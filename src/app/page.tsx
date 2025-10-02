
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { useUser } from "@/firebase";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace("/login");
    }
  }, [user, isUserLoading, router]);
  
  if (isUserLoading || !user) {
    return <div className="flex h-screen items-center justify-center">Chargement...</div>;
  }

  return (
      <MainLayout>
        <DashboardClient />
      </MainLayout>
  );
}
