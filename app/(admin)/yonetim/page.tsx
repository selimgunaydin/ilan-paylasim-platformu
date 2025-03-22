import AdminView from "@/views/admin/auth";
import React from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/api/auth/auth-options";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect("/yonetim/anasayfa");
  }
  return <AdminView />;
}
