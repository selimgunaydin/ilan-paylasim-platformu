import React from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/api/auth/[...nextauth]/route";
import { headers } from "next/headers";
import MyListings from "@/views/root/my-listings";

export async function generateMetadata() {
  return {
    title: "İlanlarım",
    description: "İlanlarım sayfası",
  };
}

async function getListings() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth");
  }

  const headersList = headers();
  const cookies = headersList.get("cookie");

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/listings/user`,
    {
      headers: {
        Cookie: cookies || "",
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error("İlanlar getirilemedi");
  }

  return res.json();
}

export default async function DashboardPage() {
  const listings = await getListings();

  return <MyListings initialListings={listings} />;
}
