'use server';

/**
 * @fileOverview An AI agent to suggest mission notes based on agent profile and mission details.
 *
 * - suggestMissionNotes - A function that handles the suggestion of mission notes.
 * - SuggestMissionNotesInput - The input type for the suggestMissionNotes function.
 * - SuggestMissionNotesOutput - The return type for the suggestMissionNotes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestMissionNotesInputSchema = z.object({
  agentProfile: z.string().describe('The profile of the agent, including their skills, experience, and past performance.'),
  missionDetails: z.string().describe('The details of the mission, including objectives, location, timeline, and potential risks.'),
});
export type SuggestMissionNotesInput = z.infer<typeof SuggestMissionNotesInputSchema>;

const SuggestMissionNotesOutputSchema = z.object({
  suggestedNotes: z.string().describe('Suggested notes or talking points for the mission assignment, tailored to the agent and mission.'),
});
export type SuggestMissionNotesOutput = z.infer<typeof SuggestMissionNotesOutputSchema>;

export async function suggestMissionNotes(input: SuggestMissionNotesInput): Promise<SuggestMissionNotesOutput> {
  return suggestMissionNotesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestMissionNotesPrompt',
  input: {schema: SuggestMissionNotesInputSchema},
  output: {schema: SuggestMissionNotesOutputSchema},
  prompt: `You are an expert mission briefing assistant. Based on the agent's profile and the mission details, suggest notes or talking points for the mission assignment.

Agent Profile: {{{agentProfile}}}

Mission Details: {{{missionDetails}}}

Suggested Notes:`,
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
