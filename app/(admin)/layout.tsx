"use client";

import { AdminAuthProvider } from "@/hooks/use-admin-auth";
import { Toaster } from "@app/components/ui/toaster";
import { AdminHeader } from "@/views/admin/header";
import { queryClient } from "@/lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <AdminAuthProvider>
          <AdminHeader />
          <div className="container mx-auto pt-8">{children}</div>
          <Toaster />
        </AdminAuthProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
