// PayTR ödeme başlatma endpoint'i
app.post("/api/payments/create", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Yetkilendirme gerekli" });
  }

  try {
    const { listingId, amount, email, user_name, user_address, user_phone } = req.body;

    if (!listingId || !amount || !email) {
      return res.status(400).json({ error: "Eksik parametreler" });
    }

    // PayTR merchant bilgileri
    const merchant_id = process.env.PAYTR_MERCHANT_ID!;
    const merchant_key = process.env.PAYTR_MERCHANT_KEY!;
    const merchant_salt = process.env.PAYTR_MERCHANT_SALT!;

    // Benzersiz sipariş ID oluştur
    const merchant_oid = `${Date.now()}_${req.user!.id}_${listingId}`;

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

    // PayTR için hash oluştur
    const hashStr = `${merchant_id}${user_ip}${merchant_oid}${email}${amount}${test_mode}${currency}${no_installment}${max_installment}${merchant_ok_url}${merchant_fail_url}${lang}${timeout_limit}${merchant_salt}`;
    const token = crypto
      .createHmac("sha256", merchant_key)
      .update(hashStr)
      .digest("base64");

    console.log("PayTR Test Modu - Ödeme Başlatma Parametreleri:", {
      merchant_id,
      user_ip,
      merchant_oid,
      email,
      payment_amount: amount,
      test_mode,
      currency,
      merchant_ok_url,
      merchant_fail_url,
      user_name,
      user_address,
      user_phone,
      debug_on,
      timeout_limit,
      lang
    });

    // PayTR'ye POST isteği gönder
    const paytrResponse = await fetch("https://www.paytr.com/odeme/api/get-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        merchant_id,
        user_ip,
        merchant_oid,
        email,
        payment_amount: amount,
        payment_type: "card",
        merchant_ok_url,
        merchant_fail_url,
        user_name,
        user_address,
        user_phone,
        merchant_ok_url,
        merchant_fail_url,
        user_basket: JSON.stringify([["Premium İlan", amount, 1]]),
        debug_on: debug_on.toString(),
        test_mode: test_mode.toString(),
        currency,
        no_installment: no_installment.toString(),
        max_installment: max_installment.toString(),
        lang,
        timeout_limit: timeout_limit.toString(),
        paytr_token: token,
      }),
    });

    const paytrData = await paytrResponse.json();
    console.log("PayTR Test Modu - API Yanıtı:", paytrData);

    if (paytrData.status === "success") {
      // Ödeme token'ını kaydet ve yanıt ver
      await db
        .update(schema.listings)
        .set({ 
          paymentStatus: "pending",
          merchant_oid: merchant_oid 
        })
        .where(eq(schema.listings.id, listingId));

      res.json({
        token: paytrData.token,
        merchant_oid: merchant_oid,
      });
    } else {
      console.error("PayTR token alma hatası:", paytrData);
      res.status(500).json({ error: "Ödeme başlatılamadı" });
    }
  } catch (error) {
    console.error("Ödeme başlatma hatası:", error);
    res.status(500).json({ error: "Ödeme başlatılamadı" });
  }