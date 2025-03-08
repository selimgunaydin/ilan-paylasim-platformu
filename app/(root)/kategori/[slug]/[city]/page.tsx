'use client'

import React from 'react'
import CategoryDetail from '@/pages/category-detail'

export default function CategoryCityPage({ params }: { params: { slug: string, city: string } }) {
  return (
    <CategoryDetail />
  )
} 