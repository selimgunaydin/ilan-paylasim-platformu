'use client'

import * as React from "react";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { AdminHeader } from "@/views/admin/header/admin-header";

export default function ManagementHome({ children }: { children?: React.ReactNode }) {
  const { admin } = useAdminAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Ana İçerik */}
      <main className="pt-16">
        <div className="container mx-auto px-4 py-8">
          {children ?? (
            <div className="space-y-4">
              <h1 className="text-2xl font-bold">Hoş Geldiniz, {admin?.username}</h1>
              <p className="text-gray-600">
                Yönetim panelinden ilanları yönetebilir ve sistem ayarlarını düzenleyebilirsiniz.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}