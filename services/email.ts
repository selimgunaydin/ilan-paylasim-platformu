import nodemailer from 'nodemailer';
import { config } from '../config';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

// Email gönderme fonksiyonu
export async function sendEmail({ to, subject, text, html }: EmailOptions) {
  const transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth: {
      user: config.email.user,
      pass: config.email.password,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"${config.email.fromName}" <${config.email.fromAddress}>`,
      to,
      subject,
      text,
      html: html || text,
    });

    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
}

// Doğrulama e-postası içeriği oluşturma
export function generateVerificationEmail(username: string, verificationToken: string): EmailOptions {
  const verificationLink = `${config.appUrl}/verify-email?token=${verificationToken}`;
  
  const subject = 'E-posta Adresinizi Doğrulayın';
  const text = `
    Sayın ${username},

    E-posta adresinizi doğrulamak için aşağıdaki bağlantıya tıklayın:
    ${verificationLink}

    Bu bağlantı 24 saat süreyle geçerlidir.

    Eğer bu işlemi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.

    Saygılarımızla,
    İlan Yönetim Sistemi
  `;

  return {
    to: '', // Bu değer kullanım sırasında doldurulacak
    subject,
    text,
  };
} 