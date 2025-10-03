
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/context/auth-context";
import { cn } from "@/lib/utils";
import { FirebaseClientProvider } from "@/firebase";
import { LogoProvider } from "@/context/logo-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "eBrigade",
  description: "Système de Gestion des Agents Militaires",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={cn("antialiased", inter.className)}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <FirebaseClientProvider>
            <AuthProvider>
              <LogoProvider>
                {children}
              </LogoProvider>
              <Toaster />
            </AuthProvider>
          </FirebaseClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
