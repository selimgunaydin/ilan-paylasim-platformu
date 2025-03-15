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
          <DialogTitle className="text-2xl font-bold mb-4">Kullanım Koşulları</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 text-sm">
          <section>
            <h3 className="font-semibold text-lg mb-2">1. Genel Hükümler</h3>
            <p>Bu kullanım koşulları, ilan paylaşım platformumuzu ("Platform") kullanımınızı düzenleyen şartları içermektedir. Platformu kullanarak bu koşulları kabul etmiş sayılırsınız.</p>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-2">2. Üyelik</h3>
            <p>Platform'a üye olabilmek için 18 yaşını doldurmuş olmanız gerekmektedir. Üyelik sırasında verdiğiniz bilgilerin doğru ve güncel olmasından siz sorumlusunuz.</p>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-2">3. İlan Kuralları</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>İlanlar gerçek ve var olan ürün/hizmetler için verilmelidir.</li>
              <li>Yasadışı ürün veya hizmetlerin ilanı yasaktır.</li>
              <li>İlan içerikleri genel ahlak kurallarına uygun olmalıdır.</li>
              <li>Yanıltıcı veya aldatıcı bilgiler içeren ilanlar yayınlanamaz.</li>
              <li>Telif hakkı ihlali içeren içerikler yasaktır.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-2">4. Sorumluluk Reddi</h3>
            <p>Platform, kullanıcılar arasındaki alışverişlerde aracı konumundadır. İlan veren ve ilan ile ilgilenen taraflar arasındaki anlaşmazlıklardan Platform sorumlu tutulamaz.</p>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-2">5. İlan Yayın Süresi ve Sınırlamalar</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>İlanlar 30 gün süreyle yayında kalır.</li>
              <li>Bir kullanıcı aynı anda en fazla 10 aktif ilana sahip olabilir.</li>
              <li>Platform, uygunsuz gördüğü ilanları yayından kaldırma hakkını saklı tutar.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-2">6. Gizlilik</h3>
            <p>Kullanıcı bilgileriniz gizlilik politikamız kapsamında korunmaktadır. Kişisel verileriniz üçüncü taraflarla paylaşılmaz.</p>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-2">7. Değişiklikler</h3>
            <p>Platform, bu kullanım koşullarını önceden haber vermeksizin değiştirme hakkını saklı tutar. Değişiklikler sitede yayınlandığı tarihte yürürlüğe girer.</p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
} 