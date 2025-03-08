import { useQuery } from "@tanstack/react-query";
import { Listing } from "@shared/schema";
import { Card, CardContent } from "@app/components/ui/card";
import FavoriteCard from "@app/components/favorite-card";

// Favorilerim sayfası - Dashboard'daki Favoriler tab içeriğinin aynısı
export default function MyFavorites() {
  // Favori ilanları getiren sorgu
  const { data: favorites } = useQuery<(Listing & { 
    category?: { 
      id: number; 
      name: string; 
      parentId: number | null;
      slug: string;
      order: number;
    } 
  })[]>({
    queryKey: ["favorites"],
    queryFn: () => fetch("/api/favorites").then(res => {
      if (!res.ok) throw new Error('Failed to fetch favorites');
      return res.json();
    }),
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold mb-4">Favori İlanlarım</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {favorites?.map((listing) => (
              <FavoriteCard
                key={listing.id}
                listing={listing}
              />
            ))}
            {favorites?.length === 0 && (
              <p className="text-muted-foreground col-span-full text-center py-8">
                Henüz favori ilanınız bulunmuyor.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}