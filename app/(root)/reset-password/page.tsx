'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResetPasswordForm } from "./reset-password-form";

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token: string };
}) {
  const { token } = searchParams;

  if (!token) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Hata</CardTitle>
            <CardDescription>
              Geçersiz veya eksik şifre sıfırlama bağlantısı. Lütfen yeni bir şifre sıfırlama talebinde bulunun.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Şifre Sıfırlama</CardTitle>
          <CardDescription>
            Lütfen yeni şifrenizi belirleyin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResetPasswordForm token={token} />
        </CardContent>
      </Card>
    </div>
  );
} 