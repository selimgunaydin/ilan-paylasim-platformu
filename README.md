# İlan Yönetim Sistemi

Bu proje, kullanıcıların ilan ekleyebileceği, mesajlaşabileceği ve ilanları yönetebileceği kapsamlı bir web uygulamasıdır. Next.js, Express, PostgreSQL ve WebSocket teknolojileri kullanılarak geliştirilmiştir.

## Özellikler

- **Kullanıcı Yönetimi**
  - Kayıt ve giriş sistemi
  - E-posta doğrulama
  - Şifre sıfırlama
  - Profil yönetimi

- **İlan Yönetimi**
  - İlan ekleme, düzenleme ve silme
  - Kategori bazlı ilan listeleme
  - İlan arama ve filtreleme
  - Favori ilanlar

- **Mesajlaşma Sistemi**
  - Gerçek zamanlı mesajlaşma (WebSocket)
  - Gelen ve gönderilen mesajlar
  - Dosya paylaşımı

- **Ödeme Entegrasyonu**
  - PayTR ile ödeme işlemleri
  - Ücretli ilan yayınlama

- **Admin Paneli**
  - İlan onaylama/reddetme
  - Kullanıcı yönetimi
  - Kategori yönetimi
  - Sistem ayarları

## Teknoloji Yığını

- **Frontend**
  - Next.js 14
  - React 18
  - Tailwind CSS
  - Radix UI
  - React Hook Form
  - Zod (form doğrulama)
  - Tanstack Query

- **Backend**
  - Express.js
  - Next.js API Routes
  - Drizzle ORM
  - PostgreSQL (Neon)
  - Redis

- **Kimlik Doğrulama**
  - NextAuth.js
  - JWT
  - Bcrypt

- **Depolama**
  - Cloudflare Storage

- **E-posta**
  - SendGrid

## Kurulum

### Ön Koşullar

- Node.js (v18 veya üzeri)
- PostgreSQL veritabanı
- Redis (isteğe bağlı, oturum yönetimi için)

### Adımlar

1. Projeyi klonlayın:
   ```bash
   git clone <repo-url>
   cd <proje-klasörü>
   ```

2. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```

3. Çevre değişkenlerini ayarlayın:
   `.env.example` dosyasını `.env` olarak kopyalayın ve gerekli değişkenleri doldurun.

4. Veritabanı şemasını oluşturun:
   ```bash
   npm run db:push
   ```

5. Geliştirme sunucusunu başlatın:
   ```bash
   npm run dev
   ```

## Proje Yapısı

```
/
├── app/                    # Next.js uygulama klasörü
│   ├── (admin)/            # Admin paneli sayfaları
│   ├── (root)/             # Ana uygulama sayfaları
│   ├── api/                # API rotaları
│   ├── components/         # UI bileşenleri
│   ├── hooks/              # React hooks
│   ├── lib/                # Yardımcı kütüphaneler
│   ├── providers/          # Context sağlayıcıları
│   ├── types/              # TypeScript tipleri
│   └── utils/              # Yardımcı fonksiyonlar
│
├── server/                 # Express sunucu kodları
│   ├── routes/             # API rotaları
│   ├── services/           # İş mantığı servisleri
│   ├── utils/              # Yardımcı fonksiyonlar
│   ├── auth.ts             # Kimlik doğrulama
│   ├── db.ts               # Veritabanı bağlantısı
│   ├── index.ts            # Sunucu giriş noktası
│   ├── mail.ts             # E-posta servisi
│   ├── storage.ts          # Dosya depolama
│   └── websocket.ts        # WebSocket sunucusu
│
├── shared/                 # Paylaşılan kod
│   └── schema.ts           # Veritabanı şeması
│
├── migrations/             # Veritabanı migrasyonları
│
├── public/                 # Statik dosyalar
│
├── .env                    # Çevre değişkenleri
├── .env.example            # Örnek çevre değişkenleri
├── .gitignore              # Git tarafından yok sayılacak dosyalar
├── drizzle.config.ts       # Drizzle ORM yapılandırması
├── next.config.js          # Next.js yapılandırması
├── package.json            # Proje bağımlılıkları
├── tailwind.config.ts      # Tailwind CSS yapılandırması
└── tsconfig.json           # TypeScript yapılandırması
```

## Geliştirme

### Komutlar

- `npm run dev`: Geliştirme sunucusunu başlatır
- `npm run build`: Projeyi derler
- `npm run start`: Derlenmiş projeyi başlatır
- `npm run db:push`: Veritabanı şemasını günceller
- `npm run check`: TypeScript tip kontrolü yapar

## Dağıtım

Proje, Vercel, Netlify veya kendi sunucunuzda dağıtılabilir. Dağıtım öncesinde aşağıdaki adımları izleyin:

1. Gerekli çevre değişkenlerini ayarlayın
2. Projeyi derleyin: `npm run build`
3. Sunucuyu başlatın: `npm run start`

## Lisans

MIT

## İletişim

Proje ile ilgili sorularınız için [e-posta adresi] adresine e-posta gönderebilirsiniz. 