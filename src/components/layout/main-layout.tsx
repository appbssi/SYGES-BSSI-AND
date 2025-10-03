import type { ReactNode } from "react";
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./sidebar";
import { AppHeader } from "./header";

export function MainLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <Sidebar>
        <AppSidebar />
      </Sidebar>
      <SidebarInset>
        <AppHeader />
        <main className="p-4 sm:p-6 lg:p-8 bg-white dark:bg-background">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
