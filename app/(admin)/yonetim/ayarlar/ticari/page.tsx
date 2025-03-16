import PaymentSettingsPage from '@/views/admin/ayarlar/ticari'

export async function generateMetadata() {
  return {
    title: "Ticari Ayarlar",
    description: "Ticari ayarlar sayfası",
  };
}

export default function page() {
  return (
    <PaymentSettingsPage />
  )
}
