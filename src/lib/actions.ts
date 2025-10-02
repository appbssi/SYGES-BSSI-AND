
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getFirestore } from "firebase-admin/firestore";
import { initializeAdminApp } from "@/firebase/admin-init";
import type { Mission } from "./types";

// Initialize DB instance once per module
const dbPromise = initializeAdminApp().then(app => getFirestore(app));

async function isRegistrationNumberTaken(regNum: string, currentId?: string): Promise<boolean> {
    const db = await dbPromise;
    const agentsRef = db.collection('agents');
    const snapshot = await agentsRef.where('registrationNumber', '==', regNum).get();
    if (snapshot.empty) {
        return false;
    }
    if (!currentId) {
        return true;
    }
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
    const db = await dbPromise;
    const validatedFields = agentSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors };
    }
    
    const { registrationNumber } = validatedFields.data;

    const isTaken = await isRegistrationNumberTaken(registrationNumber);
    if (isTaken) {
        return {
            errors: {
                registrationNumber: ["Ce matricule est déjà utilisé."],
            },
        };
    }

    try {
        const { id, ...agentData } = validatedFields.data;
        await db.collection('agents').add({
            ...agentData,
            status: 'available' // Default status
        });
        revalidatePath('/agents');
        revalidatePath('/');
        return { errors: {}, message: 'success' };
    } catch (error) {
        console.error("Error creating agent:", error);
        return { errors: {}, message: `Erreur serveur: Impossible de créer l'agent.` };
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
    const db = await dbPromise;
    const rawData = Object.fromEntries(formData.entries());
    const validatedFields = missionSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return { errors: validatedFields.error.flatten().fieldErrors };
    }
    
    await db.collection('missions').add({
        ...validatedFields.data,
        agentIds: [],
    });

    revalidatePath('/missions');
    revalidatePath('/');
    return { errors: {}, message: 'success' };
}

export async function saveMissionAssignments(assignments: Partial<Mission>[], unassignedMissions: string[]) {
    const db = await dbPromise;
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
  const db = await dbPromise;
  await db.collection('missions').doc(id).delete();
  revalidatePath("/missions");
  revalidatePath("/");
}
