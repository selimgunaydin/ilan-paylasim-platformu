import SentMessagesView from '@/views/root/gonderilen-mesajlar'

export async function generateMetadata() {
  return {
    title: "Gönderilen Mesajlar",
    description: "Gönderilen mesajlar sayfası",
  };
}
export default function SentMessagesPage() {
  return (
    <SentMessagesView />
  )
}
