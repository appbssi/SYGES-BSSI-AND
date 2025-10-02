import { MainLayout } from "@/components/layout/main-layout";
import { getAgents, getMissions } from "@/lib/data";
import { AgentsClient } from "@/components/agents/agents-client";

export default function AgentsPage() {
  const agents = getAgents();
  const missions = getMissions();

  return (
    <MainLayout>
      <AgentsClient initialAgents={agents} initialMissions={missions} />
    </MainLayout>
  );
}
