
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Swords } from "lucide-react";
import { useAuth, useUser } from "@/firebase";
import { initiateAnonymousSignIn } from "@/firebase/non-blocking-login";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.replace("/");
    }
  }, [user, isUserLoading, router]);

  const handleLogin = () => {
    initiateAnonymousSignIn(auth);
  };
  
  if (isUserLoading || user) {
      return (
          <div className="flex min-h-screen items-center justify-center bg-background">
              <p>Chargement...</p>
          </div>
      )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <div className="flex justify-center items-center mb-4">
            <div className="flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Swords className="size-8" />
            </div>
          </div>
          <CardTitle className="text-2xl">eBrigade-BSSI</CardTitle>
          <CardDescription>
            Système de Gestion des Agents et Missions
          </CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
                Cliquez sur le bouton ci-dessous pour accéder au panneau d'administration.
            </p>
          <Button className="w-full" onClick={handleLogin}>
            Accéder à l'application
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
