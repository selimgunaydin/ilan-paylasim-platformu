// Bu dosya artık kullanılmıyor, tüm R2 işlemleri server/services/r2.ts'e taşındı
import { r2Client, LISTING_BUCKET_URL, LISTING_BUCKET_NAME, MESSAGE_BUCKET_URL, MESSAGE_BUCKET_NAME } from "./r2";

export {
  r2Client,
  LISTING_BUCKET_URL,
  LISTING_BUCKET_NAME,
  MESSAGE_BUCKET_URL,
  MESSAGE_BUCKET_NAME
};

// İzin verilen MIME tipleri
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
];

// Maksimum dosya boyutu (5MB)
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // Resim yükleme limiti 5MB'a yükseltildi

// Dosya tipini kontrol et
export const isValidImageType = (mimeType: string) => {
  return ALLOWED_IMAGE_TYPES.includes(mimeType);
};

// Dosya boyutunu kontrol et
export const isValidFileSize = (size: number) => {
  return size <= MAX_FILE_SIZE;
};