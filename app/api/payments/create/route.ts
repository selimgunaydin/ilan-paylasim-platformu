import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { listings, users } from '@/schemas/schema'
import { eq } from 'drizzle-orm'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { getToken } from 'next-auth/jwt';
// PayTR için gerekli bilgiler
const MERCHANT_ID = process.env.PAYTR_MERCHANT_ID || '123456'
const MERCHANT_KEY = process.env.PAYTR_MERCHANT_KEY || 'merchant_key'
const MERCHANT_SALT = process.env.PAYTR_MERCHANT_SALT || 'merchant_salt'
const SUCCESS_URL = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/success`
const FAIL_URL = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/fail`

export async function POST(request: NextRequest) {
  try {
    // Auth token'ı al
        const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    // Token yoksa, kullanıcı giriş yapmamış demektir
    if (!token) {
      return NextResponse.json(
        { error: "Yetkilendirme gerekli" },
        { status: 401 }
      );
    }

 
    // userId'yi al
    const userId = Number(token.sub);;

    // Request body'den listingId'yi al
    const body = await request.json()
    const { listingId } = body

    if (!listingId) {
      return NextResponse.json(
        { error: "İlan ID'si gereklidir" },
        { status: 400 }
      )
    }

    // İlanı bul
    const [listing] = await db
      .select()
      .from(listings)
      .where(eq(listings.id, listingId))

    // İlan bulunamadıysa
    if (!listing) {
      return NextResponse.json(
        { error: "İlan bulunamadı" },
        { status: 404 }
      )
    }

    // İlan sahibi mi kontrol et
    if (listing.userId !== userId) {
      return NextResponse.json(
        { error: "Bu ilan için ödeme yapamazsınız" },
        { status: 403 }
      )
    }

    // Kullanıcıyı bul
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))

    // Kullanıcı bulunamadıysa
    if (!user) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı" },
        { status: 404 }
      )
    }

    // Ödeme tutarı (TL cinsinden, örn. 10.00 TL için 1000)
    const price = 1000 // 10 TL

    // Sipariş numarası (benzersiz olmalı)
    const merchantOid = `listing_${listingId}_${Date.now()}`

    // PayTR için gerekli parametreler
    const paytrParams = {
      merchant_id: MERCHANT_ID,
      user_ip: request.headers.get('x-forwarded-for') || request.ip || '127.0.0.1',
      merchant_oid: merchantOid,
      email: user.email,
      payment_amount: price, // 1000 = 10.00 TL
      currency: 'TL',
      user_basket: JSON.stringify([
        ["İlan Yayınlama", price, 1] // [Ürün Adı, Fiyat, Adet]
      ]),
      no_installment: 1, // Taksit yapılmasın
      max_installment: 0,
      test_mode: process.env.NODE_ENV !== 'production' ? 1 : 0,
      merchant_ok_url: SUCCESS_URL,
      merchant_fail_url: FAIL_URL,
      user_name: user.username,
      user_address: user.city || 'Belirtilmemiş',
      user_phone: user.phone || 'Belirtilmemiş',
    }

    // Hash oluştur
    const hashStr = `${MERCHANT_ID}${paytrParams.user_ip}${paytrParams.merchant_oid}${paytrParams.email}${paytrParams.payment_amount}${paytrParams.user_basket}${paytrParams.no_installment}${paytrParams.max_installment}${paytrParams.currency}${paytrParams.test_mode}`
    const paytrHash = crypto.createHmac('sha256', MERCHANT_KEY).update(hashStr + MERCHANT_SALT).digest('base64')

    // PayTR token oluştur (gerçek bir API çağrısı yapılmalı, burada simüle ediyoruz)
    const token_data = {
      token: `simulated_paytr_token_${Date.now()}`,
      status: 'success'
    }

    // TODO: Burada normalde PayTR API'sine istek gönderilecek ve dönen token kullanılacak
    // Gerçek bir entegrasyon için PayTR API dokümantasyonu takip edilmelidir
    // Şu an için sadece simüle ediyoruz

    return NextResponse.json(token_data)
  } catch (error) {
    console.error("Ödeme oluşturma hatası:", error)
    return NextResponse.json(
      { error: "Ödeme işlemi sırasında bir hata oluştu" },
      { status: 500 }
    )
  }
} 