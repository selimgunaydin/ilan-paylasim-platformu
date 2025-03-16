import ActiveListingsView from '@/views/admin/aktif-ilanlar'

export async function generateMetadata() {
  return {
    title: "Aktif İlanlar",
    description: "Aktif ilanlar sayfası",
  };
}

export default function page() {
  return (
    <ActiveListingsView />
  )
}
