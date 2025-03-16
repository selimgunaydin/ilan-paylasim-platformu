import MessagesView from '@/views/root/messages'

export async function generateMetadata() {
  return {
    title: "Mesajlar",
    description: "Mesajlar sayfası",
  };
}

export default function MessagesPage() {
  return (
    <MessagesView />
  )
}
