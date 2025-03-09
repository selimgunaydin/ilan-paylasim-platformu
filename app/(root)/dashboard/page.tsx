import React from 'react'
import { redirect } from 'next/navigation'
import { Listing } from '@shared/schema'
import MyListings from '@/pages/my-listings'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/api/auth/[...nextauth]/route'

async function getListings() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth')
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/listings/user`)
  console.log('DATDAT :', res)
  if (!res.ok) {
    throw new Error('İlanlar getirilemedi')
  }

  return res.json()
}

export default async function DashboardPage() {
  const listings = await getListings()

  return (
    <div className="container mx-auto px-4 py-8">
      <MyListings initialListings={listings} />
    </div>
  )
} 