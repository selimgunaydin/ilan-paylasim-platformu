import React from 'react'
import CategoryDetailPage from '@/views/category'
import { Category } from '@shared/schemas';

async function getCategories() {
  return fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`, {
    next: { revalidate: 60 }, // 1 dakika önbellekleme
  }).then((res) => res.json());
}

async function getCategoryDetail(slug: string) {
  return fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories/${slug}`, {
    next: { revalidate: 60 }, // 1 dakika önbellekleme
  }).then((res) => res.json());
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const categories = await getCategories();
  const category = await getCategoryDetail(params.slug);

  return (
    <CategoryDetailPage categories={categories} category={category} />
  )
}
