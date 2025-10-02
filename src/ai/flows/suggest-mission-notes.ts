'use server';

/**
 * @fileOverview Un agent IA pour suggérer des notes de mission basées sur le profil de l'agent et les détails de la mission.
 *
 * - suggestMissionNotes - Une fonction qui gère la suggestion de notes de mission.
 * - SuggestMissionNotesInput - Le type d'entrée pour la fonction suggestMissionNotes.
 * - SuggestMissionNotesOutput - Le type de retour pour la fonction suggestMissionNotes.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestMissionNotesInputSchema = z.object({
  agentProfile: z.string().describe("Le profil de l'agent, y compris son grade et son expérience passée."),
  missionDetails: z.string().describe("Les détails de la mission, y compris les objectifs, le lieu, le calendrier et les risques potentiels."),
});
export type SuggestMissionNotesInput = z.infer<typeof SuggestMissionNotesInputSchema>;

const SuggestMissionNotesOutputSchema = z.object({
  suggestedNotes: z.string().describe("Notes ou points de discussion suggérés pour l'assignation de la mission, adaptés à l'agent et à la mission."),
});
export type SuggestMissionNotesOutput = z.infer<typeof SuggestMissionNotesOutputSchema>;

export async function suggestMissionNotes(input: SuggestMissionNotesInput): Promise<SuggestMissionNotesOutput> {
  return suggestMissionNotesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestMissionNotesPrompt',
  input: {schema: SuggestMissionNotesInputSchema},
  output: {schema: SuggestMissionNotesOutputSchema},
  prompt: `Vous êtes un expert en briefing de mission. En vous basant sur le profil de l'agent et les détails de la mission, suggérez des notes ou des points de discussion pour l'assignation de la mission. La réponse doit être en français.

Profil de l'agent : {{{agentProfile}}}

Détails de la mission : {{{missionDetails}}}

Notes suggérées :`,
});

const suggestMissionNotesFlow = ai.defineFlow(
  {
    name: 'suggestMissionNotesFlow',
    inputSchema: SuggestMissionNotesInputSchema,
    outputSchema: SuggestMissionNotesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
