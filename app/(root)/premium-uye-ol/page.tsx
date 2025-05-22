import Head from 'next/head';
import Link from 'next/link';
import { ShieldCheck, Star, Zap, TrendingUp, MessageSquare, Sparkles } from 'lucide-react';
import { getServerSession } from 'next-auth/next'; 
import { authOptions } from '@/api/auth/auth-options'; 

interface PremiumFeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

const PremiumFeatureCard = ({ icon: Icon, title, description }: PremiumFeatureCardProps) => (
  <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
    <div className="flex items-center justify-center w-12 h-12 bg-indigo-500 text-white rounded-full mb-4 self-start">
      <Icon className="w-6 h-6" />
    </div>
    <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
    <p className="text-gray-600 text-sm flex-grow">{description}</p>
  </div>
);

async function getUserAccountInfo(): Promise<{ isPremium: boolean }> {
  const session = await getServerSession(authOptions); 
  if (!session?.user?.id) {
    return { isPremium: false }; 
  }

  // TODO: Determine how Yuksek_uye is populated in the session object
  // For now, assuming it might be directly on session.user
  // Example: return { isPremium: !!session.user.Yuksek_uye };
  // console.log('Session in getUserAccountInfo:', session);

  // Temporarily return { isPremium: false } until the source of Yuksek_uye is confirmed
  return { isPremium: false }; 
  /*
  try {
    // Prisma code removed
  } catch (error) {
    console.error("Error fetching user account info:", error);
    return { isPremium: false }; 
  }
  */
}

const PremiumUyeOlPage = async () => {
  const userData = await getUserAccountInfo();

  // If user is already premium, you might want to redirect or show a different message
  if (userData.isPremium) {
    return (
      <div className="bg-gray-50 min-h-screen flex flex-col items-center justify-center text-center p-8">
        <Head>
          <title>Zaten Premium Üyesiniz - İlan Daddy</title>
        </Head>
        <Zap className="w-16 h-16 text-indigo-500 mb-4" />
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Zaten Premium Üyesiniz!</h1>
        <p className="text-lg text-gray-600 mb-8">
          Tüm premium avantajlarından faydalanıyorsunuz.
        </p>
        <Link href="/premium-uyelik" className="text-indigo-600 hover:text-indigo-800 font-semibold">
          Üyelik Detaylarınızı Görüntüleyin &rarr;
        </Link>
      </div>
    );
  }

  const features = [
    {
      icon: Zap,
      title: 'Sınırsız İlan Hakkı',
      description: 'İstediğiniz kadar ilan yayınlayın, potansiyel müşterilerinize ulaşmada sınırları kaldırın.',
    },
    {
      icon: TrendingUp,
      title: 'Uzatılmış İlan Süresi',
      description: 'İlanlarınız standart süreden daha uzun (örneğin 60 gün) yayında kalsın, daha fazla etkileşim alın.',
    },
    {
      icon: Star,
      title: 'Öne Çıkan İlanlar (Yakında)',
      description: 'İlanlarınızı özel bir bölümde veya listenin başında sergileyerek görünürlüğünüzü katlayın.',
    },
    {
      icon: Sparkles,
      title: 'Reklamsız Deneyim',
      description: 'Platformu reklamsız kullanarak daha hızlı, kesintisiz ve odaklanmış bir gezinti deneyimi yaşayın.',
    },
    {
      icon: ShieldCheck,
      title: 'Gelişmiş İstatistikler (Yakında)',
      description: 'İlanlarınızın performansını detaylı istatistiklerle takip edin, stratejilerinizi veriye dayalı olarak geliştirin.',
    },
    {
      icon: MessageSquare,
      title: 'Öncelikli Destek',
      description: 'Herhangi bir sorunuzda veya ihtiyacınızda uzman destek ekibimizden öncelikli yardım alın.',
    },
  ];

  return (
    <>
      <Head>
        <title>Premium Üye Ol - İlan Platformu</title>
        <meta name="description" content="Premium üyeliğe geçerek ilan platformumuzdaki ayrıcalıkları keşfedin. Sınırsız ilan, daha uzun yayın süresi ve birçok avantaj sizi bekliyor." />
      </Head>

      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Hero Section */}
          <section className="text-center py-12 md:py-16">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
              İlanlarınızın Potansiyelini <span className="text-indigo-600">Premium</span> İle Zirveye Taşıyın!
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Daha fazla görünürlük, sınırsız ilan hakkı ve birçok özel avantajla platformumuzdan en iyi şekilde yararlanın. Standartların ötesine geçin.
            </p>
            <Link
              href="/odeme?product=premium_membership&plan=monthly"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-lg"
            >
              Hemen Premium Ol (Aylık 149 TL)
            </Link>
          </section>

          {/* Features Grid */}
          <section className="py-12 md:py-16">
            <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">Neden Premium Üye Olmalısınız?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature) => (
                <PremiumFeatureCard key={feature.title} {...feature} />
              ))}
            </div>
          </section>

          {/* Comparison Table */}
          <section className="py-12 md:py-16 bg-white rounded-lg shadow-xl">
            <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">Standart ve Premium Karşılaştırması</h2>
            <div className="overflow-x-auto px-4">
              <table className="min-w-full table-auto border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase border-b border-gray-300">Özellik</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase border-b border-gray-300">Standart Üye</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-indigo-600 uppercase border-b border-gray-300">Premium Üye</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-300">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">Ücretsiz İlan Sayısı</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">1 adet</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 font-semibold text-center">Sınırsız</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">İlan Yayın Süresi</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">30 gün</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 font-semibold text-center">60+ gün</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">İlan Düzenleme</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">İlk onay sonrası kısıtlı/onaylı</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 font-semibold text-center">Esnek, her zaman premium avantajları</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">Öne Çıkan İlan</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">Yok</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 font-semibold text-center">Var (Yakında)</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">Reklamlar</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">Platformda Gösterilir</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 font-semibold text-center">Reklamsız Deneyim</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">Destek</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">Standart</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 font-semibold text-center">Öncelikli Destek</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">Detaylı İstatistikler</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">Yok</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 font-semibold text-center">Var (Yakında)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Final CTA */}
          <section className="text-center py-16">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Premium'a Geçiş Yapmaya Hazır Mısınız?</h2>
            <p className="text-lg text-gray-600 max-w-xl mx-auto mb-8">
              Ayrıcalıklı özelliklerden hemen yararlanmaya başlayın ve ilanlarınızın performansını en üst düzeye çıkarın.
            </p>
            <Link
              href="/odeme?product=premium_membership&plan=monthly"
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-10 rounded-lg shadow-md hover:shadow-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 text-lg"
            >
              Evet, Premium Üye Olmak İstiyorum! (Aylık 49 TL)
            </Link>
          </section>
        </div>
      </div>
    </>
  );
};

export default PremiumUyeOlPage;