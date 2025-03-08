import { Express } from 'express';
import { db } from '../../db';
import * as schema from '@shared/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export function registerPaymentRoutes(app: Express): void {
  // PayTR ödeme başlatma endpoint'i
  app.post("/api/payments/create", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Yetkilendirme gerekli" });
    }

    try {
      const listingId = parseInt(req.body.listingId);

      if (isNaN(listingId)) {
        return res.status(400).json({ error: "Geçersiz ilan ID" });
      }

      // İlanı kontrol et
      const [listing] = await db
        .select()
        .from(schema.listings)
        .where(eq(schema.listings.id, listingId));

      if (!listing) {
        return res.status(404).json({ error: "İlan bulunamadı" });
      }

      if (listing.userId !== req.user!.id) {
        return res
          .status(403)
          .json({ error: "Bu ilan için ödeme yapamazsınız" });
      }

      // Test modu için merchant id ve hash değerleri
      const merchant_id = process.env.PAYTR_MERCHANT_ID;
      const merchant_key = process.env.PAYTR_MERCHANT_KEY;
      const merchant_salt = process.env.PAYTR_MERCHANT_SALT;

      if (!merchant_id || !merchant_key || !merchant_salt) {
        console.error("PayTR credentials missing");
        return res
          .status(500)
          .json({ error: "Ödeme sistemi yapılandırması eksik" });
      }

      // Test modu için sabit tutar: 1 TL
      const amount = "100"; // 1.00 TL

      // Benzersiz sipariş numarası oluştur
      const merchant_oid = `TST_${Date.now()}_${listingId}`;

      // Test modu için email (zorunlu alan)
      const email = req.user!.email || "test@example.com";

      // Test modu için kullanıcı bilgileri
      const user_name = req.user!.username || "Test User";

      // Test modu için adres bilgileri (zorunlu alanlar)
      const user_address = "Test Adres";
      const user_phone = "05555555555";

      // PayTR isteği için token oluştur
      const merchant_ok_url = `${process.env.APP_URL}/payment/success`;
      const merchant_fail_url = `${process.env.APP_URL}/payment/fail`;

      // Test modu parametreleri
      const test_mode = 1;
      const debug_on = 1;
      const timeout_limit = 30;
      const currency = "TL";
      const no_installment = 0;
      const max_installment = 0;
      const lang = "tr";

      // Kullanıcı IP'sini al
      const forwarded = req.headers["x-forwarded-for"] as string;
      const user_ip = forwarded ? forwarded.split(",")[0].trim() : req.ip;

      // PayTR için zorunlu parametreler
      const merchant = {
        merchant_id: process.env.PAYTR_MERCHANT_ID!,
        merchant_key: process.env.PAYTR_MERCHANT_KEY!,
        merchant_salt: process.env.PAYTR_MERCHANT_SALT!,
        email: req.user!.email,
        payment_amount: amount, // Kuruş cinsinden (ör: 49900 = 499.00 TL)
        merchant_oid: merchant_oid,
        user_name: req.user!.username,
        user_address: "Türkiye",
        user_phone: req.user!.phone || "",
        merchant_ok_url: `${process.env.APP_URL}/api/payments/success`,
        merchant_fail_url: `${process.env.APP_URL}/api/payments/fail`,
        user_basket: JSON.stringify([["Öncelikli İlan", "1", amount]]),
        user_ip: user_ip,
        timeout_limit: "30",
        debug_on: process.env.NODE_ENV === "development" ? "1" : "0",
        test_mode: process.env.NODE_ENV === "development" ? "1" : "0",
        no_installment: "0",
        max_installment: "0",
        currency: "TL",
        lang: "tr",
      };

      // Hash string'i oluştur
      const hashStr = `${merchant.merchant_id}${merchant.user_ip}${merchant.merchant_oid}${merchant.email}${merchant.payment_amount}${merchant.user_basket}${merchant.no_installment}${merchant.max_installment}${merchant.currency}${merchant.test_mode}`;

      // PayTR token'ı oluştur
      const paytr_token = crypto
        .createHmac("sha256", merchant.merchant_salt)
        .update(hashStr + merchant.merchant_key)
        .digest("base64");

      // Ödeme durumunu güncelle
      await db
        .update(schema.listings)
        .set({
          paymentStatus: "pending",
          active: false, // Ödeme tamamlanana kadar ilanı aktif etme
        })
        .where(eq(schema.listings.id, listingId));

      // Token'ı döndür
      res.json({
        token: paytr_token,
        merchant_oid: merchant_oid,
      });
    } catch (error) {
      console.error("Ödeme başlatma hatası:", error);
      res.status(500).json({ error: "Ödeme başlatılamadı" });
    }
  });

  // PayTR ödeme sonucu notification endpoint'i
  app.post("/api/payments/notification", async (req, res) => {
    try {
      const { merchant_oid, status, total_amount, hash } = req.body;

      // Hash doğrulaması
      const hashStr = `${merchant_oid}${process.env.PAYTR_MERCHANT_SALT!}${status}${total_amount}`;
      const calculatedHash = crypto
        .createHmac("sha256", process.env.PAYTR_MERCHANT_KEY!)
        .update(hashStr)
        .digest("base64");

      if (hash !== calculatedHash) {
        console.error("Hash doğrulama hatası");
        return res.status(400).send("PAYTR notification failed");
      }

      // merchant_oid'den listing ID'yi çıkar
      const [_, listingId] = merchant_oid.split("_");

      if (!listingId) {
        console.error("Geçersiz merchant_oid:", merchant_oid);
        return res.status(400).send("PAYTR notification failed");
      }

      // Ödeme durumunu güncelle
      if (status === "success") {
        await db
          .update(schema.listings)
          .set({
            paymentStatus: "completed",
            active: true, // Ödeme tamamlandığında ilanı aktif et
            approved: true, // Ödeme tamamlandığında ilanı onayla
          })
          .where(eq(schema.listings.id, parseInt(listingId)));

        console.log(`Ödeme başarılı - Listing ID: ${listingId}`);
      } else {
        await db
          .update(schema.listings)
          .set({
            paymentStatus: "failed",
            active: false, // Başarısız ödemede ilanı aktif etme
          })
          .where(eq(schema.listings.id, parseInt(listingId)));

        console.log(`Ödeme başarısız - Listing ID: ${listingId}`);
      }

      res.send("OK");
    } catch (error) {
      console.error("PayTR notification hatası:", error);
      res.status(500).send("PAYTR notification failed");
    }
  });

  // PayTR ödeme başarılı callback endpoint'i
  app.post("/api/payments/success", async (req, res) => {
    const { merchant_oid } = req.body;

    try {
      // merchant_oid'den listing ID'yi çıkar
      const [_, listingId] = merchant_oid.split("_");

      if (!listingId) {
        throw new Error("Geçersiz merchant_oid");
      }

      // İlanı aktifleştir ve ödeme durumunu güncelle
      await db
        .update(schema.listings)
        .set({
          paymentStatus: "completed",
          active: true, // Ödeme tamamlandığında ilanı aktif et
          approved: true, // Ödeme tamamlandığında ilanı onayla
        })
        .where(eq(schema.listings.id, parseInt(listingId)));

      // Kullanıcıyı başarılı sayfasına yönlendir
      res.redirect("/dashboard?payment=success");
    } catch (error) {
      console.error("Ödeme başarılı callback hatası:", error);
      res.redirect("/payment?error=callback");
    }
  });

  // PayTR ödeme başarısız callback endpoint'i
  app.post("/api/payments/fail", async (req, res) => {
    const { merchant_oid } = req.body;

    try {
      // merchant_oid'den listing ID'yi çıkar
      const [_, listingId] = merchant_oid.split("_");

      if (!listingId) {
        throw new Error("Geçersiz merchant_oid");
      }

      // Ödeme durumunu güncelle
      await db
        .update(schema.listings)
        .set({
          paymentStatus: "failed",
          active: false, // Başarısız ödemede ilanı aktif etme
        })
        .where(eq(schema.listings.id, parseInt(listingId)));

      // Kullanıcıyı hata sayfasına yönlendir
      res.redirect("/payment?error=failed");
    } catch (error) {
      console.error("Ödeme başarısız callback hatası:", error);
      res.redirect("/payment?error=callback");
    }
  });
} 