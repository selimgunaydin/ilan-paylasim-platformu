import React from 'react'
import HomePage from '@/pages/home-page'
import { Category } from '@/schemas/schema';

export default async function Home() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`);
  const categories: Category[] = await res.json();
  return (
    <HomePage categories={categories} />
  )
} 