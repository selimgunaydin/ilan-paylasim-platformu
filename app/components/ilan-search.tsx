'use client'
import Link from "next/link";
import { Button } from "@app/components/ui/button";
import { Input } from "@app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectLabel,
  SelectSeparator,
  SelectGroup,
} from "@app/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Category } from "@shared/schemas";
import { getQueryFn } from "@/lib/queryClient";
import cityList from "../../public/city-list.json";

// Category tipini genişleterek listingCount özelliğini ekleyelim
interface CategoryWithCount extends Category {
  listingCount?: number;
}

export default function IlanSearch({ categories }: { categories: CategoryWithCount[] }) {
  const mainCategories = categories.filter((c) => !c.parentId);
  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-lg">
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const category = form.category.value;
        const city = form.city.value;

        if (!category) return;

        const url = `/kategori/${category}${city ? `/${city}` : ""}`;
        window.location.href = url;
      }}
      className="flex flex-col md:flex-row gap-4"
    >
      <div className="w-full md:flex-1">
        <Select name="category" required>
          <SelectTrigger>
            <SelectValue placeholder="Kategori Seç" />
          </SelectTrigger>
          <SelectContent>
            {mainCategories.map((mainCategory) => (
              <SelectGroup key={mainCategory.id}>
                <SelectLabel className="font-semibold text-sm text-gray-700">
                  {mainCategory.name}
                </SelectLabel>
                {categories
                  ?.filter((c) => c.parentId === mainCategory.id)
                  .map((subCategory) => (
                    <SelectItem
                      key={subCategory.id}
                      value={subCategory.slug}
                    >
                      {subCategory.name}
                      {subCategory.listingCount && subCategory.listingCount > 0 && (
                        <span className="ms-2">
                          ({subCategory.listingCount})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                <SelectSeparator />
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="w-full md:flex-1">
        <Select name="city">
          <SelectTrigger>
            <SelectValue placeholder="Tüm Şehirler" />
          </SelectTrigger>
          <SelectContent>
            {cityList.cities.map((city) => (
              <SelectItem key={city.value} value={city.value}>
                {city.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        type="submit"
        className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white px-8"
      >
        Ara
      </Button>
    </form>
  </div>
  )
}
