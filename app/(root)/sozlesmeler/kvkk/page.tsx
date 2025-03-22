import React from 'react';
import { Card, CardContent } from '@app/components/ui/card';

export const metadata = {
  title: 'KVKK Aydınlatma Metni',
  description: 'İlan Platformu KVKK kapsamında kişisel verilerin işlenmesine ilişkin aydınlatma metni.',
};

export default function KVKKPage() {
  return (
    <div className="max-w-7xl mx-auto py-8 px-4 md:py-12">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">KVKK Aydınlatma Metni</h1>
      <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
        6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında, kişisel verilerinizin 
        işlenmesine ilişkin İlan Platformu olarak sizi bilgilendirmek istiyoruz.
      </p>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <h2 className="text-2xl font-bold mb-4">1. Veri Sorumlusu</h2>
          <p className="text-muted-foreground">
            6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, İlan Platformu 
            olarak, veri sorumlusu sıfatıyla, kişisel verilerinizi aşağıda açıklanan amaçlar 
            kapsamında hukuka ve dürüstlük kurallarına uygun bir şekilde işleyebilecek, 
            kaydedebilecek, saklayabilecek, sınıflandırabilecek, güncelleyebilecek ve mevzuatın 
            izin verdiği hallerde üçüncü kişilere açıklayabilecek/aktarabilecektir.
          </p>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <h2 className="text-2xl font-bold mb-4">2. Kişisel Verilerinizin İşlenme Amacı</h2>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Kişisel verileriniz, platformumuz tarafından sağlanan hizmetlerden faydalanabilmeniz 
              amacıyla KVKK'ya uygun olarak işlenmektedir. Kişisel verilerinizin işlenme amaçları 
              aşağıdaki gibidir:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground">
              <li>Üyelik işlemlerinizin gerçekleştirilmesi ve hesabınızın yönetilmesi</li>
              <li>İlan verme, ilan arama ve görüntüleme hizmetlerinin sunulması</li>
              <li>Kullanıcılar arası iletişimin sağlanması</li>
              <li>İşlem güvenliğinin sağlanması ve risk değerlendirmelerinin yapılması</li>
              <li>Platformda sunulan hizmetlerin iyileştirilmesi ve kişiselleştirilmesi</li>
              <li>Talep ve şikayetlerinizin alınması ve değerlendirilmesi</li>
              <li>Platform güvenliğinin sağlanması ve sahtecilik/dolandırıcılık faaliyetlerinin önlenmesi</li>
              <li>Düzenleyici ve denetleyici kurumlar ile resmi mercilerin talep ve denetimleri doğrultusunda gerekli bilgilerin temini</li>
              <li>İlgili mevzuat gereği saklanması gereken bilgilerinizin muhafazası</li>
              <li>İzniniz doğrultusunda pazarlama ve tanıtım faaliyetlerinin gerçekleştirilmesi</li>
              <li>Hizmetlerimize ilişkin analiz ve istatistiki çalışmaların yapılması</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <h2 className="text-2xl font-bold mb-4">3. İşlenen Kişisel Verileriniz</h2>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Platform tarafından işlenen kişisel verileriniz aşağıdaki kategoriler altında açıklanmıştır:
            </p>
            <h3 className="text-xl font-semibold">Kimlik Bilgileri</h3>
            <p className="text-muted-foreground">
              Ad, soyad, T.C. kimlik numarası (gereken durumlarda), doğum tarihi vb.
            </p>
            
            <h3 className="text-xl font-semibold">İletişim Bilgileri</h3>
            <p className="text-muted-foreground">
              Telefon numarası, e-posta adresi, ikamet adresi, iş adresi vb.
            </p>
            
            <h3 className="text-xl font-semibold">Müşteri İşlem Bilgileri</h3>
            <p className="text-muted-foreground">
              İlan bilgileri, ilan tercihleri, ilan geçmişi, ilan etkileşimleri, mesajlaşma içeriği vb.
            </p>
            
            <h3 className="text-xl font-semibold">İşlem Güvenliği Bilgileri</h3>
            <p className="text-muted-foreground">
              IP adresi, kullanıcı adı, şifre, hesap hareketleri bilgisi, son giriş tarihi, cihaz bilgisi vb.
            </p>
            
            <h3 className="text-xl font-semibold">Finansal Bilgiler</h3>
            <p className="text-muted-foreground">
              Ödeme bilgileri, fatura bilgileri, ödeme geçmişi vb. (ödeme işlemlerinde kullanılması halinde)
            </p>
            
            <h3 className="text-xl font-semibold">Pazarlama Bilgileri</h3>
            <p className="text-muted-foreground">
              İzin vermeniz durumunda, alışkanlık ve beğenileriniz, tercihleriniz vb.
            </p>
            
            <h3 className="text-xl font-semibold">Görsel ve İşitsel Kayıtlar</h3>
            <p className="text-muted-foreground">
              İlanlarınızda kullandığınız fotoğraflar, videolar vb.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <h2 className="text-2xl font-bold mb-4">4. Kişisel Verilerin İşlenme Hukuki Sebepleri</h2>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Kişisel verileriniz, KVKK'nın 5. ve 6. maddelerinde yer alan aşağıdaki hukuki sebeplere dayanarak işlenmektedir:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground">
              <li>Açık rızanızın bulunması</li>
              <li>Kanunlarda açıkça öngörülmesi</li>
              <li>Bir sözleşmenin kurulması veya ifasıyla doğrudan doğruya ilgili olması</li>
              <li>Hukuki yükümlülüğümüzün yerine getirilmesi için zorunlu olması</li>
              <li>Bir hakkın tesisi, kullanılması veya korunması için zorunlu olması</li>
              <li>Temel hak ve özgürlüklerinize zarar vermemek kaydıyla, meşru menfaatlerimiz için veri işlenmesinin zorunlu olması</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <h2 className="text-2xl font-bold mb-4">5. Kişisel Verilerin Aktarılması</h2>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Kişisel verileriniz, yukarıda belirtilen amaçların gerçekleştirilmesi doğrultusunda ve KVKK'nın 8. ve 9. maddelerinde belirtilen şartlara uygun olarak, aşağıdaki alıcı gruplarına aktarılabilecektir:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground">
              <li>İlan Platformu iş ortakları ve hizmet sağlayıcıları</li>
              <li>Platformun teknik altyapı ve hizmetlerinden faydalandığı tedarikçiler</li>
              <li>Ödeme hizmetleri ve finansal işlemlerin gerçekleştirilmesi amacıyla bankalar ve ödeme kuruluşları</li>
              <li>Yetkili kamu kurum ve kuruluşları ile adli merciler</li>
              <li>Hizmet aldığımız danışmanlık şirketleri ve profesyonel danışmanlar</li>
              <li>Açık rızanıza dayalı olarak paylaşılmasına izin verdiğiniz diğer üçüncü kişiler</li>
            </ul>
            <p className="text-muted-foreground">
              Kişisel verileriniz, hizmetlerimizin sağlanabilmesi amacıyla sınırlı olarak ve KVKK'da 
              belirtilen güvenlik önlemleri alınarak yurt dışındaki sunucularda saklanabilir veya 
              yurt dışında bulunan hizmet sağlayıcılarımızla paylaşılabilir.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <h2 className="text-2xl font-bold mb-4">6. Kişisel Verilerin Saklanma Süresi</h2>
          <p className="text-muted-foreground">
            Kişisel verileriniz, işlenme amaçlarının gerektirdiği süreler boyunca ve yasal 
            saklama yükümlülüklerimiz kapsamında işlenmekte ve saklanmaktadır. Kişisel verilerinizin 
            işlenme amacı sona erdiğinde ve/veya ilgili mevzuat uyarınca öngörülen saklama süreleri 
            dolduğunda, kişisel verileriniz silinecek, yok edilecek veya anonim hale getirilecektir.
          </p>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <h2 className="text-2xl font-bold mb-4">7. KVKK Kapsamındaki Haklarınız</h2>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              KVKK'nın 11. maddesi uyarınca, kişisel veri sahibi olarak aşağıdaki haklara sahipsiniz:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground">
              <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
              <li>Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme</li>
              <li>Kişisel verilerinizin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme</li>
              <li>Yurt içinde veya yurt dışında kişisel verilerinizin aktarıldığı üçüncü kişileri bilme</li>
              <li>Kişisel verilerinizin eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme</li>
              <li>KVKK'nın 7. maddesinde öngörülen şartlar çerçevesinde kişisel verilerinizin silinmesini veya yok edilmesini isteme</li>
              <li>Kişisel verilerinizin düzeltilmesi, silinmesi ya da yok edilmesi halinde bu işlemlerin kişisel verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme</li>
              <li>İşlenen verilerinizin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme</li>
              <li>Kişisel verilerinizin kanuna aykırı olarak işlenmesi sebebiyle zarara uğramanız hâlinde zararın giderilmesini talep etme</li>
            </ul>
            <p className="text-muted-foreground">
              Bu haklarınızı kullanmak için, destek@ilanplatformu.com adresine e-posta göndererek veya 
              platform üzerindeki iletişim kanalları aracılığıyla talepte bulunabilirsiniz.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <h2 className="text-2xl font-bold mb-4">8. Veri Güvenliği</h2>
          <p className="text-muted-foreground">
            Kişisel verilerinizin güvenliğini sağlamak amacıyla, teknolojik imkânlar ve uygulama 
            maliyetlerini göz önünde bulundurarak her türlü teknik ve idari tedbiri almaktayız. 
            Bu kapsamda, veri kaybı, yetkisiz erişim, veri ifşası gibi risklere karşı uygun güvenlik 
            düzeyini temin etmeye yönelik teknik altyapı ve denetim mekanizmaları oluşturulmuştur.
          </p>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <h2 className="text-2xl font-bold mb-4">9. Çerezler ve Benzeri Teknolojiler</h2>
          <p className="text-muted-foreground">
            Platform, çerezler ve benzer teknolojiler kullanarak kişisel verilerinizi toplamaktadır. 
            Çerezler hakkında detaylı bilgi için "Çerez Politikası" sayfamızı ziyaret edebilirsiniz.
          </p>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <h2 className="text-2xl font-bold mb-4">10. Aydınlatma Metni Güncellemeleri</h2>
          <p className="text-muted-foreground">
            Bu aydınlatma metni, yasal düzenlemeler veya veri işleme faaliyetlerimizdeki değişiklikler 
            doğrultusunda güncellenebilir. Yapılan güncellemeler Platform üzerinden duyurulacak ve 
            güncel metin yayınlanacaktır. Bu nedenle, düzenli olarak aydınlatma metnini kontrol 
            etmenizi öneririz.
          </p>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <h2 className="text-2xl font-bold mb-4">11. İletişim</h2>
          <p className="text-muted-foreground">
            KVKK kapsamındaki talepleriniz veya bu aydınlatma metni hakkında sorularınız için 
            destek@ilanplatformu.com e-posta adresi üzerinden bizimle iletişime geçebilirsiniz.
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