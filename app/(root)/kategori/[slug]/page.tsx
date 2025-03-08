'use client'

import React from 'react'
import CategoryDetail from '@/pages/category-detail'

export default function CategoryDetailPage({ params }: { params: { slug: string } }) {
  return (
    <CategoryDetail />
  )
} 