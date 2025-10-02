
'use client';
import {
  collection,
  doc,
  type Firestore,
} from 'firebase/firestore';
import {
  addDocumentNonBlocking,
  deleteDocumentNonBlocking,
  setDocumentNonBlocking,
} from '@/firebase';
import type { Agent } from '@/lib/types';

export const agentsCollection = (db: Firestore) => collection(db, 'agents');
export const agentDoc = (db: Firestore, id: string) => doc(db, 'agents', id);

export function addAgent(db: Firestore, agent: Omit<Agent, 'id'>) {
  return addDocumentNonBlocking(agentsCollection(db), agent);
}

export function updateAgent(
  db: Firestore,
  id: string,
  agent: Partial<Omit<Agent, 'id'>>
) {
  return setDocumentNonBlocking(agentDoc(db, id), agent, { merge: true });
}

export function deleteAgent(db: Firestore, id: string) {
  return deleteDocumentNonBlocking(agentDoc(db, id));
}
