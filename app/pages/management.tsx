import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@app/components/ui/card";
import { Button } from "@app/components/ui/button";
import { Input } from "@app/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@app/components/ui/form";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useAdminAuth } from "@/hooks/use-admin-auth";

export default function ManagementLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { loginMutation, admin } = useAdminAuth();

  const form = useForm({
    defaultValues: {
      username: "",
      password: ""
    }
  });

  // Admin zaten giriş yapmışsa ana sayfaya yönlendir
  React.useEffect(() => {
    if (admin) {
      router.push('/yonetim/anasayfa');
    }
  }, [admin, router]);

  const handleSubmit = async (values: any) => {
    try {
      await loginMutation.mutateAsync(values);
      // Not: Yönlendirme artık loginMutation.onSuccess'de yapılıyor
    } catch (err) {
      console.error("Login error:", err);
      toast({
        title: "Hata",
        description: "Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
      <Card className="w-[400px] bg-white/30 backdrop-blur-md border border-white/20 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Yönetim Paneli Girişi</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                rules={{ required: "Kullanıcı adı zorunludur" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kullanıcı Adı</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                rules={{ required: "Şifre zorunludur" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Şifre</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full">
                Giriş Yap
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}