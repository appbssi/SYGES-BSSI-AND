'use server';

/**
 * @fileOverview Ce fichier définit un flux Genkit pour optimiser les assignations de mission en fonction de la disponibilité des agents, de leurs compétences et de la priorité de la mission à l'aide de l'IA. Il comprend les définitions de fonction pour la fonction optimizeMissionAssignment,
 * ainsi que les types d'entrée et de sortie.
 *
 * - optimizeMissionAssignment - Une fonction qui gère le processus d'optimisation des assignations de mission.
 * - OptimizeMissionAssignmentInput - Le type d'entrée pour la fonction optimizeMissionAssignment.
 * - OptimizedMissionAssignmentOutput - Le type de retour pour la fonction optimizeMissionAssignment.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OptimizeMissionAssignmentInputSchema = z.object({
  agents: z.array(
    z.object({
      agentId: z.string().describe("Identifiant unique de l'agent."),
      availability: z
        .array(
          z.object({
            start: z.string().datetime().describe("Heure de début de la disponibilité."),
            end: z.string().datetime().describe("Heure de fin de la disponibilité."),
          })
        )
        .describe("Plages de disponibilité de l'agent."),
      skills: z.array(z.string()).describe("Liste des compétences de l'agent."),
      currentMissions: z
        .array(
          z.object({
            missionId: z.string().describe("Identifiant unique de la mission."),
            start: z.string().datetime().describe("Heure de début de la mission."),
            end: z.string().datetime().describe("Heure de fin de la mission."),
          })
        )
        .describe("Liste des missions actuellement assignées."),
    })
  ).describe("Liste des agents à considérer pour l'assignation."),
  missions: z.array(
    z.object({
      missionId: z.string().describe("Identifiant unique de la mission."),
      priority: z.number().describe("Priorité de la mission (plus le nombre est élevé, plus la priorité est haute)."),
      requiredSkills: z.array(z.string()).describe("Liste des compétences requises pour la mission."),
      startTime: z.string().datetime().describe("Heure de début de la mission."),
      endTime: z.string().datetime().describe("Heure de fin de la mission."),
    })
  ).describe("Liste des missions à assigner."),
});

export type OptimizeMissionAssignmentInput = z.infer<typeof OptimizeMissionAssignmentInputSchema>;

const OptimizedMissionAssignmentOutputSchema = z.object({
  assignments: z.array(
    z.object({
      agentId: z.string().describe("L'ID de l'agent assigné à la mission."),
      missionId: z.string().describe("L'ID de la mission assignée à l'agent."),
      notes: z.string().optional().describe("Notes sur l'assignation, y compris les conflits potentiels."),
    })
  ).describe("Une liste d'assignations de mission optimisées."),
  unassignedMissions: z
    .array(z.string())
    .describe("Liste des ID de mission qui n'ont pas pu être assignées."),
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
  prompt: `Vous êtes un assistant IA spécialisé dans l'optimisation des assignations de missions pour une unité militaire.

  Étant donné une liste d'agents avec leur disponibilité, leurs compétences et leurs missions actuelles, et une liste de missions avec leurs priorités, compétences requises et délais, votre tâche est de créer un calendrier d'assignation optimisé.

  Considérez les facteurs suivants :
  - Disponibilité de l'agent : Assurez-vous que les agents ne sont assignés à des missions que pendant leurs plages de disponibilité.
  - Compétences de l'agent : Faites correspondre les agents avec les missions qui requièrent leurs compétences.
  - Priorité de la mission : Assignez les missions à plus haute priorité en premier.
  - Évitement des conflits : Détectez et résolvez tout conflit de temps potentiel entre les missions assignées au même agent. Si les conflits sont inévitables, notez-les dans les notes d'assignation.
  
  La réponse doit être en français.

  Entrée :
  Agents : {{{JSON.stringify agents}}}
  Missions : {{{JSON.stringify missions}}}

  Sortie :
  Fournissez un objet JSON avec la structure suivante :
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
  assignments : Un tableau d'objets, où chaque objet représente une assignation d'un agent à une mission. Chaque objet d'assignation doit inclure l'agentId, le missionId et toutes les notes pertinentes (par exemple, conflits potentiels, lacunes en matière de compétences).
  unassignedMissions : Un tableau d'ID de mission qui n'ont pas pu être assignés en raison de conflits, d'un manque d'agents disponibles ou de non-concordance des compétences.
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
