// ilan/[slug]/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/api/auth/[...nextauth]/route"; // Adjust path as needed
import { headers } from "next/headers";

import type { Category } from "@shared/schemas";
import ListingDetailClient from "@/views/ilan-detay";

async function fetchListing(id: string, cookies: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/listings/${id}`, {
    headers: {
      "Cookie": cookies || "",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("İlan yüklenemedi");
  return res.json() as Promise<any>;
}

async function fetchCategories(cookies: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`, {
    headers: {
      "Cookie": cookies || "",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Kategoriler yüklenemedi");
  return res.json() as Promise<Category[]>;
}

async function fetchSimilarListings(categoryId: string, cookies: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/listings?categoryId=${categoryId}&limit=5`,
    {
      headers: {
        "Cookie": cookies || "",
      },
      cache: "no-store",
    }
  );
  if (!res.ok) throw new Error("Benzer ilanlar yüklenemedi");
  return res.json() as Promise<{ listings: any }>;
}

export default async function ListingDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const session = await getServerSession(authOptions);
  const headersList = headers();
  const cookies = headersList.get("cookie") || "";

  const id = params.slug?.split("-").pop();
  if (!id || isNaN(Number(id))) {
    return <div className="p-8 text-center">Geçersiz ilan ID'si</div>;
  }

  try {
    // Fetch listing first to get its categoryId
    const listing = await fetchListing(id, cookies);

    // Then fetch categories and similar listings using the listing's categoryId
    const [categories, similarListingsResponse] = await Promise.all([
      fetchCategories(cookies),
      fetchSimilarListings(listing.categoryId, cookies),
    ]);

    return (
      <ListingDetailClient
        initialListing={listing}
        initialCategories={categories}
        initialSimilarListings={similarListingsResponse.listings}
        user={session?.user || null}
        slug={params.slug}
      />
    );
  } catch (error) {
    console.error("Veri yükleme hatası:", error);
    return <div className="p-8 text-center">İlan bulunamadı</div>;
  }
}