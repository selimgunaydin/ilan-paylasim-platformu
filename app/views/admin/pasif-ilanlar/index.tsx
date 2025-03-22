"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@app/components/ui/button";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { DataTable } from "@app/components/ui/data-table";
import { FaToggleOn, FaTrash, FaFlag } from "react-icons/fa";
import { cn } from "@/utils";
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
import Link from "next/link";
import { Loader2 } from "lucide-react";
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

export default function InactiveListings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");

  const rejectMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/listings/${id}/reject`, {
        method: "PUT",
        credentials: "include", // Add this to include cookies
      });
      if (!res.ok) throw new Error("İlan reddedilemedi");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inactive-listings"] });
      toast({
        title: "Başarılı",
        description: "İlan reddedildi",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const activateMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/listings/${id}/activate`, {
        method: "PUT",
        credentials: "include", // Add this to include cookies
      });
      if (!res.ok) throw new Error("İlan aktif edilemedi");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inactive-listings"] });
      toast({
        title: "Başarılı",
        description: "İlan aktif edildi",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/listings/${id}/delete`, {
        method: "DELETE",
        credentials: "include", // Add this to include cookies
      });
      if (!res.ok) throw new Error("İlan silinemedi");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inactive-listings"] });
      toast({
        title: "Başarılı",
        description: "İlan ve ilgili tüm veriler silindi",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const {
    data: listings,
    isLoading,
    error,
  } = useQuery<Listing[]>({
    queryKey: ["inactive-listings"],
    queryFn: async () => {
      console.log("Fetching inactive listings from frontend...");
      const res = await fetch("/api/admin/listings/inactive", {
        credentials: "include", // Add this to include cookies
      });
      if (!res.ok) {
        const errorData = await res.json();
        console.error("Error response:", errorData);
        throw new Error(errorData.error || "İlanlar yüklenemedi");
      }
      const data = await res.json();
      console.log("Received inactive listings from API:", data);
      return data;
    },
  });

  const categories = Array.from(
    new Set(listings?.map((listing: Listing) => listing.categoryName) || [])
  );
  const cities = Array.from(
    new Set(listings?.map((listing: Listing) => listing.city) || [])
  );

  const filteredListings = listings?.filter((listing: Listing) => {
    if (selectedCategory !== "all" && listing.categoryName !== selectedCategory)
      return false;
    if (selectedCity !== "all" && listing.city !== selectedCity) return false;
    return true;
  });

  const handleReject = async (id: number) => {
    if (window.confirm("Bu ilanı reddetmek istediğinize emin misiniz?")) {
      await rejectMutation.mutateAsync(id);
    }
  };

  const handleActivate = async (id: number) => {
    if (window.confirm("Bu ilanı aktif etmek istediğinize emin misiniz?")) {
      await activateMutation.mutateAsync(id);
    }
  };

  const handleDelete = async (id: number) => {
    if (
      window.confirm(
        "Bu ilanı ve ilgili tüm verileri kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
      )
    ) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const columns = [
    {
      header: "Başlık",
      accessorKey: "title",
      cell: ({ row }: { row: Row<Listing> }) => (
        <Link
          href={`/yonetim/ilan/${row.original.id}`}
          className="cursor-pointer text-left hover:text-blue-600 hover:underline break-all"
        >
          {row.original.title}
        </Link>
      ),
    },
    {
      header: "Kategori",
      accessorKey: "categoryName",
    },
    {
      header: "Eklenme Tarihi",
      accessorKey: "createdAt",
      cell: ({ row }: { row: Row<Listing> }) =>
        format(new Date(row.original.createdAt), "dd.MM.yy", { locale: tr }),
    },
    {
      header: "Bitiş",
      accessorKey: "endDate",
      cell: ({ row }: { row: Row<Listing> }) =>
        row.original.endDate
          ? format(new Date(row.original.endDate), "dd.MM.yy", { locale: tr })
          : "-",
    },
    {
      header: "Görülme",
      accessorKey: "viewCount",
      cell: ({ row }: { row: Row<Listing> }) => row.original.viewCount || 0,
    },
    {
      header: "Şehir",
      accessorKey: "city",
      cell: ({ row }: { row: Row<Listing> }) => row.original.city,
    },
    {
      header: "Tipi",
      accessorKey: "listingType",
      cell: ({ row }: { row: Row<Listing> }) => (
        <span
          className={cn(
            row.original.listingType === "premium" && "text-blue-500 font-bold"
          )}
        >
          {row.original.listingType === "premium" ? "Premium" : "Standart"}
        </span>
      ),
    },
    {
      header: "İşlemler",
      cell: ({ row }: { row: Row<Listing> }) => (
        <div className="space-x-2">
          <Button
            size="sm"
            variant="default"
            onClick={() => handleActivate(row.original.id)}
            disabled={activateMutation.isPending}
          >
            <FaToggleOn className="h-4 w-4" />
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
      ),
    },
  ];

  if (isLoading)
    return (
      <div className="flex flex-col gap-2 items-center justify-center h-screen">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );

  if (error) return <div>Hata oluştu: {(error as Error).message}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Pasif İlanlar</h1>

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

      <DataTable columns={columns} data={filteredListings || []} />
    </div>
  );
}
