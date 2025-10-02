
"use client";

import { useState, useEffect } from "react";
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
import { BrainCircuit, Loader2, Save, Sparkles } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "../ui/label";
import { useFirestore } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { optimizeMissionAssignment } from "@/ai/flows/optimize-mission-assignment";
import { useAuth } from "@/context/auth-context";

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
  const { user } = useAuth();
  const isViewer = user?.role === 'viewer';
  
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSaving, setIsSaving] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [assignments, setAssignments] = useState<MissionAssignmentState>({});
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if(isOpen) {
      setAssignments({});
    }
  }, [isOpen]);
  
  const getMissionStatus = (mission: Mission) => {
    if (!isClient) return "Chargement...";
    const now = new Date();
    if (new Date(mission.endDate) < now) return "Terminée";
    if (new Date(mission.startDate) > now) return "À venir";
    return "Active";
  }

  const unassignedMissions = missions.filter(m => m.agentIds.length === 0 && getMissionStatus(m) !== "Terminée");

  const getAvailableAgentsForMission = (mission: Mission) => {
    const missionStart = new Date(mission.startDate);
    const missionEnd = new Date(mission.endDate);
    
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
      const hasConflict = missions.some(m =>
        m.agentIds.includes(agent.id) &&
        getMissionStatus(m) !== 'Terminée' &&
        new Date(m.startDate) < missionEnd &&
        new Date(m.endDate) > missionStart
      );
      
      const isBusyInDialog = busyInDialogAgentIds.has(agent.id);
      
      return !hasConflict && !isBusyInDialog;
    });
  };

  const handleAssignmentChange = (missionId: string, agentId: string) => {
    setAssignments(prev => ({ ...prev, [missionId]: agentId }));
  };
  
  const handleOptimize = async () => {
    setIsOptimizing(true);
    try {
        const agentData = agents.map(agent => ({
            agentId: agent.id,
            availability: [{ start: new Date(0).toISOString(), end: new Date(8640000000000000).toISOString() }], // Assuming agents are always available unless on a mission
            currentMissions: missions
                .filter(m => m.agentIds.includes(agent.id))
                .map(m => ({ missionId: m.id, start: m.startDate, end: m.endDate }))
        }));

        const missionData = unassignedMissions.map(m => ({
            missionId: m.id,
            startTime: m.startDate,
            endTime: m.endDate,
        }));
        
        const result = await optimizeMissionAssignment({ agents: agentData, missions: missionData });

        if (result.assignments) {
            const newAssignments: MissionAssignmentState = {};
            result.assignments.forEach(a => {
                newAssignments[a.missionId] = a.agentId;
            });
            setAssignments(newAssignments);
            toast({ title: "Optimisation Réussie", description: "Les assignations suggérées ont été chargées." });
        }
        
        if (result.unassignedMissions.length > 0) {
            toast({ variant: 'destructive', title: "Missions Non Assignées", description: `${result.unassignedMissions.length} mission(s) n'ont pas pu être assignées.` });
        }

    } catch (error) {
        console.error("Error optimizing assignments: ", error);
        toast({
            variant: "destructive",
            title: "Erreur d'Optimisation",
            description: "Une erreur est survenue lors de l'optimisation IA."
        });
    } finally {
        setIsOptimizing(false);
    }
  };


  const handleSaveAssignments = async () => {
    if (Object.keys(assignments).length === 0) {
        setIsOpen(false);
        return;
    };
    setIsSaving(true);

    try {
        const updatePromises = Object.entries(assignments).map(([missionId, agentId]) => {
            const missionRef = doc(firestore, "missions", missionId);
            const mission = missions.find(m => m.id === missionId);
            if(!mission) return Promise.resolve();

            const newAgentIds = Array.from(new Set([...mission.agentIds, agentId]));
            return updateDoc(missionRef, { agentIds: newAgentIds });
        });

        await Promise.all(updatePromises);
        
        toast({ title: 'Assignations Enregistrées', description: 'Le tableau des missions a été mis à jour.' });
        setIsOpen(false);
    } catch (error) {
        console.error("Error saving assignments: ", error);
        toast({
            variant: "destructive",
            title: "Erreur",
            description: "Une erreur est survenue lors de l'enregistrement."
        });
    } finally {
        setIsSaving(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl h-[70vh]">
        <DialogHeader>
          <DialogTitle>Assignation Manuelle des Missions</DialogTitle>
          <DialogDescription className="flex justify-between items-center">
            <span>Assignez des agents disponibles aux missions non-assignées.</span>
             <Button variant="outline" size="sm" onClick={handleOptimize} disabled={isOptimizing || unassignedMissions.length === 0 || isViewer}>
                {isOptimizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Optimiser avec l'IA
            </Button>
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
                                <Select onValueChange={(agentId) => handleAssignmentChange(mission.id, agentId)} value={assignments[mission.id] || ""} disabled={isViewer}>
                                    <SelectTrigger id={`assign-${mission.id}`} className="w-full">
                                        <SelectValue placeholder="Sélectionner un agent..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableAgents.map(agent => (
                                            <SelectItem key={agent.id} value={agent.id}>{agent.firstName} {agent.lastName}</SelectItem>
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
          <Button type="button" onClick={handleSaveAssignments} disabled={isSaving || isViewer}>
            {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enregistrement...</> : <><Save className="mr-2 h-4 w-4"/> Enregistrer les Assignations</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
