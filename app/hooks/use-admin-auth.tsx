'use client'

import { createContext, ReactNode, useContext } from "react";
import { useQuery, useMutation, UseMutationResult } from "@tanstack/react-query";
import { getQueryFn, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type AdminUser = {
  id: number;
  username: string;
  type: 'admin';
};

type AdminLoginData = {
  username: string;
  password: string;
};

type AdminAuthContextType = {
  admin: AdminUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<{ success: boolean, userId: number }, Error, AdminLoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
};

export const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const router = useRouter();
  const status = useSession();

  const {
    data: admin,
    error,
    isLoading,
  } = useQuery<AdminUser | null>({
    queryKey: ["/api/admin/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: status.status === "authenticated",
    staleTime: 1000 * 60 * 30, // 30 dakika
    gcTime: 1000 * 60 * 60, // 1 saat
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: AdminLoginData) => {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Giriş başarısız");
      }

      return await response.json();
    },
    onSuccess: (data) => {
      // Önce query cache'i güncelle
      queryClient.invalidateQueries({ queryKey: ["/api/admin/user"] });

      toast({
        title: "Giriş başarılı",
        description: "Yönetim paneline yönlendiriliyorsunuz.",
      });

      // Kullanıcıyı hemen yönetim paneline yönlendir
      router.push('/yonetim/anasayfa');
    },
    onError: (error: Error) => {
      toast({
        title: "Giriş başarısız",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error("Çıkış yapılamadı");
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/admin/user"], null);
      queryClient.removeQueries({ queryKey: ["/api/admin"] });
      toast({
        title: "Çıkış yapıldı",
        description: "Güvenli bir şekilde çıkış yaptınız.",
      });
      router.push('/yonetim');
    },
    onError: (error: Error) => {
      toast({
        title: "Çıkış başarısız",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AdminAuthContext.Provider
      value={{
        admin: admin || null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
}