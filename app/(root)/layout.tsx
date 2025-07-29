import React from "react";
import type { Metadata } from "next";
import { ClientLayout } from "@app/components/ClientLayout";
import "../globals.css";
import { getSiteSettings } from "@app/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  // Site ayarlarını metadata için getir
  const settings = await getSiteSettings();
  
  return {
    title: settings.home_title || "İlan Platformu",
    description: settings.home_description || "İkinci el eşya, araç ve daha fazlasını bulabileceğiniz güvenilir ilan platformu.",
    icons: settings.site_favicon ? { icon: settings.site_favicon } : undefined,
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Site ayarlarını server-side'da yükle
  const settings = await getSiteSettings();
  
  return <ClientLayout settings={settings}>{children}</ClientLayout>;
}
