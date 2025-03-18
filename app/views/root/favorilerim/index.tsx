'use client'

import { useQuery } from "@tanstack/react-query";
import { Listing } from "@shared/schemas";
import { Card, CardContent } from "@app/components/ui/card";
import FavoriteCard from "@app/components/favorite-card";
import { motion } from "framer-motion";
import { Heart, Info, RefreshCcw } from "lucide-react";
import { Button } from "@app/components/ui/button";

// Modern Skeleton Component
const SkeletonCard = () => (
  <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
    <div className="animate-pulse">
      <div className="bg-gray-200 h-48 w-full"></div>
      <div className="p-4 space-y-3">
        <div className="h-5 bg-gray-200 rounded-md w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded-md w-1/2"></div>
        <div className="h-10 bg-gray-200 rounded-md w-full mt-4"></div>
      </div>
    </div>
  </div>
);

// Empty State Component
const EmptyState = () => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="col-span-full py-12 px-4"
  >
    <div className="max-w-md mx-auto text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Heart className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">Favori İlanınız Bulunmuyor</h3>
      <p className="text-gray-500 mb-6">
        Beğendiğiniz ilanları favorilerinize ekleyerek daha sonra kolayca erişebilirsiniz.
      </p>
      <Button variant="outline" className="mx-auto">
        İlanları Keşfet
      </Button>
    </div>
  </motion.div>
);

// Error State Component
const ErrorState = ({ refetch }: { refetch: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="col-span-full py-12 px-4"
  >
    <div className="max-w-md mx-auto text-center">
      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <Info className="h-8 w-8 text-red-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">Bir Sorun Oluştu</h3>
      <p className="text-gray-500 mb-6">
        Favori ilanlarınızı yüklerken bir hata ile karşılaştık. Lütfen tekrar deneyin.
      </p>
      <Button 
        onClick={refetch} 
        variant="outline" 
        className="flex items-center gap-2 mx-auto"
      >
        <RefreshCcw className="h-4 w-4" />
        Yeniden Dene
      </Button>
    </div>
  </motion.div>
);

export default function FavoritesView() {
  const { 
    data: favorites,
    isLoading,
    isError,
    refetch
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

  // Container animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  // Item animation variants
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl min-h-[calc(100vh-200px)]">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Favori İlanlarım</h1>
        <p className="text-gray-600">
          {!isLoading && !isError && favorites?.length ? 
            `Toplam ${favorites.length} favori ilanınız bulunmakta` : 
            "İlgilendiğiniz ilanları bir arada görebilirsiniz"
          }
        </p>
      </div>

      <Card className="bg-white rounded-xl shadow-sm border">
        <CardContent className="p-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          ) : isError ? (
            <ErrorState refetch={refetch} />
          ) : favorites?.length === 0 ? (
            <EmptyState />
          ) : (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {favorites?.map((listing) => (
                <motion.div key={listing.id} variants={itemVariants}>
                  <FavoriteCard listing={listing} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}