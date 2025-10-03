
"use client";

import { useState, useMemo, useEffect } from "react";
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
import { Check, Download, MoreHorizontal, Plus, Trash2, UserPlus, Users, ChevronDown, FileSpreadsheet, FileText, CalendarClock } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { fr } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MissionForm } from "./mission-form";
import { MissionAssignmentDialog } from "./mission-assignment-dialog";
import { ExtendMissionDialog } from "./extend-mission-dialog";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { agentsCollection } from "@/firebase/firestore/agents";
import { missionsCollection, missionDoc } from "@/firebase/firestore/missions";
import { updateDoc, doc, deleteDoc } from "firebase/firestore";
import { useAuth } from "@/context/auth-context";
import { ScrollArea } from "../ui/scroll-area";

type MissionStatus = "Active" | "À venir" | "Terminée" | "Chargement...";
type MissionWithAgents = Mission & { agents: Agent[], status: MissionStatus };

export function MissionsClient() {
  const { user } = useAuth();
  const isViewer = user?.role === 'viewer';
  
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [isExtendDialogOpen, setIsExtendDialogOpen] = useState(false);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const { toast } = useToast();
  
  const firestore = useFirestore();

  const agentsQuery = useMemoFirebase(() => {
      if (!firestore || !user) return null;
      return agentsCollection(firestore);
  }, [firestore, user]);
  const { data: agentsData, isLoading: agentsLoading } = useCollection<Agent>(agentsQuery);

  const missionsQuery = useMemoFirebase(() => {
      if (!firestore || !user) return null;
      return missionsCollection(firestore);
  }, [firestore, user]);
  const { data: missionsData, isLoading: missionsLoading } = useCollection<Mission>(missionsQuery);

  const initialAgents = agentsData || [];
  const initialMissions = missionsData || [];

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


  const missionsWithAgents: MissionWithAgents[] = useMemo(() => {
    if (!user) return [];
    return initialMissions.map(
      (mission) => ({
        ...mission,
        agents: (mission.agentIds.map(id => initialAgents.find((a) => a.id === id)).filter(Boolean) as Agent[])
          .sort((a, b) => a.firstName.localeCompare(b.firstName)),
        status: isClient ? getMissionStatus(mission) : "Chargement..."
      })
    ).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [initialMissions, initialAgents, isClient, user]);
  
  const handleExportCsv = () => {
    const dataToExport = missionsWithAgents.map(m => ({
        nom_mission: m.name,
        noms_agents: m.agents.map(a => `${a.firstName} ${a.lastName}` || '').join('; ') || "Non assignée",
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
        m.agents.map(a => `${a.firstName} ${a.lastName}`).filter(Boolean).join(', ') || 'Non assignée',
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

  const handleExtend = (mission: Mission) => {
    setSelectedMission(mission);
    setIsExtendDialogOpen(true);
  }
  
  const handleAddNew = () => {
    setSelectedMission(null);
    setIsFormOpen(true);
  };

  const handleToggleAgent = async (missionId: string, agentId: string) => {
      if (isViewer) {
          toast({
              variant: "destructive",
              title: "Accès refusé",
              description: "Vous n'avez pas les droits pour effectuer cette action."
          });
          return;
      }
      const mission = initialMissions.find(m => m.id === missionId);
      if (!mission) return;

      let newAgentIds: string[];
      if (mission.agentIds.includes(agentId)) {
        newAgentIds = mission.agentIds.filter(id => id !== agentId);
      } else {
        newAgentIds = [...mission.agentIds, agentId];
      }
      
      const missionRef = doc(firestore, "missions", missionId);
      await updateDoc(missionRef, { agentIds: newAgentIds });
      
      toast({
          title: "Assignation Mise à Jour",
          description: "La liste des agents pour la mission a été mise à jour."
      });
  }

  const confirmDelete = async () => {
    if (selectedMission) {
      try {
        const missionRef = missionDoc(firestore, selectedMission.id);
        await deleteDoc(missionRef);
        toast({
          title: "Mission Annulée",
          description: `La mission ${selectedMission.name} a été supprimée.`,
        });
      } catch (error) {
         toast({
          variant: "destructive",
          title: "Erreur de suppression",
          description: "Impossible de supprimer la mission.",
        });
      } finally {
        setIsAlertOpen(false);
        setSelectedMission(null);
      }
    }
  }

  const isLoading = agentsLoading || missionsLoading;

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Journal de Mission</h2>
        <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsAssignmentDialogOpen(true)} disabled={isViewer}><UserPlus className="mr-2" /> Assigner</Button>
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
            <Button onClick={handleAddNew} disabled={isViewer}><Plus className="mr-2" /> Créer une Mission</Button>
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
              {isLoading && (!missionsData || !agentsData) ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Chargement des missions...
                  </TableCell>
                </TableRow>
              ) : missionsWithAgents.length > 0 ? (
                missionsWithAgents.map((mission) => (
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
                        <PopoverContent className="w-auto p-0">
                          <div className="space-y-2 p-4">
                            <h4 className="font-medium leading-none">Agents Assignés</h4>
                            <ScrollArea className="h-48">
                                <div className="grid gap-2 pr-4">
                                {mission.agents.map(agent => agent && (
                                    <div key={agent.id} className="flex items-center gap-2">
                                    <p>{agent.firstName} {agent.lastName} ({agent.rank}) - {agent.contactNumber}</p>
                                    </div>
                                ))}
                                </div>
                            </ScrollArea>
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
                    {mission.status === "Chargement..." ? (
                      <span className="text-muted-foreground text-xs">Chargement...</span>
                    ) : (
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
                    )}
                  </TableCell>
                   <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={isViewer}>
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {mission.status !== 'Terminée' && (
                        <DropdownMenuSub>
                           <DropdownMenuSubTrigger disabled={isViewer}>
                               <UserPlus className="mr-2 h-4 w-4" />
                               Assigner des agents
                           </DropdownMenuSubTrigger>
                           <DropdownMenuPortal>
                               <DropdownMenuSubContent className="max-h-64 overflow-y-auto">
                                  {[...initialAgents].sort((a, b) => a.firstName.localeCompare(b.firstName)).map(agent => (
                                     <DropdownMenuItem 
                                        key={agent.id} 
                                        onSelect={(e) => e.preventDefault()} 
                                        onClick={() => handleToggleAgent(mission.id, agent.id)}
                                        disabled={(!isAgentAvailableForMission(agent, mission, initialMissions) && !mission.agentIds.includes(agent.id)) || isViewer}
                                      >
                                         <div className="w-4 mr-2">
                                            {mission.agentIds.includes(agent.id) && <Check className="h-4 w-4" />}
                                         </div>
                                         <div className="flex flex-col">
                                            <span>{agent.firstName} {agent.lastName}</span>
                                            <span className="text-xs text-muted-foreground">{agent.contactNumber}</span>
                                         </div>
                                     </DropdownMenuItem>
                                  ))}
                               </DropdownMenuSubContent>
                           </DropdownMenuPortal>
                        </DropdownMenuSub>
                        )}
                        {mission.status !== 'Terminée' && (
                           <DropdownMenuItem onClick={() => handleExtend(mission)} disabled={isViewer}>
                             <CalendarClock className="mr-2 h-4 w-4" />
                             Prolonger
                           </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDelete(mission)} className="text-destructive" disabled={isViewer}>
                          <Trash2 className="mr-2 h-4 w-4" /> Annuler
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Aucune mission trouvée.
                  </TableCell>
                </TableRow>
              )}
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

      {selectedMission && (
        <ExtendMissionDialog
            isOpen={isExtendDialogOpen}
            setIsOpen={setIsExtendDialogOpen}
            mission={selectedMission}
        />
      )}

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
