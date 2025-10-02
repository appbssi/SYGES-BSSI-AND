
"use client";

import { useState, useMemo } from "react";
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
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSeparator,
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
import { Download, MoreHorizontal, Plus, Trash2, FilePenLine, ChevronDown, FileText, FileSpreadsheet } from "lucide-react";
import { exportToCsv, exportToPdf } from "@/lib/utils";
import { deleteAgentAction } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { agentsCollection } from "@/firebase/firestore/agents";
import { missionsCollection } from "@/firebase/firestore/missions";

type AgentWithStatus = Agent & { status: "Disponible" | "Occupé" };

export function AgentsClient() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<"all" | "Disponible" | "Occupé">("all");

  const firestore = useFirestore();

  const agentsQuery = useMemoFirebase(() => agentsCollection(firestore), [firestore]);
  const { data: agentsData, isLoading: agentsLoading } = useCollection<Agent>(agentsQuery);

  const missionsQuery = useMemoFirebase(() => missionsCollection(firestore), [firestore]);
  const { data: missionsData, isLoading: missionsLoading } = useCollection<Mission>(missionsQuery);
  
  const agents = agentsData || [];
  const missions = missionsData || [];

  const getAgentStatus = (agentId: string) => {
    const now = new Date();
    const hasActiveMission = missions.some(
      (m) =>
        m.agentIds.includes(agentId) &&
        new Date(m.startDate) <= now &&
        new Date(m.endDate) >= now
    );
    return hasActiveMission ? "Occupé" : "Disponible";
  };

  const agentsWithStatus: AgentWithStatus[] = useMemo(() => agents.map((agent) => ({
    ...agent,
    status: getAgentStatus(agent.id),
  })), [agents, missions]);
  
  const filteredAgents = agentsWithStatus.filter(agent => {
    if (statusFilter === 'all') return true;
    return agent.status === statusFilter;
  });

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

  const handleExportCsv = () => {
    const dataToExport = filteredAgents.map(({ id, status, ...rest }) => ({
      ...rest,
      status: status === "Disponible" ? "Disponible" : "Occupé",
    }));
    exportToCsv(dataToExport, "ebrigade_agents.csv");
  };
  
  const handleExportPdf = () => {
    const headers = ["Nom", "Matricule", "Grade", "Contact", "Statut"];
    const body = filteredAgents.map(({ name, registrationNumber, rank, contact, status }) => [
        name,
        registrationNumber,
        rank,
        contact,
        status,
    ]);
    exportToPdf("Liste des Agents", headers, body, "ebrigade_agents.pdf");
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Liste des Agents</h2>
        <div className="flex gap-2">
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
          <Button onClick={handleAddNew}><Plus className="mr-2" /> Ajouter un Agent</Button>
        </div>
      </div>
       <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">Tous</TabsTrigger>
          <TabsTrigger value="Disponible">Disponibles</TabsTrigger>
          <TabsTrigger value="Occupé">Occupés</TabsTrigger>
        </TabsList>
      </Tabs>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Matricule</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(agentsLoading || missionsLoading) ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Chargement des données...
                  </TableCell>
                </TableRow>
              ) : filteredAgents.length > 0 ? (
                filteredAgents.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell>
                      <div className="font-medium">{agent.name}</div>
                    </TableCell>
                    <TableCell>{agent.registrationNumber}</TableCell>
                    <TableCell>{agent.rank}</TableCell>
                    <TableCell>{agent.contact}</TableCell>
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
                ))
               ) : (
                <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Aucun agent ne correspond au filtre &quot;{statusFilter}&quot;.
                    </TableCell>
                </TableRow>
              )}
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
