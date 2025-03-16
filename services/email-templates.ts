import { config } from '../config';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

// Email template for when a listing is deactivated by admin
export function generateListingDeactivatedEmail(username: string, listingTitle: string): EmailOptions {
  const subject = 'İlanınız Pasif Duruma Alındı';
  const text = `
    Sayın ${username},

    "${listingTitle}" başlıklı ilanınız platformumuzun yöneticileri tarafından pasif duruma alınmıştır.

    Bu işlem genellikle ilan içeriğinin platformumuzun kurallarına uygun olmadığı durumlarda gerçekleştirilir.

    Eğer bu kararla ilgili itirazınız varsa, lütfen destek ekibimizle iletişime geçiniz.

    Saygılarımızla,
    İlan Yönetim Sistemi
  `;

  return {
    to: '', // Kullanım sırasında doldurulacak
    subject,
    text,
  };
}

// Email template for when a listing is deleted by admin
export function generateListingDeletedEmail(username: string, listingTitle: string): EmailOptions {
  const subject = 'İlanınız Silindi';
  const text = `
    Sayın ${username},

    "${listingTitle}" başlıklı ilanınız platformumuzun yöneticileri tarafından silinmiştir.

    Bu işlem genellikle ilan içeriğinin platformumuzun kullanım koşullarını veya topluluk standartlarını ihlal ettiği durumlarda gerçekleştirilir.

    Eğer bu kararla ilgili itirazınız varsa, lütfen destek ekibimizle iletişime geçiniz.

    Saygılarımızla,
    İlan Yönetim Sistemi
  `;

  return {
    to: '', // Kullanım sırasında doldurulacak
    subject,
    text,
  };
}

// Email template for when a user is banned
export function generateUserBannedEmail(username: string): EmailOptions {
  const subject = 'Hesabınız Askıya Alındı';
  const text = `
    Sayın ${username},

    Platformumuzdaki hesabınız yöneticilerimiz tarafından askıya alınmıştır.

    Bu işlem genellikle platform kurallarının veya kullanım koşullarının ihlali durumunda gerçekleştirilir.

    Hesabınızın askıya alınmasıyla ilgili daha fazla bilgi almak veya itiraz etmek isterseniz, lütfen destek ekibimizle iletişime geçiniz.

    Saygılarımızla,
    İlan Yönetim Sistemi
  `;

  return {
    to: '', // Kullanım sırasında doldurulacak
    subject,
    text,
  };
}

// Email template for when a pending listing is rejected
export function generateListingRejectedEmail(username: string, listingTitle: string): EmailOptions {
  const subject = 'İlanınız Reddedildi';
  const text = `
    Sayın ${username},

    "${listingTitle}" başlıklı ilanınız, platformumuzun yöneticileri tarafından incelenmiş ve onaylanmamıştır.

    İlanınızın reddedilme nedeni, içeriğin platformumuzun standartlarına veya politikalarına uygun olmaması olabilir.

    İlanınızı düzenleyerek tekrar onaya sunabilirsiniz. Lütfen içeriğinizin platformumuzun kurallarına uygun olduğundan emin olunuz.

    Eğer bu kararla ilgili itirazınız varsa, lütfen destek ekibimizle iletişime geçiniz.

    Saygılarımızla,
    İlan Yönetim Sistemi
  `;

  return {
    to: '', // Kullanım sırasında doldurulacak
    subject,
    text,
  };
}

// Email template for when a listing is approved
export function generateListingApprovedEmail(username: string, listingTitle: string): EmailOptions {
  const subject = 'İlanınız Onaylandı';
  const text = `
    Sayın ${username},

    "${listingTitle}" başlıklı ilanınız platformumuzun yöneticileri tarafından incelenmiş ve onaylanmıştır.

    İlanınız artık platformumuzda tüm kullanıcılar tarafından görüntülenebilir durumdadır.

    İlanınızın performansını ve gelen mesajları takip etmek için hesabınızı düzenli olarak kontrol etmenizi öneririz.

    Saygılarımızla,
    İlan Yönetim Sistemi
  `;

  return {
    to: '', // Kullanım sırasında doldurulacak
    subject,
    text,
  };
}

// Email template for when a user account is reactivated
export function generateUserReactivatedEmail(username: string): EmailOptions {
  const subject = 'Hesabınız Yeniden Aktifleştirildi';
  const text = `
    Sayın ${username},

    Platformumuzdaki hesabınız yöneticilerimiz tarafından yeniden aktifleştirilmiştir.

    Artık platform üzerindeki tüm özelliklerimize erişebilir, ilanlarınızı yönetebilir ve yeni ilanlar ekleyebilirsiniz.

    Platformumuzu kullanmaya devam ettiğiniz için teşekkür ederiz.

    Saygılarımızla,
    İlan Yönetim Sistemi
  `;

  return {
    to: '', // Kullanım sırasında doldurulacak
    subject,
    text,
  };
} 