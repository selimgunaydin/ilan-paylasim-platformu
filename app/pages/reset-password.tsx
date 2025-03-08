import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@app/components/ui/card";
import { Button } from "@app/components/ui/button";
import { Input } from "@app/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@app/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const token = new URLSearchParams(window.location.search).get("token");

  const form = useForm({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  React.useEffect(() => {
    if (!token) {
      router.push("/auth");
      toast({
        title: "Hata",
        description: "Geçersiz şifre sıfırlama bağlantısı",
        variant: "destructive",
      });
    }
  }, [token, router, toast]);

  const onSubmit = async (data: { password: string; confirmPassword: string }) => {
    if (data.password !== data.confirmPassword) {
      toast({
        title: "Hata",
        description: "Şifreler eşleşmiyor",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await apiRequest("POST", "/api/reset-password", {
        token,
        password: data.password,
      });
      
      const result = await response.json();
      
      toast({
        title: "Başarılı",
        description: result.message,
      });
      
      // Yönlendir
      setTimeout(() => {
        router.push("/auth");
      }, 2000);
    } catch (error) {
      console.error("Password reset error:", error);
      toast({
        title: "Hata",
        description: error instanceof Error ? error.message : "Şifre sıfırlama işlemi başarısız oldu",
        variant: "destructive",
      });
    }
  };

  if (!token) return null;

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Yeni Şifre Belirleme</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                rules={{ required: "Şifre gereklidir" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Yeni Şifre</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                rules={{ required: "Şifre tekrarı gereklidir" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Şifre Tekrarı</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full">
                Şifremi Güncelle
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
