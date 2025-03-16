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

export function generateVerificationEmail(email: string, token: string): EmailOptions {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? process.env.APP_URL || 'https://yourdomain.com'
    : 'http://localhost:3000';

  console.log('Generating verification email with base URL:', baseUrl);

  const verificationLink = `${baseUrl}/verify-email?token=${token}`;

  const text = `
    Email Adresinizi Doğrulayın

    Merhaba,

    Hesabınızı doğrulamak için aşağıdaki bağlantıya tıklayın:
    ${verificationLink}

    Bu bağlantı 24 saat boyunca geçerlidir.

    Eğer bu hesabı siz oluşturmadıysanız, bu emaili görmezden gelebilirsiniz.
  `;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Email Doğrulama</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c3e50; margin-bottom: 20px;">Email Adresinizi Doğrulayın</h2>
        <p>Merhaba,</p>
        <p>Hesabınızı doğrulamak için aşağıdaki bağlantıya tıklayın:</p>
        <p style="margin: 30px 0;">
          <a href="${verificationLink}" 
             style="background-color: #3498db; 
                    color: white; 
                    padding: 12px 24px; 
                    text-decoration: none; 
                    border-radius: 4px; 
                    display: inline-block;">
            Email Adresimi Doğrula
          </a>
        </p>
        <p>Veya bu bağlantıyı tarayıcınızda açın:</p>
        <p style="word-break: break-all; color: #3498db;">
          ${verificationLink}
        </p>
        <p>Bu bağlantı 24 saat boyunca geçerlidir.</p>
        <p>Eğer bu hesabı siz oluşturmadıysanız, bu emaili görmezden gelebilirsiniz.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #7f8c8d; font-size: 12px;">
          Bu otomatik olarak gönderilen bir emaildir. Lütfen bu adrese yanıt vermeyiniz.
        </p>
      </div>
    </body>
    </html>
  `;

  return {
    to: email,
    subject: 'Email Adresinizi Doğrulayın',
    text,
    html,
  };
}

export function generatePasswordResetEmail(email: string, token: string): EmailOptions {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? process.env.APP_URL || 'https://yourdomain.com'
    : 'http://localhost:5000';

  const resetLink = `${baseUrl}/reset-password?token=${token}`;

  const text = `
    Şifre Sıfırlama İsteği

    Merhaba,

    Hesabınız için şifre sıfırlama talebinde bulundunuz. Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:
    ${resetLink}

    Bu bağlantı 1 saat boyunca geçerlidir.

    Eğer bu talebi siz yapmadıysanız, bu emaili görmezden gelebilirsiniz.
  `;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Şifre Sıfırlama</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c3e50; margin-bottom: 20px;">Şifre Sıfırlama İsteği</h2>
        <p>Merhaba,</p>
        <p>Hesabınız için şifre sıfırlama talebinde bulundunuz. Şifrenizi sıfırlamak için aşağıdaki düğmeye tıklayın:</p>
        <p style="margin: 30px 0;">
          <a href="${resetLink}" 
             style="background-color: #3498db; 
                    color: white; 
                    padding: 12px 24px; 
                    text-decoration: none; 
                    border-radius: 4px; 
                    display: inline-block;">
            Şifremi Sıfırla
          </a>
        </p>
        <p>Veya bu bağlantıyı tarayıcınızda açın:</p>
        <p style="word-break: break-all; color: #3498db;">
          ${resetLink}
        </p>
        <p>Bu bağlantı 1 saat boyunca geçerlidir.</p>
        <p>Eğer bu talebi siz yapmadıysanız, bu emaili görmezden gelebilirsiniz.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #7f8c8d; font-size: 12px;">
          Bu otomatik olarak gönderilen bir emaildir. Lütfen bu adrese yanıt vermeyiniz.
        </p>
      </div>
    </body>
    </html>
  `;

  return {
    to: email,
    subject: 'Şifre Sıfırlama İsteği',
    text,
    html,
  };
}