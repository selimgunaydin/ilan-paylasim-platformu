import React from 'react'
import HomePage from '@/views/root/home'
import { Category } from '@shared/schemas';

export default async function Home() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`);
  const categories: Category[] = await res.json();
  return (
    <HomePage categories={categories} />
  )
} 