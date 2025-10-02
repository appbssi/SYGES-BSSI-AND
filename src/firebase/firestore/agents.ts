
'use client';
import {
  collection,
  doc,
  type Firestore,
} from 'firebase/firestore';

export const agentsCollection = (db: Firestore) => collection(db, 'agents');
export const agentDoc = (db: Firestore, id: string) => doc(db, 'agents', id);
