
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Shield } from "lucide-react";
import { useLogo } from "@/context/logo-context";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { logo } = useLogo();

  const handleLogin = () => {
    setIsLoading(true);
    const result = login(username, password);
    if (result.success) {
      router.replace("/");
    } else {
      toast({
        variant: "destructive",
        title: "Erreur de connexion",
        description: result.message,
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-4">
            <div className="flex size-24 items-center justify-center rounded-lg bg-background">
               {logo ? (
                  <Image src={logo} alt="Logo" width={64} height={64} className="rounded-lg object-contain" />
                ) : (
                  <Shield className="h-16 w-16" />
                )}
            </div>
          </div>
          <CardTitle className="text-2xl">eBrigade-BSSI</CardTitle>
          <CardDescription>
            Système de Gestion des Agents et Missions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Login</Label>
              <Input
                id="username"
                type="text"
                placeholder="login"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>
          <Button className="w-full mt-6" onClick={handleLogin} disabled={isLoading}>
            {isLoading ? "Connexion..." : "Se Connecter"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
