import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Korumalı rotaları içeren bir dizi
const protectedRoutes = [
  '/dashboard',
  '/ilan-ekle',
  '/ilan-duzenle',
  '/ilanlarim',
  '/favorilerim',
  '/gonderilen-mesajlar',
  '/gelen-mesajlar',
  '/profilim',
]

// Admin rotaları
const adminRoutes = [
  '/yonetim/anasayfa',
  '/yonetim/ilanlar',
  '/yonetim/kullanicilar',
  '/yonetim/ayarlar',
  '/yonetim/*'
]

// Public admin rotaları (giriş sayfası gibi)
const publicAdminRoutes = [
  '/yonetim'
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // NextAuth API rotalarını atla
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // NextAuth token kontrolü
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  })

  // API istekleri için özel kontrol
  if (pathname.startsWith('/api/')) {
    // Auth API isteklerini atla
    if (pathname.startsWith('/api/auth')) {
      return NextResponse.next()
    }
    
    // Public API rotaları (token gerektirmeyen)
    const publicApiRoutes = [
      '/api/listings',
      '/api/categories',
      '/api/register',
      '/api/verify-email',
      '/api/reset-password',
      '/api/forgot-password',
      '/api/reset-password-verify',
    ]
    
    // Tam eşleşme veya alt yollar için kontrol
    const isPublicApi = publicApiRoutes.some(route => 
      pathname === route || pathname.startsWith(`${route}/`)
    )
    
    if (isPublicApi) {
      return NextResponse.next()
    }
    
    // Admin API rotaları
    if (pathname.startsWith('/api/admin/')) {
      if (!token || token.type !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      return NextResponse.next()
    }
    
    // Diğer API rotaları için token kontrolü
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    return NextResponse.next()
  }

  // Admin sayfaları kontrolü
  if (pathname.startsWith('/yonetim')) {
    // Public admin rotalarını kontrol et
    if (publicAdminRoutes.includes(pathname)) {
      return NextResponse.next()
    }

    // Admin yetkisi kontrolü
    if (!token || token.type !== 'admin') {
      return NextResponse.redirect(new URL('/yonetim', request.url))
    }
  }

  // Korumalı rotalar için oturum kontrolü
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!token) {
      return NextResponse.redirect(new URL('/auth', request.url))
    }
  }

  return NextResponse.next()
}

// Middleware'in hangi yollarda çalışacağını belirt
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/ilan-ekle/:path*',
    '/ilan-duzenle/:path*',
    '/ilanlarim/:path*',
    '/favorilerim/:path*',
    '/gonderilen-mesajlar/:path*',
    '/gelen-mesajlar/:path*',
    '/profilim/:path*',
    '/yonetim',
    '/yonetim/:path*',
    '/api/:path*'
  ]
} 