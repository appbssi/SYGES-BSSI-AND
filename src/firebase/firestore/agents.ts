
'use client';
import {
  collection,
  doc,
  type Firestore,
  addDoc,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import type { Agent } from '@/lib/types';

export const agentsCollection = (db: Firestore) => collection(db, 'agents');
export const agentDoc = (db: Firestore, id: string) => doc(db, 'agents', id);

export function addAgent(db: Firestore, agent: Omit<Agent, 'id'>) {
  // For server actions, we want to await. Client-side can be non-blocking.
  return addDoc(agentsCollection(db), agent);
}

export function updateAgent(
  db: Firestore,
  id: string,
  agent: Partial<Omit<Agent, 'id'>>
) {
  return setDoc(agentDoc(db, id), agent, { merge: true });
}

export function deleteAgent(db: Firestore, id: string) {
  return deleteDoc(agentDoc(db, id));
}
