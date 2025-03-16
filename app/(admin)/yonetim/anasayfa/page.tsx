import ManagementHome from '@/views/admin/anasayfa'

export async function generateMetadata() {
  return {
    title: "Yönetim Paneli",
    description: "Yönetim paneli sayfası",
  };
}

export default function page() {
  return (
    <ManagementHome />
  )
}
