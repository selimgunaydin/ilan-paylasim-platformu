import DashboardView from '@/views/root/dashboard'

export async function generateMetadata() {
  return {
    title: "Dashboard",
    description: "Dashboard sayfası",
  };
}

export default function DashboardPage() {
  return (
    <DashboardView />
  )
}
