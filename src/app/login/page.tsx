
"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
            <div className="flex size-24 items-center justify-center rounded-lg bg-primary/10 text-primary-foreground">
               <Image 
                src="https://scontent.fabj3-1.fna.fbcdn.net/v/t39.30808-6/394142997_646960114251268_259469798782353381_n.jpg?_nc_cat=103&ccb=1-7&_nc_sid=a5f93a&_nc_eui2=AeG989T34uY5-j61pU_04UvTf_H9XqG8kIZ_8f1eoLyQhgnYlFeyYgIEnL8z7FqRk9o&_nc_ohc=y4i5pXh2Y-IQ7kNvgFX0zge&_nc_ht=scontent.fabj3-1.fna&oh=00_AYCBYL2e_8A07pLp-WjGcc2n1X8G4i5rF4h7eT0bHAb9bA&oe=669B0C52" 
                alt="Logo eBrigade"
                width={100}
                height={100}
                className="rounded-full"
                data-ai-hint="brigade emblem crocodile"
              />
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
