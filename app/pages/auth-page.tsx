import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, type InsertUser } from "@shared/schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@app/components/ui/card";
import { Button } from "@app/components/ui/button";
import { Input } from "@app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@app/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@app/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@app/components/ui/tabs";
import { CheckCircle2, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import * as z from "zod";
import { Checkbox } from "@app/components/ui/checkbox";
import Link from "next/link";
import { getClientIp } from "@/utils/getIpAddress";
import { signIn, useSession } from "next-auth/react";
import { useState } from "react";

// NextAuth session tipini genişlet
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string;
      name?: string;
      emailVerified?: boolean | null;
      isAdmin?: boolean;
      type?: 'user' | 'admin';
      username?: string;
    }
  }
}

export default function AuthPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const location = useSearchParams();
  const verified = location.get("verified") === "true";
  const [showVerificationMessage, setShowVerificationMessage] =
    React.useState(false);
  const [activeTab, setActiveTab] = React.useState("login");
  const { toast } = useToast();

  React.useEffect(() => {
    if (session?.user?.emailVerified && !showVerificationMessage && !verified) {
      router.push("/dashboard");
    }
  }, [session, router, showVerificationMessage, verified]);

  return (
    <>
      <div className="min-h-screen flex items-center justify-center">
        <Card className="glass-card w-[350px]">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-primary">
              {verified ? "Email Doğrulandı!" : "Hoş Geldiniz"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {showVerificationMessage ? (
              <div className="text-center space-y-4">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
                <p className="text-lg font-medium text-gray-900">
                  Kayıt işleminiz başarıyla tamamlandı!
                </p>
                <p className="text-sm text-gray-600">
                  Üyeliğinizi e-posta adresinize gönderilen bağlantıyı
                  tıklayarak onayladıktan sonra sitemizi kullanmaya hemen
                  başlayabilirsiniz.
                </p>
              </div>
            ) : (
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-3 mb-4 bg-white/50">
                  <TabsTrigger
                    value="login"
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    Giriş
                  </TabsTrigger>
                  <TabsTrigger
                    value="register"
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    Kayıt
                  </TabsTrigger>
                  <TabsTrigger
                    value="forgot"
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    Şifre Sıfırla
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <LoginForm
                    onForgotPassword={() => setActiveTab("forgot")}
                  />
                </TabsContent>

                <TabsContent value="register">
                  <RegisterForm
                    onSubmit={async (data) => {
                      try {
                        const response = await fetch('/api/register', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify(data),
                        });
                        
                        if (response.ok) {
                          setShowVerificationMessage(true);
                        } else {
                          const errorData = await response.json();
                          toast({
                            title: "Kayıt başarısız",
                            description: errorData.message || "Bir hata oluştu",
                            variant: "destructive",
                          });
                        }
                      } catch (error) {
                        console.error("Registration error:", error);
                        toast({
                          title: "Kayıt başarısız",
                          description: "Bir hata oluştu",
                          variant: "destructive",
                        });
                      }
                    }}
                  />
                </TabsContent>

                <TabsContent value="forgot">
                  <ForgotPasswordForm />
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function LoginForm({
  onForgotPassword,
}: {
  onForgotPassword: () => void;
}) {
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();
  
  const form = useForm({
    resolver: zodResolver(
      z.object({
        username: z
          .string()
          .min(1, "Kullanıcı adı veya email gereklidir")
          .transform((val) => val.toLowerCase()),
        password: z.string().min(1, "Şifre gereklidir"),
      }),
    ),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const ip_address = await getClientIp();
      
      const result = await signIn("user-credentials", {
        username: data.username,
        password: data.password,
        ip_address,
        redirect: false,
        callbackUrl: "/dashboard"
      });
      
      if (result?.error) {
        toast({
          title: "Giriş başarısız",
          description: result.error,
          variant: "destructive",
        });
      } else if (result?.url) {
        router.push(result.url);
      }
    } catch (error) {
      toast({
        title: "Giriş başarısız",
        description: "Bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email veya Kullanıcı Adı</FormLabel>
              <FormControl>
                <Input {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Şifre</FormLabel>
              <FormControl>
                <Input type="password" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col space-y-2">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Giriş Yapılıyor...
              </>
            ) : (
              "Giriş Yap"
            )}
          </Button>
          <Button
            type="button"
            variant="link"
            className="text-sm text-muted-foreground"
            onClick={onForgotPassword}
            disabled={isLoading}
          >
            Şifremi Unuttum
          </Button>
        </div>
      </form>
    </Form>
  );
}

function ForgotPasswordForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm({
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: { email: string }) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Başarılı",
          description: result.message || "Şifre sıfırlama bağlantısı gönderildi.",
        });
        form.reset();
      } else {
        toast({
          title: "Hata",
          description: "Şifre sıfırlama isteği gönderilemedi.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Password reset request error:", error);
      toast({
        title: "Hata",
        description: "Şifre sıfırlama isteği gönderilemedi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} type="email" placeholder="ornek@email.com" disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Gönderiliyor...
            </>
          ) : (
            "Şifre Sıfırlama Bağlantısı Gönder"
          )}
        </Button>
      </form>
    </Form>
  );
}

// RegisterForm bileşeninde cinsiyet seçimi validasyonu ve görüntüleme ayarları
function RegisterForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [isLoading, setIsLoading] = React.useState(false);
  const form = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: false,
      gender: "",
    },
  });

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const ip_address = await getClientIp();
      await onSubmit({
        ...data,
        ip_address,
      });
    } catch (error) {
      console.error("Registration error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  console.log(form.formState.errors);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kullanıcı Adı</FormLabel>
              <FormControl>
                <Input {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cinsiyet</FormLabel>
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Cinsiyet seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Erkek</SelectItem>
                    <SelectItem value="female">Kadın</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Şifre</FormLabel>
              <FormControl>
                <Input type="password" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Şifre Tekrar</FormLabel>
              <FormControl>
                <Input type="password" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="terms"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  <Link
                    href="/kullanim-kosullari"
                    className="text-primary hover:underline"
                    target="_blank"
                  >
                    Kullanım koşullarını
                  </Link>{" "}
                  kabul ediyorum
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Kayıt Yapılıyor...
            </>
          ) : (
            "Kayıt Ol"
          )}
        </Button>
      </form>
    </Form>
  );
}
