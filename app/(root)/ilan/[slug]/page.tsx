import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/api/auth/[...nextauth]/route"; // Adjust path as needed
import { headers } from "next/headers";
import Link from "next/link";
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

async function fetchFavoriteStatus(id: string, userId: string | undefined, cookies: string) {
  if (!userId) return { isFavorite: false };
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/favorites/check/${id}`, {
    headers: {
      "Cookie": cookies || "",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Favori durumu kontrol edilemedi");
  return res.json() as Promise<{ isFavorite: boolean }>;
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
    // Fetch all necessary data on the server
    const listing = await fetchListing(id, cookies);
    const [categories, similarListingsResponse, favoriteStatus] = await Promise.all([
      fetchCategories(cookies),
      fetchSimilarListings(listing.categoryId, cookies),
      fetchFavoriteStatus(id, session?.user?.id, cookies),
    ]);

    const category = categories.find((c) => c.id === listing.categoryId);
    const parentCategory = category?.parentId
      ? categories.find((c) => c.id === category.parentId)
      : null;

    return (
      <div className="py-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex mb-4 text-sm text-gray-500">
          <Link href="/" className="hover:text-blue-600">Anasayfa</Link>
          <span className="mx-2">/</span>
          {parentCategory && (
            <>
              <Link href={`/kategori/${parentCategory.slug}`} className="hover:text-blue-600">
                {parentCategory.name}
              </Link>
              <span className="mx-2">/</span>
            </>
          )}
          {category && (
            <>
              <Link href={`/kategori/${category.slug}`} className="hover:text-blue-600">
                {category.name}
              </Link>
              <span className="mx-2">/</span>
            </>
          )}
          <span className="text-gray-900">{listing.title}</span>
        </nav>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
          <div className="md:col-span-2">
            {/* Listing Details */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <h1 className="text-2xl font-bold">{listing.title}</h1>
                  {listing.listingType === "premium" && (
                    <span className="bg-yellow-500 text-white px-2 py-1 rounded">Öncelikli İlan</span>
                  )}
                </div>
                {listing?.images && listing?.images.length > 0 && (
                  <div className="mb-6">
                    {/* Static image placeholder - client will handle interactivity */}
                    <img src={listing?.images[0]} alt={listing.title} className="w-full h-64 object-cover rounded" />
                  </div>
                )}
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap text-lg">{listing.description}</p>
                </div>
              </div>
            </div>

            <ListingDetailClient
          listing={listing}
          user={session?.user || null}
          initialFavoriteStatus={favoriteStatus.isFavorite}
          slug={params.slug}
        />

            {/* Similar Listings */}
            <div className="bg-white rounded-lg shadow mt-6">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Benzer İlanlar</h2>
                <div className="space-y-4">
                  {similarListingsResponse.listings
                    ?.filter((l:any) => l.id !== listing.id && l.listingType === "premium")
                    .slice(0, 5)
                    .map((similarListing:any) => (
                      <Link
                        key={similarListing.id}
                        href={`/ilan/${createSeoUrl(similarListing.title)}-${similarListing.id}`}
                        className="block p-4 border rounded-lg hover:border-blue-500 transition-colors"
                      >
                        <h3 className="font-semibold mb-2">{similarListing.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{similarListing.description}</p>
                      </Link>
                    ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Listing Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">İlan Bilgileri</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Güncelleme Tarihi</p>
                  <p className="font-medium">
                    {listing.createdAt
                      ? new Date(listing.createdAt).toLocaleDateString("tr-TR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })
                      : "Tarih bilgisi yok"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Şehir</p>
                  <p className="font-medium">{listing.city}</p>
                </div>
                {listing.contactPerson && (
                  <div>
                    <p className="text-sm text-gray-500">İlan Sahibi</p>
                    <p className="font-medium">{listing.contactPerson}</p>
                  </div>
                )}
                {listing.phone && (
                  <div>
                    <p className="text-sm text-gray-500">Telefon</p>
                    <p className="font-medium">{listing.phone}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">İlan Görüntülenme</p>
                  <p className="font-medium">{listing.views || 0}</p>
                </div>
              </div>
            </div>

            {/* Ad Space */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-2">Reklam Alanı</h3>
              <p className="text-sm opacity-90">
                Bu alanda sponsorlu içerik veya reklam gösterilebilir
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Veri yükleme hatası:", error);
    return <div className="p-8 text-center">İlan bulunamadı</div>;
  }
}

const createSeoUrl = (title: string): string =>
  title.toLowerCase().replace(/ /g, "-");