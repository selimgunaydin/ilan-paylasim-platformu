import FavoritesView from '@/views/root/favorilerim'

export async function generateMetadata() {
  return {
    title: "Favorilerim",
    description: "Favorilerim sayfası",
  };
}

export default function FavoritesPage() {
  return (
    <FavoritesView />
  )
}
