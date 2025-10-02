
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { AgentsClient } from "@/components/agents/agents-client";
import { useAuth } from "@/context/auth-context";


export default function AgentsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div className="flex h-screen items-center justify-center">Chargement...</div>;
  }

  return (
      <MainLayout>
        <AgentsClient />
      </MainLayout>
  );
}
