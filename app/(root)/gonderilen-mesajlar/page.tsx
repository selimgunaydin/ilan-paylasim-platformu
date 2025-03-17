import Messages from '@/views/root/mesajlar'

export async function generateMetadata() {
  return {
    title: "Gönderilen Mesajlar",
    description: "Gönderilen mesajlar sayfası",
  };
}
export default function SentMessagesPage() {
  return (
    <Messages type="sent" />
  )
}
