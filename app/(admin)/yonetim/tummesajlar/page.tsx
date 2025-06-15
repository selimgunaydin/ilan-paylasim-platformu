import AllMessages from '@/views/admin/tum-mesajlar';
import ProtectedPageWrapper from '../../../components/admin/verification-pin/protected-page-wrapper';

export async function generateMetadata() {
  return {
    title: "Tüm Mesajlar - Admin PIN Gerekli",
    description: "Mesajları görüntülemek için lütfen yönetici PIN'inizi girin.",
  };
}

export default function AllMessagesPage() {
  return (
    <ProtectedPageWrapper>
      <AllMessages />
    </ProtectedPageWrapper>
  )
}
