
"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, User, Swords } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { useAuth } from "@/context/auth-context";

const getTitle = (pathname: string) => {
  if (pathname.startsWith("/agents")) return "Gestion des Agents";
  if (pathname.startsWith("/missions")) return "Assignation de Missions";
  return "Tableau de Bord";
};

export function AppHeader() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
      <SidebarTrigger className="md:hidden" />
      <h1 className="text-xl font-semibold">{getTitle(pathname)}</h1>
      <div className="ml-auto flex items-center gap-4">
        <Avatar className="h-9 w-9 cursor-pointer">
            <AvatarFallback>
                <User />
            </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">{user?.username}</p>
          <p className="text-xs text-muted-foreground">{user?.role === 'admin' ? 'Administrateur' : 'Observateur'}</p>
        </div>
      </div>
    </header>
  );
}
