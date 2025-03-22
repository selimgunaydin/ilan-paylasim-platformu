"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import ListingCardSimple from "../../../components/listing-card-simple";
import { Loader2 } from "lucide-react";
import { Listing } from "../../../types";
import { Button } from "../../../components/ui/button";
import { useDebounce } from "../../../hooks/use-debounce";

export default function SearchView() {
  const searchParams = useSearchParams();
  const queryParam = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [results, setResults] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  const ITEMS_PER_PAGE = 12;

  const fetchSearchResults = async (
    query: string,
    pageNum: number,
    shouldReplace: boolean = false
  ) => {
    if (!query.trim()) {
      setResults(shouldReplace ? [] : results);
      setTotal(0);
      setHasMore(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/listings/arama?q=${encodeURIComponent(
          query
        )}&page=${pageNum}&limit=${ITEMS_PER_PAGE}`
      );

      if (!response.ok) {
        throw new Error("Arama yapılırken bir hata oluştu");
      }

      const data = await response.json();

      if (shouldReplace) {
        setResults(data.listings);
      } else {
        setResults([...results, ...data.listings]);
      }

      setTotal(data.total);
      setHasMore(
        data.listings.length === ITEMS_PER_PAGE &&
          data.listings.length + (pageNum - 1) * ITEMS_PER_PAGE < data.total
      );
    } catch (error) {
      console.error("Arama hatası:", error);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  // URL'deki sorgu parametresi değiştiğinde
  useEffect(() => {
    if (queryParam !== searchQuery) {
      setSearchQuery(queryParam);
    }
  }, [queryParam]);

  // Debounced sorgu değiştiğinde veya sayfa değiştiğinde
  useEffect(() => {
    if (debouncedSearchQuery === queryParam) {
      fetchSearchResults(debouncedSearchQuery, page, page === 1);
    }
  }, [debouncedSearchQuery, page]);

  // İlk yüklemede sorguyu çalıştır
  useEffect(() => {
    if (initialLoad && queryParam) {
      fetchSearchResults(queryParam, 1, true);
    }
  }, []);

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      setPage(page + 1);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    window.history.pushState(
      {},
      "",
      `/arama?q=${encodeURIComponent(searchQuery)}`
    );
    setPage(1);
    fetchSearchResults(searchQuery, 1, true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Sayfa başlığı */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Arama Sonuçları
        </h1>
        {!initialLoad && (
          <p className="text-gray-600">
            {queryParam ? (
              <>
                <span className="font-semibold">"{queryParam}"</span> için{" "}
                <span className="font-semibold">{total}</span> sonuç bulundu
              </>
            ) : (
              "Lütfen arama yapmak için bir kelime girin"
            )}
          </p>
        )}
      </div>

      {/* Sonuçlar */}
      {initialLoad ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
        </div>
      ) : (
        <>
          {results.length > 0 ? (
            <div className="flex flex-col gap-4">
              {results.map((listing) => (
                <ListingCardSimple key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-4">
              <h3 className="text-xl font-semibold text-gray-700 mb-4">
                {queryParam
                  ? `"${queryParam}" için sonuç bulunamadı`
                  : "Aramaya başlamak için bir kelime girin"}
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {queryParam
                  ? "Farklı anahtar kelimeler kullanarak tekrar aramayı deneyin."
                  : "İlan başlıklarında ve açıklamalarında arama yapabilirsiniz."}
              </p>
            </div>
          )}

          {/* Daha fazla yükle butonu */}
          {hasMore && results.length > 0 && (
            <div className="flex justify-center mt-12">
              <Button
                onClick={handleLoadMore}
                disabled={loading}
                className="flex items-center gap-2 bg-white border border-indigo-600 text-indigo-600 hover:bg-indigo-50 font-semibold py-2 px-6 rounded-lg transition-all duration-300"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Daha Fazla Göster
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
