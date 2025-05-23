import { Button } from "@app/components/ui/button";
import { Card, CardContent, CardHeader } from "@app/components/ui/card";
import { Listing } from "@shared/schemas";
import { format, addDays } from "date-fns";
import { tr } from "date-fns/locale";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Power, PowerOff } from "lucide-react";
import { FaEdit, FaPowerOff, FaToggleOff, FaTrash } from "react-icons/fa";

interface ListingWithCategory extends Listing {
  categoryName: string;
}

interface ListingCardProps {
  listing: ListingWithCategory;
  onEdit?: () => void;
  onDelete?: () => void;
  onDeactivate?: () => void;
  isActive: boolean;
}



export default function ListingCard({
  listing,
  onEdit,
  onDelete,
  onDeactivate,
  isActive,
}: ListingCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createdAt = listing.createdAt
    ? new Date(listing.createdAt)
    : new Date();
  const expiryDate = listing.expiresAt
    ? new Date(listing.expiresAt)
    : addDays(createdAt, 30);
  const isRejected = !listing.approved && !listing.active;
  const isExpired =
    listing.approved && !listing.active && new Date() > expiryDate;
  const canToggleStatus = listing.approved && new Date() <= expiryDate;

  const activateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/listings/${listing.id}/activate`, {
        method: "PUT",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "İlan aktifleştirilemedi");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings", "user"] });
      toast({
        title: "Başarılı",
        description: "İlan aktif hale getirildi",
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

  const deactivateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/listings/${listing.id}/deactivate`, {
        method: "PUT",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "İlan pasifleştirilemedi");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings", "user"] });
      toast({
        title: "Başarılı",
        description: "İlan pasif hale getirildi",
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

  const handleToggleStatus = () => {
    if (listing.active) {
      deactivateMutation.mutate();
    } else {
      activateMutation.mutate();
    }
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <a
          href={`/ilan/${encodeURIComponent(listing.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"))}-${listing.id}`}
          className="hover:text-blue-600"
        >
          <h3 className="text-lg font-semibold line-clamp-2">
            {listing.title}
          </h3>
        </a>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-2 text-sm">
          <p>
            <span className="font-medium">Eklenme Tarihi:</span>{" "}
            {format(createdAt, "dd MMMM yyyy", { locale: tr })}
          </p>
          <p>
            <span className="font-medium">Son Yayın Tarihi:</span>{" "}
            {format(expiryDate, "dd MMMM yyyy", { locale: tr })}
          </p>
          <p>
            <span className="font-medium">İlan Tipi:</span>{" "}
            {listing.listingType === "premium" ? "Öncelikli" : "Standart"}
          </p>
          <p>
            <span className="font-medium">Kategori:</span>{" "}
            {listing.categoryName || "Belirtilmemiş"}
          </p>
          <p>
            <span className="font-medium">Görülme:</span> {listing.views || 0}
          </p>
          <p>
            <span className="font-medium">Durum:</span>{" "}
            {isRejected ? (
              <span className="text-red-500">Reddedildi</span>
            ) : isExpired ? (
              <span className="text-orange-500">Süresi Doldu</span>
            ) : listing.active ? (
              <span className="text-green-500">Aktif</span>
            ) : (
              <span className="text-gray-500">Pasif</span>
            )}
          </p>
        </div>
        <div className="flex justify-end space-x-2 mt-4">
          {!listing.active && onEdit && (  // aktif olmayan ilanlar için düzenleme butonu
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="text-blue-600 hover:text-blue-700"
            >
              <FaEdit className="h-4 w-4" />
            </Button>
          )}
          {isActive && onDeactivate && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDeactivate}
              // className="text-yellow-600 hover:text-yellow-700"
              className="text-gray-600 hover:text-gray-700"
            >
              {/* <FaToggleOff className="h-4 w-4" />  */}
              <PowerOff className="h-4 w-4" /> 
              {/* pasife alma iconu düzeltildi */}
            </Button>
          )}
          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="text-red-600 hover:text-red-700"
            >
              <FaTrash className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
