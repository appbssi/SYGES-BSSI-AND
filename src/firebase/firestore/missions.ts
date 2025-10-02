
'use client';
import {
  collection,
  doc,
  type Firestore,
} from 'firebase/firestore';

export const missionsCollection = (db: Firestore) => collection(db, 'missions');
export const missionDoc = (db: Firestore, id: string) => doc(db, 'missions', id);
