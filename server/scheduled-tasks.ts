import { deactivateExpiredListings, checkExpirationWarnings } from "./utils/expire-listings";

// Her gün çalışacak kontrol fonksiyonu
export async function runDailyTasks() {
  try {
    // Süresi dolan ilanları kontrol et ve pasif yap
    await deactivateExpiredListings();

    // Süresi yaklaşan ilanlar için uyarı gönder
    await checkExpirationWarnings();
  } catch (error) {
    console.error("Zamanlanmış görev hatası:", error);
  }
}