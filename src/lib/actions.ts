
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getFirestore } from "firebase-admin/firestore";
import { initializeAdminApp } from "@/firebase/admin-init";
import type { Mission } from "./types";

async function isRegistrationNumberTaken(db: FirebaseFirestore.Firestore, regNum: string, currentId?: string): Promise<boolean> {
    const agentsRef = db.collection('agents');
    const snapshot = await agentsRef.where('registrationNumber', '==', regNum).get();
    if (snapshot.empty) {
        return false;
    }
    if (!currentId) {
        return true;
    }
    // If we are updating, check if the found agent is a different one
    return snapshot.docs.some(doc => doc.id !== currentId);
}

const agentSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().min(1, "Le prénom est requis."),
  lastName: z.string().min(1, "Le nom de famille est requis."),
  registrationNumber: z.string().min(1, "Le matricule est requis."),
  rank: z.string().min(1, "Le grade est requis."),
  contactNumber: z.string().min(1, "Le numéro de contact est requis."),
  address: z.string().min(1, "L'adresse est requise."),
});


export async function createAgentAction(prevState: any, formData: FormData) {
    const db = await initializeAdminApp().then(app => getFirestore(app));

    const validatedFields = agentSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors };
    }
    
    const { registrationNumber } = validatedFields.data;

    const isTaken = await isRegistrationNumberTaken(db, registrationNumber);
    if (isTaken) {
        return {
            errors: {
                registrationNumber: ["Ce matricule est déjà utilisé."],
            },
        };
    }

    try {
        await db.collection('agents').add(validatedFields.data);
        revalidatePath('/agents');
        revalidatePath('/');
        return { errors: {}, message: 'success' };
    } catch (error) {
        return { errors: {}, message: `Erreur serveur: ${error}` };
    }
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
