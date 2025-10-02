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
import Image from "next/image";

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
    return [
        { month: "Jan", missions: monthCounts[0] },
        { month: "Feb", missions: monthCounts[1] },
        { month: "Mar", missions: monthCounts[2] },
        { month: "Apr", missions: monthCounts[3] },
        { month: "May", missions: monthCounts[4] },
        { month: "Jun", missions: monthCounts[5] },
        { month: "Jul", missions: monthCounts[6] },
        { month: "Aug", missions: monthCounts[7] },
        { month: "Sep", missions: monthCounts[8] },
        { month: "Oct", missions: monthCounts[9] },
        { month: "Nov", missions: monthCounts[10] },
        { month: "Dec", missions: monthCounts[11] },
    ];
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
        <StatCard title="Total Agents" value={stats.totalAgents} icon={Users} />
        <StatCard
          title="Available Agents"
          value={stats.availableAgents}
          icon={UserCheck}
        />
        <StatCard title="Busy Agents" value={stats.busyAgents} icon={UserX} />
        <StatCard
          title="Active Missions"
          value={stats.activeMissionsCount}
          icon={Target}
        />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Missions Overview</CardTitle>
            <CardDescription>Number of missions started per month this year.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
             <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <BarChart accessibilityLayer data={missionChartData}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                        dataKey="month"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        tickFormatter={(value) => value.slice(0, 3)}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="missions" fill="var(--color-missions)" radius={4} />
                </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Active Missions</CardTitle>
            <CardDescription>Missions currently in progress.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Mission</TableHead>
                        <TableHead>Agent</TableHead>
                        <TableHead>Ends</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {stats.activeMissionsList.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No active missions</TableCell></TableRow>}
                    {stats.activeMissionsList.map(mission => (
                        <TableRow key={mission.id}>
                            <TableCell className="font-medium">{mission.name}</TableCell>
                            <TableCell>
                                {mission.agent ? (
                                    <div className="flex items-center gap-2">
                                        <Image src={mission.agent.avatar} alt={mission.agent.name} width={24} height={24} className="rounded-full" />
                                        <span className="text-sm">{mission.agent.name}</span>
                                    </div>
                                ) : "N/A"}
                            </TableCell>
                            <TableCell>{format(new Date(mission.endDate), 'MMM d, yyyy')}</TableCell>
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
