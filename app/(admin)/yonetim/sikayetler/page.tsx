import ProtectedPageWrapper from '../../../components/admin/verification-pin/protected-page-wrapper';
import ReportsAdminView from '@app/views/admin/sikayetler';

export async function generateMetadata() {
  return {
    title: 'Şikayetler',
    description: 'Şikayetleri görüntülemek ve yönetmek için yönetici PIN\'inizi girin.',
  };
}

export default function ReportsPage() {
  return (
    <ProtectedPageWrapper>
      <ReportsAdminView />
    </ProtectedPageWrapper>
  );
}
