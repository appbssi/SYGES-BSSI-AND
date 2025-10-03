
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, ChevronDown, FileText, FileSpreadsheet, Plus, MoreHorizontal, Trash2, FileUp } from "lucide-react";
import { exportToCsv, exportToPdf } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { agentsCollection, agentDoc } from "@/firebase/firestore/agents";
import { missionsCollection, missionDoc } from "@/firebase/firestore/missions";
import { AgentForm } from "./agent-form";
import { useAuth } from "@/context/auth-context";
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
import { deleteDoc, writeBatch } from "firebase/firestore";
import { AgentImportDialog } from "./agent-import-dialog";
import { orderBy, query } from "firebase/firestore";

type AgentWithStatus = Agent & { status: "Disponible" | "Occupé" | "Chargement..." };

export function AgentsClient() {
  const { user } = useAuth();
  const isViewer = user?.role === 'viewer';
  
  const [isClient, setIsClient] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const [statusFilter, setStatusFilter] = useState<"all" | "Disponible" | "Occupé">("all");

  const firestore = useFirestore();

  const agentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(agentsCollection(firestore), orderBy("firstName"), orderBy("lastName"));
  }, [firestore, user]);
  const { data: agentsData, isLoading: agentsLoading } = useCollection<Agent>(agentsQuery);

  const missionsQuery = useMemoFirebase(() => {
      if (!firestore || !user) return null;
      return missionsCollection(firestore);
  }, [firestore, user]);
  const { data: missionsData, isLoading: missionsLoading } = useCollection<Mission>(missionsQuery);
  
  const agents = agentsData || [];
  const missions = missionsData || [];

  const getAgentStatus = (agentId: string): "Disponible" | "Occupé" => {
    const now = new Date();
    const hasActiveMission = missions.some(
      (m) =>
        m.agentIds.includes(agentId) &&
        new Date(m.startDate) <= now &&
        new Date(m.endDate) >= now
    );
    return hasActiveMission ? "Occupé" : "Disponible";
  };

  const agentsWithStatus: AgentWithStatus[] = useMemo(() => {
    if (!isClient || !user) {
      return (agentsData || []).map(agent => ({
        ...agent,
        status: "Chargement..."
      }));
    }
    return (agentsData || []).map((agent) => ({
      ...agent,
      status: getAgentStatus(agent.id),
    }));
  }, [agentsData, missions, isClient, user]);
  
  const filteredAgents = agentsWithStatus.filter(agent => {
    if (statusFilter === 'all') return true;
    return agent.status === statusFilter;
  });

  const handleExportCsv = () => {
    const dataToExport = filteredAgents.map(({ id, status, ...rest }) => ({
      ...rest,
      status: status,
    }));
    exportToCsv(dataToExport, "ebrigade_agents.csv");
  };
  
  const handleExportPdf = () => {
    const headers = ["Nom", "Matricule", "Grade", "Contact", "Statut"];
    const body = filteredAgents.map(({ firstName, lastName, registrationNumber, rank, contactNumber, status }) => [
        `${firstName} ${lastName}`,
        registrationNumber,
        rank,
        contactNumber,
        status,
    ]);
    exportToPdf("Liste des Agents", headers, body, "ebrigade_agents.pdf");
  };
  
  const handleAddNew = () => {
    setIsFormOpen(true);
  };
  
  const handleDelete = (agent: Agent) => {
    setSelectedAgent(agent);
    setIsAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedAgent || !firestore) {
      return;
    }
    try {
      // 1. Delete the agent document
      const agentRef = agentDoc(firestore, selectedAgent.id);
      await deleteDoc(agentRef);

      // 2. Remove the agent from all missions they are assigned to
      const batch = writeBatch(firestore);
      const missionsToUpdate = missions.filter(m => m.agentIds.includes(selectedAgent.id));

      missionsToUpdate.forEach(mission => {
        const missionRef = missionDoc(firestore, mission.id);
        const updatedAgentIds = mission.agentIds.filter(id => id !== selectedAgent.id);
        batch.update(missionRef, { agentIds: updatedAgentIds });
      });

      await batch.commit();

      toast({
        title: "Agent Supprimé",
        description: `L'agent ${selectedAgent.firstName} ${selectedAgent.lastName} a été supprimé avec succès.`,
      });
    } catch (error) {
      console.error("Error deleting agent:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de l'agent.",
      });
    } finally {
      setIsAlertOpen(false);
      setSelectedAgent(null);
    }
  };

  const isLoading = agentsLoading || missionsLoading;

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Liste des Agents</h2>
        <div className="flex gap-2">
           <Button variant="outline" onClick={() => setIsImportOpen(true)} disabled={isViewer}><FileUp className="mr-2" /> Importer</Button>
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
          <Button onClick={handleAddNew} disabled={isViewer}><Plus className="mr-2" /> Ajouter un Agent</Button>
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
              {isLoading && !agentsData ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Chargement des données...
                  </TableCell>
                </TableRow>
              ) : filteredAgents.length > 0 ? (
                filteredAgents.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell>
                      <div className="font-medium">{agent.firstName} {agent.lastName}</div>
                    </TableCell>
                    <TableCell>{agent.registrationNumber}</TableCell>
                    <TableCell>{agent.rank}</TableCell>
                    <TableCell>{agent.contactNumber}</TableCell>
                    <TableCell>
                      {agent.status === "Chargement..." ? (
                        <span className="text-muted-foreground text-xs">Chargement...</span>
                      ) : (
                        <Badge
                          variant={agent.status === "Disponible" ? "secondary" : "destructive"}
                          className={agent.status === "Disponible" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"}
                        >
                          {agent.status}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={isViewer}>
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Ouvrir le menu</span>
                          </Button>                        
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleDelete(agent)}
                            className="text-destructive"
                            disabled={isViewer}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
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
        agent={null}
      />
      
      <AgentImportDialog
        isOpen={isImportOpen}
        setIsOpen={setIsImportOpen}
        existingAgents={agents}
      />

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous absolument sûr?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'agent {selectedAgent?.firstName} {selectedAgent?.lastName} sera définitivement supprimé et retiré de toutes les missions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

    