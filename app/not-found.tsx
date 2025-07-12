'use client';

import { AlertCircle, Home } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <>
      <style jsx>{`
        .home-button:hover {
          background-color: #1d4ed8 !important;
        }
        .contact-link:hover {
          text-decoration: underline !important;
        }
      `}</style>
      <div style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '32rem',
          margin: '0 1rem',
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          padding: '2rem 1.5rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '1.5rem',
            gap: '0.75rem'
          }}>
            <AlertCircle style={{ height: '2.5rem', width: '2.5rem', color: '#dc2626' }} />
            <h1 style={{
              fontSize: '1.875rem',
              fontWeight: 'bold',
              color: '#111827',
              margin: 0
            }}>404 - Sayfa Bulunamadı</h1>
          </div>

          <p style={{
            marginTop: '0.5rem',
            fontSize: '1rem',
            color: '#374151',
            lineHeight: '1.5'
          }}>
            Üzgünüz, aradığınız ilan veya sayfa bulunamadı. Yanlış bir adres girmiş olabilirsiniz ya da bu sayfa kaldırılmış olabilir.
          </p>

          <div style={{
            marginTop: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <button 
                className="home-button"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  transition: 'background-color 0.2s'
                }}
              >
                <Home style={{ height: '1.25rem', width: '1.25rem' }} />
                Anasayfaya Dön
              </button>
            </Link>
            <p style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              textAlign: 'center',
              margin: 0
            }}>
              Hala sorun yaşıyorsanız, <a href="/iletisim" className="contact-link" style={{ color: '#2563eb', textDecoration: 'underline' }}>destek ekibimizle iletişime geçin</a>.
            </p>
          </div>
        </div>
      </div>
    </>
  );
} 