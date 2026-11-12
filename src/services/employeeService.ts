import {
  collection,
  doc,
  getFirestore,
  getDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  runTransaction,
  updateDoc,
  type DocumentData
} from 'firebase/firestore';
import { getIdToken, reload } from 'firebase/auth';
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
  await getIdToken(user, true);
  if (auth.currentUser?.uid !== user.uid || !user.emailVerified) {
    throw new Error('Votre adresse e-mail doit être vérifiée et votre session doit rester active.');
  }
  return user;
};

const requireOwner = async (storeId: string) => {
  const user = await requireVerifiedSession();
  if (!storeId || storeId !== user.uid) {
    throw new Error('Seul le propriétaire authentifié peut gérer cette boutique.');
  }
  return user;
};

/** Creates an email-based invitation; acceptance still requires the invited verified email. */
export const createEmployeeInvitation = async (
  storeId: string,
  employee: { email: string; displayName: string; role: EmployeeRole }
): Promise<string> => {
  await requireOwner(storeId);
  const email = employee.email.trim().toLowerCase();
  const displayName = employee.displayName.trim();
  if (!email.includes('@') || !displayName) throw new Error('E-mail ou nom employé invalide.');
  if (!['manager', 'cashier'].includes(employee.role)) throw new Error('Rôle employé invalide.');
  const invitationRef = doc(collection(db, 'stores', storeId, 'invitations'));
  const expiresAt = Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await runTransaction(db, async (transaction) => {
    transaction.set(invitationRef, { email, displayName, role: employee.role, status: 'pending',
      createdBy: auth.currentUser!.uid, createdAt: serverTimestamp(), expiresAt });
  });
  return invitationRef.id;
};

/** Accepts an invitation and creates the active membership in one transaction. */
export const acceptEmployeeInvitation = async (storeId: string, invitationId: string): Promise<void> => {
  const user = await requireVerifiedSession();
  if (!storeId || storeId === user.uid || !invitationId.trim()) throw new Error('Lien d’invitation invalide.');
  const invitationRef = doc(db, 'stores', storeId, 'invitations', invitationId);
  const memberRef = doc(db, 'stores', storeId, 'members', user.uid);
  await runTransaction(db, async (transaction) => {
    const [invitationSnapshot, memberSnapshot] = await Promise.all([transaction.get(invitationRef), transaction.get(memberRef)]);
    if (!invitationSnapshot.exists()) throw new Error('Invitation introuvable.');
    if (memberSnapshot.exists()) throw new Error('Ce compte possède déjà un accès à cette boutique.');
    const invitation = invitationSnapshot.data() as DocumentData;
    if (invitation.status !== 'pending') throw new Error('Cette invitation n’est plus disponible.');
    if (!(invitation.expiresAt instanceof Timestamp) || invitation.expiresAt.toMillis() <= Date.now()) throw new Error('Cette invitation a expiré.');
    if (String(invitation.email).trim().toLowerCase() !== (user.email || '').trim().toLowerCase()) throw new Error('Cette invitation ne correspond pas à votre adresse e-mail.');
    if (!['manager', 'cashier'].includes(invitation.role)) throw new Error('Rôle d’invitation invalide.');
    transaction.set(memberRef, { uid: user.uid, role: invitation.role, displayName: invitation.displayName,
      email: invitation.email, active: true, status: 'active', createdAt: serverTimestamp(), invitationId });
    transaction.update(invitationRef, { status: 'accepted', acceptedBy: user.uid, acceptedAt: serverTimestamp() });
  });
};

export type EmployeeInvitationStatus = 'pending' | 'accepted' | 'revoked';

export interface EmployeeInvitation {
  id: string;
  email: string;
  displayName: string;
  role: EmployeeRole;
  status: EmployeeInvitationStatus;
  createdAt?: unknown;
  expiresAt?: unknown;
}

/** Lists invitations for the authenticated owner only. */
export const listEmployeeInvitations = async (storeId: string): Promise<EmployeeInvitation[]> => {
  await requireOwner(storeId);
  const invitationsQuery = query(
    collection(db, 'stores', storeId, 'invitations'),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(invitationsQuery);
  return snapshot.docs.map((item) => {
    const data = item.data() as DocumentData;
    return {
      id: item.id,
      email: String(data.email ?? ''),
      displayName: String(data.displayName ?? ''),
      role: data.role as EmployeeRole,
      status: data.status as EmployeeInvitationStatus,
      createdAt: data.createdAt,
      expiresAt: data.expiresAt
    };
  });
};

/** Revokes a pending invitation; accepted or already revoked invitations are immutable. */
export const revokeEmployeeInvitation = async (
  storeId: string,
  invitationId: string
): Promise<void> => {
  await requireOwner(storeId);
  if (!invitationId.trim()) throw new Error('Invitation invalide.');
  const invitationRef = doc(db, 'stores', storeId, 'invitations', invitationId);
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(invitationRef);
    if (!snapshot.exists()) throw new Error('Invitation introuvable.');
    if (snapshot.data().status !== 'pending') {
      throw new Error('Seule une invitation en attente peut être révoquée.');
    }
    transaction.update(invitationRef, { status: 'revoked' });
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

/** Reactivates only a previously suspended employee; pending invitations stay employee-activated. */
export const reactivateEmployee = async (
  storeId: string,
  employeeUid: string
): Promise<void> => {
  await requireOwner(storeId);
  if (!employeeUid || employeeUid === storeId) throw new Error('Employé invalide.');
  const memberRef = doc(db, 'stores', storeId, 'members', employeeUid);
  const snapshot = await getDoc(memberRef);
  if (!snapshot.exists()) throw new Error('Employé introuvable.');
  const member = snapshot.data() as DocumentData;
  if (member.status !== 'suspended' || member.active !== false) {
    throw new Error('Seul un employé suspendu peut être réactivé.');
  }
  await updateDoc(memberRef, { active: true, status: 'active' });
};

/**
 * Reads only the signed-in employee's invitation in the boutique identified
 * by the invitation link. Firestore rules verify the UID and verified email.
 * The caller must not discover boutiques by listing or searching stores.
 */
export const getOwnEmployeeInvitation = async (
  storeId: string
): Promise<EmployeeMembership | null> => {
  const user = await requireVerifiedSession();
  if (!storeId || storeId === user.uid) throw new Error('Boutique cible invalide.');

  const snapshot = await getDoc(doc(db, 'stores', storeId, 'members', user.uid));
  if (!snapshot.exists()) return null;

  const data = snapshot.data() as DocumentData;
  if (
    data.uid !== user.uid
    || typeof data.email !== 'string'
    || data.email.toLowerCase() !== (user.email || '').toLowerCase()
    || !['manager', 'cashier'].includes(data.role)
  ) {
    throw new Error('Cette invitation ne correspond pas à votre compte.');
  }

  return {
    uid: user.uid,
    role: data.role as EmployeeRole,
    displayName: String(data.displayName ?? ''),
    email: String(data.email),
    active: data.active === true,
    ...(data.status ? { status: data.status as EmployeeStatus } : {}),
    createdAt: data.createdAt
  };
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
