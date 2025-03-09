import DOMPurify from 'isomorphic-dompurify';

export function sanitizeEmail(email: string | null | undefined): string {
  if (!email) return '';

  // Email için özel sanitizasyon
  const sanitized = DOMPurify.sanitize(email, {
    ALLOWED_TAGS: [], // HTML tag'lerine izin verme
    ALLOWED_ATTR: [], // HTML özelliklerine izin verme
  });

  // Email için sadece temel güvenlik temizliği yap
  return sanitized
    .replace(/<[^>]*>/g, '') // HTML taglerini kaldır
    .replace(/javascript:/gi, '') // javascript: protokolünü kaldır
    .replace(/data:/gi, '') // data: URI şemalarını kaldır
    .replace(/\s+/g, '') // Boşlukları kaldır
    .trim();
}

export function sanitizeInput(input: string | null | undefined): string {
  if (!input) return '';

  // HTML ve JavaScript kodlarını temizle
  const sanitized = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // Hiçbir HTML tag'ine izin verme
    ALLOWED_ATTR: [], // Hiçbir HTML attribute'una izin verme
    FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'object', 'embed', 'link'],
    FORBID_ATTR: ['onload', 'onerror', 'onclick', 'onmouseover', 'style'],
  });

  // SQL injection karakterlerini daha sıkı escape et
  const sqlSanitized = sanitized
    .replace(/['"`]/g, '') // Tüm tırnak işaretlerini kaldır
    .replace(/\\/g, '')    // Tüm ters slash işaretlerini kaldır
    .replace(/;/g, '')     // SQL komut ayracını kaldır
    .replace(/--/g, '')    // SQL yorum satırını kaldır
    .replace(/\/\*[\s\S]*?\*\//g, '')  // Çok satırlı SQL yorumlarını kaldır
    .replace(/\/\//g, '')  // Tek satırlı yorumları kaldır
    .replace(/\|\|/g, '')  // Bitwise OR operatörünü kaldır
    .replace(/&&/g, '')    // AND operatörünü kaldır
    .replace(/\b(OR|AND|UNION|SELECT|DROP|DELETE|INSERT|UPDATE|CREATE|ALTER|TRUNCATE|EXEC|EXECUTE)\b/gi, '') // SQL anahtar kelimelerini kaldır
    .replace(/\bFROM\b/gi, '') // FROM anahtar kelimesini kaldır
    .replace(/\bWHERE\b/gi, '') // WHERE anahtar kelimesini kaldır
    .replace(/\bTABLE\b/gi, '') // TABLE anahtar kelimesini kaldır
    .replace(/\bLIKE\b/gi, '') // LIKE anahtar kelimesini kaldır
    .replace(/\$where\b/gi, '') // MongoDB $where operatörünü kaldır
    .replace(/\$regex\b/gi, '') // MongoDB $regex operatörünü kaldır
    .replace(/\*/g, '') // Yıldız karakterini kaldır
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Kontrol karakterlerini kaldır
    .trim();

  // İkinci bir kontrol katmanı - alfanumerik, çoklu dil karakterleri ve bazı özel karakterlere izin ver
  // Unicode karakter aralıkları:
  // \p{L} - Tüm Unicode harfleri (Latin, Kiril, Arapça, vb.)
  // \p{N} - Tüm sayılar
  // \p{P} - Noktalama işaretleri
  // \p{Z} - Boşluk karakterleri
  return sqlSanitized.replace(/[^\p{L}\p{N}\p{Z}\p{P}.,!?#$%^&*()_+-]/gu, '');
}

export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Email alanı için özel sanitizasyon
      if (key.toLowerCase().includes('email')) {
        sanitized[key] = sanitizeEmail(value);
      } else {
        sanitized[key] = sanitizeInput(value);
      }
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}