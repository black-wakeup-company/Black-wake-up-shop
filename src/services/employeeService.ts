import {
  collection,
  doc,
  getFirestore,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  runTransaction,
  updateDoc,
  type DocumentData
} from 'firebase/firestore';
import { reload } from 'firebase/auth';
import { auth } from './firebase';

const db = getFirestore(auth.app);
export type EmployeeRole = 'manager' | 'cashier';
export type EmployeeStatus = 'pending' | 'active' | 'suspended';

export interface EmployeeMembership {
  uid: string;
  role: EmployeeRole;
  displayName: string;
  email: string;
  active: boolean;
  status?: EmployeeStatus;
  createdAt?: unknown;
}

const requireVerifiedSession = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('Connectez-vous pour continuer.');
  await reload(user);
  if (!auth.currentUser?.emailVerified) {
    throw new Error('Votre adresse e-mail doit être vérifiée.');
  }
  return auth.currentUser;
};

const requireOwner = async (storeId: string) => {
  const user = await requireVerifiedSession();
  if (!storeId || storeId !== user.uid) {
    throw new Error('Seul le propriétaire authentifié peut gérer cette boutique.');
  }
  return user;
};

/**
 * Creates a pending membership for an already registered employee UID.
 * Firebase Auth account creation is intentionally separate: no Admin SDK,
 * Cloud Functions, or owner-handled employee passwords are used.
 */
export const createEmployeeInvitation = async (
  storeId: string,
  employee: { uid: string; email: string; displayName: string; role: EmployeeRole }
): Promise<void> => {
  await requireOwner(storeId);
  const uid = employee.uid.trim();
  const email = employee.email.trim().toLowerCase();
  const displayName = employee.displayName.trim();
  if (!uid || uid === storeId) throw new Error('Identifiant employé invalide.');
  if (!email.includes('@') || !displayName) throw new Error('E-mail ou nom employé invalide.');
  if (!['manager', 'cashier'].includes(employee.role)) throw new Error('Rôle employé invalide.');

  const memberRef = doc(db, 'stores', storeId, 'members', uid);
  await runTransaction(db, async (transaction) => {
    const existing = await transaction.get(memberRef);
    if (existing.exists()) {
      throw new Error('Ce compte possède déjà une adhésion dans cette boutique.');
    }
    transaction.set(memberRef, {
      uid,
      role: employee.role,
      displayName,
      email,
      active: false,
      status: 'pending',
      createdAt: serverTimestamp()
    });
  });
};

export const listEmployees = async (storeId: string): Promise<EmployeeMembership[]> => {
  await requireOwner(storeId);
  const membersQuery = query(
    collection(db, 'stores', storeId, 'members'),
    orderBy('createdAt', 'asc')
  );
  const snapshot = await getDocs(membersQuery);
  return snapshot.docs
    .map((item) => item.data() as DocumentData)
    .filter((item) => item.role === 'manager' || item.role === 'cashier')
    .map((item) => ({
      uid: String(item.uid),
      role: item.role as EmployeeRole,
      displayName: String(item.displayName ?? ''),
      email: String(item.email ?? ''),
      active: item.active === true,
      ...(item.status ? { status: item.status as EmployeeStatus } : {}),
      createdAt: item.createdAt
    }));
};

export const changeEmployeeRole = async (
  storeId: string,
  employeeUid: string,
  role: EmployeeRole
): Promise<void> => {
  await requireOwner(storeId);
  if (!employeeUid || employeeUid === storeId || !['manager', 'cashier'].includes(role)) {
    throw new Error('Modification du rôle invalide.');
  }
  await updateDoc(doc(db, 'stores', storeId, 'members', employeeUid), { role });
};

export const suspendEmployee = async (
  storeId: string,
  employeeUid: string
): Promise<void> => {
  await requireOwner(storeId);
  if (!employeeUid || employeeUid === storeId) throw new Error('Employé invalide.');
  await updateDoc(doc(db, 'stores', storeId, 'members', employeeUid), {
    active: false,
    status: 'suspended'
  });
};

/** Called by the employee after signing in and verifying their own email. */
export const activateOwnInvitation = async (storeId: string): Promise<void> => {
  const user = await requireVerifiedSession();
  if (!storeId || storeId === user.uid) throw new Error('Boutique cible invalide.');
  await updateDoc(doc(db, 'stores', storeId, 'members', user.uid), {
    active: true,
    status: 'active'
  });
};
