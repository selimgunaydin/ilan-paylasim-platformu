import AdminView from "@/views/admin/auth";
import React from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/api/auth/auth-options";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    // session.user.type NextAuth tip tanımında olmayabilir, gerekirse eklenmeli
    if (session.user && session.user.type === 'admin') {
      redirect("/yonetim/anasayfa");
    } else {
      // Oturum var ama admin değilse, ana sayfaya yönlendir
      redirect("/"); 
    }
  }
  // Oturum yoksa giriş formunu (AdminView) göster
  return <AdminView />;
}
