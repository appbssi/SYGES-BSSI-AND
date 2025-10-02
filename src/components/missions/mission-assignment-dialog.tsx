
"use client";

import { useState } from "react";
import { format } from "date-fns";
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
import { Agent, Mission } from "@/lib/types";
import { BrainCircuit, Loader2, Save } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { saveMissionAssignments } from "@/lib/actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "../ui/label";

interface MissionAssignmentDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  agents: Agent[];
  missions: Mission[];
}

type MissionAssignmentState = {
  [missionId: string]: string; // agentId
};


export function MissionAssignmentDialog({ isOpen, setIsOpen, agents, missions }: MissionAssignmentDialogProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [assignments, setAssignments] = useState<MissionAssignmentState>({});
  
  const getMissionStatus = (mission: Mission) => {
    const now = new Date();
    if (new Date(mission.endDate) < now) return "Terminée";
    if (new Date(mission.startDate) > now) return "À venir";
    return "Active";
  }

  const unassignedMissions = missions.filter(m => m.agentIds.length === 0 && getMissionStatus(m) !== "Terminée");

  const getAvailableAgentsForMission = (mission: Mission) => {
    const missionStart = new Date(mission.startDate);
    const missionEnd = new Date(mission.endDate);
    
    // Find agents who are busy during this mission's timeframe due to other manual assignments in this dialog
    const busyInDialogAgentIds = new Set<string>();
    Object.entries(assignments).forEach(([assignedMissionId, agentId]) => {
      if (assignedMissionId === mission.id) return;
      const otherMission = missions.find(m => m.id === assignedMissionId);
      if(otherMission) {
        const otherStart = new Date(otherMission.startDate);
        const otherEnd = new Date(otherMission.endDate);
        if(missionStart < otherEnd && missionEnd > otherStart) {
          busyInDialogAgentIds.add(agentId);
        }
      }
    });

    return agents.filter(agent => {
      // Is agent busy with an existing, confirmed mission?
      const hasConflict = missions.some(m =>
        m.agentIds.includes(agent.id) &&
        getMissionStatus(m) !== 'Terminée' &&
        new Date(m.startDate) < missionEnd &&
        new Date(m.endDate) > missionStart
      );
      
      // Is agent busy with a selection in the current dialog?
      const isBusyInDialog = busyInDialogAgentIds.has(agent.id);
      
      return !hasConflict && !isBusyInDialog;
    });
  };

  const handleAssignmentChange = (missionId: string, agentId: string) => {
    setAssignments(prev => ({ ...prev, [missionId]: agentId }));
  };


  const handleSaveAssignments = async () => {
    if (Object.keys(assignments).length === 0) {
        setIsOpen(false);
        return;
    };
    setIsSaving(true);

    // This logic needs to merge new assignments with existing ones
    const missionsToUpdate: Partial<Mission>[] = Object.entries(assignments).map(([missionId, agentId]) => {
        const mission = missions.find(m => m.id === missionId);
        if (!mission) return null;
        
        const newAgentIds = Array.from(new Set([...mission.agentIds, agentId]));
        
        return {
            id: missionId,
            agentIds: newAgentIds,
        };
    }).filter((m): m is Partial<Mission> => m !== null);
    
    await saveMissionAssignments(missionsToUpdate, []);
    setIsSaving(false);
    setIsOpen(false);
    setAssignments({});
    toast({ title: 'Assignations Enregistrées', description: 'Le tableau des missions a été mis à jour.' });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl h-[70vh]">
        <DialogHeader>
          <DialogTitle>Assignation Manuelle des Missions</DialogTitle>
          <DialogDescription>
            Assignez des agents disponibles aux missions non-assignées.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 border rounded-lg p-4 my-4">
            <div className="space-y-6">
                {unassignedMissions.length > 0 ? unassignedMissions.map(mission => {
                    const availableAgents = getAvailableAgentsForMission(mission);
                    return (
                        <div key={mission.id} className="p-3 bg-card rounded-md border grid grid-cols-2 gap-4 items-center">
                            <div>
                                <p className="font-semibold">{mission.name}</p>
                                <p className="text-sm text-muted-foreground">{format(new Date(mission.startDate), "dd/MM/yy")} - {format(new Date(mission.endDate), "dd/MM/yy")}</p>
                            </div>
                            <div>
                                <Label htmlFor={`assign-${mission.id}`} className="sr-only">Assigner Agent</Label>
                                <Select onValueChange={(agentId) => handleAssignmentChange(mission.id, agentId)}>
                                    <SelectTrigger id={`assign-${mission.id}`} className="w-full">
                                        <SelectValue placeholder="Sélectionner un agent..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableAgents.map(agent => (
                                            <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                                        ))}
                                        {availableAgents.length === 0 && <p className="p-2 text-xs text-muted-foreground text-center">Aucun agent disponible</p>}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
                        <BrainCircuit className="w-12 h-12 mb-4" />
                        <h3 className="font-semibold">Toutes les missions sont assignées !</h3>
                    </div>
                )}
            </div>
        </ScrollArea>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Annuler</Button>
          <Button type="button" onClick={handleSaveAssignments} disabled={isSaving}>
            {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enregistrement...</> : <><Save className="mr-2 h-4 w-4"/> Enregistrer les Assignations</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
