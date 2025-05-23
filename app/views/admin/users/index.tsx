'use client'

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@app/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@app/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { DataTable } from "@app/components/ui/data-table";
import type { Row } from "@tanstack/react-table";
import { Loader2 } from "lucide-react";

interface User {
  id: number;
  username: string;
  email: string;
  phone: string | null;
  used_free_ad: number;
  gender: string;
  status: boolean;
  yuksekUye: boolean;
  createdAt: string;
}

interface Filters {
  gender: string;
  used_free_ad: string;
  yuksekUye: string;
}

export default function UsersPage() {
  const { toast } = useToast();
  const [filters, setFilters] = useState<Filters>({
    gender: "hepsi",
    used_free_ad: "hepsi",
    yuksekUye: "hepsi",
  });

  const {
    data: users,
    isLoading,
    error,
  } = useQuery<User[], Error>({
    queryKey: ["/api/admin/users", filters],
    queryFn: async () => {
      const response = await fetch("/api/admin/users", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Kullanıcılar yüklenemedi");
      }
      return response.json();
    },
  });

  const handleStatusChange = async (userId: number, newStatus: boolean) => {
    try {
      await fetch(`/api/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Başarılı",
        description: "Kullanıcı durumu güncellendi",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Kullanıcı durumu güncellenemedi",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (userId: number) => {
    if (!confirm("Kullanıcıyı silmek istediğinize emin misiniz?")) return;

    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Başarılı",
        description: "Kullanıcı silindi",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Kullanıcı silinemedi",
        variant: "destructive",
      });
    }
  };

  const columns = [
    {
      header: "Kullanıcı Adı",
      accessorKey: "username",
    },
    {
      header: "E-posta",
      accessorKey: "email",
    },
    {
      header: "Kayıt Tarihi",
      accessorKey: "createdAt",
      cell: ({ row }: { row: Row<User> }) => {
        return new Date(row.original.createdAt).toLocaleDateString();
      },
    },
    {
      header: "İlan Durumu",
      accessorKey: "used_free_ad",
      cell: ({ row }: { row: Row<User> }) =>
        row.original.used_free_ad === 1 ? "EVET" : "--",
    },
    {
      header: "Cinsiyet",
      accessorKey: "gender",
      cell: ({ row }: { row: Row<User> }) => {
        const gender = row.original.gender;
        if (gender === "male") return "Erkek";
        if (gender === "female") return "Kadın";
        return "--"; // "unspecified" olanlar için
      },
    },
    {
      header: "Üyelik Tipi",
      accessorKey: "yuksekUye",
      cell: ({ row }: { row: Row<User> }) =>
        row.original.yuksekUye ? "YÜKSEK" : "Stn.",
    },
    {
      header: "İşlemler",
      cell: ({ row }: { row: Row<User> }) => (
        <div className="flex gap-2">
          <Button
            variant={row.original.status ? "destructive" : "default"}
            size="sm"
            onClick={() =>
              handleStatusChange(row.original.id, !row.original.status)
            }
          >
            {row.original.status ? "Banla" : "Aktif Et"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row.original.id)}
          >
            Sil
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
  if (error) return <div>Hata oluştu: {error.message}</div>;

  // filteredUsers tanımı güncellendi: users tanımsızsa boş dizi, değilse filtrelenmiş dizi.
  // Bu sayede filteredUsers her zaman User[] tipinde olur.
  const filteredUsers: User[] = users
    ? users.filter((user) => {
        if (filters.gender !== "hepsi" && user.gender !== filters.gender)
          return false;
        if (
          filters.used_free_ad !== "hepsi" &&
          ((filters.used_free_ad === "yes" && user.used_free_ad !== 1) ||
            (filters.used_free_ad === "no" && user.used_free_ad === 1))
        )
          return false;
        if (
          filters.yuksekUye !== "hepsi" &&
          ((filters.yuksekUye === "yes" && !user.yuksekUye) ||
            (filters.yuksekUye === "no" && user.yuksekUye))
        )
          return false;
        return true;
      })
    : [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Üye Yönetimi</h1>

      <div className="mb-6 flex gap-4">
        <Select
          value={filters.gender}
          onValueChange={(value) =>
            setFilters((prev) => ({ ...prev, gender: value }))
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Cinsiyet" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hepsi">Tüm Cinsiyetler</SelectItem>
            <SelectItem value="female">Kadın</SelectItem>
            <SelectItem value="male">Erkek</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.used_free_ad}
          onValueChange={(value) =>
            setFilters((prev) => ({ ...prev, used_free_ad: value }))
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="İlan Vermiş" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hepsi">Tüm İlan Durumları</SelectItem>
            <SelectItem value="yes">İlan Verenler</SelectItem>
            <SelectItem value="no">İlan Vermeyenler</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.yuksekUye}
          onValueChange={(value) =>
            setFilters((prev) => ({ ...prev, yuksekUye: value }))
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Yüksek Üye" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hepsi">Tüm Üyelik Tipleri</SelectItem>
            <SelectItem value="yes">Yüksek Üyeler</SelectItem>
            <SelectItem value="no">Standart Üyeler</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* API'den hiç kullanıcı gelmediyse genel mesaj göster */}
      {(!users || users.length === 0) && !isLoading && (
        <div className="text-center py-10 text-gray-500">
          Sistemde kayıtlı kullanıcı bulunmamaktadır.
        </div>
      )}

      {/* Kullanıcı varsa (filtrelenmiş veya filtrelenmemiş) DataTable'ı göster */}
      {/* DataTable kendi içinde filteredUsers boşsa mesaj gösterecek */}
      {users && users.length > 0 && (
        <DataTable columns={columns} data={filteredUsers} />
        // İsteğe bağlı: noResultsMessage="Filtrelerinize uygun üye bulunamadı." gibi özel bir mesaj da geçilebilir.
        // <DataTable columns={columns} data={filteredUsers} noResultsMessage="Filtrelerinize uygun üye bulunamadı." />
      )}
    </div>
  );
}
