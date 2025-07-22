"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import ListingCardSimple from "../../../components/listing-card-simple";
import { Loader2 } from "lucide-react";
import { Listing } from "../../../types";
import { Button } from "../../../components/ui/button";
import { useDebounce } from "../../../hooks/use-debounce";
import { getCityOptions } from "../../../lib/constants";

export default function SearchView() {
  const searchParams = useSearchParams();
  const queryParam = searchParams.get("q") || "";
  const cityParam = searchParams.get("city") || "";
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [results, setResults] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  const ITEMS_PER_PAGE = 12;
  const cityOptions = getCityOptions();

  // Yardımcı: cityParam'dan label bul
  const getCityLabel = (cityValue: string) => {
    if (!cityValue) return "";
    const found = cityOptions.find((c) => c.value === cityValue);
    return found ? found.label : cityValue;
  };

  const cityLabel = getCityLabel(cityParam);

  const fetchSearchResults = async (
    query: string,
    city: string,
    pageNum: number,
    shouldReplace: boolean = false
  ) => {
    // Hem arama sorgusu hem de şehir parametresi boşsa
    if (!query.trim() && !city.trim()) {
      setResults(shouldReplace ? [] : results);
      setTotal(0);
      setHasMore(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.append('q', query);
      if (city.trim()) params.append('city', city);
      params.append('page', pageNum.toString());
      params.append('limit', ITEMS_PER_PAGE.toString());

      const response = await fetch(`/api/listings/arama?${params.toString()}`);

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
      fetchSearchResults(debouncedSearchQuery, cityParam, page, page === 1);
    }
  }, [debouncedSearchQuery, cityParam, page]);

  // İlk yüklemede sorguyu çalıştır
  useEffect(() => {
    if (initialLoad && (queryParam || cityParam)) {
      fetchSearchResults(queryParam, cityParam, 1, true);
    }
  }, []);

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      setPage(page + 1);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.append('q', searchQuery);
    if (cityParam) params.append('city', cityParam);
    
    window.history.pushState({}, "", `/arama?${params.toString()}`);
    setPage(1);
    fetchSearchResults(searchQuery, cityParam, 1, true);
  };

  // Arama başlığını oluştur
  const getSearchTitle = () => {
    if (queryParam && cityParam) {
      return `"${queryParam}" için ${cityLabel} şehrinde arama sonuçları`;
    } else if (queryParam) {
      return `"${queryParam}" için arama sonuçları`;
    } else if (cityParam) {
      return `${cityLabel} şehrindeki ilanlar`;
    }
    return "Arama Sonuçları";
  };

  // Arama açıklamasını oluştur
  const getSearchDescription = () => {
    if (queryParam && cityParam) {
      return `"${queryParam}" için ${cityLabel} şehrinde ${total} sonuç bulundu`;
    } else if (queryParam) {
      return `"${queryParam}" için ${total} sonuç bulundu`;
    } else if (cityParam) {
      return `${cityLabel} şehrinde ${total} ilan bulundu`;
    }
    return "Lütfen arama yapmak için bir kelime girin veya şehir seçin";
  };

  // Sonuç bulunamadı mesajını oluştur
  const getNoResultsMessage = () => {
    if (queryParam && cityParam) {
      return `"${queryParam}" için ${cityLabel} şehrinde sonuç bulunamadı`;
    } else if (queryParam) {
      return `"${queryParam}" için sonuç bulunamadı`;
    } else if (cityParam) {
      return `${cityLabel} şehrinde ilan bulunamadı`;
    }
    return "Aramaya başlamak için bir kelime girin veya şehir seçin";
  };

  // Sonuç bulunamadı açıklamasını oluştur
  const getNoResultsDescription = () => {
    if (queryParam && cityParam) {
      return "Farklı anahtar kelimeler kullanarak veya farklı şehir seçerek tekrar aramayı deneyin.";
    } else if (queryParam) {
      return "Farklı anahtar kelimeler kullanarak tekrar aramayı deneyin.";
    } else if (cityParam) {
      return "Farklı şehir seçerek tekrar aramayı deneyin.";
    }
    return "İlan başlıklarında ve açıklamalarında arama yapabilir veya belirli bir şehirdeki ilanları görüntüleyebilirsiniz.";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Sayfa başlığı */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {getSearchTitle()}
        </h1>
        {!initialLoad && (
          <p className="text-gray-600">
            {getSearchDescription()}
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
                {getNoResultsMessage()}
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {getNoResultsDescription()}
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
