
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { getAgents, getMissions } from "@/lib/data";
import { MissionsClient } from "@/components/missions/missions-client";

export default function MissionsPage() {
  const agents = getAgents();
  const missions = getMissions();
  const router = useRouter();

  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem("isAuthenticated");
    if (isAuthenticated !== "true") {
      router.replace("/login");
    }
  }, [router]);

  return (
    <MainLayout>
      <MissionsClient initialAgents={agents} initialMissions={missions} />
    </MainLayout>
  );
}
