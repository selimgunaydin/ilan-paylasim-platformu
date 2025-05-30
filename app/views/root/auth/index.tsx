'use client'

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import type { RootState } from '@/redux/store'; 
import { clearAuthMessages, setAuthError } from '@/redux/slices/authSlice'; 
import { resendVerificationEmail as resendVerificationEmailThunk } from '@/redux/thunks/authThunks';
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
// import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import * as z from "zod";
import { Checkbox } from "@app/components/ui/checkbox";
import Link from "next/link";
import { getClientIp } from "@/utils/getIpAddress";
import { useRecaptchaToken } from '@/components/ReCaptcha';
import { signIn, useSession } from "next-auth/react";
import { useState } from "react";
import { TermsModal } from "@/components/TermsModal";
import { Suspense } from "react";
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

function AuthContent() {
  const location = useSearchParams();
  const verified = location.get("verified") === "true";
  const [activeTab, setActiveTab] = React.useState("login");
  const { toast } = useToast();
  const router = useRouter();
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
                          router.push('/auth/success');
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
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default function AuthView() {
 
  return (
  <Suspense fallback={<div>Loading...</div>}>
    <AuthContent />
  </Suspense>
  );
}

function LoginForm({
  onForgotPassword,
}: {
  onForgotPassword: () => void;
}) {
  // Lokal state sadece ana giriş işlemi için
  const [isLoading, setIsLoading] = React.useState(false); 
  const { toast } = useToast();
  const router = useRouter();

  // Redux hook'ları
  const dispatch = useAppDispatch();
  const {
    loading: authLoading, // auth slice'ın yüklenme durumu (e-posta yeniden gönderme için)
    successMessage: authSuccessMessage,
    errorMessage: authErrorMessage,
  } = useAppSelector((state: RootState) => state.auth);

  // E-posta doğrulaması UI kontrolü için lokal state'ler
  const [showResendLink, setShowResendLink] = React.useState(false);
  const [emailForResend, setEmailForResend] = React.useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = React.useState(0); // Geri sayım için state
  const resendTimerRef = React.useRef<NodeJS.Timeout | null>(null); // Timer referansı
  
  // Form şeması
  const formSchema = z.object({
    username: z
      .string()
      .min(1, "Kullanıcı adı veya email gereklidir")
      .transform((val) => val.toLowerCase()),
    password: z.string().min(1, "Şifre gereklidir"),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Geri sayım için useEffect
  React.useEffect(() => {
    if (resendCooldown > 0) {
      resendTimerRef.current = setTimeout(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    } else if (resendTimerRef.current) {
      clearTimeout(resendTimerRef.current);
    }
    
    return () => {
      if (resendTimerRef.current) {
        clearTimeout(resendTimerRef.current);
      }
    };
  }, [resendCooldown]);

  // Redux mesajlarını izlemek ve toast göstermek için useEffect
  React.useEffect(() => {
    if (authSuccessMessage) {
      toast({
        title: "Başarılı",
        description: authSuccessMessage,
      });
      dispatch(clearAuthMessages()); // Mesajı temizle
      setShowResendLink(false); // Başarılı gönderim sonrası linki gizle
      setEmailForResend(null);
      form.clearErrors("root"); // Genel form hatasını da temizle
    }
    if (authErrorMessage) {
      toast({
        title: "Hata",
        description: authErrorMessage,
        variant: "destructive",
      });
      dispatch(clearAuthMessages()); // Mesajı temizle
    }
  }, [authSuccessMessage, authErrorMessage, dispatch, toast, form]);

  const getRecaptchaToken = useRecaptchaToken('login');

const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    dispatch(clearAuthMessages()); // Önceki auth mesajlarını temizle
    setShowResendLink(false); // Her yeni girişte yeniden gönderme linkini gizle
    setEmailForResend(null);

    try {
      const ip_address = await getClientIp();
      // reCAPTCHA token al
      console.log('reCAPTCHA token alınıyor...');
      const recaptchaToken = await getRecaptchaToken();
      
      if (!recaptchaToken) {
        console.log('reCAPTCHA token alınamadı!');
        form.setError("root", { type: "manual", message: "Lütfen reCAPTCHA doğrulamasını tamamlayın." });
        setIsLoading(false);
        return;
      }
      
      const result = await signIn("user-credentials", {
        username: data.username,
        password: data.password,
        ip_address,
        recaptchaToken,
        redirect: false,
        callbackUrl: "/"
      });
      
      if (result?.error) {
        const errorMsg = result.error;
        console.log('Giriş hatası:', errorMsg);
        form.setError("root", { type: "manual", message: errorMsg });

        // E-posta doğrulama hatası mı kontrol et (tek bir yerden)
        if (errorMsg.toLowerCase().includes("doğrula") || 
            errorMsg.toLowerCase().includes("verify") ||
            errorMsg.toLowerCase().includes("email not verified") ||
            errorMsg.toLowerCase().includes("e-postanızı doğrulayın")) {
          setShowResendLink(true);
          setEmailForResend(data.username); // Kullanıcı adı alanı e-posta içerebilir
        }
      } else if (result?.url) {
        window.location.href = result.url; // veya router.push(result.url)
      } else {
        // Başarılı giriş ama URL yoksa (genellikle olmaz ama önlem)
        router.push("/");
      }
    } catch (error) {
      const generalError = "Giriş sırasında beklenmedik bir hata oluştu.";
      form.setError("root", { type: "manual", message: generalError });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = () => { // async olmasına gerek yok, thunk zaten async
    if (!emailForResend || resendCooldown > 0) return; // Geri sayım aktifse gönderme
    
    dispatch(resendVerificationEmailThunk({ email: emailForResend }))
      .unwrap()
      .then(() => {
        // Başarılı API yanıtı sonrası geri sayımı başlat
        setResendCooldown(60); // 60 saniye geri sayım
        toast({
          title: "Bilgi",
          description: "Doğrulama e-postası için 1 dakika beklemelisiniz.",
        });
      })
      .catch(() => {
        // Hata durumu - toast zaten Redux useEffect'inde gösteriliyor
      });
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
                <Input {...field} disabled={isLoading || authLoading} />
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
                <Input type="password" {...field} disabled={isLoading || authLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Giriş formu genel hatası (e-posta doğrulama linki gösterilmiyorsa) */}
        {form.formState.errors.root && !showResendLink && (
          <div className="text-sm font-medium text-destructive">
            {form.formState.errors.root.message}
          </div>
        )}

        {/* E-posta Yeniden Gönderme Bölümü (tek bir tane olmalı) */}
        {showResendLink && emailForResend && (
          <div className="space-y-2 my-4">
            <p className="text-sm text-destructive">
              E-postanızı henüz doğrulamadınız.
            </p>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleResendVerification} // Redux thunk'ını çağıran fonksiyon
              disabled={authLoading || isLoading || resendCooldown > 0} // Geri sayım
            >
              {authLoading ? ( 
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gönderiliyor...</>
              ) : resendCooldown > 0 ? (
                `Tekrar Gönder (${resendCooldown}s)`
              ) : (
                "Doğrulama E-postasını Tekrar Gönder"
              )}
            </Button>
          </div>
        )}
        
        <div className="flex flex-col space-y-2">
          <Button type="submit" className="w-full" disabled={isLoading || authLoading}>
            {(isLoading || authLoading) ? ( // Basitleştirilmiş yüklenme durumu
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isLoading ? "Giriş Yapılıyor..." : "İşleniyor..."} 
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
            disabled={isLoading || authLoading}
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
    resolver: zodResolver(
      z.object({
        username: z.string().min(1, "Kullanıcı adı gereklidir"),
        email: z.string().email("Geçerli bir email adresi giriniz"),
        password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
        confirmPassword: z.string(),
        gender: z.string().min(1, "Cinsiyet seçimi gereklidir"),
        terms: z.boolean().refine((val) => val === true, {
          message: "Kullanım koşullarını kabul etmelisiniz",
        }),
      }).refine((data) => data.password === data.confirmPassword, {
        message: "Şifreler eşleşmiyor",
        path: ["confirmPassword"],
      })
    ),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      gender: "",
      terms: false,
    },
  });

  const handleSubmit = async (data: any) => {
    if (!data.terms) {
      form.setError("terms", {
        type: "manual",
        message: "Kullanım koşullarını kabul etmelisiniz",
      });
      return;
    }

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
                  <TermsModal>
                    <span className="text-primary hover:underline cursor-pointer">
                      Kullanım koşullarını
                    </span>
                  </TermsModal>
                  {" "}kabul ediyorum
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
