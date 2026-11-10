import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  sendEmailVerification,
  signOut,
  updateProfile
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  serverTimestamp,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { auth as ownerAuth } from './firebase';

const EMPLOYEE_APP_NAME = 'boutiquepro-employee-provisioning';
const employeeApp = getApps().some((item) => item.name === EMPLOYEE_APP_NAME)
  ? getApp(EMPLOYEE_APP_NAME)
  : initializeApp(firebaseConfig, EMPLOYEE_APP_NAME);

const employeeAuth = getAuth(employeeApp);
const db = getFirestore(ownerAuth.app);

export type EmployeeRole = 'manager' | 'cashier';

export interface CreateEmployeeInput {
  storeId: string;
  displayName: string;
  email: string;
  password: string;
  role: EmployeeRole;
}

export interface EmployeeMember {
  uid: string;
  role: EmployeeRole;
  displayName: string;
  email: string;
  active: boolean;
  createdAt?: unknown;
}

const requireOwner = async (storeId: string) => {
  const owner = ownerAuth.currentUser;
  if (!owner || owner.uid !== storeId.trim()) {
    throw new Error('Seul le propriétaire connecté peut gérer les employés de cette boutique.');
  }

  const ownerMemberSnapshot = await getDoc(doc(db, 'stores', storeId, 'members', owner.uid));
  const ownerMember = ownerMemberSnapshot.data();
  if (!ownerMemberSnapshot.exists() || ownerMember?.role !== 'owner' || ownerMember?.active !== true) {
    throw new Error('Le compte connecté ne possède pas les droits de propriétaire sur cette boutique.');
  }
  return owner;
};

const validateEmployee = (displayName: string, email: string, role: EmployeeRole) => {
  if (!displayName.trim()) throw new Error('Le nom de l’employé est obligatoire.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Adresse email invalide.');
  if (!['manager', 'cashier'].includes(role)) throw new Error('Rôle employé invalide.');
};

/**
 * Creates an employee account in a secondary Firebase Auth instance.
 * The owner's primary session remains signed in while membership is written.
 */
export const createEmployeeAccount = async (input: CreateEmployeeInput) => {
  const storeId = input.storeId.trim();
  const displayName = input.displayName.trim();
  const email = input.email.trim().toLowerCase();
  await requireOwner(storeId);
  validateEmployee(displayName, email, input.role);

  if (input.password.length < 6) {
    throw new Error('Le mot de passe doit contenir au moins 6 caractères.');
  }

  let employeeUid: string | null = null;
  try {
    const credential = await createUserWithEmailAndPassword(employeeAuth, email, input.password);
    employeeUid = credential.user.uid;
    await updateProfile(credential.user, { displayName });

    await setDoc(doc(db, 'stores', storeId, 'members', employeeUid), {
      uid: employeeUid,
      role: input.role,
      displayName,
      email,
      active: true,
      createdAt: serverTimestamp()
    });

    let verificationEmailSent = true;
    try {
      await sendEmailVerification(credential.user);
    } catch (error) {
      verificationEmailSent = false;
      console.warn('Compte créé, mais email de vérification non envoyé.', error);
    }

    return { uid: employeeUid, email, displayName, role: input.role, verificationEmailSent };
  } catch (error) {
    if (employeeUid) {
      console.error('Compte employé créé mais rattachement incomplet. Utilisez attachExistingEmployee avec cet UID.', employeeUid);
    }
    throw error;
  } finally {
    if (employeeAuth.currentUser) {
      try {
        await signOut(employeeAuth);
      } catch (error) {
        console.warn('La session temporaire de création employé n’a pas pu être fermée.', error);
      }
    }
  }
};

/**
 * Recovery path when Auth account creation succeeded but the Firestore
 * membership write failed. The employee must already exist in Firebase Auth.
 */
export const attachExistingEmployee = async (input: {
  storeId: string;
  uid: string;
  displayName: string;
  email: string;
  role: EmployeeRole;
}) => {
  const storeId = input.storeId.trim();
  const uid = input.uid.trim();
  const displayName = input.displayName.trim();
  const email = input.email.trim().toLowerCase();
  await requireOwner(storeId);
  validateEmployee(displayName, email, input.role);
  if (!uid || uid === storeId) throw new Error('Identifiant employé invalide.');

  const memberRef = doc(db, 'stores', storeId, 'members', uid);
  const existing = await getDoc(memberRef);
  if (existing.exists()) throw new Error('Cet utilisateur est déjà rattaché à cette boutique.');

  await setDoc(memberRef, {
    uid,
    role: input.role,
    displayName,
    email,
    active: true,
    createdAt: serverTimestamp()
  });

  return { uid, email, displayName, role: input.role };
};

/** Owner-only employee directory; Firestore rules enforce the permission. */
export const listStoreEmployees = async (storeId: string): Promise<EmployeeMember[]> => {
  await requireOwner(storeId);
  const snapshot = await getDocs(collection(db, 'stores', storeId, 'members'));
  return snapshot.docs
    .map((item) => item.data() as EmployeeMember)
    .filter((member) => member.role === 'manager' || member.role === 'cashier');
};

/** Change an employee's role or suspend/reactivate their boutique access. */
export const updateEmployeeMember = async (
  storeId: string,
  uid: string,
  changes: Partial<Pick<EmployeeMember, 'role' | 'active'>>
) => {
  await requireOwner(storeId);
  if (!uid.trim() || uid === storeId) throw new Error('Identifiant employé invalide.');
  if (changes.role && !['manager', 'cashier'].includes(changes.role)) {
    throw new Error('Rôle employé invalide.');
  }
  if (typeof changes.active !== 'boolean' && !changes.role) {
    throw new Error('Aucune modification valide fournie.');
  }
  await updateDoc(doc(db, 'stores', storeId, 'members', uid), changes);
};

/**
 * Employee sign-in uses the primary Firebase Auth instance so the active
 * session is the identity evaluated by Firestore security rules.
 * The boutique code is the owner's Firebase UID (storeId).
 */
export const signInEmployeeWithEmail = async (input: {
  storeId: string;
  email: string;
  password: string;
}) => {
  const storeId = input.storeId.trim();
  const email = input.email.trim().toLowerCase();

  if (!storeId) throw new Error('Le code de la boutique est obligatoire.');
  if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
    throw new Error('Adresse email invalide.');
  }
  if (!input.password) throw new Error('Le mot de passe est obligatoire.');

  const { signInWithEmailAndPassword, reload } = await import('firebase/auth');
  const credential = await signInWithEmailAndPassword(ownerAuth, email, input.password);
  const user = credential.user;

  try {
    await reload(user);
    if (!user.emailVerified) {
      throw new Error('Votre adresse email n’est pas encore vérifiée. Ouvrez le lien reçu par email, puis reconnectez-vous.');
    }

    const membershipSnapshot = await getDoc(
      doc(db, 'stores', storeId, 'members', user.uid)
    );

    if (!membershipSnapshot.exists()) {
      throw new Error('Ce compte n’est pas associé à cette boutique. Vérifiez le code boutique auprès du propriétaire.');
    }

    const membership = membershipSnapshot.data();
    if (membership.uid !== user.uid || membership.email?.toLowerCase() !== email) {
      throw new Error('Les informations du compte ne correspondent pas à cette adhésion.');
    }
    if (membership.active !== true) {
      throw new Error('Votre accès à cette boutique a été suspendu. Contactez le propriétaire.');
    }
    if (membership.role !== 'manager' && membership.role !== 'cashier') {
      throw new Error('Ce compte n’a pas un rôle employé autorisé.');
    }

    return {
      user,
      storeId,
      member: {
        uid: user.uid,
        role: membership.role as EmployeeRole,
        displayName: membership.displayName || user.displayName || email,
        email,
        active: true
      } satisfies EmployeeMember
    };
  } catch (error) {
    await signOut(ownerAuth);
    throw error;
  }
};
