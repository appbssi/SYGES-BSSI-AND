'use server';

/**
 * @fileOverview This file defines a Genkit flow for optimizing mission assignments based on agent availability, skills, and mission priority using AI. It includes function definitions for the optimizeMissionAssignment function,
 * along with the input and output types.
 *
 * - optimizeMissionAssignment - A function that handles the mission assignment optimization process.
 * - OptimizeMissionAssignmentInput - The input type for the optimizeMissionAssignment function.
 * - OptimizedMissionAssignmentOutput - The return type for the optimizeMissionAssignment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OptimizeMissionAssignmentInputSchema = z.object({
  agents: z.array(
    z.object({
      agentId: z.string().describe('Unique identifier for the agent.'),
      availability: z
        .array(
          z.object({
            start: z.string().datetime().describe('Start time of availability.'),
            end: z.string().datetime().describe('End time of availability.'),
          })
        )
        .describe('Agent availability slots.'),
      skills: z.array(z.string()).describe('List of skills the agent possesses.'),
      currentMissions: z
        .array(
          z.object({
            missionId: z.string().describe('Unique identifier for the mission.'),
            start: z.string().datetime().describe('Start time of the mission.'),
            end: z.string().datetime().describe('End time of the mission.'),
          })
        )
        .describe('List of currently assigned missions.'),
    })
  ).describe('List of agents to consider for assignment.'),
  missions: z.array(
    z.object({
      missionId: z.string().describe('Unique identifier for the mission.'),
      priority: z.number().describe('Priority of the mission (higher number = higher priority).'),
      requiredSkills: z.array(z.string()).describe('List of skills required for the mission.'),
      startTime: z.string().datetime().describe('Start time of the mission.'),
      endTime: z.string().datetime().describe('End time of the mission.'),
    })
  ).describe('List of missions to assign.'),
});

export type OptimizeMissionAssignmentInput = z.infer<typeof OptimizeMissionAssignmentInputSchema>;

const OptimizedMissionAssignmentOutputSchema = z.object({
  assignments: z.array(
    z.object({
      agentId: z.string().describe('The ID of the agent assigned to the mission.'),
      missionId: z.string().describe('The ID of the mission assigned to the agent.'),
      notes: z.string().optional().describe('Notes on the assignment, including any potential conflicts.'),
    })
  ).describe('A list of optimized mission assignments.'),
  unassignedMissions: z
    .array(z.string())
    .describe('List of mission IDs that could not be assigned.'),
});

export type OptimizedMissionAssignmentOutput = z.infer<typeof OptimizedMissionAssignmentOutputSchema>;

export async function optimizeMissionAssignment(
  input: OptimizeMissionAssignmentInput
): Promise<OptimizedMissionAssignmentOutput> {
  return optimizeMissionAssignmentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'optimizeMissionAssignmentPrompt',
  input: {schema: OptimizeMissionAssignmentInputSchema},
  output: {schema: OptimizedMissionAssignmentOutputSchema},
  prompt: `You are an AI assistant specialized in optimizing mission assignments for a military unit.

  Given a list of agents with their availability, skills, and current missions, and a list of missions with their priorities, required skills, and timeframes, your task is to create an optimized assignment schedule.

  Consider the following factors:
  - Agent availability: Ensure that agents are only assigned to missions during their available time slots.
  - Agent skills: Match agents with missions that require their skills.
  - Mission priority: Assign higher-priority missions first.
  - Conflict avoidance: Detect and resolve any potential time conflicts between missions assigned to the same agent. If conflicts are unavoidable, note them in the assignment notes.

  Input:
  Agents: {{{JSON.stringify agents}}}
  Missions: {{{JSON.stringify missions}}}

  Output:
  Provide a JSON object with the following structure:
  {
  "assignments": [
  {
  "agentId": "agent123",
  "missionId": "mission456",
  "notes": ""
  }
  ],
  "unassignedMissions": ["mission789"]
  }
  assignments: An array of objects, where each object represents an assignment of an agent to a mission. Each assignment object should include the agentId, missionId, and any relevant notes (e.g., potential conflicts, skill gaps).
  unassignedMissions: An array of mission IDs that could not be assigned due to conflicts, lack of available agents, or skill mismatches.
  `,
});

const optimizeMissionAssignmentFlow = ai.defineFlow(
  {
    name: 'optimizeMissionAssignmentFlow',
    inputSchema: OptimizeMissionAssignmentInputSchema,
    outputSchema: OptimizedMissionAssignmentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
