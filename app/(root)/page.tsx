import React from 'react'
import HomePage from '@/views/root/home'
import { Category } from '@shared/schemas';
import { safeFetch } from '@shared/utils/fetch-helper';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default async function Home() {
  const categories = await safeFetch<Category[]>(
    `${process.env.NEXT_PUBLIC_API_URL}/api/categories`,
    undefined,
    []
  );
  
  return (
    <HomePage categories={categories} />
  )
} 