"use client";

import { useState } from "react";
import type { Agent, Mission } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BrainCircuit, Download, MoreHorizontal, Trash2, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { MissionAssignmentDialog } from "./mission-assignment-dialog";
import { exportToCsv } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteMissionAction, saveMissionAssignments } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { fr } from "date-fns/locale";

type MissionWithAgent = Omit<Mission, "agentId"> & { agent: Omit<Agent, 'avatar'> | null, status: "Active" | "À venir" | "Terminée" };

export function MissionsClient({
  initialAgents,
  initialMissions,
}: {
  initialAgents: Agent[];
  initialMissions: Mission[];
}) {
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const { toast } = useToast();

  const getMissionStatus = (mission: Mission): "Active" | "À venir" | "Terminée" => {
    const now = new Date();
    const start = new Date(mission.startDate);
    const end = new Date(mission.endDate);
    if (end < now) return "Terminée";
    if (start > now) return "À venir";
    return "Active";
  }
  
  const isAgentAvailable = (agentId: string, missionToCheck: Mission) => {
      const missionStart = new Date(missionToCheck.startDate);
      const missionEnd = new Date(missionToCheck.endDate);
      
      const agentMissions = initialMissions.filter(m => m.agentId === agentId && m.id !== missionToCheck.id);

      for (const mission of agentMissions) {
          const existingStart = new Date(mission.startDate);
          const existingEnd = new Date(mission.endDate);
          // Check for overlap
          if (missionStart < existingEnd && missionEnd > existingStart) {
              return false; // Agent is busy
          }
      }
      return true; // Agent is available
  }

  const missionsWithAgents: MissionWithAgent[] = initialMissions.map(
    (mission) => {
      const agentData = initialAgents.find((a) => a.id === mission.agentId) || null;
      const agent = agentData ? { ...agentData } : null;
      if (agent) {
        delete (agent as any).avatar;
      }

      return {
      ...mission,
      agent,
      status: getMissionStatus(mission)
    }}
  ).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  
  const handleExport = () => {
    const dataToExport = missionsWithAgents.map(m => ({
        nom_mission: m.name,
        nom_agent: m.agent?.name || "Non assignée",
        matricule_agent: m.agent?.registrationNumber || "N/A",
        date_debut: m.startDate,
        date_fin: m.endDate,
        statut: m.status,
    }));
    exportToCsv(dataToExport, "ebrigade_missions.csv");
  };

  const handleDelete = (mission: Mission) => {
    setSelectedMission(mission);
    setIsAlertOpen(true);
  }
  
  const handleAssignAgent = async (missionId: string, agentId: string | null) => {
      await saveMissionAssignments([{ id: missionId, agentId: agentId }] as Mission[], []);
      toast({
          title: "Assignation Mise à Jour",
          description: "L'agent a été assigné à la mission."
      });
  }

  const confirmDelete = async () => {
    if (selectedMission) {
      await deleteMissionAction(selectedMission.id);
      toast({
        title: "Mission Annulée",
        description: `La mission ${selectedMission.name} a été annulée.`,
      });
      setIsAlertOpen(false);
      setSelectedMission(null);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Journal de Mission</h2>
        <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}><Download className="mr-2" /> Exporter en CSV</Button>
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mission</TableHead>
                <TableHead>Agent Assigné</TableHead>
                <TableHead>Calendrier</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {missionsWithAgents.map((mission) => {
                const availableAgents = initialAgents.filter(agent => isAgentAvailable(agent.id, mission));
                return (
                <TableRow key={mission.id}>
                  <TableCell className="font-medium">{mission.name}</TableCell>
                  <TableCell>
                    {mission.agent ? (
                      <span>{mission.agent.name}</span>
                    ) : (
                      <span className="text-muted-foreground">Non assignée</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {format(new Date(mission.startDate), "dd/MM/yy", { locale: fr })} -{" "}
                    {format(new Date(mission.endDate), "dd/MM/yy", { locale: fr })}
                  </TableCell>
                  <TableCell>
                     <Badge
                        variant={mission.status === 'Active' ? 'destructive' : 'secondary'}
                        className={
                            mission.status === 'Active' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/80 dark:text-blue-200' : 
                            mission.status === 'Terminée' ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' :
                            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/80 dark:text-yellow-200'
                        }
                     >
                        {mission.status}
                     </Badge>
                  </TableCell>
                   <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {mission.status !== 'Terminée' && (
                        <DropdownMenuSub>
                           <DropdownMenuSubTrigger>
                               <UserPlus className="mr-2 h-4 w-4" />
                               {mission.agentId ? "Changer l'agent" : "Assigner un agent"}
                           </DropdownMenuSubTrigger>
                           <DropdownMenuPortal>
                               <DropdownMenuSubContent>
                                  {availableAgents.map(agent => (
                                     <DropdownMenuItem key={agent.id} onClick={() => handleAssignAgent(mission.id, agent.id)}>
                                         {agent.name}
                                     </DropdownMenuItem>
                                  ))}
                                  {availableAgents.length === 0 && <DropdownMenuItem disabled>Aucun agent disponible</DropdownMenuItem>}
                                  {mission.agentId && (
                                     <DropdownMenuItem className="text-destructive" onClick={() => handleAssignAgent(mission.id, null)}>
                                         Désassigner
                                     </DropdownMenuItem>
                                  )}
                               </DropdownMenuSubContent>
                           </DropdownMenuPortal>
                        </DropdownMenuSub>
                        )}
                        <DropdownMenuItem onClick={() => handleDelete(mission)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> Annuler
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )})}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
       <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Elle supprimera définitivement la mission {selectedMission?.name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
