"use client";

import { useEffect, useState } from 'react';

import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { AdminAuthProvider } from "@/hooks/use-admin-auth";
import { SocketProvider } from "@/providers/socket-provider";
import { Toaster } from "@app/components/ui/toaster";
import { AdminHeader } from "@/views/admin/header";
import { queryClient } from "@/lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { ReCaptchaProvider } from "@app/components/ReCaptcha";

function useAutoCssReload() {
  // useEffect kaldırıldı
    // Sadece client'ta çalışsın
    if (typeof window === "undefined") return;

    // 2 saniye sonra CSS kontrolü yap
    const timeout = setTimeout(() => {
      const bodyStyles = window.getComputedStyle(document.body);
      
      if (
        bodyStyles.backgroundColor === "" ||
        bodyStyles.backgroundColor === "transparent" ||
        bodyStyles.backgroundColor === "rgba(0, 0, 0, 0)"
      ) {
        // Sadece 1 kez yenile (sonsuz döngüye girmesin)
        if (!(window as any).__cssReloaded) {
          (window as any).__cssReloaded = true;
          // CACHE TEMİZLİĞİ
          if (queryClient && typeof queryClient.clear === "function") {
            queryClient.clear();
          }
          window.location.reload();
        }
      }
    }, 2000);

    return () => clearTimeout(timeout);
}

function PasswordProtection({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Always ask for the password on page load
    const password = prompt('Admin paneline erişmek için lütfen şifreyi girin:');
    
    if (password === process.env.NEXT_PUBLIC_ADMIN_PANEL_PASSWORD) {
      setIsAuthenticated(true);
    } else {
      alert('Hatalı şifre! Ana sayfaya yönlendiriliyorsunuz...');
      window.location.href = '/';
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // This part will be briefly visible before redirection
    return (
       <div className="flex items-center justify-center min-h-screen">
        <p>Yetkiniz yok. Yönlendiriliyorsunuz...</p>
      </div>
    );
  }

  return <>{children}</>;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useAutoCssReload();  

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ReCaptchaProvider>
          <AuthProvider>
            <AdminAuthProvider>
              <SocketProvider>
                                <PasswordProtection>
                  <AdminHeader />
                  <div className="container mx-auto pt-8">{children}</div>
                  <Toaster />
                </PasswordProtection>
              </SocketProvider>
            </AdminAuthProvider>
          </AuthProvider>
        </ReCaptchaProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
