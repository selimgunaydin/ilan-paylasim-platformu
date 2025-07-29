"use client";

import { Card, CardContent, CardHeader } from "@app/components/ui/card";
import { Listing } from "@/types";
import { Badge } from "@app/components/ui/badge";
import { formatDistance } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { createSeoUrl } from "@/utils/create-seo-url";
import { cn } from "@/utils";

interface ListingCardSimpleProps {
  listing: Listing;
}

export default function ListingCardSimple({ listing }: ListingCardSimpleProps) {
  const listingUrl = `/ilan/${encodeURIComponent(
    listing.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")
  )}-${listing.id}`;

  // İlan resmi kontrolü
  const primaryImage =
    listing.images && listing.images.length > 0
      ? listing.images[0]
      : "/placeholder-listing.jpg";

  // Tarih formatı
  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return formatDistance(date, new Date(), {
        addSuffix: true,
        locale: tr,
      });
    } catch (e) {
      return "";
    }
  };

  return (
    <div
      key={listing.id}
      className={cn(
        "border rounded-lg p-4 relative",
        listing.listingType === "premium"
          ? "border-2 border-yellow-400 bg-yellow-50"
          : "bg-white"
      )}
    >
      {listing.listingType === "premium" && (
        <span className="absolute top-4 right-4 bg-yellow-500 text-white px-2 py-1 rounded">
          Öncelikli İlan
        </span>
      )}
      <Link
        href={`/ilan/${createSeoUrl(listing.title)}-${listing.id}`}
        className="hover:text-blue-600"
      >
        <h2 className="text-xl font-semibold mb-2">{listing.title}</h2>
      </Link>
      <div
        dangerouslySetInnerHTML={{ __html: listing.description || "" }}
        className="text-gray-600 mb-3 line-clamp-2"
      />
      <div className="flex justify-between items-center text-sm text-gray-500">
        <div className="flex items-center gap-1">
          <span className="text-gray-500">📍</span>
          {listing.city}
        </div>
        <span>
          {new Date(listing.createdAt || Date.now()).toLocaleDateString(
            "tr-TR",
            {
              day: "2-digit",
              month: "long",
              year: "numeric",
            }
          )}
        </span>
      </div>
    </div>
  );
}
