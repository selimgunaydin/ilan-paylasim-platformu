import UsersPageView from '@/views/admin/users'

export async function generateMetadata() {
  return {
    title: "Kullanıcılar",
    description: "Kullanıcılar sayfası",
  };
}

export default function UsersPage() {
  return (
    <UsersPageView />
  )
}
