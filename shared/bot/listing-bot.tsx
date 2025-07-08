// ES module uyumlu importlar
import dotenv from 'dotenv';
dotenv.config();
import { chromium } from 'playwright';
import axios from 'axios';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SITE_URL = process.env.SITE_URL || 'http://localhost:3000';

// Ayarlanabilir parametreler
const ILAN_SAYISI = 1; // Kaç ilan eklenecek
const BEKLEME_SURESI_MS = { min: 5000, max: 15000 }; // 5-15 sn arası - spam, rare limit koruması

// Kategorileri API'den çek
async function fetchCategories() {
    const res = await axios.get(`${SITE_URL}/api/categories/all`);
    return res.data;
}

// Şehirleri sabit liste olarak döndür
async function fetchCities() {
    return [
        "Adana", "Ankara", "İstanbul", "İzmir", "Bursa",
        "Antalya", "Konya", "Kayseri", "Mersin", "Eskişehir"
    ];
}

// Gemini API ile kategoriye uygun başlık, açıklama ve contact person oluştur
async function getGeminiListing(categoryName: string) {
    const prompt = `Aşağıdaki kategoriye uygun, sade ve gerçekçi bir Türkçe ilan üret. Lütfen sadece metin ver; **kalın**, _italik_, markdown veya HTML biçimlendirme kullanma.\n
Format şu şekilde olmalı:\n
Başlık: [Sade, dikkat çekici bir başlık. Kalınlık, yıldız, markdown kullanma.]\n
Açıklama: [Paragraflar halinde detaylı ve çok samimi açıklama. Biçimlendirme karakteri kullanma. Satış, hizmet, vs. ise ona uygun içerik üret.]\n
Contact Person: [Sadece bir gerçekçi ve genelde Kadın Türkçe isim ve soyisim. Unvan, telefon numarası, e-posta yazma.]\n
\n
Kategori: ${categoryName}`;

    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`,
            { contents: [{ parts: [{ text: prompt }] }] },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-goog-api-key': GEMINI_API_KEY,
                },
            }
        );
        // Gemini cevabını tam yazdır
        const content = response.data.candidates[0].content;
        const parts = content.parts; // dizi
        const fullText = parts.map((p: any) => p.text).join('');
        console.log('Gemini API response metni:', fullText);
        if (!fullText) throw new Error("API'den geçerli metin gelmedi.");

        const baslik = fullText.match(/Başlık:\s*(.*)/)?.[1]?.trim() || "Başlık";
        const aciklama = fullText.match(/Açıklama:\s*([\s\S]*?)Contact Person:/)?.[1]?.trim() || "Açıklama";
        const contactPerson = fullText.match(/Contact Person:\s*(.*)/)?.[1]?.trim() || "Ahmet Yılmaz";

        return { baslik, aciklama, contactPerson };

    } catch (error) {
        console.error("Gemini API hatası:", error);
        return {
            baslik: "Başlık",
            aciklama: "Açıklama",
            contactPerson: "Ahmet Yılmaz",
        };
    }
}

// Rastgele sayı üretici
function randomBetween(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function runBot() {
    const categories = await fetchCategories();
    const cities = await fetchCities();

    const browser = await chromium.launch({ headless: false, slowMo: 100 });
    const context = await browser.newContext({ storageState: 'auth.json' });
    const page = await context.newPage();

    for (let i = 0; i < ILAN_SAYISI; i++) {
        try {
            console.log(`\n[${i + 1}. İlan] İlan ekleme sayfasına gidiliyor...`);
            await page.goto(`${SITE_URL}/ilan-ekle`, { waitUntil: 'networkidle' });
            console.log('Şu anki URL:', page.url());

            // Form hazır mı kontrol et
            await page.waitForSelector('input[name="title"]', { timeout: 10000 });
            await page.waitForSelector('button:has-text("Kategori seçin")', { timeout: 10000 });

            // Rastgele alt kategori seç
            const allSubCategories = categories.flatMap((cat: any) => cat.children || []);
            const subCategory = allSubCategories[randomBetween(0, allSubCategories.length - 1)];
            const categoryName = subCategory?.name || "Diğer";
            const categoryId = subCategory?.id?.toString();

            // Kategori seçeneği için seçici
            const kategoriOptionSelector = `div[role="option"][data-value="${categoryId}"]`;

            // Kategori dropdown'u aç
            await page.click('button:has-text("Kategori seçin")');
            await page.waitForSelector('div[role="option"]', { timeout: 10000 });
            await page.waitForTimeout(1000);

            // Kategoriyi ID ile seçmeye çalış
            const kategoriOption = await page.$(kategoriOptionSelector);
            if (kategoriOption) {
                await kategoriOption.click();
            } else {
                console.warn(`⚠️ Kategori ID ${categoryId} bulunamadı, isimle seçim deneniyor...`);
                await page.click(`div[role="option"]:has-text("${categoryName}")`);
            }

            // Gemini'den veri al
            const { baslik, aciklama, contactPerson } = await getGeminiListing(categoryName);

            // Başlık doldur
            await page.fill('input[name="title"]', baslik);

            // Açıklama temizleme
            const cleanedDescription = aciklama.replace(/\*\*/g, '').trim();

            // Açıklama (contenteditable alan) - doğrudan içeriği atıyoruz
            await page.evaluate((text) => {
                const editor = document.querySelector('[contenteditable="true"]');
                if (editor) {
                    (editor as HTMLElement).innerText = text;
                }
            }, cleanedDescription);

            // Şehir seç
            const city = cities[randomBetween(0, cities.length - 1)];
            await page.click('button:has-text("Şehir seçin")');
            await page.waitForTimeout(500);
            await page.click(`div[role="option"]:has-text("${city}")`);

            // Contact Person doldur
            await page.fill('input[name="contactPerson"]', contactPerson);

            // Premium seçeneği olan radio butonunu seç (aria-checked="false" olanı bulup tıkla)
            await page.locator('[role="radio"][aria-checked="false"]').click();


            // Sözleşme checkbox'ını kontrol et ve işaretle
            const checkbox = await page.$('button[role="checkbox"]');
            if (checkbox) {
                const checked = await checkbox.getAttribute('aria-checked');
                if (checked === 'false') {
                    await checkbox.scrollIntoViewIfNeeded();
                    await checkbox.click();
                    console.log('Sözleşme checkbox işaretlendi.');
                } else {
                    console.log('Sözleşme checkbox zaten işaretli.');
                }
            } else {
                console.warn('Checkbox bulunamadı veya tıklanamadı.');
            }

            // Submit butonunu kontrol et
            // const submitButton = await page.$('button[type="submit"]');
            // Submit butonunu seç (buton metni bazlı)
            const submitButton = await page.$('button:has-text("İlan Oluştur")') || await page.$('button[type="submit"]');
            if (!submitButton) {
                throw new Error('Submit butonu bulunamadı!');
            }
            // if (!submitButton) {
            //     throw new Error('Submit butonu bulunamadı!');
            // }
            const isDisabled = await submitButton.getAttribute('disabled');
            if (isDisabled !== null) {
                throw new Error('Submit butonu devre dışı bırakılmış!');
            }

            // Submit et
            await submitButton.click();

            // Submit sonrası bekleme ve başarı mesajını kontrol (örnek olarak)
            try {
                await page.waitForSelector('.success-message, .ilan-success', { timeout: 10000 });
                console.log(`[${i + 1}. İlan] İlan eklendi!`);
            } catch {
                console.warn(`[${i + 1}. İlan] Başarı mesajı bulunamadı, sayfa durumunu kontrol et.`);
            }

            // Başarı mesajı veya yönlendirme için bekle
            await page.waitForTimeout(8000);

            console.log(`[${i + 1}. İlan] İlan eklendi!`);

            // Spam koruması için random bekle
            const bekle = randomBetween(BEKLEME_SURESI_MS.min, BEKLEME_SURESI_MS.max);
            console.log(`[${i + 1}. İlan] Sonraki ilana kadar ${Math.round(bekle / 1000)} sn bekleniyor...`);
            await page.waitForTimeout(bekle);

        } catch (err) {
            console.error(`[${i + 1}. İlan] Bir hata oluştu:`, err);
        }
    }

    await browser.close();
    console.log('Tüm ilanlar eklendi, bot kapatıldı.');
}

runBot();
