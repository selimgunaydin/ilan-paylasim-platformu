'use client'

import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@app/components/ui/button";
import ManagementHome from "@/pages/management-home";
import { Loader2 } from "lucide-react";
export default function AdminDashboardPage() {
  const { admin, isLoading, logoutMutation } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !admin) {
      router.push('/yonetim');
    }
  }, [admin, isLoading, router]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">
      <Loader2 className="w-8 h-8 animate-spin" />
    </div>;
  }

  if (!admin) {
    return null;
  }

  return (
      <ManagementHome />
  );
} 