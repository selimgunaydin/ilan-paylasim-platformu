import InactiveListings from '@/views/admin/pasif-ilanlar'

export async function generateMetadata() {
  return {
    title: "Pasif İlanlar",
    description: "Pasif ilanlar sayfası",
  };
}

export default function InactiveListingsPage() {
  return (
    <InactiveListings />
  )
}
