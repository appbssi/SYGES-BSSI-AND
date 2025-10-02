
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { FirebaseClientProvider } from "@/firebase";

export default function DashboardPage() {
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
        <DashboardClient />
      </MainLayout>
    </FirebaseClientProvider>
  );
}
