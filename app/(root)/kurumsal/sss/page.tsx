import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@app/components/ui/accordion';
import { Card, CardContent } from '@app/components/ui/card';

export const metadata = {
  title: 'Sıkça Sorulan Sorular',
  description: 'İlan Platformu hakkında sıkça sorulan sorular ve cevapları.',
};

export default function SSSPage() {
  // Sıkça sorulan sorular ve cevapları
  const faqs = [
    {
      category: 'Genel Sorular',
      questions: [
        {
          question: 'İlan Platformu nedir?',
          answer: 'İlan Platformu, kullanıcıların çeşitli kategorilerde ilan paylaşabildiği ve keşfedebildiği online bir platformdur. Amacımız, kullanıcılarımızın ihtiyaçlarını karşılayacak ilanları kolaylıkla bulabilmelerini ve kendi ilanlarını güvenle paylaşabilmelerini sağlamaktır.'
        },
        {
          question: 'İlan Platformu\'nu kullanmak ücretli midir?',
          answer: 'İlan Platformu\'nda standart ilanlar ücretsiz olarak yayınlanabilir. Ancak, ilanlarınızın daha fazla kişiye ulaşmasını sağlamak için ücretli premium ilan seçeneklerimiz de bulunmaktadır. Ayrıca, yüksek üyelik paketlerimiz ile daha fazla özelliğe erişim sağlayabilirsiniz.'
        },
        {
          question: 'Hangi kategorilerde ilan verebilirim?',
          answer: 'İlan Platformu\'nda emlak, araç, iş ilanları, hizmetler, ikinci el eşya gibi çeşitli kategorilerde ilanlar verebilirsiniz. Platformumuz sürekli olarak genişlemekte ve yeni kategoriler eklenmektedir.'
        }
      ]
    },
    {
      category: 'Üyelik ve Hesap',
      questions: [
        {
          question: 'Nasıl üye olabilirim?',
          answer: 'Üye olmak için ana sayfadaki "Giriş / Üyelik" butonuna tıklayarak kayıt formunu doldurabilirsiniz. E-posta adresinizi doğruladıktan sonra hesabınız aktif hale gelecektir.'
        },
        {
          question: 'Şifremi unuttum, ne yapmalıyım?',
          answer: 'Giriş sayfasında bulunan "Şifremi Unuttum" bağlantısına tıklayarak şifre sıfırlama adımlarını takip edebilirsiniz. E-posta adresinize bir şifre sıfırlama bağlantısı gönderilecektir.'
        },
        {
          question: 'Hesabımı nasıl silebilirim?',
          answer: 'Hesabınızı silmek için profil sayfanızdaki ayarlar bölümünden "Hesabımı Sil" seçeneğini kullanabilirsiniz. Bu işlem tüm verilerinizi kalıcı olarak sileceği için dikkatli olmanızı öneririz.'
        }
      ]
    },
    {
      category: 'İlan Verme',
      questions: [
        {
          question: 'Nasıl ilan verebilirim?',
          answer: 'İlan vermek için öncelikle üye olmalısınız. Giriş yaptıktan sonra "Ücretsiz İlan Ver" butonuna tıklayarak ilan formumuzu doldurabilirsiniz. İlanınız onaylandıktan sonra yayına alınacaktır.'
        },
        {
          question: 'İlanım ne kadar sürede yayınlanır?',
          answer: 'Standart ilanlar genellikle 24 saat içinde incelenir ve uygun bulunursa yayınlanır. Premium ilanlar ise daha hızlı bir şekilde incelenerek yayınlanmaktadır.'
        },
        {
          question: 'İlanımı nasıl düzenleyebilirim?',
          answer: 'İlanlarınızı düzenlemek için "İlanlarım" sayfasına giderek düzenlemek istediğiniz ilanı seçebilir ve "Düzenle" butonuna tıklayabilirsiniz. İlanlarınızda yapacağınız değişikliklerden sonra yeniden onay sürecinden geçmesi gerekebilir.'
        },
        {
          question: 'İlanımı nasıl öne çıkarabilirim?',
          answer: 'İlanınızı öne çıkarmak için premium ilan seçeneklerinden birini tercih edebilirsiniz. Premium ilanlar, ana sayfada ve kategori sayfalarında daha üst sıralarda görüntülenir ve daha fazla kullanıcıya ulaşmanızı sağlar.'
        }
      ]
    },
    {
      category: 'Ödeme ve Ücretlendirme',
      questions: [
        {
          question: 'Hangi ödeme yöntemlerini kabul ediyorsunuz?',
          answer: 'Kredi kartı, banka kartı ve online ödeme sistemleri aracılığıyla ödeme yapabilirsiniz. Tüm ödemeleriniz güvenli ödeme altyapımız üzerinden gerçekleştirilmektedir.'
        },
        {
          question: 'Premium ilan ücretleri nedir?',
          answer: 'Premium ilan ücretlerimiz, seçtiğiniz paket ve ilan süresine göre değişiklik göstermektedir. Güncel fiyat bilgilerimize "İlan Ver" sayfasından ulaşabilirsiniz.'
        },
        {
          question: 'İade politikanız nedir?',
          answer: 'Eğer premium hizmetlerden memnun kalmazsanız, satın alma tarihinden itibaren 7 gün içinde iade talebinde bulunabilirsiniz. İade koşullarımız hakkında detaylı bilgiyi "Kullanım Koşulları" sayfamızda bulabilirsiniz.'
        }
      ]
    },
    {
      category: 'Güvenlik ve Gizlilik',
      questions: [
        {
          question: 'Kişisel verilerim nasıl korunuyor?',
          answer: 'Kişisel verileriniz, KVKK ve ilgili mevzuata uygun olarak işlenmekte ve korunmaktadır. Gizlilik politikamız ve kişisel verilerin korunmasına ilişkin detaylı bilgilere "Gizlilik Politikası" ve "KVKK" sayfalarımızdan ulaşabilirsiniz.'
        },
        {
          question: 'Güvenli alışveriş için nelere dikkat etmeliyim?',
          answer: 'Platformumuzda güvenli alışveriş için, tanımadığınız kişilerle yüz yüze görüşmelerinizde halka açık ve güvenli yerleri tercih etmenizi, ödeme işlemlerinde dikkatli olmanızı ve şüpheli durumlarda bize bildirmenizi öneririz.'
        }
      ]
    },
    {
      category: 'İletişim ve Destek',
      questions: [
        {
          question: 'Sorun yaşadığımda kimle iletişime geçebilirim?',
          answer: 'Herhangi bir sorun yaşadığınızda, "İletişim" sayfamız üzerinden bizimle iletişime geçebilir veya destek@ilanplatformu.com adresine e-posta gönderebilirsiniz. Destek ekibimiz size en kısa sürede yardımcı olacaktır.'
        },
        {
          question: 'Bir ilanı nasıl şikayet edebilirim?',
          answer: 'Kurallara uymayan veya şüpheli bir ilan gördüğünüzde, ilgili ilanın detay sayfasındaki "Şikayet Et" butonunu kullanarak bize bildirebilirsiniz. Tüm şikayetler titizlikle incelenmektedir.'
        }
      ]
    }
  ];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 md:py-12">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">Sıkça Sorulan Sorular</h1>
      <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
        İlan Platformu hakkında merak ettiğiniz soruların cevaplarını burada bulabilirsiniz.
      </p>

      <div className="space-y-8">
        {faqs.map((category, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold mb-4">{category.category}</h2>
              <Accordion type="single" collapsible className="w-full">
                {category.questions.map((faq, faqIndex) => (
                  <AccordionItem key={faqIndex} value={`item-${index}-${faqIndex}`}>
                    <AccordionTrigger className="text-left font-semibold">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-muted-foreground">{faq.answer}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 