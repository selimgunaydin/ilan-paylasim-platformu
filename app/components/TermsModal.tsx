import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function TermsModal({ children }: { children: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold mb-4">İlan Oluşturma Sözleşmesi</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 text-sm">
          <section>
            <h3 className="font-semibold text-lg mb-3">1. Genel Hükümler</h3>
            <p className="text-gray-700">Bu sözleşme, ilan paylaşım platformumuzda ("Platform") ilan oluşturma sürecinizi düzenleyen şartları içermektedir. İlan oluşturarak bu sözleşmeyi kabul etmiş sayılırsınız.</p>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-3">2. İlan İçerik Kuralları</h3>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li>İlanlar gerçek ve var olan ürün/hizmetler için verilmelidir.</li>
              <li>Yasadışı ürün veya hizmetlerin ilanı yasaktır.</li>
              <li>İlan içerikleri genel ahlak kurallarına uygun olmalıdır.</li>
              <li>Yanıltıcı veya aldatıcı bilgiler içeren ilanlar yayınlanamaz.</li>
              <li>Telif hakkı ihlali içeren içerikler yasaktır.</li>
              <li>İlan başlığı ve açıklaması Türkçe karakterlere uygun olmalıdır.</li>
              <li>İlan görselleri net ve ürünü/hizmeti doğru yansıtmalıdır.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-3">3. İletişim Bilgileri</h3>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li>İletişim bilgileriniz doğru ve güncel olmalıdır.</li>
              <li>Telefon numaranız aktif ve erişilebilir olmalıdır.</li>
              <li>İlan ile ilgili mesajlara makul sürede yanıt vermelisiniz.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-3">4. İlan Yayın Süresi ve Sınırlamalar</h3>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li>İlanlar 30 gün süreyle yayında kalır.</li>
              <li>Bir kullanıcı aynı anda en fazla 10 aktif ilana sahip olabilir.</li>
              <li>Platform, uygunsuz gördüğü ilanları yayından kaldırma hakkını saklı tutar.</li>
              <li>Premium ilanlar öncelikli olarak listelenir ve daha uzun süre yayında kalır.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-3">5. Sorumluluk Reddi</h3>
            <p className="text-gray-700">Platform, kullanıcılar arasındaki alışverişlerde aracı konumundadır. İlan veren ve ilan ile ilgilenen taraflar arasındaki anlaşmazlıklardan Platform sorumlu tutulamaz.</p>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-3">6. Gizlilik ve Veri Kullanımı</h3>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              <li>İlan bilgileriniz ve iletişim detaylarınız gizlilik politikamız kapsamında korunmaktadır.</li>
              <li>Kişisel verileriniz üçüncü taraflarla paylaşılmaz.</li>
              <li>İlanınız yayından kaldırıldığında veya süresi dolduğunda, verileriniz belirli bir süre saklanır.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-3">7. Değişiklikler</h3>
            <p className="text-gray-700">Platform, bu sözleşmeyi önceden haber vermeksizin değiştirme hakkını saklı tutar. Değişiklikler sitede yayınlandığı tarihte yürürlüğe girer.</p>
          </section>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <p className="text-blue-800 font-medium">Not: Bu sözleşmeyi kabul etmeden ilan oluşturamazsınız. İlan oluşturarak bu sözleşmenin tüm maddelerini kabul etmiş sayılırsınız.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 