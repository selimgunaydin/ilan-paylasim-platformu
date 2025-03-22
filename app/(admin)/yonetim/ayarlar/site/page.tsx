import React from 'react';
import SiteSettingsPage from '@app/views/admin/ayarlar/site';
import { headers } from 'next/headers';

export const metadata = {
  title: 'Site Ayarları',
  description: 'Site başlığı, logosu, iletişim bilgileri ve diğer site ayarlarını yönetin.',
};

const getSiteSettings = async () => { 

  const headersList = headers();
  const cookies = headersList.get("cookie");
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/site-settings`, {
    headers: {
      Cookie: cookies || "",
    },
    cache: "no-store",
  });
  const data = await response.json();
  return data;
}

export default async function Page() {
  const settings = await getSiteSettings();
  return <SiteSettingsPage settings={settings} />;
} 