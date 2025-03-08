import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

// Login işlemi
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Burada gerçek kimlik doğrulama yapılmalıdır
    // Bu sadece örnek bir uygulamadır
    if (email === 'test@example.com' && password === 'password') {
      // JWT token oluştur
      const token = jwt.sign(
        { userId: '123', email },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '1d' }
      )

      // Response oluştur ve cookie ayarla
      const response = NextResponse.json(
        { success: true, message: 'Giriş başarılı' },
        { status: 200 }
      )

      // Cookie ayarla
      response.cookies.set({
        name: 'auth-token',
        value: token,
        httpOnly: true,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24, // 1 gün
      })

      return response
    }

    // Kimlik doğrulama başarısız
    return NextResponse.json(
      { success: false, message: 'Geçersiz e-posta veya şifre' },
      { status: 401 }
    )
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu' },
      { status: 500 }
    )
  }
}

// Logout işlemi
export async function DELETE(request: NextRequest) {
  try {
    // Cookie'yi temizle
    const response = NextResponse.json(
      { success: true, message: 'Çıkış başarılı' },
      { status: 200 }
    )

    response.cookies.delete('auth-token')
    
    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu' },
      { status: 500 }
    )
  }
} 