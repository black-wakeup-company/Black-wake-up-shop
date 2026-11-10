import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  sendEmailVerification,
  signOut,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore';
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

/**
 * Creates an employee Firebase Authentication account using a secondary
 * Firebase app, so the currently signed-in owner session is not replaced.
 *
 * The owner then creates the employee membership under their own authenticated
 * session. If that Firestore write fails, the auth account remains created;
 * retry membership creation for the returned UID rather than creating another
 * account with the same email.
 *
 * This is a client-side onboarding flow, not an Admin SDK operation.
 */
export const createEmployeeAccount = async (input: CreateEmployeeInput) => {
  const owner = ownerAuth.currentUser;
  const storeId = input.storeId.trim();
  const displayName = input.displayName.trim();
  const email = input.email.trim().toLowerCase();

  if (!owner || owner.uid !== storeId) {
    throw new Error('Seul le propriétaire connecté peut ajouter un employé à sa boutique.');
  }
  if (!displayName) {
    throw new Error('Le nom de l’employé est obligatoire.');
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Adresse email invalide.');
  }
  if (input.password.length < 6) {
    throw new Error('Le mot de passe doit contenir au moins 6 caractères.');
  }
  if (!['manager', 'cashier'].includes(input.role)) {
    throw new Error('Rôle employé invalide.');
  }

  const ownerMemberRef = doc(db, 'stores', storeId, 'members', owner.uid);
  const ownerMemberSnapshot = await getDoc(ownerMemberRef);
  const ownerMember = ownerMemberSnapshot.data();

  if (
    !ownerMemberSnapshot.exists()
    || ownerMember?.role !== 'owner'
    || ownerMember?.active !== true
  ) {
    throw new Error('Le compte connecté ne possède pas les droits de propriétaire sur cette boutique.');
  }

  let employeeUid: string | null = null;

  try {
    const credential = await createUserWithEmailAndPassword(employeeAuth, email, input.password);
    employeeUid = credential.user.uid;
    await updateProfile(credential.user, { displayName });

    // Firestore write is made with the primary owner auth session.
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
    } catch (verificationError) {
      verificationEmailSent = false;
      console.warn('Compte créé, mais email de vérification non envoyé.', verificationError);
    }

    return { uid: employeeUid, email, displayName, role: input.role, verificationEmailSent };
  } catch (error) {
    if (employeeUid) {
      console.error(
        'Le compte employé a peut-être été créé, mais son rattachement à la boutique a échoué. Réutilisez cet UID pour finaliser le rattachement.',
        employeeUid
      );
    }
    throw error;
  } finally {
    if (employeeAuth.currentUser) {
      await signOut(employeeAuth);
    }
  }
};
