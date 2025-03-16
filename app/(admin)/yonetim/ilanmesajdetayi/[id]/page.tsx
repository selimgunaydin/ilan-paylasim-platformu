import AdminConversationDetail from '@/views/admin/ilan-mesaj-detayi'

export async function generateMetadata() {
  return {
    title: "İlan Mesaj Detayı",
    description: "İlan mesaj detayı sayfası",
  };
}

export default function page() {
  return (
    <AdminConversationDetail />
  )
}
