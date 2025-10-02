"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { addAgent, updateAgent, deleteAgent, addMission, updateMission, deleteMission, isRegistrationNumberTaken } from "./data";
import type { Agent, Mission } from "./types";

const agentSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  registrationNumber: z.string().min(1, "Le matricule est requis"),
  rank: z.string().min(1, "Le grade est requis"),
  contact: z.string().min(1, "Le contact est requis"),
  address: z.string().min(1, "L'adresse est requise"),
});

export async function createAgentAction(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  const validatedFields = agentSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  if (isRegistrationNumberTaken(validatedFields.data.registrationNumber)) {
     return {
      errors: { registrationNumber: ["Ce matricule est déjà pris."] },
    };
  }

  addAgent(validatedFields.data);
  revalidatePath("/agents");
  revalidatePath("/");
}

export async function updateAgentAction(id: string, formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  const validatedFields = agentSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  if (isRegistrationNumberTaken(validatedFields.data.registrationNumber, id)) {
     return {
      errors: { registrationNumber: ["Ce matricule est déjà pris."] },
    };
  }

  updateAgent(id, validatedFields.data);
  revalidatePath("/agents");
  revalidatePath("/");
  revalidatePath("/missions");
}

export async function deleteAgentAction(id: string) {
  deleteAgent(id);
  revalidatePath("/agents");
  revalidatePath("/");
  revalidatePath("/missions");
}

const missionSchema = z.object({
    name: z.string().min(1, "Le nom est requis"),
    details: z.string().min(1, "Les détails sont requis"),
    agentIds: z.array(z.string()),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    priority: z.coerce.number().min(1).max(5),
    notes: z.string().optional(),
});


export async function saveMissionAssignments(assignments: Partial<Mission>[], unassignedMissions: string[]) {
    assignments.forEach(mission => {
        if (mission.id) {
            updateMission(mission.id, { agentIds: mission.agentIds, notes: mission.notes });
        }
    });
    unassignedMissions.forEach(missionId => {
        updateMission(missionId, { agentIds: [] });
    });
    revalidatePath('/missions');
    revalidatePath('/agents');
    revalidatePath('/');
}

export async function deleteMissionAction(id: string) {
  deleteMission(id);
  revalidatePath("/missions");
  revalidatePath("/");
}
