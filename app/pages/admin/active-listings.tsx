'use client'

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@app/components/ui/button";
import { Input } from "@app/components/ui/input";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { DataTable } from "@app/components/ui/data-table";
import { FaToggleOff, FaTrash, FaFlag } from 'react-icons/fa';
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@app/components/ui/select";
import type { Row } from "@tanstack/react-table";

interface Listing {
  id: number;
  title: string;
  createdAt: string;
  endDate: string | null;
  viewCount: number;
  city: string;
  listingType: string;
  categoryName: string;
  active: boolean;
  approved: boolean;
}

export default function ActiveListings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");

  const rejectMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/listings/${id}/reject`, {
        method: 'PUT',
        credentials: 'include' 
      });
      if (!res.ok) throw new Error('İlan reddedilemedi');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-listings'] });
      toast({
        title: "Başarılı",
        description: "İlan reddedildi",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const deactivateMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/listings/${id}/deactivate`, {
        method: 'PUT',
        credentials: 'include' 
      });
      if (!res.ok) throw new Error('İlan pasife alınamadı');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-listings'] });
      toast({
        title: "Başarılı",
        description: "İlan pasife alındı",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/listings/${id}/delete`, {
        method: 'DELETE',
        credentials: 'include' 
      });
      if (!res.ok) throw new Error('İlan silinemedi');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-listings'] });
      toast({
        title: "Başarılı",
        description: "İlan ve ilgili tüm veriler silindi",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const { data: listings, isLoading, error } = useQuery<Listing[]>({
    queryKey: ["active-listings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/listings/active", {
        credentials: 'include' 
      });
      if (!res.ok) throw new Error("İlanlar yüklenemedi");
      return res.json();
    },
  });

  // Get unique categories and cities from listings
  const categories = Array.from(new Set(listings?.map((listing: Listing) => listing.categoryName) || []));
  const cities = Array.from(new Set(listings?.map((listing: Listing) => listing.city) || []));

  const filteredListings = listings?.filter((listing: Listing) => {
    if (selectedCategory && selectedCategory !== "all" && listing.categoryName !== selectedCategory) return false;
    if (selectedCity && selectedCity !== "all" && listing.city !== selectedCity) return false;
    return true;
  });

  const handleReject = async (id: number) => {
    if (window.confirm('Bu ilanı reddetmek istediğinize emin misiniz?')) {
      await rejectMutation.mutateAsync(id);
    }
  };

  const handleDeactivate = async (id: number) => {
    if (window.confirm('Bu ilanı pasife almak istediğinize emin misiniz?')) {
      await deactivateMutation.mutateAsync(id);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bu ilanı ve ilgili tüm verileri kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const columns = [
    {
      header: "Başlık",
      accessorKey: "title",
      cell: ({ row }: { row: Row<Listing> }) => (
        <div
          onClick={() => router.push(`/yonetim/ilan/${row.original.id}`)}
          className="cursor-pointer text-left hover:text-blue-600 hover:underline"
        >
          {row.original.title}
        </div>
      )
    },
    {
      header: "Kategori",
      accessorKey: "categoryName",
    },
    {
      header: "Eklenme Tarihi",
      accessorKey: "createdAt",
      cell: ({ row }: { row: Row<Listing> }) => format(new Date(row.original.createdAt), 'dd.MM.yy', { locale: tr })
    },
    {
      header: "Bitiş",
      accessorKey: "endDate",
      cell: ({ row }: { row: Row<Listing> }) => row.original.endDate ? format(new Date(row.original.endDate), 'dd.MM.yy', { locale: tr }) : '-'
    },
    {
      header: "Görülme",
      accessorKey: "viewCount",
      cell: ({ row }: { row: Row<Listing> }) => row.original.viewCount || 0
    },
    {
      header: "Şehir",
      accessorKey: "city",
      cell: ({ row }: { row: Row<Listing> }) => row.original.city
    },
    {
      header: "Tipi",
      accessorKey: "listingType",
      cell: ({ row }: { row: Row<Listing> }) => (
        <span className={cn(
          row.original.listingType === 'premium' && "text-blue-500 font-bold"
        )}>
          {row.original.listingType === 'premium' ? 'Premium' : 'Standart'}
        </span>
      )
    },
    {
      header: "İşlemler",
      cell: ({ row }: { row: Row<Listing> }) => (
        <div className="space-x-2">
          <Button
            size="sm"
            variant="outline"
            className="text-gray-500"
            onClick={() => handleDeactivate(row.original.id)}
            disabled={deactivateMutation.isPending}
          >
            <FaToggleOff className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-orange-500 hover:text-orange-600 hover:bg-orange-50"
            onClick={() => handleReject(row.original.id)}
            disabled={rejectMutation.isPending}
          >
            <FaFlag className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-gray-400 hover:text-gray-500"
            onClick={() => handleDelete(row.original.id)}
            disabled={deleteMutation.isPending}
          >
            <FaTrash className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  if (isLoading) return <div>Yükleniyor...</div>;
  if (error) return <div>Hata oluştu: {(error as Error).message}</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Aktif İlanlar</h1>

      <div className="mb-6 flex gap-4">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Kategori seçin" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">Tüm Kategoriler</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <Select value={selectedCity} onValueChange={setSelectedCity}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Şehir seçin" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">Tüm Şehirler</SelectItem>
              {cities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={filteredListings || []}
      />
    </div>
  );
}