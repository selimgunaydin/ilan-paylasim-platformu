import PendingListings from '@/views/admin/onay-bekleyen-ilanlar'

export async function generateMetadata() {
  return {
    title: "Onay Bekleyen İlanlar",
    description: "Onay bekleyen ilanlar sayfası",
  };
}

export default function PendingListingsPage() {
  return (
    <PendingListings />
  )
}
