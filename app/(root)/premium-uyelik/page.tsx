"use client";

import Head from 'next/head';
import Link from 'next/link';
import { ShieldCheck, Star, Zap, TrendingUp, UserCircle2, CreditCard, CheckCircle2, Info, FileText, Settings2, Package, MessageSquare, Sparkles } from 'lucide-react';
import { useState } from 'react';

interface Benefit {
  icon: React.ElementType;
  text: string;
}

const PremiumUyelikPage = () => {
  const [showAsPremium, setShowAsPremium] = useState(false);

  const benefits: Benefit[] = [
    { icon: Star, text: "Öne Çıkan İlanlar Arasında Yer Alma" },
    { icon: Zap, text: "Daha Fazla Görünürlük ve Erişim" },
    { icon: TrendingUp, text: "İlan İstatistiklerine Detaylı Erişim" },
    { icon: MessageSquare, text: "Öncelikli Destek Hizmeti" },
    { icon: Sparkles, text: "Platformdaki Yeniliklere Erken Erişim" },
    { icon: ShieldCheck, text: "Güvenli Alışveriş Araçları" },
  ];

  const nonPremiumBenefits: Benefit[] = [
    { icon: CheckCircle2, text: "Standart İlan Yayınlama" },
    { icon: Info, text: "Sınırlı Sayıda Ücretsiz İlan" },
  ];

  return (
    <>
      <Head>
        <title>{showAsPremium ? 'Premium Üyelik Yönetimi' : 'Premium Üyelik Avantajları'} - İlan Platformu</title>
        <meta name="description" content={showAsPremium ? "Premium üyelik detaylarınızı yönetin ve avantajlarınızdan yararlanın." : "Premium üyeliğe geçerek ilanlarınızı öne çıkarın ve daha fazla kişiye ulaşın."} />
      </Head>

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            {showAsPremium ? 'Premium Üyelik Yönetim Paneli' : 'Premium Üyelik'}
          </h1>
          <div className="flex items-center">
            <span className="mr-2 text-sm text-gray-600">Premium Görünümü:</span>
            <button 
              onClick={() => setShowAsPremium(!showAsPremium)}
              className={`px-4 py-2 rounded-md font-medium transition-colors
                ${showAsPremium ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-300 text-gray-700 hover:bg-gray-400'}`}
            >
              {showAsPremium ? 'AÇIK' : 'KAPALI'}
            </button>
          </div>
        </div>

        {showAsPremium ? (
          // Premium Kullanıcı Arayüzü
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-8 rounded-xl shadow-2xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
              <div>
                <h2 className="text-4xl font-extrabold mb-2">Hoş Geldiniz, Premium Üye!</h2>
                <p className="text-indigo-200 text-lg">Üyeliğinizle ilgili tüm detayları buradan yönetebilirsiniz.</p>
              </div>
              <Link href="/ilan-ekle" className="mt-4 md:mt-0 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center">
                <Package className="w-5 h-5 mr-2" /> Yeni İlan Oluştur
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {/* Üyelik Detayları */}
              <div className="bg-white/10 p-6 rounded-lg backdrop-blur-md">
                <div className="flex items-center text-yellow-300 mb-3">
                  <UserCircle2 className="w-7 h-7 mr-3" />
                  <h3 className="text-xl font-semibold">Üyelik Detaylarınız</h3>
                </div>
                <p className="text-sm text-indigo-100 mb-1"><strong className="font-medium text-indigo-50">Üyelik Tipi:</strong> Aylık Premium</p>
                <p className="text-sm text-indigo-100"><strong className="font-medium text-indigo-50">Yenilenme Tarihi:</strong> 23 Haziran 2025</p>
                <p className="text-xs text-indigo-200 mt-2">Sonraki yenileme için kartınızdan otomatik çekim yapılacaktır.</p>
              </div>

              {/* Fatura Bilgileri */}
              <div className="bg-white/10 p-6 rounded-lg backdrop-blur-md">
                <div className="flex items-center text-yellow-300 mb-3">
                  <FileText className="w-7 h-7 mr-3" />
                  <h3 className="text-xl font-semibold">Fatura ve Abonelik</h3>
                </div>
                <div className="space-y-3 mt-2">
                  <button className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium py-2.5 px-4 rounded-md text-sm flex items-center justify-center">
                    <FileText className="w-4 h-4 mr-2" /> Faturalarımı Görüntüle
                  </button>
                  <button className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium py-2.5 px-4 rounded-md text-sm flex items-center justify-center">
                    <CreditCard className="w-4 h-4 mr-2" /> Ödeme Yöntemini Güncelle
                  </button>
                  <button className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2.5 px-4 rounded-md text-sm flex items-center justify-center">
                    <Settings2 className="w-4 h-4 mr-2" /> Aboneliği Yönet (İptal/Değiştir)
                  </button>
                  <p className="text-xs text-center text-indigo-200 pt-1">Abonelik yönetimi yakında aktif olacaktır.</p>
                </div>
              </div>
              
              {/* Mevcut Avantajlar */}
              <div className="bg-white/10 p-6 rounded-lg backdrop-blur-md md:col-span-2 lg:col-span-1">
                <div className="flex items-center text-yellow-300 mb-3">
                  <Sparkles className="w-7 h-7 mr-3" />
                  <h3 className="text-xl font-semibold">Mevcut Avantajlarınız</h3>
                </div>
                <ul className="space-y-2.5 text-sm">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start">
                      <benefit.icon className="w-5 h-5 mr-2.5 mt-0.5 text-green-400 flex-shrink-0" />
                      <span className="text-indigo-50">{benefit.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="text-center mt-10">
              <p className="text-sm text-indigo-200">Destek için <Link href="/destek" className="font-semibold hover:underline text-yellow-300">destek sayfamızı</Link> ziyaret edebilirsiniz.</p>
            </div>
          </div>
        ) : (
          // Premium Olmayan Kullanıcı Arayüzü
          <div className="bg-white p-8 rounded-lg shadow-xl">
            <div className="text-center mb-8">
              <ShieldCheck className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Premium Üyeliğin Avantajlarını Keşfedin!</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                İlanlarınızı bir üst seviyeye taşıyın! Premium üyelik ile daha fazla kişiye ulaşın, ilanlarınızı öne çıkarın ve platformumuzdaki özel araçlara erişim sağlayın.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-10 items-start">
              <div>
                <h3 className="text-xl font-semibold text-gray-700 mb-4">Premium ile Neler Kazanırsınız?</h3>
                <ul className="space-y-3">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start">
                      <benefit.icon className="w-6 h-6 mr-3 text-indigo-500 flex-shrink-0" />
                      <span className="text-gray-700">{benefit.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-700 mb-4">Mevcut Durumunuz (Standart Üyelik):</h3>
                <ul className="space-y-3">
                  {nonPremiumBenefits.map((benefit, index) => (
                    <li key={index} className="flex items-start">
                      <benefit.icon className="w-6 h-6 mr-3 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-700">{benefit.text}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-sm text-gray-500">
                  Standart üyelik ile temel ilan yayınlama özelliklerini kullanabilirsiniz.
                </p>
              </div>
            </div>

            <div className="text-center">
              <Link href="/premium-uye-ol" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-10 rounded-lg text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 inline-block">
                Hemen Premium'a Geç!
              </Link>
              <p className="mt-4 text-sm text-gray-500">
                Premium üyelik hakkında daha fazla bilgi için <Link href="/premium-uye-ol" className="text-indigo-600 hover:underline">tıklayın</Link>.
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default PremiumUyelikPage;