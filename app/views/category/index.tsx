"use client";

import type { Category } from "@shared/schemas";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "@app/components/ui/select";
import { Button } from "@app/components/ui/button";

type City = {
  value: string;
  label: string;
};

type Props = {
  categories: Category[];
  category: Category;
  params: { slug: string; city?: string };
  searchParams: { page?: string; search?: string };
  cityList: City[];
};

export default function CategoryDetailClient({
  categories,
  category,
  params,
  searchParams,
  cityList,
}: Props) {

  return (
    <div className="mx-auto bg-white p-6 rounded-lg shadow-lg mb-8">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.target as HTMLFormElement;
          const category = form.category.value;
          const city = form.city.value;

          if (!category) return;

          const normalizedCity = city ? `/${decodeURIComponent(city.toLowerCase())}` : "";
          const url = `/kategori/${category}${normalizedCity}`;
          window.location.href = url;
        }}
        className="flex flex-col md:flex-row gap-4"
      >
        {/* Category Selection */}
        <div className="w-full md:flex-1">
          <Select defaultValue={params.slug} name="category" required>
            <SelectTrigger>
              <SelectValue placeholder="Kategori Seç" />
            </SelectTrigger>
            <SelectContent>
              {categories
                ?.filter((c) => !c.parentId)
                .map((mainCategory) => (
                  <SelectGroup key={mainCategory.id}>
                    <SelectLabel className="font-semibold text-sm text-gray-700">
                      {mainCategory.name}
                    </SelectLabel>
                    {categories
                      ?.filter((c) => c.parentId === mainCategory.id)
                      .map((subCategory) => (
                        <SelectItem key={subCategory.id} value={subCategory.slug}>
                          {subCategory.name}
                        </SelectItem>
                      ))}
                    <SelectSeparator />
                  </SelectGroup>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* City Selection */}
        <div className="w-full md:flex-1">
          <Select defaultValue={params.city} name="city">
            <SelectTrigger>
              <SelectValue placeholder="Tüm Şehirler" />
            </SelectTrigger>
            <SelectContent>
              {cityList.map((city) => (
                <SelectItem key={city.value} value={city.value}>
                  {city.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white px-8"
        >
          Ara
        </Button>
      </form>

      {/* Search Input */}
      <div className="w-full mt-4">
        <input
          type="search"
          placeholder="İlanlarda ara..."
          className="w-full  px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          defaultValue={searchParams.search || ""}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const searchQuery = e.currentTarget.value;
              const cityParam = params.city ? `/${params.city}` : "";
              const baseUrl = `/kategori/${params.slug}${cityParam}`;
              const searchParam = searchQuery.trim()
                ? `?search=${encodeURIComponent(searchQuery.trim())}`
                : "";
              window.location.href = baseUrl + searchParam;
            }
          }}
        />
      </div>
    </div>
  );
}