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
import { BrainCircuit, Download } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import { MissionAssignmentDialog } from "./mission-assignment-dialog";
import { exportToCsv } from "@/lib/utils";

type MissionWithAgent = Omit<Mission, "agentId"> & { agent: Agent | null, status: "Active" | "Upcoming" | "Completed" };

export function MissionsClient({
  initialAgents,
  initialMissions,
}: {
  initialAgents: Agent[];
  initialMissions: Mission[];
}) {
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);

  const getMissionStatus = (mission: Mission) => {
    const now = new Date();
    const start = new Date(mission.startDate);
    const end = new Date(mission.endDate);
    if (end < now) return "Completed";
    if (start > now) return "Upcoming";
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
        mission_name: m.name,
        agent_name: m.agent?.name || "Unassigned",
        agent_registration: m.agent?.registrationNumber || "N/A",
        start_date: m.startDate,
        end_date: m.endDate,
        status: m.status,
        priority: m.priority,
        required_skills: m.requiredSkills.join(' | '),
    }));
    exportToCsv(dataToExport, "ebigade_missions.csv");
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Mission Log</h2>
        <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}><Download className="mr-2" /> Export CSV</Button>
            <Button onClick={() => setIsAssignmentDialogOpen(true)}>
                <BrainCircuit className="mr-2" /> Optimize Assignments
            </Button>
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mission</TableHead>
                <TableHead>Assigned Agent</TableHead>
                <TableHead>Timeline</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
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
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {format(new Date(mission.startDate), "dd/MM/yy")} -{" "}
                    {format(new Date(mission.endDate), "dd/MM/yy")}
                  </TableCell>
                  <TableCell>
                     <Badge
                        variant={mission.status === 'Active' ? 'destructive' : 'secondary'}
                        className={
                            mission.status === 'Active' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/80 dark:text-blue-200' : 
                            mission.status === 'Completed' ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' :
                            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/80 dark:text-yellow-200'
                        }
                     >
                        {mission.status}
                     </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">P-{mission.priority}</Badge>
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
    </>
  );
}
