'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useRecaptchaToken } from '@/components/ReCaptcha';
import { Button } from "@app/components/ui/button";
import { Input } from "@app/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@app/components/ui/card";
import { Label } from "@app/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminView() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const getRecaptchaToken = useRecaptchaToken('admin_login');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // ESKİ YÖNTEM: Ayrı admin provider'ı ile giriş (Yorumda kalmalı)
      // const result = await signIn("admin-credentials", {
      //   username,
      //   password,
      //   redirect: false,
      //   callbackUrl: "/yonetim/anasayfa"
      // });

      // YENİ YÖNTEM: Tek user provider'ı ile giriş (isAdmin kontrolü authOptions'da)
      const recaptchaToken = await getRecaptchaToken();
      if (!recaptchaToken) {
        toast({
          title: "Güvenlik doğrulaması başarısız",
          description: "Lütfen reCAPTCHA doğrulamasını tamamlayın ve tekrar deneyin.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const result = await signIn("user-credentials", {
        username,
        password,
        recaptchaToken,
        redirect: false,
        callbackUrl: "/yonetim/anasayfa" // Admin paneline yönlendirme
      });

      if (result?.error) {
        toast({
          title: "Giriş başarısız",
          description: result.error,
          variant: "destructive",
        });
      } else if (result?.url) {
        // Başarılı giriş sonrası yönlendirme
        // router.push(result.url) yerine window.location.href kullanılmış,
        // Next.js 13+ App Router'da router.push daha iyi olabilir.
        // Ancak mevcut çalışan yapı buysa şimdilik dokunmayalım.
        window.location.href = result.url;
      }
    } catch (error) {
      console.error("Giriş sırasında bir hata oluştu:", error);
      toast({
        title: "Giriş başarısız",
        description: "Bilinmeyen bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Yönetici Girişi</CardTitle>
          <CardDescription>
            Yönetim paneline erişmek için giriş yapın
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Kullanıcı Adı</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Giriş yapılıyor...
                </>
              ) : (
                "Giriş Yap"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}