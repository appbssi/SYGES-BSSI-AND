
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { getAgents, getMissions } from "@/lib/data";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default function DashboardPage() {
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
      <DashboardClient agents={agents} missions={missions} />
    </MainLayout>
  );
}
