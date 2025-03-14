import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

if (!process.env.SENDGRID_FROM_EMAIL) {
  throw new Error("SENDGRID_FROM_EMAIL environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

interface EmailParams {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    console.log('Attempting to send email:', {
      to: params.to,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: params.subject
    });

    const msg = {
      to: params.to,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL!,
        name: 'Creaati'
      },
      subject: params.subject,
      text: params.text || '',
      html: params.html || params.text || '',
      mailSettings: {
        sandboxMode: {
          enable: false
        }
      }
    };

    await mailService.send(msg);
    console.log('Email sent successfully to:', params.to);
    return true;
  } catch (error: any) {
    console.error('SendGrid email error:', error);
    if (error.response) {
      console.error('SendGrid error details:', {
        statusCode: error.response.statusCode,
        body: error.response.body,
        headers: error.response.headers
      });
    }
    console.error('Failed email details:', {
      to: params.to,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: params.subject
    });
    return false;
  }
}

export function generateVerificationEmail(email: string, token: string): EmailParams {
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

export function generatePasswordResetEmail(email: string, token: string): EmailParams {
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