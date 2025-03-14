"use client";

import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { SidebarProvider } from "@/components/ui/sidebar";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Header } from "@/views/header";
import { MobileNav } from "@/components/ui/mobile-nav";
import { Footer } from "@/views/footer";
import { SocketProvider } from "@/providers/socket-provider";
import { AuthProvider } from "@/hooks/use-auth";
import { SessionProvider } from "next-auth/react";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <AuthProvider>
          <SocketProvider>
            <SidebarProvider>
              <Header />
              <div className="pt-16 pb-16 md:pb-0">
                <div className="mx-auto">{children}</div>
              </div>
              <MobileNav />
              <Toaster />
              <Footer />
            </SidebarProvider>
          </SocketProvider>
        </AuthProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
