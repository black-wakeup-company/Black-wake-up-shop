import { readFile } from 'node:fs/promises';
import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails
} from '@firebase/rules-unit-testing';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
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

test('employee membership creation requires every allowed field', async () => {
  const db = dbFor(ownerUid);
  await assertFails(setDoc(doc(db, 'stores', storeId, 'members', 'incomplete'), {
    uid: 'incomplete', role: 'cashier', displayName: 'Incomplete', active: true
  }));
  await assertSucceeds(setDoc(doc(db, 'stores', storeId, 'members', 'complete'), {
    uid: 'complete', role: 'cashier', displayName: 'Complete',
    email: 'complete@example.test', active: true, createdAt: serverTimestamp()
  }));
});

test('cashier cannot delete sales or edit sales', async () => {
  const db = dbFor(cashierUid);
  await assertFails(deleteDoc(doc(db, 'stores', storeId, 'sales', 's1')));
  await assertFails(updateDoc(doc(db, 'stores', storeId, 'sales', 's1'), { total: 1 }));
});
