'use client'

import { useQuery } from "@tanstack/react-query";
import { Listing } from "@shared/schemas";
import { Card, CardContent } from "@app/components/ui/card";
import FavoriteCard from "@app/components/favorite-card";

// Simple Skeleton Component
const SkeletonCard = () => (
  <div className="animate-pulse">
    <div className="bg-gray-200 h-48 w-full rounded-t-lg"></div>
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
    </div>
  </div>
);

export default function FavoritesView() {
  const { 
    data: favorites,
    isLoading,
    isError 
  } = useQuery<(Listing & { 
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
            {isLoading ? (
              // Show 3 skeleton cards while loading
              Array(3).fill(0).map((_, index) => (
                <SkeletonCard key={index} />
              ))
            ) : isError ? (
              <p className="text-red-500 col-span-full text-center py-8">
                Favori ilanlar yüklenirken bir hata oluştu.
              </p>
            ) : favorites?.length === 0 ? (
              <p className="text-muted-foreground col-span-full text-center py-8">
                Henüz favori ilanınız bulunmuyor.
              </p>
            ) : (
              favorites?.map((listing) => (
                <FavoriteCard
                  key={listing.id}
                  listing={listing}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}