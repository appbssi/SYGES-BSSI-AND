
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
import { Download, ChevronDown, FileText, FileSpreadsheet, Plus } from "lucide-react";
import { exportToCsv, exportToPdf } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { agentsCollection } from "@/firebase/firestore/agents";
import { missionsCollection } from "@/firebase/firestore/missions";
import { AgentForm } from "./agent-form";

type AgentWithStatus = Agent & { status: "Disponible" | "Occupé" | "Chargement..." };

export function AgentsClient() {
  const [isClient, setIsClient] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const [statusFilter, setStatusFilter] = useState<"all" | "Disponible" | "Occupé">("all");

  const firestore = useFirestore();

  const agentsQuery = useMemoFirebase(() => agentsCollection(firestore), [firestore]);
  const { data: agentsData, isLoading: agentsLoading } = useCollection<Agent>(agentsQuery);

  const missionsQuery = useMemoFirebase(() => missionsCollection(firestore), [firestore]);
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
    if (!isClient) {
      return agents.map(agent => ({
        ...agent,
        status: "Chargement..."
      }));
    }
    return agents.map((agent) => ({
      ...agent,
      status: getAgentStatus(agent.id),
    }));
  }, [agents, missions, isClient]);
  
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

  const isLoading = agentsLoading || missionsLoading;

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
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
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
                  </TableRow>
                ))
               ) : (
                <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
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
    </>
  );
}
