import { readFile } from 'node:fs/promises';
import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails
} from '@firebase/rules-unit-testing';
import { createFirebaseSyncAdapter } from '../src/services/firebaseSyncAdapter.ts';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';

const projectId = 'demo-boutiquepro';
let env;
const ownerUid = 'owner-1';
const managerUid = 'manager-1';
const cashierUid = 'cashier-1';
const otherOwnerUid = 'owner-2';
const storeId = ownerUid;

const member = (uid, role, active = true) => ({
  uid, role, active,
  displayName: role === 'owner' ? 'Owner' : role,
  email: `${uid}@example.test`,
  createdAt: new Date()
});

before(async () => {
  const rules = await readFile(new URL('../firestore.rules', import.meta.url), 'utf8');
  env = await initializeTestEnvironment({ projectId, firestore: { rules } });
});

after(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, 'stores', storeId), {
      ownerUid, name: 'Boutique test', ownerEmail: 'owner@example.test',
      createdAt: new Date(), schemaVersion: 1
    });
    await setDoc(doc(db, 'stores', storeId, 'members', ownerUid), member(ownerUid, 'owner'));
    await setDoc(doc(db, 'stores', storeId, 'members', managerUid), member(managerUid, 'manager'));
    await setDoc(doc(db, 'stores', storeId, 'members', cashierUid), member(cashierUid, 'cashier'));
    await setDoc(doc(db, 'stores', storeId, 'members', 'inactive-1'), member('inactive-1', 'cashier', false));
    await setDoc(doc(db, 'stores', otherOwnerUid), {
      ownerUid: otherOwnerUid, name: 'Other store', createdAt: new Date(), schemaVersion: 1
    });
    await setDoc(doc(db, 'stores', otherOwnerUid, 'members', otherOwnerUid), member(otherOwnerUid, 'owner'));
  });
});

const dbFor = (uid, email_verified = true) =>
  env.authenticatedContext(uid, { email_verified }).firestore();

test('owner can provision a store and owner membership atomically on first login', async () => {
  const newOwnerUid = 'new-owner-1';
  const db = dbFor(newOwnerUid);
  const storeRef = doc(db, 'stores', newOwnerUid);
  const memberRef = doc(db, 'stores', newOwnerUid, 'members', newOwnerUid);

  await assertSucceeds(runTransaction(db, async (transaction) => {
    const [storeSnapshot, memberSnapshot] = await Promise.all([
      transaction.get(storeRef),
      transaction.get(memberRef)
    ]);
    assert.equal(storeSnapshot.exists(), false);
    assert.equal(memberSnapshot.exists(), false);
    transaction.set(storeRef, {
      ownerUid: newOwnerUid,
      name: 'Ma boutique',
      ownerEmail: 'new-owner@example.test',
      createdAt: serverTimestamp(),
      schemaVersion: 1
    });
    transaction.set(memberRef, {
      uid: newOwnerUid,
      role: 'owner',
      displayName: 'Propriétaire',
      email: 'new-owner@example.test',
      active: true,
      createdAt: serverTimestamp()
    });
  }));

  await assertSucceeds(getDoc(storeRef));
  await assertSucceeds(getDoc(memberRef));
});

test('owner provisioning rejects an unverified account', async () => {
  const unverifiedDb = dbFor('unverified-owner', false);
  await assertFails(setDoc(doc(unverifiedDb, 'stores', 'unverified-owner'), {
    ownerUid: 'unverified-owner', name: 'Nope', ownerEmail: 'unverified@example.test',
    createdAt: serverTimestamp(), schemaVersion: 1
  }));
});

test('owner provisioning refuses either incomplete pre-existing state', async () => {
  const partialStoreUid = 'partial-store-owner';
  const partialMemberUid = 'partial-member-owner';

  await env.withSecurityRulesDisabled(async (context) => {
    const adminDb = context.firestore();
    await setDoc(doc(adminDb, 'stores', partialStoreUid), {
      ownerUid: partialStoreUid, name: 'Partial store',
      ownerEmail: 'partial@example.test', createdAt: new Date(), schemaVersion: 1
    });
    await setDoc(doc(adminDb, 'stores', partialMemberUid, 'members', partialMemberUid), {
      ...member(partialMemberUid, 'owner')
    });
  });

  const storeOnlyDb = dbFor(partialStoreUid);
  await assertFails(setDoc(doc(storeOnlyDb, 'stores', partialStoreUid, 'members', partialStoreUid), {
    uid: partialStoreUid, role: 'owner', displayName: 'Owner',
    email: 'partial@example.test', active: true, createdAt: serverTimestamp()
  }));

  const memberOnlyDb = dbFor(partialMemberUid);
  await assertFails(setDoc(doc(memberOnlyDb, 'stores', partialMemberUid), {
    ownerUid: partialMemberUid, name: 'Must not be created',
    ownerEmail: 'partial@example.test', createdAt: serverTimestamp(), schemaVersion: 1
  }));
});

test('settings documents are restricted to the main document', async () => {
  const ownerDb = dbFor(ownerUid);
  await assertFails(setDoc(doc(ownerDb, 'stores', storeId, 'settings', 'extra'), {
    boutiqueName: 'Unexpected settings'
  }));
  await assertFails(getDoc(doc(ownerDb, 'stores', storeId, 'settings', 'extra')));
});

test('owner can read own store and create products', async () => {
  const db = dbFor(ownerUid);
  await assertSucceeds(getDoc(doc(db, 'stores', storeId)));
  await assertSucceeds(setDoc(doc(db, 'stores', storeId, 'products', 'p1'), { id: 'p1', name: 'Test' }));
});

test('manager can manage products and expenses, but not members or settings', async () => {
  const db = dbFor(managerUid);
  await assertSucceeds(setDoc(doc(db, 'stores', storeId, 'products', 'p1'), { id: 'p1' }));
  await assertSucceeds(setDoc(doc(db, 'stores', storeId, 'expenses', 'e1'), { id: 'e1' }));
  await assertFails(setDoc(doc(db, 'stores', storeId, 'settings', 'main'), { boutiqueName: 'Nope' }));
  await assertFails(setDoc(doc(db, 'stores', storeId, 'members', 'new-member'), member('new-member', 'cashier')));
});

test('cashier can create sales and read products but cannot alter stock or expenses', async () => {
  const db = dbFor(cashierUid);
  await assertSucceeds(getDoc(doc(db, 'stores', storeId, 'products', 'p1')));
  await assertSucceeds(setDoc(doc(db, 'stores', storeId, 'sales', 's1'), { id: 's1', total: 100 }));
  await assertFails(setDoc(doc(db, 'stores', storeId, 'products', 'p2'), { id: 'p2' }));
  await assertFails(setDoc(doc(db, 'stores', storeId, 'expenses', 'e1'), { id: 'e1' }));
});

test('unverified and inactive accounts cannot access store data', async () => {
  const unverified = dbFor(cashierUid, false);
  await assertFails(getDoc(doc(unverified, 'stores', storeId, 'products', 'p1')));
  const inactive = dbFor('inactive-1');
  await assertFails(getDoc(doc(inactive, 'stores', storeId, 'products', 'p1')));
});

test('a member cannot read or write another boutique', async () => {
  const db = dbFor(ownerUid);
  await assertFails(getDoc(doc(db, 'stores', otherOwnerUid)));
  await assertFails(setDoc(doc(db, 'stores', otherOwnerUid, 'products', 'intrusion'), { id: 'intrusion' }));
});

test('owner alone can suspend an employee; employee cannot change own role', async () => {
  const ownerDb = dbFor(ownerUid);
  await assertSucceeds(updateDoc(doc(ownerDb, 'stores', storeId, 'members', cashierUid), {
    uid: cashierUid, role: 'cashier', displayName: 'cashier',
    email: 'cashier-1@example.test', active: false,
    createdAt: (await getDoc(doc(ownerDb, 'stores', storeId, 'members', cashierUid))).data().createdAt
  }));
  const cashierDb = dbFor(cashierUid);
  await assertFails(updateDoc(doc(cashierDb, 'stores', storeId, 'members', cashierUid), { role: 'manager' }));
});

test('owner can change employee role and suspension cannot be self-reversed', async () => {
  const ownerDb = dbFor(ownerUid);
  const employeeUid = 'role-change-employee';
  const memberRef = doc(ownerDb, 'stores', storeId, 'members', employeeUid);
  await assertSucceeds(setDoc(memberRef, {
    uid: employeeUid, role: 'cashier', displayName: 'Employee',
    email: 'role-change@example.test', active: false, status: 'pending',
    createdAt: serverTimestamp()
  }));

  const employeeDb = dbFor(employeeUid, true);
  await assertSucceeds(updateDoc(doc(employeeDb, 'stores', storeId, 'members', employeeUid), {
    active: true, status: 'active'
  }));

  const createdAt = (await getDoc(memberRef)).data().createdAt;
  await assertSucceeds(updateDoc(doc(ownerDb, 'stores', storeId, 'members', employeeUid), {
    uid: employeeUid, role: 'manager', displayName: 'Employee',
    email: 'role-change@example.test', active: true, status: 'active', createdAt
  }));
  await assertSucceeds(updateDoc(doc(ownerDb, 'stores', storeId, 'members', employeeUid), {
    uid: employeeUid, role: 'manager', displayName: 'Employee',
    email: 'role-change@example.test', active: false, status: 'suspended', createdAt
  }));

  await assertFails(updateDoc(doc(employeeDb, 'stores', storeId, 'members', employeeUid), {
    active: true, status: 'active'
  }));
  await assertFails(deleteDoc(doc(employeeDb, 'stores', storeId, 'members', employeeUid)));
});

test('employee membership creation requires every allowed field', async () => {
  const db = dbFor(ownerUid);
  await assertFails(setDoc(doc(db, 'stores', storeId, 'members', 'incomplete'), {
    uid: 'incomplete', role: 'cashier', displayName: 'Incomplete', active: true
  }));
  await assertSucceeds(setDoc(doc(db, 'stores', storeId, 'members', 'complete'), {
    uid: 'complete', role: 'cashier', displayName: 'Complete',
    email: 'complete@example.test', active: false, status: 'pending', createdAt: serverTimestamp()
  }));
  await assertFails(setDoc(doc(db, 'stores', storeId, 'members', 'active-at-creation'), {
    uid: 'active-at-creation', role: 'cashier', displayName: 'Unverified',
    email: 'unverified-employee@example.test', active: true, status: 'active', createdAt: serverTimestamp()
  }));
});

test('only the invited verified employee can activate a pending membership', async () => {
  const pendingUid = 'pending-employee';
  const ownerDb = dbFor(ownerUid);
  const memberRef = doc(ownerDb, 'stores', storeId, 'members', pendingUid);
  await assertSucceeds(setDoc(memberRef, {
    uid: pendingUid, role: 'cashier', displayName: 'Pending Employee',
    email: 'pending@example.test', active: false, status: 'pending', createdAt: serverTimestamp()
  }));

  const unverifiedEmployeeDb = dbFor(pendingUid, false);
  await assertFails(updateDoc(doc(unverifiedEmployeeDb, 'stores', storeId, 'members', pendingUid), {
    active: true, status: 'active'
  }));

  const wrongEmailDb = env.authenticatedContext(pendingUid, {
    email_verified: true, email: 'attacker@example.test'
  }).firestore();
  await assertFails(updateDoc(doc(wrongEmailDb, 'stores', storeId, 'members', pendingUid), {
    active: true, status: 'active'
  }));

  const verifiedEmployeeDb = env.authenticatedContext(pendingUid, {
    email_verified: true, email: 'pending@example.test'
  }).firestore();
  await assertSucceeds(updateDoc(doc(verifiedEmployeeDb, 'stores', storeId, 'members', pendingUid), {
    active: true, status: 'active'
  }));
  await assertFails(updateDoc(doc(verifiedEmployeeDb, 'stores', storeId, 'members', pendingUid), {
    role: 'manager'
  }));
});

test('owner can suspend but cannot activate a pending employee', async () => {
  const ownerDb = dbFor(ownerUid);
  const pendingUid = 'pending-suspend';
  const memberRef = doc(ownerDb, 'stores', storeId, 'members', pendingUid);
  await assertSucceeds(setDoc(memberRef, {
    uid: pendingUid, role: 'cashier', displayName: 'Pending',
    email: 'pending-suspend@example.test', active: false, status: 'pending', createdAt: serverTimestamp()
  }));
  await assertFails(updateDoc(memberRef, {
    uid: pendingUid, role: 'cashier', displayName: 'Pending',
    email: 'pending-suspend@example.test', active: true, status: 'active',
    createdAt: (await getDoc(memberRef)).data().createdAt
  }));
  await assertSucceeds(updateDoc(memberRef, {
    uid: pendingUid, role: 'cashier', displayName: 'Pending',
    email: 'pending-suspend@example.test', active: false, status: 'suspended',
    createdAt: (await getDoc(memberRef)).data().createdAt
  }));
});

test('cashier cannot delete sales or edit sales', async () => {
  const db = dbFor(cashierUid);
  await assertFails(deleteDoc(doc(db, 'stores', storeId, 'sales', 's1')));
  await assertFails(updateDoc(doc(db, 'stores', storeId, 'sales', 's1'), { total: 1 }));
});


test('stock movements are append-only and scoped to the active boutique', async () => {
  const db = dbFor(cashierUid);
  const movement = {
    id: 'move-sale-1', productId: 'p1', quantityDelta: -2,
    reason: 'sale', referenceId: 'sale-1',
    createdAt: new Date().toISOString(), createdBy: cashierUid
  };
  const movementRef = doc(db, 'stores', storeId, 'stockMovements', movement.id);
  await assertSucceeds(setDoc(movementRef, movement));
  await assertFails(updateDoc(movementRef, { quantityDelta: -3 }));
  await assertFails(deleteDoc(movementRef));
  await assertFails(setDoc(doc(db, 'stores', storeId, 'stockMovements', 'forged'), {
    ...movement, id: 'different-id'
  }));
});


test('document identity must match its Firestore key, including technical sales syncId', async () => {
  const ownerDb = dbFor(ownerUid);
  await assertFails(setDoc(doc(ownerDb, 'stores', storeId, 'products', 'product-key'), {
    id: 'different-product-id', name: 'Mismatch'
  }));
  await assertSucceeds(setDoc(doc(ownerDb, 'stores', storeId, 'sales', 'sale-sync-key'), {
    id: 'VTE-2026-0042', syncId: 'sale-sync-key', total: 100
  }));
  await assertFails(setDoc(doc(ownerDb, 'stores', storeId, 'sales', 'wrong-sync-key'), {
    id: 'VTE-2026-0043', syncId: 'another-sync-key', total: 100
  }));
  await assertFails(setDoc(doc(ownerDb, 'stores', storeId, 'expenses', 'expense-key'), {
    id: 'different-expense-id', amount: 100
  }));
});

test('settings deletion is denied and cashiers cannot read expenses', async () => {
  const ownerDb = dbFor(ownerUid);
  await assertSucceeds(setDoc(doc(ownerDb, 'stores', storeId, 'settings', 'main'), {
    boutiqueName: 'Boutique test'
  }));
  await assertFails(deleteDoc(doc(ownerDb, 'stores', storeId, 'settings', 'main')));
  const cashierDb = dbFor(cashierUid);
  await assertFails(getDoc(doc(cashierDb, 'stores', storeId, 'expenses', 'e1')));
});

test('Firebase adapter creates once and treats an identical retry as idempotent', async () => {
  const db = dbFor(ownerUid);
  const adapter = createFirebaseSyncAdapter(db);
  const actor = { uid: ownerUid, emailVerified: true, storeId, role: 'owner', active: true };
  const mutation = {
    id: 'job-product-1', storeId, entity: 'products', operation: 'create',
    documentId: 'adapter-product-1',
    payload: { id: 'adapter-product-1', name: 'Produit test', stockQuantity: 4 },
    createdAt: new Date().toISOString(), attempts: 0
  };

  await assertSucceeds(adapter.apply(mutation, actor));
  await assertSucceeds(adapter.apply(mutation, actor));
  const saved = await getDoc(doc(db, 'stores', storeId, 'products', mutation.documentId));
  assert.deepEqual(saved.data(), mutation.payload);
});

test('Firebase adapter rejects a conflicting create without overwriting existing data', async () => {
  const db = dbFor(ownerUid);
  const adapter = createFirebaseSyncAdapter(db);
  const target = doc(db, 'stores', storeId, 'products', 'already-exists');
  await setDoc(target, { id: 'already-exists', name: 'Valeur originale' });

  const mutation = {
    id: 'job-conflict-1', storeId, entity: 'products', operation: 'create',
    documentId: 'already-exists',
    payload: { id: 'already-exists', name: 'Valeur concurrente' },
    createdAt: new Date().toISOString(), attempts: 0
  };
  await assert.rejects(adapter.apply(mutation, {
    uid: ownerUid, emailVerified: true, storeId, role: 'owner', active: true
  }), /Conflit de création/);

  const saved = await getDoc(target);
  assert.equal(saved.data().name, 'Valeur originale');
});

test('Firebase adapter leaves updates and deletes disabled', async () => {
  const adapter = createFirebaseSyncAdapter(dbFor(ownerUid));
  const actor = { uid: ownerUid, emailVerified: true, storeId, role: 'owner', active: true };
  for (const operation of ['update', 'delete']) {
    await assert.rejects(adapter.apply({
      id: `job-${operation}`, storeId, entity: 'products', operation,
      documentId: 'p1', payload: operation === 'update' ? { name: 'Nouveau' } : undefined,
      createdAt: new Date().toISOString(), attempts: 0
    }, actor), /contrôle de version/);
  }
});

test('Firebase adapter cannot bypass Firestore role rules', async () => {
  const adapter = createFirebaseSyncAdapter(dbFor(cashierUid));
  const mutation = {
    id: 'job-cashier-product', storeId, entity: 'products', operation: 'create',
    documentId: 'forbidden-product',
    payload: { id: 'forbidden-product', name: 'Interdit' },
    createdAt: new Date().toISOString(), attempts: 0
  };
  await assert.rejects(adapter.apply(mutation, {
    uid: cashierUid, emailVerified: true, storeId, role: 'cashier', active: true
  }));
});
