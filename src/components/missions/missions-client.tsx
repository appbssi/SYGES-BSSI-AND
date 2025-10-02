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
import { BrainCircuit, Download, MoreHorizontal, Trash2 } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import { MissionAssignmentDialog } from "./mission-assignment-dialog";
import { exportToCsv } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { deleteMissionAction } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { fr } from "date-fns/locale";

type MissionWithAgent = Omit<Mission, "agentId"> & { agent: Agent | null, status: "Active" | "À venir" | "Terminée" };

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

  const missionsWithAgents: MissionWithAgent[] = initialMissions.map(
    (mission) => ({
      ...mission,
      agent: initialAgents.find((a) => a.id === mission.agentId) || null,
      status: getMissionStatus(mission)
    })
  ).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  
  const handleExport = () => {
    const dataToExport = missionsWithAgents.map(m => ({
        nom_mission: m.name,
        nom_agent: m.agent?.name || "Non assignée",
        matricule_agent: m.agent?.registrationNumber || "N/A",
        date_debut: m.startDate,
        date_fin: m.endDate,
        statut: m.status,
        priorite: m.priority,
        competences_requises: m.requiredSkills.join(' | '),
    }));
    exportToCsv(dataToExport, "ebrigade_missions.csv");
  };

  const handleDelete = (mission: Mission) => {
    setSelectedMission(mission);
    setIsAlertOpen(true);
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
            <Button onClick={() => setIsAssignmentDialogOpen(true)}>
                <BrainCircuit className="mr-2" /> Optimiser les Assignations
            </Button>
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
                <TableHead>Priorité</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {missionsWithAgents.map((mission) => (
                <TableRow key={mission.id}>
                  <TableCell className="font-medium">{mission.name}</TableCell>
                  <TableCell>
                    {mission.agent ? (
                      <div className="flex items-center gap-3">
                        <Image
                          src={mission.agent.avatar}
                          alt={mission.agent.name}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                        <span>{mission.agent.name}</span>
                      </div>
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
                  <TableCell>
                    <Badge variant="outline">P-{mission.priority}</Badge>
                  </TableCell>
                   <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleDelete(mission)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> Annuler
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
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
