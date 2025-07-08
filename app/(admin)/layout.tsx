"use client";

import { useEffect } from 'react';

import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { AdminAuthProvider } from "@/hooks/use-admin-auth";
import { SocketProvider } from "@/providers/socket-provider";
import { Toaster } from "@app/components/ui/toaster";
import { AdminHeader } from "@/views/admin/header";
import { queryClient } from "@/lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { ReCaptchaProvider } from "@/components/ReCaptcha";

function useCssLoadedCheck() {
  useEffect(() => {
    // Bu kontrol yalnızca geliştirme ortamında çalışsın
    if (process.env.NODE_ENV === 'development') {
      const checkInterval = setInterval(() => {
        // Temel bir CSS kuralının uygulanıp uygulanmadığını kontrol et
        // globals.css dosyasından bir stil seçelim. Örneğin body'nin arkaplan rengi.
        const bodyStyles = window.getComputedStyle(document.body);
        // Eğer arkaplan rengi varsayılan (genellikle transparent veya rgba(0, 0, 0, 0)) ise
        // ve CSS'imiz tarafından ayarlanmamışsa, CSS yüklenmemiş demektir.
        // globals.css içinde `body` için `background-color` tanımlı olmalı.
        if (bodyStyles.backgroundColor === '' || bodyStyles.backgroundColor === 'transparent' || bodyStyles.backgroundColor === 'rgba(0, 0, 0, 0)') {
          console.warn('CSS yüklenmemiş gibi görünüyor, sayfa yenileniyor...');
          window.location.reload();
        }
        // CSS yüklendiyse interval'ı temizle
        clearInterval(checkInterval);
      }, 1500); // 1.5 saniye sonra kontrol et

      // Component unmount olduğunda interval'ı temizle
      return () => clearInterval(checkInterval);
    }
  }, []);
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useCssLoadedCheck(); 

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ReCaptchaProvider>
          <AuthProvider>
            <AdminAuthProvider>
              <SocketProvider>
                <AdminHeader />
                <div className="container mx-auto pt-8">{children}</div>
                <Toaster />
              </SocketProvider>
            </AdminAuthProvider>
          </AuthProvider>
        </ReCaptchaProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
