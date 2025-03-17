import ReceivedMessagesView from '@/views/root/mesajlar'

export async function generateMetadata() {
  return {
    title: "Gelen Mesajlar",
    description: "Gelen mesajlar sayfası",
  };
}
export default function ReceivedMessagesPage() {
  return (
    <ReceivedMessagesView type="received" />
  )
}
