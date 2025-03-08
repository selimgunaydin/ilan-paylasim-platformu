'use client'

import React from 'react'
import MyListings from '@/pages/my-listings'
import { redirect } from 'next/navigation'

// Not: Bu sayfa için sunucu tarafında auth kontrolü yapmalısınız
// Bunu middleware kullanarak yapabilirsiniz
export default function DashboardPage() {
  // Bu kısım client component içinde kontrol edilmelidir
  return (
    <MyListings />
  )
} 