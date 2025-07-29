'use client'

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@app/components/ui/card";
import { useToast } from "@app/hooks/use-toast";

export default function VerifyEmailView() {
  const router = useRouter();
  const { toast } = useToast();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const token = new URLSearchParams(window.location.search).get("token");
        if (!token) {
          toast({
            title: "Hata",
            description: "Doğrulama token'ı bulunamadı",
            variant: "destructive",
          });
          setVerifying(false);
          return;
        }

        const response = await fetch(`/api/verify-email?token=${token}`);
        const data = await response.json();

        if (response.ok) {
          setVerified(true);
          toast({
            title: "Başarılı",
            description: "Email adresiniz başarıyla doğrulandı",
          });
          // 2 saniye sonra auth sayfasına yönlendir
          setTimeout(() => {
            router.push("/auth");
          }, 2000);
        } else {
          toast({
            title: "Hata",
            description: data.error || "Email doğrulama işlemi başarısız oldu",
            variant: "destructive",
          });
          setTimeout(() => {
            router.push("/auth");
          }, 2000);
        }
      } catch (error) {
        toast({
          title: "Hata",
          description: "Email doğrulama sırasında bir hata oluştu",
          variant: "destructive",
        });
        setTimeout(() => {
          router.push("/auth");
        }, 2000);
      } finally {
        setVerifying(false);
      }
    };

    verifyEmail();
  }, [toast, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-[400px] bg-white/30 backdrop-blur-md border border-white/20 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Email Doğrulama</CardTitle>
        </CardHeader>
        <CardContent>
          {verifying ? (
            <p className="text-center">Email adresiniz doğrulanıyor...</p>
          ) : verified ? (
            <p className="text-center text-green-600">
              Email adresiniz başarıyla doğrulandı. Giriş sayfasına yönlendiriliyorsunuz...
            </p>
          ) : (
            <p className="text-center text-red-600">
              Email doğrulama başarısız oldu. Giriş sayfasına yönlendiriliyorsunuz...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}