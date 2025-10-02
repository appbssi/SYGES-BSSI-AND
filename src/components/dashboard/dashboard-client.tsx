"use client";

import { useMemo } from "react";
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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { format, getMonth } from "date-fns";
import { fr } from "date-fns/locale";

export function DashboardClient({
  agents,
  missions,
}: {
  agents: Agent[];
  missions: Mission[];
}) {
  const stats = useMemo(() => {
    const now = new Date();
    const activeMissions = missions.filter(
      (m) => new Date(m.startDate) <= now && new Date(m.endDate) >= now
    );
    const busyAgentIds = new Set(activeMissions.map((m) => m.agentId));
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
          agent: agents.find(a => a.id === m.agentId) || null
      }))
    };
  }, [agents, missions]);
  
  const missionChartData = useMemo(() => {
    const monthCounts = Array(12).fill(0);
    missions.forEach(mission => {
        const month = getMonth(new Date(mission.startDate));
        monthCounts[month]++;
    });
    const months = ["Janv", "Févr", "Mars", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"];
    return months.map((month, index) => ({
        month,
        missions: monthCounts[index]
    }));
  }, [missions]);

  const chartConfig = {
    missions: {
      label: "Missions",
      color: "hsl(var(--accent))",
    },
  } satisfies ChartConfig;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Agents (Total)" value={stats.totalAgents} icon={Users} />
        <StatCard
          title="Agents Disponibles"
          value={stats.availableAgents}
          icon={UserCheck}
        />
        <StatCard title="Agents Occupés" value={stats.busyAgents} icon={UserX} />
        <StatCard
          title="Missions Actives"
          value={stats.activeMissionsCount}
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
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Mission</TableHead>
                        <TableHead>Agent</TableHead>
                        <TableHead>Se termine le</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {stats.activeMissionsList.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">Aucune mission active</TableCell></TableRow>}
                    {stats.activeMissionsList.map(mission => (
                        <TableRow key={mission.id}>
                            <TableCell className="font-medium">{mission.name}</TableCell>
                            <TableCell>
                                {mission.agent ? (
                                    <span className="text-sm">{mission.agent.name}</span>
                                ) : "N/A"}
                            </TableCell>
                            <TableCell>{format(new Date(mission.endDate), 'd MMM yyyy', { locale: fr })}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
