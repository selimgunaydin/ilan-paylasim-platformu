import React from 'react';
import { ContactMessagesPage } from '@app/components/admin/contact-messages';

export const metadata = {
  title: 'İletişim Mesajları',
  description: 'Site üzerinden gönderilen iletişim mesajlarını yönetin.',
};

export default async function Page() {
  return <ContactMessagesPage />;
} 