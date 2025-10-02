
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getFirestore } from "firebase-admin/firestore";
import { initializeAdminApp } from "@/firebase/admin-init";
import type { Mission } from "./types";

const agentSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom de famille est requis"),
  registrationNumber: z.string().min(1, "Le matricule est requis"),
  rank: z.string().min(1, "Le grade est requis"),
  contactNumber: z.string().min(1, "Le contact est requis"),
  address: z.string().min(1, "L'adresse est requise"),
});

async function isRegistrationNumberTaken(db: FirebaseFirestore.Firestore, regNum: string, currentId?: string): Promise<boolean> {
    const agentsRef = db.collection('agents');
    const snapshot = await agentsRef.where('registrationNumber', '==', regNum).get();
    if (snapshot.empty) {
        return false;
    }
    // If we're creating a new agent, any result means the number is taken.
    if (!currentId) {
        return true;
    }
    // If we're updating, it's only a problem if the found doc has a different ID.
    return snapshot.docs.some(doc => doc.id !== currentId);
}


export async function createAgentAction(prevState: any, formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  const validatedFields = agentSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const db = getFirestore(await initializeAdminApp());
  
  if (await isRegistrationNumberTaken(db, validatedFields.data.registrationNumber)) {
     return {
      errors: { registrationNumber: ["Ce matricule est déjà pris."] },
    };
  }

  await db.collection('agents').add(validatedFields.data);
  revalidatePath("/agents");
  revalidatePath("/");
  return { errors: {}, message: 'success' };
}

export async function updateAgentAction(id: string, prevState: any, formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  const validatedFields = agentSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  const db = getFirestore(await initializeAdminApp());

  if (await isRegistrationNumberTaken(db, validatedFields.data.registrationNumber, id)) {
     return {
      errors: { registrationNumber: ["Ce matricule est déjà pris."] },
    };
  }

  await db.collection('agents').doc(id).update(validatedFields.data);
  revalidatePath("/agents");
  revalidatePath("/");
  revalidatePath("/missions");
  return { errors: {}, message: 'success' };
}

export async function deleteAgentAction(id: string) {
  const db = getFirestore(await initializeAdminApp());
  
  const missionsRef = db.collection('missions');
  const snapshot = await missionsRef.where('agentIds', 'array-contains', id).get();
  
  const batch = db.batch();
  snapshot.forEach(doc => {
      const missionData = doc.data();
      const newAgentIds = missionData.agentIds.filter((agentId: string) => agentId !== id);
      batch.update(doc.ref, { agentIds: newAgentIds });
  });
  
  batch.delete(db.collection('agents').doc(id));

  await batch.commit();

  revalidatePath("/agents");
  revalidatePath("/");
  revalidatePath("/missions");
}

const missionSchema = z.object({
    name: z.string().min(1, "Le nom est requis."),
    description: z.string().min(1, "La description est requise."),
    startDate: z.string().refine((d) => !isNaN(Date.parse(d)), "Date de début invalide."),
    endDate: z.string().refine((d) => !isNaN(Date.parse(d)), "Date de fin invalide."),
}).refine(data => new Date(data.startDate) < new Date(data.endDate), {
    message: "La date de fin doit être après la date de début.",
    path: ["endDate"],
});


export async function createMissionAction(prevState: any, formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());
    const validatedFields = missionSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors };
    }
    const db = getFirestore(await initializeAdminApp());
    await db.collection('missions').add({
        ...validatedFields.data,
        agentIds: [],
    });

    revalidatePath('/missions');
    revalidatePath('/');
    return { errors: {}, message: 'success' };
}

export async function saveMissionAssignments(assignments: Partial<Mission>[], unassignedMissions: string[]) {
    const db = getFirestore(await initializeAdminApp());

    const batch = db.batch();

    assignments.forEach(mission => {
        if (mission.id && mission.agentIds) {
            const missionRef = db.collection('missions').doc(mission.id);
            batch.update(missionRef, { agentIds: mission.agentIds });
        }
    });
    
    unassignedMissions.forEach(missionId => {
        const missionRef = db.collection('missions').doc(missionId);
        batch.update(missionRef, { agentIds: [] });
    });

    await batch.commit();

    revalidatePath('/missions');
    revalidatePath('/agents');
    revalidatePath('/');
}

export async function deleteMissionAction(id: string) {
  const db = getFirestore(await initializeAdminApp());
  await db.collection('missions').doc(id).delete();
  revalidatePath("/missions");
  revalidatePath("/");
}
