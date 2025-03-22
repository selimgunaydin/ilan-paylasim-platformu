import React from 'react';
import ContactPage from '@app/views/root/iletisim';
import { getSiteSettings } from '@/lib/settings';
import { Metadata } from 'next';

// Dynamic metadata
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  
  return {
    title: `İletişim - ${settings.site_name}`,
    description: 'Bizimle iletişime geçin. Sorularınızı, önerilerinizi ve geri bildirimlerinizi bekliyoruz.',
  };
}

export default async function Page() {
  const settings = await getSiteSettings();
  return <ContactPage settings={settings} />;
} 