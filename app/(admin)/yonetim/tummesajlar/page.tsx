import AllMessages from '@/views/admin/tum-mesajlar'

export async function generateMetadata() {
  return {
    title: "Tüm Mesajlar",
    description: "Tüm mesajlar sayfası",
  };
}

export default function AllMessagesPage() {
  return (
    <AllMessages />
  )
}
