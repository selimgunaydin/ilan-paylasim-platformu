import React from 'react';
import { ContactMessagesPage } from '@app/components/admin/contact-messages';
import ProtectedPageWrapper from '../../../components/admin/verification-pin/protected-page-wrapper';

export const metadata = {
  title: 'İletişim Mesajları - Admin PIN Gerekli',
  description: 'İletişim mesajlarını görüntülemek için lütfen yönetici PIN\'inizi girin.',
};

export default async function Page() {
  return (
    <ProtectedPageWrapper>
      <ContactMessagesPage />
    </ProtectedPageWrapper>
  );
}