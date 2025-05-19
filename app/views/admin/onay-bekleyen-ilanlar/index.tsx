"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@app/components/ui/button";
import { Input } from "@app/components/ui/input";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { DataTable } from "@app/components/ui/data-table";
import { FaCheck, FaTrash, FaFlag, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { cn } from "@/utils";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function PendingListings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/listings/${id}/approve`, {
        method: "PUT",
        credentials: "include",
      });
      if (!res.ok) throw new Error("İlan onaylanamadı");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-listings"] });
      toast({
        title: "Başarılı",
        description: "İlan onaylandı",
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
        credentials: "include",
      });
      if (!res.ok) throw new Error("İlan silinemedi");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-listings"] });
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
  } = useQuery({
    queryKey: ["pending-listings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/listings/pending", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("İlanlar yüklenemedi");
      return res.json();
    },
  });

  const handleApprove = async (id: number) => {
    if (window.confirm("Bu ilanı onaylamak istediğinize emin misiniz?")) {
      await approveMutation.mutateAsync(id);
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

  const rejectMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/listings/${id}/reject`, {
        method: "PUT",
        credentials: "include",
      });
      if (!res.ok) throw new Error("İlan reddedilemedi");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-listings"] });
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

  const handleReject = async (id: number) => {
    if (window.confirm("Bu ilanı reddetmek istediğinize emin misiniz?")) {
      await rejectMutation.mutateAsync(id);
    }
  };

  const columns = [
    {
      header: "Başlık",
      accessorKey: "title",
      cell: ({ row }: { row: any }) => (
        <Link
          href={`/yonetim/ilan/${row.original.id}`}
          className="cursor-pointer text-left hover:text-blue-600 hover:underline"
        >
          {row.getValue("title")}
        </Link>
      ),
    },
    {
      header: "Eklenme Tarihi",
      accessorKey: "createdAt",
      cell: ({ row }: { row: any }) =>
        format(new Date(row.getValue("createdAt")), "dd.MM.yy", { locale: tr }),
    },
    {
      header: "Kategori",
      accessorKey: "categoryName",
      cell: ({ row }: { row: any }) => row.getValue("categoryName"),
    },
    {
      header: "Tipi",
      accessorKey: "listingType",
      cell: ({ row }: { row: any }) => (
        <span
          className={cn(
            row.getValue("listingType") === "premium" &&
              "text-blue-500 font-bold"
          )}
        >
          {row.getValue("listingType") === "premium" ? "Premium" : "Standart"}
        </span>
      ),
    },
    {
      header: "İşlemler",
      cell: ({ row }: { row: any }) => (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="default"
            onClick={() => handleApprove(row.original.id)}
            disabled={approveMutation.isPending}
          >
            <FaCheck className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-orange-500 hover:text-orange-600 hover:bg-orange-50"
            onClick={() => handleReject(row.original.id)}
            disabled={rejectMutation.isPending}
          >
            <FaTimesCircle className="h-4 w-4" />
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
      <h1 className="text-2xl font-bold mb-6">Onay Bekleyen İlanlar</h1>
      <DataTable columns={columns} data={listings || []} />
    </div>
  );
}
