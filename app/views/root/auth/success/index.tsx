"use client";

import { Button } from "@app/components/ui/button";
import { Badge, CheckCircle2 } from "lucide-react";
import React from "react";
import Link from "next/link";
import { cn } from "@/utils";
export default function AuthSuccessView() {
  return (
    <div className="text-center space-y-4 h-screen flex flex-col justify-center items-center">
      <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
      <p className="text-lg font-medium text-gray-900">
        Kayıt işleminiz başarıyla tamamlandı!
      </p>
      <p className="text-sm text-gray-600">
        Üyeliğinizi e-posta adresinize gönderilen bağlantıyı tıklayarak
        onayladıktan sonra sitemizi kullanmaya hemen başlayabilirsiniz.
      </p>
      <Link
        href="/auth"
        className={cn(
          "flex border-2 border-gray-300 items-center gap-2 px-8 py-2 rounded-full text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200"
        )}
      >
        <span>Giriş Yap</span>
      </Link>
    </div>
  );
}
