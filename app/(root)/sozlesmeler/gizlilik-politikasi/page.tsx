import React from 'react';
import { Card, CardContent } from '@app/components/ui/card';

export const metadata = {
  title: 'Gizlilik Politikası',
  description: 'İlan Platformu gizlilik politikası ve kişisel verilerin korunması hakkında bilgiler.',
};

export default function GizlilikPolitikasiPage() {
  return (
    <div className="max-w-7xl mx-auto py-8 px-4 md:py-12">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">Gizlilik Politikası</h1>
      <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
        İlan Platformu olarak kişisel verilerinizin korunması en önemli önceliklerimizden biridir. 
        Bu politika, verilerinizin nasıl toplandığı, kullanıldığı ve korunduğunu açıklamaktadır.
      </p>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <h2 className="text-2xl font-bold mb-4">1. Toplanan Bilgiler</h2>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Platformumuz aşağıdaki türde kişisel verileri toplayabilir:
            </p>
            <h3 className="text-xl font-semibold">1.1. Doğrudan Sağladığınız Bilgiler</h3>
            <ul className="list-disc pl-6 text-muted-foreground">
              <li>Kayıt ve profil bilgileri: İsim, e-posta adresi, telefon numarası, adres</li>
              <li>İlan bilgileri: İlanınızda paylaştığınız içerik, fotoğraflar ve açıklamalar</li>
              <li>İletişim bilgileri: Mesajlaşma içeriği, iletişim formları aracılığıyla gönderdiğiniz bilgiler</li>
              <li>Ödeme bilgileri: Satın aldığınız hizmetler için ödeme işlemi sırasında sağladığınız bilgiler</li>
            </ul>
            <h3 className="text-xl font-semibold">1.2. Otomatik Olarak Toplanan Bilgiler</h3>
            <ul className="list-disc pl-6 text-muted-foreground">
              <li>Kullanım verileri: Platformumuzda gezinme, etkileşim ve tıklama verileri</li>
              <li>Cihaz bilgileri: IP adresi, tarayıcı türü, işletim sistemi, cihaz türü</li>
              <li>Çerezler ve benzer teknolojiler aracılığıyla toplanan veriler</li>
              <li>Konum bilgileri: Genel konum veya kullanıcının izin vermesi durumunda hassas konum bilgileri</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <h2 className="text-2xl font-bold mb-4">2. Bilgilerin Kullanımı</h2>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Topladığımız bilgileri aşağıdaki amaçlarla kullanıyoruz:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground">
              <li>Platformun temel işlevlerini sağlamak ve hizmetlerimizi sunmak</li>
              <li>Hesabınızı yönetmek ve güvenliğini sağlamak</li>
              <li>İlanlarınızı yayınlamak ve yönetmek</li>
              <li>Kullanıcılar arasında iletişimi sağlamak</li>
              <li>Ödeme işlemlerini gerçekleştirmek</li>
              <li>Teknik sorunları tespit etmek ve çözmek</li>
              <li>Platformumuzu geliştirmek ve kullanıcı deneyimini iyileştirmek</li>
              <li>Kişiselleştirilmiş içerik ve öneriler sunmak</li>
              <li>Pazarlama ve tanıtım faaliyetleri yürütmek (izin verdiğiniz takdirde)</li>
              <li>Sahtekarlık ve kötüye kullanımları önlemek</li>
              <li>Yasal yükümlülüklerimizi yerine getirmek</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <h2 className="text-2xl font-bold mb-4">3. Bilgilerin Paylaşımı</h2>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Kişisel verilerinizi aşağıdaki durumlarda ve taraflarla paylaşabiliriz:
            </p>
            <h3 className="text-xl font-semibold">3.1. Diğer Kullanıcılarla</h3>
            <p className="text-muted-foreground">
              İlan verdiğinizde, ilanınızda paylaştığınız bilgiler ve profil bilgilerinizin 
              bir kısmı diğer kullanıcılar tarafından görüntülenebilir.
            </p>
            <h3 className="text-xl font-semibold">3.2. Hizmet Sağlayıcılarımızla</h3>
            <p className="text-muted-foreground">
              Platformumuzun işleyişi için gerekli hizmetleri sağlayan üçüncü taraflarla (ödeme işlemcileri, 
              sunucu sağlayıcıları, iletişim hizmetleri vb.) verilerinizi paylaşabiliriz.
            </p>
            <h3 className="text-xl font-semibold">3.3. Yasal Gereklilikler Nedeniyle</h3>
            <p className="text-muted-foreground">
              Yasal bir yükümlülüğü yerine getirmek, platformun haklarını veya güvenliğini korumak, 
              yasadışı faaliyetleri önlemek amacıyla gerektiğinde resmi makamlarla bilgi paylaşabiliriz.
            </p>
            <h3 className="text-xl font-semibold">3.4. İş Ortaklarımızla</h3>
            <p className="text-muted-foreground">
              Pazarlama, analiz ve diğer iş geliştirme faaliyetleri için iş ortaklarımızla 
              toplu ve anonim hale getirilmiş veriler paylaşabiliriz.
            </p>
            <p className="text-muted-foreground font-medium mt-4">
              Kişisel verilerinizi satmıyor veya kiralamıyoruz.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <h2 className="text-2xl font-bold mb-4">4. Veri Güvenliği</h2>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Kişisel verilerinizin güvenliğini sağlamak için aşağıdaki önlemleri alıyoruz:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground">
              <li>Verilerinizi korumak için endüstri standardı SSL şifrelemesi kullanıyoruz</li>
              <li>Düzenli güvenlik değerlendirmeleri ve testleri yapıyoruz</li>
              <li>Yetkisiz erişimleri önlemek için fiziksel ve elektronik güvenlik önlemleri uyguluyoruz</li>
              <li>Çalışanlarımız gizlilik ve veri güvenliği konusunda eğitilmektedir</li>
              <li>Veri ihlali durumlarına karşı acil müdahale planlarımız bulunmaktadır</li>
            </ul>
            <p className="text-muted-foreground">
              İnternet üzerinden veri iletiminin %100 güvenli olmadığını belirtmek isteriz. 
              Kişisel verilerinizi korumak için tüm önlemleri alsak da, mutlak güvenlik garantisi veremiyoruz.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <h2 className="text-2xl font-bold mb-4">5. Çerezler ve Benzer Teknolojiler</h2>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Platformumuzda çerezler, pikseller, web işaretçileri ve yerel depolama gibi teknolojileri 
              kullanıyoruz. Bu teknolojiler aşağıdaki amaçlarla kullanılmaktadır:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground">
              <li>Temel platform işlevlerini sağlamak (oturum yönetimi, tercihlerinizin hatırlanması vb.)</li>
              <li>Kullanım istatistiklerini ve trafik verilerini toplamak</li>
              <li>Platformumuzun performansını ve kullanım deneyimini iyileştirmek</li>
              <li>Kişiselleştirilmiş içerik ve reklamlar sunmak (izin verdiğiniz takdirde)</li>
            </ul>
            <p className="text-muted-foreground">
              Çoğu web tarayıcısı, çerezleri engellemenize veya çerez kullanımı hakkında 
              bildirim almanıza olanak tanır. Çerezleri devre dışı bırakmayı seçerseniz, 
              platformumuzun bazı özellikleri düzgün çalışmayabilir.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <h2 className="text-2xl font-bold mb-4">6. Haklarınız</h2>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Kişisel verilerinizle ilgili aşağıdaki haklara sahipsiniz:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground">
              <li>Verilerinize erişim ve verilerinizin bir kopyasını alma hakkı</li>
              <li>Yanlış veya eksik bilgilerin düzeltilmesini isteme hakkı</li>
              <li>Belirli durumlarda verilerinizin silinmesini isteme hakkı</li>
              <li>Verilerinizin işlenmesini kısıtlama hakkı</li>
              <li>Verilerinizin başka bir hizmet sağlayıcıya aktarılmasını isteme hakkı</li>
              <li>Pazarlama amaçlı iletişime itiraz etme hakkı</li>
              <li>Otomatik karar verme ve profilleme süreçlerine itiraz etme hakkı</li>
            </ul>
            <p className="text-muted-foreground">
              Bu haklarınızı kullanmak için hesap ayarlarınızı ziyaret edebilir veya 
              destek@ilanplatformu.com adresine e-posta gönderebilirsiniz.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <h2 className="text-2xl font-bold mb-4">7. Çocukların Gizliliği</h2>
          <p className="text-muted-foreground">
            Platformumuz 18 yaş altındaki kişilere yönelik değildir ve bilerek 18 yaş altındaki 
            kişilerden kişisel veri toplamayız. 18 yaşından küçük bir kişiden yanlışlıkla kişisel veri 
            topladığımızı fark edersek, bu verileri derhal silmek için adımlar atacağız.
          </p>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <h2 className="text-2xl font-bold mb-4">8. Politika Değişiklikleri</h2>
          <p className="text-muted-foreground">
            Bu Gizlilik Politikası'nı zaman zaman güncelleyebiliriz. Önemli değişiklikler olması 
            durumunda, sizi e-posta yoluyla veya platformumuzda bir bildirim yayınlayarak bilgilendireceğiz. 
            Platformumuzu kullanmaya devam etmeniz, güncellenmiş politikayı kabul ettiğiniz anlamına gelecektir.
          </p>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <h2 className="text-2xl font-bold mb-4">9. İletişim</h2>
          <p className="text-muted-foreground">
            Bu Gizlilik Politikası veya kişisel verilerinizin işlenmesiyle ilgili sorularınız için 
            lütfen destek@ilanplatformu.com adresinden veya "İletişim" sayfamız aracılığıyla bizimle iletişime geçiniz.
          </p>
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