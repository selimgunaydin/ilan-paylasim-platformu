# Sistem Bilgisi Raporu

---

## 📁 Modül Bazlı Yapı

### 1. Kullanıcı Yönetimi
- **Amaç:** Kullanıcıların kayıt, giriş, profil yönetimi, e-posta doğrulama ve şifre sıfırlama işlemlerini sağlar.
- **Tüm Frontend Sayfaları:**
  - `/auth`, `/auth/page.tsx`, `/auth/success/page.tsx`, `/reset-password`, `/verify-email`, `/profilim`, `/admin/users`, `/admin/users/[id]`
- **Admin/Superadmin Erişimi:**
  - Kullanıcı işlemleri: user
  - Kullanıcı listesi/detay: admin
- **Tüm Veritabanı Tabloları ve Kritik Alanlar:**
  - `users`: id, username, password, email, emailVerified, isAdmin, status, has_used_free_ad, profileImage, profileVisibility, googleId, facebookId, createdAt, lastSeen, gender, age, city, aboutMe, yuksekUye, phone, ip_address
  - `favorites`: id, userId, listingId, createdAt
- **Tüm API Endpointleri:**
  - `POST /api/register` — Kayıt
  - `POST /api/auth` — Giriş
  - `GET /api/user` — Kullanıcı bilgisi
  - `DELETE /api/user` — Hesap silme
  - `POST /api/forgot-password` — Şifre sıfırlama isteği
  - `POST /api/reset-password` — Şifre sıfırlama
  - `GET /api/user/status` — Oturum durumu
  - `POST /api/user/upload-profile-image` — Profil resmi yükleme
  - `GET /api/users/[id]` — Kullanıcı detayı
- **Tüm Dış Servisler/Entegrasyonlar:**
  - SendGrid (e-posta doğrulama, bildirim) — SDK
  - Google, Facebook (sosyal login) — NextAuth provider
  - Cloudflare R2 (profil resmi) — AWS S3 SDK
- **Tüm Webhooklar:**
  - Yok
- **Arka Plan Servisleri/Cronjoblar:**
  - `/api/cron/cleanup` — 12 ay inaktif kullanıcı temizliği
- **Otomatik Kurallar:**
  - E-posta doğrulama zorunluluğu
  - Tekrar eden kayıt engeli
  - Profil görünürlüğü ve durum kontrolü
- **Bağlı Olduğu Diğer Modüller:**
  - Mesajlaşma, İlan Yönetimi, Favoriler, Ödeme, Admin Paneli
- **Geliştirici Notları:**
  - `users.isAdmin` ile admin ayrımı yapılır, `admin_users` kaldırılacak.
  - Migrationlarda veri kaybı olmamasına dikkat edilmeli.
  - E-posta ve şifre asla loglanmamalı.

---

### 2. İlan Yönetimi
- **Amaç:** Kullanıcıların ilan eklemesi, düzenlemesi, silmesi, ilanların kategorilere göre listelenmesi ve arama/filtreleme işlemleri.
- **Tüm Frontend Sayfaları:**
  - `/ilanlarim`, `/ilan-ekle`, `/ilan-duzenle/[id]`, `/ilan/[slug]`, `/kategori/[slug]`, `/arama`, `/dashboard`, `/admin/aktifilanlar`, `/admin/pasifilanlar`, `/admin/onaybekleyenilanlar`, `/admin/ilan/[id]`
- **Admin/Superadmin Erişimi:**
  - İlan onay/reddetme, silme: admin
  - Kendi ilanları: user
- **Tüm Veritabanı Tabloları ve Kritik Alanlar:**
  - `listings`: id, title, description, city, contactPerson, phone, images, listingType, paymentStatus, approved, userId, categoryId, views, createdAt, expiresAt, active, user_ip, updated_at
- **Tüm API Endpointleri:**
  - `GET /api/listings` — Tüm ilanlar
  - `POST /api/listings` — Yeni ilan ekle
  - `GET /api/listings/[id]` — İlan detayı
  - `PUT /api/listings/[id]` — İlan güncelle
  - `DELETE /api/listings/[id]` — İlan sil
  - `GET /api/listings/user` — Kullanıcının ilanları
  - `POST /api/listings/[id]/deactivate` — Pasif yap
  - `POST /api/listings/[id]/activate` — Aktif yap
  - `POST /api/listings/[id]/approve` — Onayla (admin)
  - `POST /api/listings/[id]/reject` — Reddet (admin)
- **Tüm Dış Servisler/Entegrasyonlar:**
  - Cloudflare R2 (ilan görselleri) — AWS S3 SDK
  - PayTR (ödeme) — iframe/REST
- **Tüm Webhooklar:**
  - Yok
- **Arka Plan Servisleri/Cronjoblar:**
  - `runDailyTasks` — Süresi dolan ilanları pasif yapar
- **Otomatik Kurallar:**
  - Süresi dolan ilanlar otomatik pasif yapılır
  - Onaylanmamış ilan yayına alınmaz
  - Ücretsiz ilan hakkı bir kez
- **Bağlı Olduğu Diğer Modüller:**
  - Kullanıcı Yönetimi, Kategori Yönetimi, Mesajlaşma, Ödeme, Favoriler
- **Geliştirici Notları:**
  - Görsel yükleme işlemlerinde dosya boyutu ve formatı kontrol edilmeli.
  - İlan silme işlemi, ilişkili mesaj ve favorileri de siler.

---

### 3. Kategori Yönetimi
- **Amaç:** İlanların kategorilere ayrılması, kategori ekleme/düzenleme/silme ve sıralama işlemleri.
- **Tüm Frontend Sayfaları:**
  - `/kategori/[slug]`, `/admin/kategoriler`, `/ilan-ekle`, `/ilan-duzenle/[id]`
- **Admin/Superadmin Erişimi:**
  - Kategori ekle/düzenle/sil: admin
  - Listeleme: user, guest
- **Tüm Veritabanı Tabloları ve Kritik Alanlar:**
  - `categories`: id, name, parentId, slug, order, customTitle, metaDescription, content, faqs
- **Tüm API Endpointleri:**
  - `GET /api/categories` — Tüm kategoriler
  - `GET /api/categories/all` — Kategoriler ve ilan sayıları
  - `GET /api/categories/[slug]` — Slug ile kategori
  - `POST /api/admin/categories` — Kategori ekle (admin)
  - `PUT /api/admin/categories/[id]` — Kategori güncelle (admin)
  - `DELETE /api/admin/categories/[id]` — Kategori sil (admin)
- **Tüm Dış Servisler/Entegrasyonlar:**
  - Yok
- **Tüm Webhooklar:**
  - Yok
- **Arka Plan Servisleri/Cronjoblar:**
  - Yok
- **Otomatik Kurallar:**
  - Aynı slug ile kategori eklenemez
  - Kategori silme işlemi, alt kategorileri ve bağlı ilanları etkiler
- **Bağlı Olduğu Diğer Modüller:**
  - İlan Yönetimi
- **Geliştirici Notları:**
  - Kategori silme işlemi öncesi bağlı ilan ve alt kategori kontrolü yapılmalı.
  - Kategori sıralama işlemleri drag-drop ile yapılır.

---

### 4. Mesajlaşma Sistemi
- **Amaç:** Kullanıcılar arası ve admin-kullanıcı arası gerçek zamanlı mesajlaşma, dosya paylaşımı.
- **Tüm Frontend Sayfaları:**
  - `/gelen-mesajlar`, `/gonderilen-mesajlar`, `/admin/tummesajlar`, `/admin/ilanmesajdetayi/[id]`, `/admin/iletisim-mesajlari`, `/ilan/[slug]`, `/admin/ilan-mesaj-detayi`
- **Admin/Superadmin Erişimi:**
  - Tüm mesajlar: admin
  - Kendi mesajları: user
- **Tüm Veritabanı Tabloları ve Kritik Alanlar:**
  - `conversations`: id, listingId, senderId, receiverId, createdAt, is_admin_conversation
  - `messages`: id, conversationId, senderId, receiverId, content, isRead, createdAt, sender_ip, files, fileTypes
- **Tüm API Endpointleri:**
  - `GET /api/conversations` — Kullanıcının konuşmaları
  - `GET /api/conversations/[id]` — Konuşma detayı
  - `GET /api/conversations/[id]/messages` — Konuşma mesajları
  - `POST /api/messages` — Mesaj gönderme
  - `POST /api/messages/upload` — Mesaj dosyası yükleme
  - `GET /api/conversations/[id]/events` — Mesaj olayları
- **Tüm Dış Servisler/Entegrasyonlar:**
  - Cloudflare R2 (mesaj dosyaları) — AWS S3 SDK
- **Tüm Webhooklar:**
  - Yok
- **Arka Plan Servisleri/Cronjoblar:**
  - Yok
- **Otomatik Kurallar:**
  - Kötü sözlük filtresi (mesaj içeriği kontrolü)
  - Dosya boyutu ve formatı kontrolü
- **Bağlı Olduğu Diğer Modüller:**
  - Kullanıcı Yönetimi, İlan Yönetimi
- **Geliştirici Notları:**
  - Mesaj dosyaları için maksimum 5 dosya ve boyut limiti uygulanır.
  - Admin mesajları için özel event ve kontrol vardır.

---

### 5. Ödeme/Premium Üyelik
- **Amaç:** Premium ilan ve üyelik satın alma, ödeme işlemleri.
- **Tüm Frontend Sayfaları:**
  - `/odeme`, `/premium-uye-ol`, `/premium-uyelik`, `/admin/ayarlar/ticari`
- **Admin/Superadmin Erişimi:**
  - Ödeme ayarları: admin
  - Ödeme işlemi: user
- **Tüm Veritabanı Tabloları ve Kritik Alanlar:**
  - `payment_settings`: id, premium_listing_price, listing_duration, premium_member_price, default_payment_gateway, paytr_merchant_id, paytr_secret_key, paytr_merchant_key, paytr_sandbox, updated_at, updated_by
- **Tüm API Endpointleri:**
  - `POST /api/payments/create` — Ödeme başlatma
  - `GET /api/admin/payment-settings` — Ödeme ayarları (admin)
- **Tüm Dış Servisler/Entegrasyonlar:**
  - PayTR (ödeme) — iframe/REST
  - Stripe, Iyzico (hazır, aktif değil)
- **Tüm Webhooklar:**
  - Yok
- **Arka Plan Servisleri/Cronjoblar:**
  - Yok
- **Otomatik Kurallar:**
  - Premium ilan süresi ve fiyatı admin tarafından belirlenir
  - Ücretsiz ilan hakkı bir kez kullanılabilir
- **Bağlı Olduğu Diğer Modüller:**
  - Kullanıcı Yönetimi, İlan Yönetimi
- **Geliştirici Notları:**
  - Ödeme entegrasyonunda test ve prod anahtarları ayrılmalı.
  - Ayarlar productionda değiştirilmemeli.

---

### 6. Admin Paneli
- **Amaç:** Tüm sistemin yönetimi, kullanıcı, ilan, kategori, mesaj ve site ayarlarının yönetimi.
- **Tüm Frontend Sayfaları:**
  - `/yonetim/anasayfa`, `/yonetim/users`, `/yonetim/aktifilanlar`, `/yonetim/pasifilanlar`, `/yonetim/onaybekleyenilanlar`, `/yonetim/kategoriler`, `/yonetim/ayarlar/site`, `/yonetim/ayarlar/ticari`, `/yonetim/tummesajlar`, `/yonetim/iletisim-mesajlari`, `/yonetim/ilan/[id]`, `/yonetim/users/[id]`, `/yonetim/ilanmesajdetayi/[id]`
- **Admin/Superadmin Erişimi:**
  - Tüm işlemler: admin
- **Tüm Veritabanı Tabloları ve Kritik Alanlar:**
  - Tüm ana tablolar (users, listings, categories, messages, payment_settings, site_settings, contact_messages)
- **Tüm API Endpointleri:**
  - `/api/admin/*` ile başlayan tüm endpointler (token ve admin kontrolü ile korumalı)
  - `GET /api/admin/users` — Kullanıcı listesi
  - `GET /api/admin/users/[id]` — Kullanıcı detayı
  - `GET /api/admin/listings` — İlan listesi
  - `GET /api/admin/listings/[id]` — İlan detayı
  - `POST /api/admin/listings/[id]/approve` — İlan onaylama
  - `POST /api/admin/listings/[id]/reject` — İlan reddetme
  - `POST /api/admin/categories` — Kategori ekleme
  - `PUT /api/admin/categories/[id]` — Kategori güncelleme
  - `DELETE /api/admin/categories/[id]` — Kategori silme
  - `GET /api/admin/dashboard-stats` — İstatistikler
  - `POST /api/admin/upload-logo` — Logo yükleme
  - `POST /api/admin/verify-pin` — Admin PIN doğrulama
- **Tüm Dış Servisler/Entegrasyonlar:**
  - Cloudflare R2 (logo, favicon)
  - SendGrid (bildirim, iletişim mesajı)
- **Tüm Webhooklar:**
  - Yok
- **Arka Plan Servisleri/Cronjoblar:**
  - Kullanıcı ve ilan temizliği (cronjob)
- **Otomatik Kurallar:**
  - Admin PIN ile korumalı işlemler
  - Admin olmayan kullanıcılar erişemez
- **Bağlı Olduğu Diğer Modüller:**
  - Tüm modüller
- **Geliştirici Notları:**
  - Admin işlemleri productionda dikkatli yapılmalı, kritik ayarlar yedeklenmeli.
  - Migrationlarda admin yetkisi kaybı olmamasına dikkat edilmeli.

---

### 7. İletişim ve Bildirimler
- **Amaç:** Kullanıcıların iletişim formu ile mesaj göndermesi, adminin bu mesajları yönetmesi.
- **Tüm Frontend Sayfaları:**
  - `/iletisim`, `/admin/iletisim-mesajlari`
- **Admin/Superadmin Erişimi:**
  - Mesaj yönetimi: admin
  - Form gönderimi: user, guest
- **Tüm Veritabanı Tabloları ve Kritik Alanlar:**
  - `contact_messages`: id, name, email, subject, message, isRead, createdAt, ip_address
- **Tüm API Endpointleri:**
  - `POST /api/contact` — İletişim formu gönderme
  - `GET /api/contact` — Mesajları listeleme (admin)
- **Tüm Dış Servisler/Entegrasyonlar:**
  - SendGrid (e-posta ile bildirim)
- **Tüm Webhooklar:**
  - Yok
- **Arka Plan Servisleri/Cronjoblar:**
  - Yok
- **Otomatik Kurallar:**
  - Spam koruması için reCAPTCHA
- **Bağlı Olduğu Diğer Modüller:**
  - Admin Paneli
- **Geliştirici Notları:**
  - Mesajlar silinmeden önce yedeklenmeli.

---

## 🔒 Güvenlik Politikası
- **.env ve system_settings Bilgileri:**
  - `NEXTAUTH_SECRET`, `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`, `CLOUDFLARE_ACCESS_KEY_ID`, `CLOUDFLARE_SECRET_ACCESS_KEY`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_R2_BUCKET`, `PAYTR_MERCHANT_ID`, `PAYTR_MERCHANT_KEY`, `PAYTR_SECRET_KEY`, `RECAPTCHA_SECRET_KEY`, `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
- **Admin Yetkisi Gerektiren API’ler:**
  - `/api/admin/*` altındaki tüm endpointler
  - `/api/listings/*` (POST/PUT/DELETE)
  - `/api/messages/*` (POST/DELETE)
  - `/api/user/*` (DELETE/PUT)
- **Production’da Değişmemesi Gerekenler:**
  - Tüm .env anahtarları, ödeme ve dosya erişim bilgileri, kritik ayarlar
  - `site_settings`, `payment_settings` tabloları

---

## 🌐 Dış Bağlantılar & Komut Dosyaları
- **Eklenen <script> Linkleri:**
  - Google reCAPTCHA v3: Bot koruması için, `react-google-recaptcha-v3` ile otomatik eklenir
- **SEO JSON-LD Schema Scriptleri:**
  - Ana sayfa: `CollectionPage`, `Organization`
  - Kategori: `BreadcrumbList`, `FAQPage`, `ItemList`, `WebSite` + `SearchAction`, `AggregateRating`
  - İlan detay: `Product`, `Review`, `AggregateRating`, `BreadcrumbList`
- **Sosyal Login App ID/Key:**
  - Google ve Facebook için NextAuth provider ile `.env` üzerinden alınır
- **Üçüncü Parti SDK/Script:**
  - `@aws-sdk/client-s3` (Cloudflare R2), `@sendgrid/mail` (SendGrid), `socket.io-client` (WebSocket), `react-google-recaptcha-v3` (reCAPTCHA), `framer-motion`, `react-hook-form`, `zod`, `radix-ui`, `redux`, `tanstack-query`

---

## ⚙ Yapı Kuralları & Genel Sistem Mantığı
- **Modül Bağımlılıkları:**
  - Kullanıcı → İlan → Mesaj → Ödeme → Admin
  - Kategori → İlan
  - Admin → Tüm modüller
- **Çalışma Sıralamaları:**
  1. Kullanıcı kayıt olur ve e-posta doğrular
  2. İlan ekler (ücretsiz veya premium)
  3. İlan admin onayına düşer, onaylanırsa yayına alınır
  4. Diğer kullanıcılar ilanı görüntüler, mesaj gönderir
  5. Mesajlar gerçek zamanlı iletilir, dosya paylaşımı yapılabilir
  6. Premium ilan/üyelik için ödeme yapılır (PayTR)
  7. Admin panelden tüm işlemler ve ayarlar yönetilir
- **Oturum Yönetimi:** NextAuth ile JWT tabanlı, sosyal login (Google, Facebook) ve e-posta/şifre ile giriş
- **Dosya Yükleme:** Cloudflare R2, imzalı URL yok, doğrudan backend üzerinden yükleme ve erişim
- **SEO/Blog:** SEO scriptleri otomatik olarak sayfa bileşenlerinde üretilir, blog modülü yok
- **Admin İçerik Akışı:** Admin panelde yapılan değişiklikler anında frontend'e yansır (API üzerinden)

---

## ✅ Kontrol Listesi
- [x] Tüm aktif modüller listelendi
- [x] Tüm API endpointleri listelendi
- [x] Tüm tablolar ve kolonlar yazıldı
- [x] Erişim yetkileri (admin vs user) açıklandı
- [x] Dış API, webhook, çeviri servisleri yazıldı
- [x] Otomatik kurallar ve senkronizasyon ilişkileri belirtildi
- [x] <script> ve dış bağlantı açıklamaları yazıldı
- [x] Geliştirici notları ve müdahale edilmemesi gereken alanlar belirtildi 