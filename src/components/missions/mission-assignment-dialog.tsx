"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { optimizeMissionAssignment, OptimizedMissionAssignmentOutput } from "@/ai/flows/optimize-mission-assignment";
import { suggestMissionNotes } from "@/ai/flows/suggest-mission-notes";
import { Agent, Mission } from "@/lib/types";
import { BrainCircuit, Loader2, Save, Wand2 } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import { saveMissionAssignments } from "@/lib/actions";

interface MissionAssignmentDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  agents: Agent[];
  missions: Mission[];
}

export function MissionAssignmentDialog({ isOpen, setIsOpen, agents, missions }: MissionAssignmentDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [suggestedNotesLoading, setSuggestedNotesLoading] = useState<string | null>(null);
  const [optimizedResult, setOptimizedResult] = useState<OptimizedMissionAssignmentOutput | null>(null);

  const getMissionStatus = (mission: Mission) => {
    const now = new Date();
    if (new Date(mission.endDate) < now) return "Terminée";
    if (new Date(mission.startDate) > now) return "À venir";
    return "Active";
  }

  const handleOptimize = async () => {
    setIsLoading(true);
    setOptimizedResult(null);

    const now = new Date();

    const agentAvailability = agents.map(agent => ({
        agentId: agent.id,
        availability: [{ start: now.toISOString(), end: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString() }],
        currentMissions: missions
            .filter(m => m.agentId === agent.id && getMissionStatus(m) === 'Active')
            .map(m => ({ missionId: m.id, start: new Date(m.startDate).toISOString(), end: new Date(m.endDate).toISOString() }))
    }));

    const missionsToAssign = missions.filter(m => getMissionStatus(m) !== 'Terminée' );
    
    try {
      const result = await optimizeMissionAssignment({
        agents: agentAvailability,
        missions: missionsToAssign.map(m => ({
            missionId: m.id,
            priority: m.priority,
            startTime: new Date(m.startDate).toISOString(),
            endTime: new Date(m.endDate).toISOString(),
        })),
      });
      setOptimizedResult(result);
      toast({ title: "Optimisation Terminée", description: "Veuillez examiner les assignations suggérées ci-dessous." });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Échec de l'Optimisation", description: "Impossible de générer les assignations." });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleNoteSuggestion = async (missionId: string, agentId: string) => {
    setSuggestedNotesLoading(missionId);
    const agent = agents.find(a => a.id === agentId);
    const mission = missions.find(m => m.id === missionId);

    if (agent && mission) {
        try {
            const result = await suggestMissionNotes({
                agentProfile: `Agent ${agent.name}, Grade: ${agent.rank}`,
                missionDetails: `Mission ${mission.name}: ${mission.details}`
            });
            
            if (optimizedResult) {
                const newAssignments = optimizedResult.assignments.map(a => 
                    a.missionId === missionId ? {...a, notes: result.suggestedNotes } : a
                );
                setOptimizedResult({...optimizedResult, assignments: newAssignments});
            }

        } catch (e) {
            toast({ variant: 'destructive', title: 'Échec de la suggestion de notes.' });
        }
    }
    setSuggestedNotesLoading(null);
  };
  
  const handleNotesChange = (missionId: string, newNotes: string) => {
    if (optimizedResult) {
        const newAssignments = optimizedResult.assignments.map(a => 
            a.missionId === missionId ? {...a, notes: newNotes } : a
        );
        setOptimizedResult({...optimizedResult, assignments: newAssignments});
    }
  }

  const handleSaveAssignments = async () => {
    if (!optimizedResult) return;
    setIsSaving(true);
    const missionsToUpdate = optimizedResult.assignments.map(a => ({
        id: a.missionId,
        agentId: a.agentId,
        notes: a.notes,
    } as Mission));
    
    await saveMissionAssignments(missionsToUpdate, optimizedResult.unassignedMissions);
    setIsSaving(false);
    setIsOpen(false);
    toast({ title: 'Assignations Enregistrées', description: 'Le tableau des missions a été mis à jour.' });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl h-[90vh]">
        <DialogHeader>
          <DialogTitle>Assignation Intelligente de Mission</DialogTitle>
          <DialogDescription>
            Utilisez l'IA pour trouver l'assignation optimale pour chaque mission en fonction de la disponibilité des agents.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0">
          {!optimizedResult && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <BrainCircuit className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold">Prêt à Optimiser</h3>
              <p className="text-muted-foreground mb-6">Cliquez sur le bouton pour lancer le processus d'assignation assisté par l'IA.</p>
              <Button onClick={handleOptimize} disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Optimisation en cours...</> : "Optimiser les Assignations"}
              </Button>
            </div>
          )}
          {optimizedResult && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
              <div className="md:col-span-2 flex flex-col">
                <h3 className="font-semibold mb-2">Assignations Suggérées ({optimizedResult.assignments.length})</h3>
                <ScrollArea className="flex-1 border rounded-lg p-4">
                  <div className="space-y-4">
                    {optimizedResult.assignments.map(assignment => {
                      const agent = agents.find(a => a.id === assignment.agentId);
                      const mission = missions.find(m => m.id === assignment.missionId);
                      return (
                        <div key={assignment.missionId} className="p-3 bg-card rounded-md border">
                          <p className="font-semibold">{mission?.name} &rarr; {agent?.name}</p>
                          <p className="text-sm text-muted-foreground">{mission?.details}</p>
                          <div className="mt-2">
                             <Textarea 
                                placeholder="Notes d'assignation..." 
                                value={assignment.notes || ''}
                                onChange={(e) => handleNotesChange(assignment.missionId, e.target.value)}
                                className="text-sm"
                             />
                             <Button size="sm" variant="ghost" className="mt-1" onClick={() => handleNoteSuggestion(assignment.missionId, assignment.agentId)} disabled={!!suggestedNotesLoading}>
                                {suggestedNotesLoading === assignment.missionId ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Wand2 className="mr-2 h-3 w-3" />}
                                Suggérer des Notes
                             </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              </div>
              <div className="flex flex-col">
                <h3 className="font-semibold mb-2">Missions Non Assignées ({optimizedResult.unassignedMissions.length})</h3>
                 <ScrollArea className="flex-1 border rounded-lg p-4 bg-muted/50">
                   <div className="space-y-2">
                    {optimizedResult.unassignedMissions.map(missionId => {
                        const mission = missions.find(m => m.id === missionId);
                        return <div key={missionId} className="p-2 bg-card rounded text-sm text-muted-foreground">{mission?.name}</div>
                    })}
                    {optimizedResult.unassignedMissions.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Toutes les missions sont assignées !</p>}
                   </div>
                 </ScrollArea>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Annuler</Button>
          <Button type="button" onClick={handleSaveAssignments} disabled={!optimizedResult || isSaving}>
            {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enregistrement...</> : <><Save className="mr-2 h-4 w-4"/> Enregistrer les Assignations</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
