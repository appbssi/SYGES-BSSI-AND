"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getFirestore } from "firebase-admin/firestore";
import { initializeAdminApp } from "@/firebase/admin-init";
import type { Mission } from "./types";

// Initialize DB instance once per module
const dbPromise = initializeAdminApp().then(app => getFirestore(app));

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
