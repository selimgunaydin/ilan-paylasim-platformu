import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';

// Metadata generation (server-side)
export async function generateMetadata({ params }: { params: { id: string } }) {
  return {
    title: `Kullanıcı Detayı #${params.id}`,
    description: 'Kullanıcı detay sayfası',
  };
}

// Client component (with 'use client' directive)
const UserDetailClient = dynamic(() => import('@/views/admin/users/UserDetail'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
    </div>
  ),
});

// Page component (server component by default)
export default function UserDetailPage({ params }: { params: { id: string } }) {
  const userId = parseInt(params.id);
  
  if (isNaN(userId)) {
    notFound();
  }

  return <UserDetailClient userId={userId} />;
}
