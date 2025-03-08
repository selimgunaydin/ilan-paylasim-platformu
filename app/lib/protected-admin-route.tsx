import * as React from "react";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useRouter } from "next/navigation";

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

export function ProtectedAdminRoute({ children }: ProtectedAdminRouteProps) {
  const { admin, isLoading } = useAdminAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && !admin) {
      console.log('Protected route redirect: No admin session found');
      router.push("/yonetim", { replace: true });
    }
  }, [admin, router, isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!admin) {
    return null;
  }

  return <>{children}</>;
}