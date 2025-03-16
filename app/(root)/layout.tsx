import React from "react";
import type { Metadata } from "next";
import { ClientLayout } from "../components/ClientLayout";
import "../globals.css";

export const metadata: Metadata = {
  title: 'İlan Daddy',
  description: 'İlan yönetim sistemi',
}
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClientLayout>
    <div className="container">
      {children}
    </div>
  </ClientLayout>;
}
