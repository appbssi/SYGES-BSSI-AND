
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
import { Check, Download, MoreHorizontal, Plus, Trash2, UserPlus, Users, ChevronDown, FileSpreadsheet, FileText } from "lucide-react";
import { format } from "date-fns";
import { exportToCsv, exportToPdf } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSeparator,
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MissionForm } from "./mission-form";
import { MissionAssignmentDialog } from "./mission-assignment-dialog";

type MissionWithAgents = Omit<Mission, "agentIds"> & { agents: (Omit<Agent, 'avatar'> | null)[], status: "Active" | "À venir" | "Terminée" };

export function MissionsClient({
  initialAgents,
  initialMissions,
}: {
  initialAgents: Agent[];
  initialMissions: Mission[];
}) {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
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
  
  const isAgentAvailableForMission = (agent: Agent, missionToCheck: Mission, allMissions: Mission[]): boolean => {
    if (getMissionStatus(missionToCheck) === 'Terminée') return true;

    const missionStart = new Date(missionToCheck.startDate);
    const missionEnd = new Date(missionToCheck.endDate);

    const conflictingMissions = allMissions.filter(m =>
      m.id !== missionToCheck.id &&
      m.agentIds.includes(agent.id) &&
      getMissionStatus(m) !== 'Terminée'
    );

    for (const mission of conflictingMissions) {
      const existingStart = new Date(mission.startDate);
      const existingEnd = new Date(mission.endDate);
      if (missionStart < existingEnd && missionEnd > existingStart) {
        return false;
      }
    }
    return true;
  };


  const missionsWithAgents: MissionWithAgents[] = initialMissions.map(
    (mission) => {
      const agentsData = mission.agentIds.map(id => initialAgents.find((a) => a.id === id) || null);
      const agents = agentsData.map(agentData => {
        if (agentData) {
          const { ...rest } = agentData;
          return rest;
        }
        return null;
      });

      return {
      ...mission,
      agents,
      status: getMissionStatus(mission)
    }}
  ).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  
  const handleExportCsv = () => {
    const dataToExport = missionsWithAgents.map(m => ({
        nom_mission: m.name,
        noms_agents: m.agents.map(a => a?.name || '').join('; ') || "Non assignée",
        matricules_agents: m.agents.map(a => a?.registrationNumber || '').join('; ') || "N/A",
        date_debut: format(new Date(m.startDate), 'P', { locale: fr }),
        date_fin: format(new Date(m.endDate), 'P', { locale: fr }),
        statut: m.status,
    }));
    exportToCsv(dataToExport, "ebrigade_missions.csv");
  };

  const handleExportPdf = () => {
    const headers = ["Mission", "Agents", "Début", "Fin", "Statut"];
    const body = missionsWithAgents.map(m => [
        m.name,
        m.agents.map(a => a?.name).filter(Boolean).join(', ') || 'Non assignée',
        format(new Date(m.startDate), 'P', { locale: fr }),
        format(new Date(m.endDate), 'P', { locale: fr }),
        m.status,
    ]);
    exportToPdf("Journal de Mission", headers, body, "ebrigade_missions.pdf");
  };


  const handleDelete = (mission: Mission) => {
    setSelectedMission(mission);
    setIsAlertOpen(true);
  }
  
  const handleAddNew = () => {
    setSelectedMission(null);
    setIsFormOpen(true);
  };

  const handleToggleAgent = async (missionId: string, agentId: string) => {
      const mission = initialMissions.find(m => m.id === missionId);
      if (!mission) return;

      let newAgentIds: string[];
      if (mission.agentIds.includes(agentId)) {
        newAgentIds = mission.agentIds.filter(id => id !== agentId);
      } else {
        newAgentIds = [...mission.agentIds, agentId];
      }
      
      await saveMissionAssignments([{ id: missionId, agentIds: newAgentIds } as Mission], []);
      toast({
          title: "Assignation Mise à Jour",
          description: "La liste des agents pour la mission a été mise à jour."
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
            <Button variant="outline" onClick={() => setIsAssignmentDialogOpen(true)}><UserPlus className="mr-2" /> Assigner</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="mr-2" /> Exporter <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleExportCsv}>
                  <FileSpreadsheet className="mr-2" /> Exporter en CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPdf}>
                  <FileText className="mr-2" /> Exporter en PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={handleAddNew}><Plus className="mr-2" /> Créer une Mission</Button>
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mission</TableHead>
                <TableHead>Agents Assignés</TableHead>
                <TableHead>Calendrier</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {missionsWithAgents.map((mission) => {
                
                return (
                <TableRow key={mission.id}>
                  <TableCell className="font-medium">{mission.name}</TableCell>
                  <TableCell>
                    {mission.agents.length > 0 ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Badge variant="outline" className="cursor-pointer">
                            <Users className="mr-2 h-3 w-3" />
                            {mission.agents.length} agent(s)
                          </Badge>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto">
                          <div className="space-y-2">
                            <h4 className="font-medium leading-none">Agents Assignés</h4>
                            <div className="grid gap-2">
                              {mission.agents.map(agent => agent && (
                                <div key={agent.id} className="flex items-center gap-2">
                                  <p>{agent.name} ({agent.rank})</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
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
                               Assigner des agents
                           </DropdownMenuSubTrigger>
                           <DropdownMenuPortal>
                               <DropdownMenuSubContent className="max-h-64 overflow-y-auto">
                                  {initialAgents.map(agent => (
                                     <DropdownMenuItem 
                                        key={agent.id} 
                                        onSelect={(e) => e.preventDefault()} 
                                        onClick={() => handleToggleAgent(mission.id, agent.id)}
                                        disabled={!isAgentAvailableForMission(agent, mission, initialMissions) && !mission.agentIds.includes(agent.id)}
                                      >
                                         <div className="w-4 mr-2">
                                            {mission.agentIds.includes(agent.id) && <Check className="h-4 w-4" />}
                                         </div>
                                         {agent.name}
                                     </DropdownMenuItem>
                                  ))}
                               </DropdownMenuSubContent>
                           </DropdownMenuPortal>
                        </DropdownMenuSub>
                        )}
                        <DropdownMenuSeparator />
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
      
      <MissionForm 
        isOpen={isFormOpen} 
        setIsOpen={setIsFormOpen} 
        mission={selectedMission}
      />
      
      <MissionAssignmentDialog
        isOpen={isAssignmentDialogOpen}
        setIsOpen={setIsAssignmentDialogOpen}
        agents={initialAgents}
        missions={initialMissions}
      />

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

    