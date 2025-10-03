
"use client";

import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Home, Users, Target, LogOut, Shield } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { useAuth } from "@/context/auth-context";
import { useLogo } from "@/context/logo-context";
import { LogoUploader } from "../logo-uploader";

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const { logo, isDefaultLogo } = useLogo();

  const handleLogout = async () => {
    logout();
    router.replace("/login");
  };

  const isActive = (path: string) => pathname === path;

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg relative">
            {logo}
            <LogoUploader />
          </div>
          <span className="text-lg font-semibold">eBrigade-BSSI</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/")}
              tooltip={{ children: "Tableau de Bord" }}
            >
              <Link href="/">
                <Home />
                <span>Tableau de Bord</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/agents")}
              tooltip={{ children: "Agents" }}
            >
              <Link href="/agents">
                <Users />
                <span>Agents</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/missions")}
              tooltip={{ children: "Missions" }}
            >
              <Link href="/missions">
                <Target />
                <span>Missions</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
       <SidebarFooter>
        <Button variant="destructive" onClick={handleLogout} className="w-full">
          <LogOut className="mr-2" />
          Se Déconnecter
        </Button>
      </SidebarFooter>
    </>
  );
}
