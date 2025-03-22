import Link from "next/link";
import IlanSearch from "@app/components/ilan-search";
import { Footer } from "@/views/footer";

// Category tipini genişleterek listingCount ve children özelliklerini ekleyelim
interface Category {
  id: number;
  name: string;
  parentId: number | null;
  slug: string;
  order: number;
  customTitle: string | null;
  metaDescription: string | null;
  content: string | null;
  faqs: string | null;
  listingCount: number;
  children: Category[];
}

// Category tipini genişleterek listingCount özelliğini opsiyonel olarak ekleyelim
interface CategoryWithCount extends Category {
  listingCount: number;
}
export default function HomePage({ categories }: { categories: CategoryWithCount[] }) {
  // Ana kategoriler (parentId null olanlar)
  const mainCategories = Array.isArray(categories)
    ? categories.filter((c) => !c.parentId)
    : [];

  // Alt kategorilerin toplam ilan sayısını hesaplayan fonksiyon
  const getSubcategoryListingCount = (mainCategory: CategoryWithCount) => {
    return (
      mainCategory.children?.reduce(
        (total, subCat) => total + (subCat.listingCount || 0),
        0
      ) || 0
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section - Modern Gradient Background */}
      <div className="relative bg-gradient-to-r from-blue-700 to-indigo-800 py-24">
        <div className="absolute inset-0 opacity-5"></div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white/10 to-transparent"></div>
        
        <div className="relative w-full max-w-[1800px] mx-auto px-4">
          <div className="text-center text-white">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Aradığınız Her Şey <span className="text-yellow-300">Burada</span>
            </h1>
            <p className="text-lg md:text-xl mb-10 max-w-3xl mx-auto opacity-90">
              Yeni bir iş, ikinci el eşyalar, satılık ya da kiralık araçlar,
              emlak, ev arkadaşı, özel ders ve daha pek çok konuda aradığınız ne
              varsa burada.
            </p>

            {/* Arama formu bölümü - Search Section */}
            <IlanSearch categories={categories} />
            
            {/* Quick Stats */}
            <div className="mt-12 flex flex-wrap justify-center gap-8 text-white">
              <div className="flex items-center">
                <div className="bg-white/20 p-3 rounded-full mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="text-2xl font-bold">10,000+</div>
                  <div className="text-sm opacity-80">Aktif Kullanıcı</div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="bg-white/20 p-3 rounded-full mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2 2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="text-2xl font-bold">50,000+</div>
                  <div className="text-sm opacity-80">Aktif İlan</div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="bg-white/20 p-3 rounded-full mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="text-2xl font-bold">24/7</div>
                  <div className="text-sm opacity-80">Destek</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Categories Section */}
      <div className="w-full max-w-[1800px] mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Tüm Kategoriler</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">İhtiyacınız olan her şeyi kolayca bulun. Binlerce ilan arasından size en uygun olanı seçin.</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mainCategories.map((mainCategory: CategoryWithCount) => {
            const totalSubcategoryListings = getSubcategoryListingCount(mainCategory);
            const totalListings = (mainCategory.listingCount || 0) + totalSubcategoryListings;
            if(mainCategory.children.length === 0) return null;
            return (
              <div key={mainCategory.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Link
                      href={`/kategori/${mainCategory.slug}`}
                      className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
                    >
                      {mainCategory.name}
                    </Link>
                    {totalListings > 0 && (
                      <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                        {totalListings} ilan
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {mainCategory.children
                      ?.sort((a, b) => {
                        // İlan sayısı büyükten küçüğe (ilan olanlar üstte)
                        const listingCountDiff = (b.listingCount || 0) - (a.listingCount || 0);
                        if (listingCountDiff !== 0) return listingCountDiff;
                        // İlan sayıları eşitse order'a göre sırala
                        return a.order - b.order;
                      })
                      .slice(0, 5) // İlk 5 alt kategoriyi göster
                      .map((subCategory: CategoryWithCount) => (
                        <Link
                          key={subCategory.id}
                          href={`/kategori/${subCategory.slug}`}
                          className="flex items-center justify-between text-gray-600 hover:text-blue-600 transition-colors"
                        >
                          <span>{subCategory.name}</span>
                          {subCategory.listingCount > 0 && (
                            <span className="text-sm text-gray-500">
                              {subCategory.listingCount}
                            </span>
                          )}
                        </Link>
                      ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <Link
                      href={`/kategori/${mainCategory.slug}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                    >
                      Tümünü Gör
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* How It Works Section */}
      <div className="bg-gray-50 py-16">
        <div className="w-full max-w-[1800px] mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Nasıl Çalışır?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Sadece birkaç adımda ilanınızı yayınlayın veya aradığınızı bulun.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">İlan Oluştur</h3>
              <p className="text-gray-600">Satmak veya kiralamak istediğiniz ürün veya hizmet için detaylı bir ilan oluşturun.</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Keşfet</h3>
              <p className="text-gray-600">Binlerce ilan arasından aradığınızı kolayca bulun ve iletişime geçin.</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">İletişime Geç</h3>
              <p className="text-gray-600">İlan sahipleriyle doğrudan mesajlaşarak detayları konuşun ve anlaşın.</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 py-16">
        <div className="w-full max-w-[1800px] mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Hemen İlanınızı Yayınlayın</h2>
          <p className="text-white/90 max-w-2xl mx-auto mb-8">Binlerce potansiyel alıcıya ulaşın ve satışlarınızı artırın. İlanınızı birkaç dakika içinde oluşturun.</p>
          <Link
            href="/ilan-ekle"
            className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 transition-colors shadow-lg"
          >
            Ücretsiz İlan Ver
          </Link>
        </div>
      </div>
    </div>
  );
}