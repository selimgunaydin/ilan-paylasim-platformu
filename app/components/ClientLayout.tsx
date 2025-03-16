"use client";

import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { SidebarProvider } from "@/components/ui/sidebar";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Header } from "@/views/root/header";
import { MobileNav } from "@/components/ui/mobile-nav";
import { Footer } from "@/views/footer";
import { SocketProvider } from "@/providers/socket-provider";
import { AuthProvider } from "@/hooks/use-auth";
import { SessionProvider } from "next-auth/react";
import { MessageNotificationProvider } from "@/providers/message-notification-provider";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <AuthProvider>
          <SocketProvider>
            <MessageNotificationProvider>
              <SidebarProvider>
                <Header />
                  <div className="mx-auto">{children}</div>
                <MobileNav />
                <Toaster />
                <Footer />
              </SidebarProvider>
            </MessageNotificationProvider>
          </SocketProvider>
        </AuthProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
