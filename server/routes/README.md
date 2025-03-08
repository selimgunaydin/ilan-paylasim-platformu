# API Routes Yapısı

Bu klasör, API rotalarını organize bir şekilde yönetmek için oluşturulmuştur. Her bir alt klasör, belirli bir işlevsellik alanına ait rotaları içerir.

## Klasör Yapısı

- `admin/`: Admin paneli ile ilgili rotalar
  - `auth.ts`: Admin kimlik doğrulama rotaları
  - `categories.ts`: Kategori yönetimi rotaları
  - `conversations.ts`: Mesajlaşma yönetimi rotaları
  - `listings.ts`: İlan yönetimi rotaları
  - `payments.ts`: Ödeme yönetimi rotaları
  - `users.ts`: Kullanıcı yönetimi rotaları

- `user/`: Kullanıcı işlemleri ile ilgili rotalar
  - `auth.ts`: Kullanıcı kimlik doğrulama rotaları
  - `profile.ts`: Kullanıcı profil yönetimi rotaları

- `conversations/`: Mesajlaşma işlemleri ile ilgili rotalar
- `messages/`: Mesaj işlemleri ile ilgili rotalar
- `listings/`: İlan işlemleri ile ilgili rotalar
- `categories/`: Kategori işlemleri ile ilgili rotalar
- `payments/`: Ödeme işlemleri ile ilgili rotalar
- `favorites/`: Favori işlemleri ile ilgili rotalar

- `types.ts`: Ortak tipler ve arayüzler
- `index.ts`: Ana route yönetimi

## Kullanım

Her bir modül, kendi rotalarını kaydeden bir fonksiyon ihraç eder. Bu fonksiyonlar, `index.ts` dosyasında bir araya getirilir ve ana uygulamaya kaydedilir.

Örnek:

```typescript
// server/routes/user/auth.ts
export function registerAuthRoutes(app: Express): void {
  app.post("/api/login", ...);
  app.post("/api/register", ...);
  // ...
}

// server/routes/index.ts
export function registerRoutes(app: Express): Server {
  registerUserRoutes(app);
  registerConversationRoutes(app);
  // ...
  return new Server(app);
}
```

## WebSocket Yönetimi

WebSocket yönetimi için gerekli fonksiyonlar `index.ts` dosyasında bulunur:

- `setWebSocketManager`: WebSocket yöneticisini ayarlar
- `sendMessageToUser`: Belirli bir kullanıcıya mesaj gönderir
- `broadcastMessage`: Tüm bağlı kullanıcılara mesaj yayınlar 