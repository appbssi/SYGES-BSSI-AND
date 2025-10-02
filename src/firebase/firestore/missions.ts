
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
import type { Mission } from '@/lib/types';

export const missionsCollection = (db: Firestore) => collection(db, 'missions');
export const missionDoc = (db: Firestore, id: string) => doc(db, 'missions', id);

export function addMission(db: Firestore, mission: Omit<Mission, 'id'>) {
  return addDocumentNonBlocking(missionsCollection(db), mission);
}

export function updateMission(
  db: Firestore,
  id: string,
  mission: Partial<Omit<Mission, 'id'>>
) {
  return setDocumentNonBlocking(missionDoc(db, id), mission, { merge: true });
}

export function deleteMission(db: Firestore, id: string) {
  return deleteDocumentNonBlocking(missionDoc(db, id));
}
