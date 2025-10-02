
'use client';
import {
  collection,
  doc,
  type Firestore,
  addDoc,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import type { Mission } from '@/lib/types';

export const missionsCollection = (db: Firestore) => collection(db, 'missions');
export const missionDoc = (db: Firestore, id: string) => doc(db, 'missions', id);

export function addMission(db: Firestore, mission: Omit<Mission, 'id' | 'agentIds'> & { agentIds: string[] }) {
    return addDoc(missionsCollection(db), mission);
}

export function updateMission(
  db: Firestore,
  id: string,
  mission: Partial<Omit<Mission, 'id'>>
) {
  return setDoc(missionDoc(db, id), mission, { merge: true });
}

export async function deleteMission(db: Firestore, id: string) {
  return deleteDoc(missionDoc(db, id));
}
