import AdminView from "@/views/admin/auth";
import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect("/yonetim/anasayfa");
  }
  return <AdminView />;
}
