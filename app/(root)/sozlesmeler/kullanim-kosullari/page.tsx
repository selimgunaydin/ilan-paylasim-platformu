import React from 'react';
import { Card, CardContent } from '@app/components/ui/card';

export const metadata = {
  title: 'Kullanım Koşulları',
  description: 'İlan Platformu kullanım koşulları, kurallar ve şartlar hakkında bilgiler.',
};

export default function KullanimKosullariPage() {
  return (
    <div className="max-w-7xl mx-auto py-8 px-4 md:py-12">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">Kullanım Koşulları</h1>
      <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
        İlan Platformu'nu kullanarak aşağıdaki koşulları kabul etmiş sayılırsınız. 
        Platformumuzu kullanmadan önce lütfen bu koşulları dikkatlice okuyunuz.
      </p>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <h2 className="text-2xl font-bold mb-4">1. Giriş</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              Bu Kullanım Koşulları, İlan Platformu ("Platform", "biz", "bizim") ile Platform'u 
              kullanan kişiler ("Kullanıcı", "siz", "sizin") arasındaki ilişkiyi düzenlemektedir.
            </p>
            <p>
              Platform'u kullanarak, bu Kullanım Koşulları'nı ve Gizlilik Politikası'nı okuduğunuzu, 
              anladığınızı ve kabul ettiğinizi beyan etmiş olursunuz. Bu koşulları kabul etmiyorsanız, 
              lütfen Platform'u kullanmayınız.
            </p>
            <p>
              Platform, bu Kullanım Koşulları'nı herhangi bir zamanda değiştirme hakkını saklı tutar. 
              Değişiklikler, Platform üzerinden yayınlandığı tarihte yürürlüğe girer. Değişikliklerden 
              sonra Platform'u kullanmaya devam etmeniz, güncellenmiş koşulları kabul ettiğiniz anlamına gelecektir.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <h2 className="text-2xl font-bold mb-4">2. Üyelik</h2>
          <div className="space-y-4 text-muted-foreground">
            <h3 className="text-xl font-semibold">2.1. Üyelik Şartları</h3>
            <p>
              Platform'a üye olabilmek için 18 yaşını doldurmuş olmanız gerekmektedir. 
              Üyelik sırasında verdiğiniz tüm bilgilerin doğru, güncel ve eksiksiz olduğunu taahhüt edersiniz.
            </p>
            <h3 className="text-xl font-semibold">2.2. Hesap Güvenliği</h3>
            <p>
              Hesabınızın güvenliğinden yalnızca siz sorumlusunuz. Şifrenizi gizli tutmalı ve 
              hesabınızdaki tüm etkinliklerden sorumlu olduğunuzu kabul etmelisiniz. 
              Hesabınızda yetkisiz bir erişim veya güvenlik ihlali fark ederseniz, 
              derhal Platform'u bilgilendirmelisiniz.
            </p>
            <h3 className="text-xl font-semibold">2.3. Hesap Sonlandırma</h3>
            <p>
              Platform, kendi takdirine bağlı olarak, herhangi bir sebepten dolayı ve önceden 
              bildirimde bulunmaksızın, herhangi bir hesabı askıya alabilir veya sonlandırabilir. 
              Kullanıcılar da istedikleri zaman hesaplarını kapatma hakkına sahiptir.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <h2 className="text-2xl font-bold mb-4">3. İlan Kuralları</h2>
          <div className="space-y-4 text-muted-foreground">
            <h3 className="text-xl font-semibold">3.1. İlan İçeriği</h3>
            <p>
              Platform üzerinde yayınlanan tüm ilanların içeriğinden yalnızca ilan veren Kullanıcı sorumludur. 
              İlanlarınızın doğru, güncel ve eksiksiz bilgiler içermesini sağlamalısınız.
            </p>
            <h3 className="text-xl font-semibold">3.2. Yasaklı İlanlar</h3>
            <p>
              Aşağıdaki içerikleri barındıran ilanların yayınlanması kesinlikle yasaktır:
            </p>
            <ul className="list-disc pl-6">
              <li>Yasadışı ürün, hizmet veya faaliyetler</li>
              <li>Sahte, yanıltıcı veya aldatıcı bilgiler</li>
              <li>Telif hakkı, ticari marka veya diğer fikri mülkiyet haklarını ihlal eden içerikler</li>
              <li>Müstehcen, pornografik veya yetişkinlere yönelik içerikler</li>
              <li>Şiddet, nefret söylemi veya ayrımcılık içeren ifadeler</li>
              <li>Kişisel verileri ifşa eden bilgiler</li>
              <li>Zararlı yazılım, virüs veya zararlı kodlar içeren linkler</li>
              <li>Platform'un teknik altyapısına zarar verebilecek içerikler</li>
            </ul>
            <h3 className="text-xl font-semibold">3.3. İlanların Kontrolü</h3>
            <p>
              Platform, yayınlanan ilanları inceleme ve uygunsuz gördüğü ilanları kaldırma hakkını saklı tutar. 
              İlanınızın kaldırılması durumunda bilgilendirileceksiniz.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <h2 className="text-2xl font-bold mb-4">4. Fikri Mülkiyet Hakları</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              Platform üzerindeki tüm içerikler, tasarımlar, logolar, metinler, grafikler ve yazılımlar, 
              Platform'a veya lisans verenlere aittir ve telif hakkı, ticari marka ve diğer fikri mülkiyet 
              yasaları ile korunmaktadır.
            </p>
            <p>
              Platform'un yazılı izni olmadan, Platform'un içeriğini kopyalamak, değiştirmek, 
              dağıtmak veya ticari amaçlarla kullanmak yasaktır.
            </p>
            <p>
              İlanlarınızda kullandığınız tüm içeriklerin (fotoğraflar, metinler vb.) haklarına 
              sahip olduğunuzu veya kullanım izninizin bulunduğunu taahhüt edersiniz.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <h2 className="text-2xl font-bold mb-4">5. Gizlilik</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              Kişisel verilerinizin nasıl toplandığı, kullanıldığı ve korunduğu hakkında detaylı bilgi için 
              lütfen <a href="/sozlesmeler/gizlilik-politikasi" className="text-primary hover:underline">Gizlilik Politikası</a>'mızı 
              ve <a href="/sozlesmeler/kvkk" className="text-primary hover:underline">KVKK Aydınlatma Metni</a>'mizi inceleyiniz.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <h2 className="text-2xl font-bold mb-4">6. Sorumluluk Sınırlandırması</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              Platform, mümkün olan en iyi hizmeti sunmak için çaba gösterse de, hizmetlerinin kesintisiz, 
              hatasız veya güvenli olacağını garanti etmemektedir.
            </p>
            <p>
              Platform, kullanıcılar arasında yapılan işlemlerden veya iletişimden sorumlu değildir. 
              Kullanıcılar arasındaki anlaşmazlıklar, doğrudan ilgili taraflar arasında çözülmelidir.
            </p>
            <p>
              Platform, kullanıcıların yayınladığı ilanların içeriğinden, doğruluğundan veya kalitesinden 
              sorumlu değildir. Platform üzerinden satın aldığınız ürün veya hizmetlerle ilgili tüm risk size aittir.
            </p>
            <p>
              Platform, yasaların izin verdiği azami ölçüde, dolaylı, özel, arızi veya sonuçsal zararlar 
              da dahil olmak üzere herhangi bir zarardan sorumlu olmayacaktır.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <h2 className="text-2xl font-bold mb-4">7. Değişiklikler ve Fesih</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              Platform, herhangi bir zamanda ve herhangi bir sebeple, önceden bildirimde bulunmaksızın, 
              hizmetlerini geçici veya kalıcı olarak değiştirme, askıya alma veya sonlandırma hakkını saklı tutar.
            </p>
            <p>
              Platform, bu Kullanım Koşullarını ihlal ettiğinizi tespit ederse, hesabınıza erişiminizi kısıtlama, 
              askıya alma veya sonlandırma hakkına sahiptir.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <h2 className="text-2xl font-bold mb-4">8. Uygulanacak Hukuk ve Yargı Yetkisi</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              Bu Kullanım Koşulları, Türkiye Cumhuriyeti yasalarına tabidir. Bu koşullardan kaynaklanan 
              veya bunlarla ilgili herhangi bir anlaşmazlık durumunda, Türkiye Cumhuriyeti mahkemeleri 
              yargı yetkisine sahip olacaktır.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <h2 className="text-2xl font-bold mb-4">9. İletişim</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              Bu Kullanım Koşulları hakkında sorularınız veya geri bildirimleriniz için lütfen 
              destek@ilanplatformu.com e-posta adresi üzerinden veya İletişim sayfamız aracılığıyla bizimle iletişime geçiniz.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            Son güncelleme tarihi: 1 Haziran 2024
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 