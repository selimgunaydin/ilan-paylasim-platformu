import SearchView from "@/views/root/search";
import React, { Suspense } from "react";

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8 flex justify-center items-center h-64">
          Yükleniyor...
        </div>
      }
    >
      <SearchView />
    </Suspense>
  );
}
