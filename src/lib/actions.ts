"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { addAgent, updateAgent, deleteAgent, addMission, updateMission, deleteMission, isRegistrationNumberTaken } from "./data";
import type { Agent, Mission } from "./types";

const agentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  registrationNumber: z.string().min(1, "Registration number is required"),
  rank: z.string().min(1, "Rank is required"),
  contact: z.string().min(1, "Contact is required"),
  address: z.string().min(1, "Address is required"),
  skills: z.string().transform(val => val.split(',').map(s => s.trim()).filter(Boolean)),
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
      errors: { registrationNumber: ["This registration number is already taken."] },
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
      errors: { registrationNumber: ["This registration number is already taken."] },
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
    name: z.string().min(1, "Name is required"),
    details: z.string().min(1, "Details are required"),
    agentId: z.string().nullable(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    priority: z.coerce.number().min(1).max(5),
    requiredSkills: z.string().transform(val => val.split(',').map(s => s.trim()).filter(Boolean)),
    notes: z.string().optional(),
});


export async function saveMissionAssignments(assignments: Mission[], unassignedMissions: string[]) {
    assignments.forEach(mission => {
        updateMission(mission.id, { agentId: mission.agentId, notes: mission.notes });
    });
    unassignedMissions.forEach(missionId => {
        updateMission(missionId, { agentId: null });
    });
    revalidatePath('/missions');
    revalidatePath('/agents');
    revalidatePath('/');
}
