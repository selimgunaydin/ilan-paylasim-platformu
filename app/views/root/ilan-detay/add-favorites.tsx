"use client";

import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { Star, StarOff } from "lucide-react";
import { useSession } from "next-auth/react";
import React, { useState } from "react";

export default function addToFavorites({
  id,
  listing,
}: {
  id: number;
  listing: any;
}) {
  const [isFavorite, setIsFavorite] = useState(false);
  const session = useSession();
  const addToFavorites = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: id }),
      });
      if (!res.ok) throw new Error("Favorilere eklenemedi");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites", id] });
      setIsFavorite(true);
      toast({ title: "Başarılı", description: "İlan favorilere eklendi" });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "İlan favorilere eklenemedi",
        variant: "destructive",
      });
    },
  });

  const removeFromFavorites = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/favorites/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Favorilerden çıkarılamadı");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites", id] });
      setIsFavorite(false);
      toast({ title: "Başarılı", description: "İlan favorilerden çıkarıldı" });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "İlan favorilerden çıkarılamadı",
        variant: "destructive",
      });
    },
  });
  const toggleFavorite = () => {
    if (!session.data?.user) {
      toast({
        title: "Uyarı",
        description: "Favorilere eklemek için giriş yapmalısınız",
        variant: "destructive",
      });
      return;
    }
    if (listing.userId == Number(session.data?.user.id)) {
      toast({
        title: "Uyarı",
        description: "Kendi ilanınızı favorilere ekleyemezsiniz",
        variant: "destructive",
      });
      return;
    }
    if (isFavorite) {
      removeFromFavorites.mutate();
    } else {
      addToFavorites.mutate();
    }
  };
  return (
    <div className="flex flex-wrap justify-between items-center gap-4">
      {/* Favorite Button */}
      <Button
        variant="outline"
        size="sm"
        className="gap-1 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
        onClick={toggleFavorite}
        disabled={addToFavorites.isPending || removeFromFavorites.isPending}
      >
        {isFavorite ? (
          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
        ) : (
          <StarOff className="h-4 w-4" />
        )}
        {isFavorite ? "Favorilerden Çıkar" : "Favorilere Ekle"}
      </Button>
    </div>
  );
}
