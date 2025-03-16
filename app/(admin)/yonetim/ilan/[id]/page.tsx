import ListingDetailAdmin from '@/views/admin/ilan'

export async function generateMetadata() {
  return {
    title: "İlan Detayı",
    description: "İlan detayı sayfası",
  };
}

export default function ListingDetailAdminPage() {
  return (
    <ListingDetailAdmin />
  )
}
