"use client";

import { useState } from "react";
import type { Agent, Mission } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import { AgentForm } from "./agent-form";
import { Download, MoreHorizontal, Plus, Trash2, FilePenLine } from "lucide-react";
import { exportToCsv } from "@/lib/utils";
import { deleteAgentAction } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";

type AgentWithStatus = Omit<Agent, 'avatar'> & { status: "Disponible" | "Occupé" };

export function AgentsClient({
  initialAgents,
  initialMissions,
}: {
  initialAgents: Agent[];
  initialMissions: Mission[];
}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const { toast } = useToast();

  const getAgentStatus = (agentId: string) => {
    const now = new Date();
    const hasActiveMission = initialMissions.some(
      (m) =>
        m.agentIds.includes(agentId) &&
        new Date(m.startDate) <= now &&
        new Date(m.endDate) >= now
    );
    return hasActiveMission ? "Occupé" : "Disponible";
  };

  const agentsWithStatus: AgentWithStatus[] = initialAgents.map(({avatar, ...agent}) => ({
    ...agent,
    status: getAgentStatus(agent.id),
  }));

  const handleEdit = (agent: Agent) => {
    setSelectedAgent(agent);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedAgent(null);
    setIsFormOpen(true);
  };
  
  const handleDelete = (agent: Agent) => {
    setSelectedAgent(agent);
    setIsAlertOpen(true);
  }
  
  const confirmDelete = async () => {
    if (selectedAgent) {
      await deleteAgentAction(selectedAgent.id);
      toast({
        title: "Agent Supprimé",
        description: `L'agent ${selectedAgent.name} a été supprimé avec succès.`,
      });
      setIsAlertOpen(false);
      setSelectedAgent(null);
    }
  }

  const handleExport = () => {
    const dataToExport = agentsWithStatus.map(({ id, ...rest }) => ({
      ...rest,
      status: rest.status === "Disponible" ? "Disponible" : "Occupé",
    }));
    exportToCsv(dataToExport, "ebrigade_agents.csv");
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Liste des Agents</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}><Download className="mr-2" /> Exporter en CSV</Button>
          <Button onClick={handleAddNew}><Plus className="mr-2" /> Ajouter un Agent</Button>
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Matricule</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agentsWithStatus.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell>
                    <div className="font-medium">{agent.name}</div>
                  </TableCell>
                  <TableCell>{agent.registrationNumber}</TableCell>
                  <TableCell>{agent.rank}</TableCell>
                  <TableCell>
                    <Badge
                      variant={agent.status === "Disponible" ? "secondary" : "destructive"}
                      className={agent.status === "Disponible" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"}
                    >
                      {agent.status}
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
                        <DropdownMenuItem onClick={() => handleEdit(agent)}>
                          <FilePenLine className="mr-2 h-4 w-4" /> Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(agent)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> Supprimer
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
      
      <AgentForm 
        isOpen={isFormOpen} 
        setIsOpen={setIsFormOpen} 
        agent={selectedAgent}
      />

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Elle supprimera définitivement l'agent {selectedAgent?.name} et le désassignera de toutes ses missions.
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
