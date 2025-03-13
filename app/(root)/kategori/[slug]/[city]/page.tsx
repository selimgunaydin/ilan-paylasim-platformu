import React from "react";
import CategoryDetailPage from "@/views/category";

// API fonksiyonları aynı kalabilir
async function getCategories() {
  return fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`, {
    next: { revalidate: 60 },
  }).then((res) => res.json());
}

async function getCategoryDetail(slug: string) {
  return fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories/${slug}`, {
    next: { revalidate: 60 },
  }).then((res) => res.json());
}

async function getListings(
  categorySlug: string,
  city: string,
  page: number,
  search: string
) {
  return fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/listings?categorySlug=${categorySlug}&city=${city}&page=${page}&search=${search}`,
    {
      next: { revalidate: 60 },
    }
  ).then((res) => res.json());
}

// searchParams prop'unu ekliyoruz
export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { slug: string; city: string };
  searchParams: { page?: string; search?: string };
}) {
  const categories = await getCategories();
  const category = await getCategoryDetail(params.slug);

  const page = searchParams.page ? parseInt(searchParams.page) : 1;
  const search = searchParams.search || "";

  const listings = await getListings(
    params.slug,
    params.city,
    page,
    search
  ).then((res) => res.listings);

  return (
    <CategoryDetailPage
      categories={categories}
      category={category}
      listings={listings}
      params={params}
      searchParams={searchParams}
    />
  );
}
