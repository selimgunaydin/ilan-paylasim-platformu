import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Category, Listing } from "@shared/schema";
import { useParams } from "next/navigation";
import Link from "next/link";
import { cn, createSeoUrl } from "@/lib/utils";
import { Badge } from "@app/components/ui/badge";
import { Button } from "@app/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "@app/components/ui/select";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMapMarkerAlt } from "@fortawesome/free-solid-svg-icons";

export default function CategoryDetail() {
  const { slug } = useParams<{ slug: string; city?: string }>();
  const pathParts = window.location.pathname.split("/").filter(Boolean);
  const lastPart = pathParts[pathParts.length - 1];
  const page = !isNaN(parseInt(lastPart)) ? parseInt(lastPart) : 1;

  // Şehir parse etme mantığını düzeltelim
  const city = pathParts.length > 2 && isNaN(parseInt(pathParts[2]))
    ? pathParts[2].charAt(0).toUpperCase() + pathParts[2].slice(1).toLowerCase()
    : undefined;

  const searchParams = new URLSearchParams(window.location.search);
  const searchQuery = searchParams.get("search") || "";

  console.log('Current path parts:', pathParts); // Debug için
  console.log('Detected city:', city); // Debug için
  console.log('Search query:', searchQuery);

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: () => fetch("/api/categories").then((res) => res.json()),
    staleTime: 300000, // 5 dakika cache
  });

  const { data: category } = useQuery<Category>({
    queryKey: ["/api/categories", slug],
    queryFn: () => fetch(`/api/categories/${slug}`).then((res) => res.json()),
    staleTime: 300000, // 5 dakika cache
  });

  const { data: listingsData } = useQuery<{
    listings: Listing[];
    total: number;
  }>({
    queryKey: ["/api/listings", { categorySlug: slug, city, page, search: searchQuery }],
    queryFn: async () => {
      const cityParam = city ? `&city=${encodeURIComponent(city)}` : "";
      const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
      const url = `/api/listings?categorySlug=${slug}${cityParam}${searchParam}&page=${page}`;
      console.log('Fetching URL:', url); // Debug için
      return fetch(url).then((res) => res.json());
    },
  });

  const [sortedListings, setSortedListings] = useState<Listing[]>([]);

  useEffect(() => {
    if (!listingsData?.listings) return;

    // Premium ilanları önce göster
    const sortedData = [...listingsData.listings].sort((a, b) => {
      if (a.listingType === "premium" && b.listingType !== "premium") return -1;
      if (a.listingType !== "premium" && b.listingType === "premium") return 1;
      return new Date(b.createdAt || Date.now()).getTime() - new Date(a.createdAt || Date.now()).getTime();
    });

    setSortedListings(sortedData);
  }, [listingsData?.listings]);

  // Eski sort logiğini kaldır
  /*const defaultSort = listingsData?.listings?.sort((a, b) => {*/

  if (!category) return <div>Yükleniyor...</div>;

  return (
    <div className="py-8">
      {/* Arama formu düzenlemesi */}
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-lg mb-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const category = form.category.value;
            const city = form.city.value;

            if (!category) return;

            const normalizedCity = city ? `/${decodeURIComponent(city.toLowerCase())}` : "";
            const url = `/kategori/${category}${normalizedCity}`;
            window.location.href = url;
          }}
          // Mobil görünümde dikey, masaüstünde yatay yerleşim için flex yapılandırması
          className="flex flex-col md:flex-row gap-4"
        >
          {/* Kategori seçimi - tam genişlik kullanımı */}
          <div className="w-full md:flex-1">
            <Select name="category" required>
              <SelectTrigger>
                <SelectValue placeholder="Kategori Seç" />
              </SelectTrigger>
              <SelectContent>
                {categories
                  ?.filter((c) => !c.parentId)
                  .map((mainCategory) => (
                    <SelectGroup key={mainCategory.id}>
                      <SelectLabel className="font-semibold text-sm text-gray-700">
                        {mainCategory.name}
                      </SelectLabel>
                      {categories
                        ?.filter((c) => c.parentId === mainCategory.id)
                        .map((subCategory) => (
                          <SelectItem
                            key={subCategory.id}
                            value={subCategory.slug}
                          >
                            {subCategory.name}
                          </SelectItem>
                        ))}
                      <SelectSeparator />
                    </SelectGroup>
                  ))}
              </SelectContent>
            </Select>
          </div>
          {/* Şehir seçimi - tam genişlik kullanımı */}
          <div className="w-full md:flex-1">
            <Select name="city">
              <SelectTrigger>
                <SelectValue placeholder="Tüm Şehirler" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="istanbul">İstanbul</SelectItem>
                <SelectItem value="adana">Adana</SelectItem>
                <SelectItem value="adiyaman">Adıyaman</SelectItem>
                <SelectItem value="afyonkarahisar">Afyonkarahisar</SelectItem>
                <SelectItem value="agri">Ağrı</SelectItem>
                <SelectItem value="aksaray">Aksaray</SelectItem>
                <SelectItem value="amasya">Amasya</SelectItem>
                <SelectItem value="ankara">Ankara</SelectItem>
                <SelectItem value="antalya">Antalya</SelectItem>
                <SelectItem value="ardahan">Ardahan</SelectItem>
                <SelectItem value="artvin">Artvin</SelectItem>
                <SelectItem value="aydin">Aydın</SelectItem>
                <SelectItem value="balikesir">Balıkesir</SelectItem>
                <SelectItem value="bartin">Bartın</SelectItem>
                <SelectItem value="batman">Batman</SelectItem>
                <SelectItem value="bayburt">Bayburt</SelectItem>
                <SelectItem value="bilecik">Bilecik</SelectItem>
                <SelectItem value="bingol">Bingöl</SelectItem>
                <SelectItem value="bitlis">Bitlis</SelectItem>
                <SelectItem value="bolu">Bolu</SelectItem>
                <SelectItem value="burdur">Burdur</SelectItem>
                <SelectItem value="bursa">Bursa</SelectItem>
                <SelectItem value="canakkale">Çanakkale</SelectItem>
                <SelectItem value="cankiri">Çankırı</SelectItem>
                <SelectItem value="corum">Çorum</SelectItem>
                <SelectItem value="denizli">Denizli</SelectItem>
                <SelectItem value="diyarbakir">Diyarbakır</SelectItem>
                <SelectItem value="duzce">Düzce</SelectItem>
                <SelectItem value="edirne">Edirne</SelectItem>
                <SelectItem value="elazig">Elazığ</SelectItem>
                <SelectItem value="erzincan">Erzincan</SelectItem>
                <SelectItem value="erzurum">Erzurum</SelectItem>
                <SelectItem value="eskisehir">Eskişehir</SelectItem>
                <SelectItem value="gaziantep">Gaziantep</SelectItem>
                <SelectItem value="giresun">Giresun</SelectItem>
                <SelectItem value="gumushane">Gümüşhane</SelectItem>
                <SelectItem value="hakkari">Hakkari</SelectItem>
                <SelectItem value="hatay">Hatay</SelectItem>
                <SelectItem value="igdir">Iğdır</SelectItem>
                <SelectItem value="isparta">Isparta</SelectItem>
                <SelectItem value="izmir">İzmir</SelectItem>
                <SelectItem value="kahramanmaras">Kahramanmaraş</SelectItem>
                <SelectItem value="karabuk">Karabük</SelectItem>
                <SelectItem value="karaman">Karaman</SelectItem>
                <SelectItem value="kars">Kars</SelectItem>
                <SelectItem value="kastamonu">Kastamonu</SelectItem>
                <SelectItem value="kayseri">Kayseri</SelectItem>
                <SelectItem value="kilis">Kilis</SelectItem>
                <SelectItem value="kirikkale">Kırıkkale</SelectItem>
                <SelectItem value="kirklareli">Kırklareli</SelectItem>
                <SelectItem value="kirsehir">Kırşehir</SelectItem>
                <SelectItem value="kocaeli">Kocaeli</SelectItem>
                <SelectItem value="konya">Konya</SelectItem>
                <SelectItem value="kutahya">Kütahya</SelectItem>
                <SelectItem value="malatya">Malatya</SelectItem>
                <SelectItem value="manisa">Manisa</SelectItem>
                <SelectItem value="mardin">Mardin</SelectItem>
                <SelectItem value="mersin">Mersin</SelectItem>
                <SelectItem value="mugla">Muğla</SelectItem>
                <SelectItem value="mus">Muş</SelectItem>
                <SelectItem value="nevsehir">Nevşehir</SelectItem>
                <SelectItem value="nigde">Niğde</SelectItem>
                <SelectItem value="ordu">Ordu</SelectItem>
                <SelectItem value="osmaniye">Osmaniye</SelectItem>
                <SelectItem value="rize">Rize</SelectItem>
                <SelectItem value="sakarya">Sakarya</SelectItem>
                <SelectItem value="samsun">Samsun</SelectItem>
                <SelectItem value="siirt">Siirt</SelectItem>
                <SelectItem value="sinop">Sinop</SelectItem>
                <SelectItem value="sivas">Sivas</SelectItem>
                <SelectItem value="sanliurfa">Şanlıurfa</SelectItem>
                <SelectItem value="sirnak">Şırnak</SelectItem>
                <SelectItem value="tekirdag">Tekirdağ</SelectItem>
                <SelectItem value="tokat">Tokat</SelectItem>
                <SelectItem value="trabzon">Trabzon</SelectItem>
                <SelectItem value="tunceli">Tunceli</SelectItem>
                <SelectItem value="usak">Uşak</SelectItem>
                <SelectItem value="van">Van</SelectItem>
                <SelectItem value="yalova">Yalova</SelectItem>
                <SelectItem value="yozgat">Yozgat</SelectItem>
                <SelectItem value="zonguldak">Zonguldak</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Arama butonu - mobilde tam genişlik */}
          <Button
            type="submit"
            className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white px-8"
          >
            Ara
          </Button>
        </form>
      </div>
      {/* Alt taraftaki başlık ve arama alanı bölümü */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">
          {city
            ? `${city.charAt(0).toUpperCase() + city.slice(1)} ${category.name} İlanları`
            : `${category.name} İlanları`}
        </h1>
        {/* Arama kutusu - mobilde tam genişlik */}
        <div className="w-full md:w-auto">
          <input
            type="search"
            placeholder="İlanlarda ara..."
            className="w-full md:w-[300px] px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            defaultValue={searchQuery}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const searchQuery = e.currentTarget.value;
                const cityParam = city ? `/${city}` : "";
                const baseUrl = `/kategori/${slug}${cityParam}`;
                const searchParam = searchQuery.trim() ? `?search=${encodeURIComponent(searchQuery.trim())}` : '';
                window.location.href = baseUrl + searchParam;
              }
            }}
          />
        </div>
      </div>
      <div className="space-y-4">
        {!sortedListings?.length && listingsData?.listings?.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <p className="text-gray-500 text-lg">
              {searchQuery ? "Bu kelimeyi içeren ilan bulunamadı.." : "Henüz bu kategoride ilan eklenmemiş..."}
            </p>
          </div>
        ) : (
          sortedListings.map((listing) => (
            <div
              key={listing.id}
              className={cn(
                "border rounded-lg p-4 relative",
                listing.listingType === "premium"
                  ? "border-2 border-yellow-400 bg-yellow-50"
                  : "bg-white",
              )}
            >
              {listing.listingType === "premium" && (
                <Badge className="absolute top-4 right-4 bg-yellow-500">
                  Öncelikli İlan
                </Badge>
              )}
              <Link
                href={`/ilan/${createSeoUrl(listing.title)}-${listing.id}`}
                className="hover:text-blue-600"
              >
                <h2 className="text-xl font-semibold mb-2">{listing.title}</h2>
              </Link>
              <p className="text-gray-600 mb-3 line-clamp-2">
                {listing.description}
              </p>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Link
                    href={`/kategori/${category.parentId === null ? category.slug : slug}/${listing.city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')}`}
                    className="hover:text-blue-500 font-bold flex items-center gap-1"
                  >
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="text-gray-500" />
                    {listing.city}
                  </Link>
                  {category.parentId === null && (
                    <>
                      <span className="text-gray-400"> - </span>
                      <Link
                        href={`/kategori/${categories?.find(c => c.id === listing.categoryId)?.slug || ''}`}
                        className="hover:text-blue-500"
                      >
                        {categories?.find(c => c.id === listing.categoryId)?.name}
                      </Link>
                    </>
                  )}
                </div>
                <span>
                  {formatDistanceToNow(new Date(listing.createdAt || Date.now()), {
                    addSuffix: true,
                    locale: tr,
                  })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
      {listingsData && listingsData.total > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-center gap-2">
            {page > 1 && (
              <Link
                href={`/kategori/${slug}${page === 2 ? '' : `/${page - 1}`}`}
                className="px-4 py-2 rounded-md bg-white hover:bg-gray-100"
              >
                ←
              </Link>
            )}

            {Array.from(
              { length: Math.min(5, Math.ceil(listingsData.total / 10)) },
              (_, i) => {
                const pageNum = page > 3 ? page - 3 + i : i + 1;
                if (pageNum > Math.ceil(listingsData.total / 10)) return null;

                const cityPath = city ? `/${city}` : '';
                const pagePath = pageNum === 1 ? '' : `/${pageNum}`;
                const searchPath = searchQuery ? `?search=${searchQuery}` : '';

                return (
                  <Link
                    key={pageNum}
                    href={`/kategori/${slug}${cityPath}${pagePath}${searchPath}`}
                    className={cn(
                      "px-4 py-2 rounded-md",
                      page === pageNum
                        ? "bg-blue-600 text-white"
                        : "bg-white hover:bg-gray-100"
                    )}
                  >
                    {pageNum}
                  </Link>
                );
              }
            )}

            {page < Math.ceil(listingsData.total / 10) && (
              <Link
                href={`/kategori/${slug}/${page + 1}`}
                className="px-4 py-2 rounded-md bg-white hover:bg-gray-100"
              >
                →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}