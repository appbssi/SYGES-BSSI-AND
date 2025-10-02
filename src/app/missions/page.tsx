
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { MissionsClient } from "@/components/missions/missions-client";
import { FirebaseClientProvider } from "@/firebase";

export default function MissionsPage() {
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
        <MissionsClient />
      </MainLayout>
    </FirebaseClientProvider>
  );
}
