
"use client";

import { useMemo, useState, useEffect } from "react";
import type { Agent, Mission } from "@/lib/types";
import { StatCard } from "./stat-card";
import { Users, Target, UserCheck, UserX } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { agentsCollection } from "@/firebase/firestore/agents";
import { missionsCollection } from "@/firebase/firestore/missions";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Badge } from "../ui/badge";
import { useAuth } from "@/context/auth-context";

export function DashboardClient() {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const firestore = useFirestore();
  const { user } = useAuth();

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
  
  const agents = agentsData || [];
  const missions = missionsData || [];

  const stats = useMemo(() => {
    if (!isClient) {
        return {
            totalAgents: 0,
            availableAgents: 0,
            busyAgents: 0,
            activeMissionsCount: 0,
            activeMissionsList: [],
        };
    }
    const now = new Date();
    const activeMissions = missions.filter(
      (m) => new Date(m.startDate) <= now && new Date(m.endDate) >= now
    );
    const busyAgentIds = new Set(activeMissions.flatMap((m) => m.agentIds));
    const totalAgents = agents.length;
    const busyAgents = busyAgentIds.size;
    const availableAgents = totalAgents - busyAgents;

    return {
      totalAgents,
      availableAgents,
      busyAgents,
      activeMissionsCount: activeMissions.length,
      activeMissionsList: activeMissions.map(m => ({
          ...m,
          agents: m.agentIds.map(agentId => agents.find(a => a.id === agentId)).filter(Boolean) as Agent[],
      }))
    };
  }, [agents, missions, isClient]);
  
  const isLoading = agentsLoading || missionsLoading;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Agents (Total)" value={isLoading ? "..." : stats.totalAgents} icon={Users} />
        <StatCard
          title="Agents Disponibles"
          value={isLoading ? "..." : stats.availableAgents}
          icon={UserCheck}
        />
        <StatCard title="Agents Occupés" value={isLoading ? "..." : stats.busyAgents} icon={UserX} />
        <StatCard
          title="Missions Actives"
          value={isLoading ? "..." : stats.activeMissionsCount}
          icon={Target}
        />
      </div>
      <div className="grid gap-6 md:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>Missions Actives</CardTitle>
            <CardDescription>Missions actuellement en cours.</CardDescription>
          </CardHeader>
          <CardContent>
             {isLoading ? (
              <div className="text-center text-muted-foreground py-8">Chargement...</div>
            ) : (
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>Mission</TableHead>
                          <TableHead>Agents</TableHead>
                          <TableHead>Se termine le</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {stats.activeMissionsList.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">Aucune mission active</TableCell></TableRow>}
                      {stats.activeMissionsList.map(mission => (
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
                                                <p>{agent.firstName} {agent.lastName} ({agent.rank})</p>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      </PopoverContent>
                                    </Popover>
                                  ) : "N/A"}
                              </TableCell>
                              <TableCell>{format(new Date(mission.endDate), 'd MMM yyyy', { locale: fr })}</TableCell>
                          </TableRow>
                      ))}
                  </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    