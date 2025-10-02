import { MainLayout } from "@/components/layout/main-layout";
import { getAgents, getMissions } from "@/lib/data";
import { MissionsClient } from "@/components/missions/missions-client";

export default function MissionsPage() {
  const agents = getAgents();
  const missions = getMissions();

  return (
    <MainLayout>
      <MissionsClient initialAgents={agents} initialMissions={missions} />
    </MainLayout>
  );
}
