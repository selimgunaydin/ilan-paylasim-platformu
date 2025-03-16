import CreateListingView from '@/views/root/ilan-ekle'

export async function generateMetadata() {
  return {
    title: "İlan Ekle",
    description: "İlan ekleme sayfası",
  };
}

export default function CreateListingPage() {
  return (
    <CreateListingView />
  )
}
