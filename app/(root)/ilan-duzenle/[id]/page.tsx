import EditListingView from '@/views/root/ilan-duzenle'

export async function generateMetadata() {
  return {
    title: "İlan Düzenle",
    description: "İlan düzenleme sayfası",
  };
}

export default function EditListingPage() {
  return <EditListingView />
}