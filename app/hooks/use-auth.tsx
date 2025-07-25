import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import {
  insertUserSchema,
  User as SelectUser,
  InsertUser,
} from "@shared/schemas";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getClientIp } from "@/utils/getIpAddress";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  isAdmin: boolean;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
};

type LoginData = Pick<InsertUser, "username" | "password">;

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const status = useSession();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: status.status === "authenticated",
    staleTime: 1000 * 60 * 60 * 4, // 4 saat
    gcTime: 1000 * 60 * 60 * 8, // 8 saat (cacheTime yerine gcTime kullanılacak)
    refetchInterval: 1000 * 60 * 60 * 2, // 2 saatte bir yenileme
    retry: 2,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: true,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      // Get client IP
      const ip_address = await getClientIp();

      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...credentials, ip_address }),
        credentials: "include",
      });

      if (!response.ok) {
        // Eğer kullanıcı inaktif ise özel hata mesajı göster
        if (response.status === 403) {
          throw new Error(
            "Hesabınız askıya alınmıştır. Lütfen yönetici ile iletişime geçin.",
          );
        }
        const error = await response.json();
        throw new Error(
          error.message || "Giriş başarısız. Kullanıcı adı veya şifre hatalı.",
        );
      }

      return await response.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
    },
    onError: (error: Error) => {
      toast({
        title: "Giriş başarısız",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      // Get client IP
      const ip_address = await getClientIp();

      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...credentials, ip_address }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Kayıt başarısız.");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Kayıt başarılı",
        description: "Lütfen email adresinizi kontrol edin.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Kayıt başarısız",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Çıkış yapılamadı");
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      queryClient.clear(); // Clear all queries on logout
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
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        isAdmin: Boolean(user?.isAdmin),
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {isLoading ? (
        <div className="h-screen w-full flex items-center justify-center">
          <span className="text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
          </span>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}