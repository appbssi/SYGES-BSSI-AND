
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { AgentsClient } from "@/components/agents/agents-client";
import { FirebaseClientProvider } from "@/firebase";

export default function AgentsPage() {
  const router = useRouter();

  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem("isAuthenticated");
    if (isAuthenticated !== "true") {
      router.replace("/login");
    }
  }, [router]);

  return (
    <FirebaseClientProvider>
      <MainLayout>
        <AgentsClient />
      </MainLayout>
    </FirebaseClientProvider>
  );
}
