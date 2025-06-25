"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { insertSiteSettingsSchema, SiteSettings } from "@shared/schemas";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@app/components/ui/form";
import { Input } from "@app/components/ui/input";
import { Button } from "@app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@app/components/ui/card";
import { Textarea } from "@app/components/ui/textarea";
import { Save, Check, Upload } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
type FormData = z.infer<typeof insertSiteSettingsSchema>;

export default function SiteSettingsPage({
  settings,
}: {
  settings: SiteSettings;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  // Form setup
  const form = useForm<FormData>({
    resolver: zodResolver(insertSiteSettingsSchema),
    defaultValues: {
      site_name: settings.site_name,
      site_logo: settings.site_logo || "",
      site_favicon: settings.site_favicon || "",
      home_title: settings.home_title,
      home_description: settings.home_description,
      contact_email: settings.contact_email,
      contact_phone: settings.contact_phone,
      contact_address: settings.contact_address,
      footer_text: settings.footer_text,
      facebook_url: settings.facebook_url || "",
      twitter_url: settings.twitter_url || "",
      instagram_url: settings.instagram_url || "",
      linkedin_url: settings.linkedin_url || "",
      youtube_url: settings.youtube_url || "",
      user_cleanup_months: settings.user_cleanup_months || 12,
    },
  });

  // Update settings mutation
  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch("/api/admin/site-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Ayarlar güncellenirken bir hata oluştu"
        );
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Site ayarları başarıyla güncellendi",
        duration: 3000,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/site-settings"] });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description:
          error instanceof Error
            ? error.message
            : "Ayarlar güncellenirken bir hata oluştu",
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  // Form submission handler
  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  // Logo yükleme fonksiyonu
  const handleLogoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }

    const file = event.target.files[0];
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "logo");

      const response = await fetch("/api/admin/upload-logo", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Logo yüklenirken bir hata oluştu");
      }

      const data = await response.json();

      // Form'daki logo URL'sini güncelle
      form.setValue("site_logo", data.url);
      toast({
        title: "Logo yüklendi",
        description: "Logo başarıyla yüklendi ve form güncellendi.",
        duration: 3000,
      });
    } catch (error) {
      console.error("Logo yükleme hatası:", error);
      toast({
        title: "Hata",
        description:
          error instanceof Error
            ? error.message
            : "Logo yüklenirken bir hata oluştu",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setUploading(false);
    }
  };

  // Favicon yükleme fonksiyonu
  const handleFaviconUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }

    const file = event.target.files[0];
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "favicon");

      const response = await fetch("/api/admin/upload-logo", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Favicon yüklenirken bir hata oluştu");
      }

      const data = await response.json();

      // Form'daki favicon URL'sini güncelle
      form.setValue("site_favicon", data.url);
      toast({
        title: "Favicon yüklendi",
        description: "Favicon başarıyla yüklendi ve form güncellendi.",
        duration: 3000,
      });
    } catch (error) {
      console.error("Favicon yükleme hatası:", error);
      toast({
        title: "Hata",
        description:
          error instanceof Error
            ? error.message
            : "Favicon yüklenirken bir hata oluştu",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 container">
      <h1 className="text-2xl font-bold">Site Ayarları</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Genel Site Ayarları */}
          <Card>
            <CardHeader>
              <CardTitle>Genel Ayarlar</CardTitle>
              <CardDescription>
                Sitenin genel bilgilerini ve görünümünü yapılandırın
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="site_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site Adı</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="site_logo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo URL</FormLabel>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                      </div>
                      <div>
                        <label htmlFor="logo-upload" className="w-full">
                          <div
                            className={`flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md cursor-pointer ${uploading
                                ? "bg-gray-100"
                                : "bg-white hover:bg-gray-50"
                              }`}
                          >
                            {uploading ? (
                              <span className="flex items-center text-sm">
                                <Upload className="w-4 h-4 mr-2 animate-pulse" />
                                Yükleniyor...
                              </span>
                            ) : (
                              <span className="flex items-center text-sm">
                                <Upload className="w-4 h-4 mr-2" />
                                Logo Yükle
                              </span>
                            )}
                          </div>
                          <input
                            id="logo-upload"
                            type="file"
                            className="hidden"
                            onChange={handleLogoUpload}
                            accept="image/jpeg,image/png,image/webp,image/svg+xml"
                            disabled={uploading}
                          />
                        </label>
                      </div>
                    </div>
                    <FormMessage />
                    {field.value && (
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground mb-1">
                          Önizleme:
                        </p>
                        <Image
                          src={field.value}
                          alt="Site Logo"
                          width={200}
                          height={80}
                          className="border rounded p-2 bg-white"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/placeholder-logo.png";
                          }}
                        />
                      </div>
                    )}
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="site_favicon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Favicon URL</FormLabel>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                      </div>
                      <div>
                        <label htmlFor="favicon-upload" className="w-full">
                          <div
                            className={`flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md cursor-pointer ${uploading
                                ? "bg-gray-100"
                                : "bg-white hover:bg-gray-50"
                              }`}
                          >
                            {uploading ? (
                              <span className="flex items-center text-sm">
                                <Upload className="w-4 h-4 mr-2 animate-pulse" />
                                Yükleniyor...
                              </span>
                            ) : (
                              <span className="flex items-center text-sm">
                                <Upload className="w-4 h-4 mr-2" />
                                Favicon Yükle
                              </span>
                            )}
                          </div>
                          <input
                            id="favicon-upload"
                            type="file"
                            className="hidden"
                            onChange={handleFaviconUpload}
                            accept="image/jpeg,image/png,image/webp,image/svg+xml,image/x-icon,image/vnd.microsoft.icon"
                            disabled={uploading}
                          />
                        </label>
                      </div>
                    </div>
                    <FormMessage />
                    {field.value && (
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground mb-1">
                          Önizleme:
                        </p>
                        <div className="border rounded p-2 inline-block bg-white">
                          <Image
                            src={field.value}
                            alt="Favicon"
                            width={32}
                            height={32}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "/favicon.ico";
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* SEO Ayarları */}
          <Card>
            <CardHeader>
              <CardTitle>SEO Ayarları</CardTitle>
              <CardDescription>
                Ana sayfa başlığı ve açıklaması gibi SEO bilgilerini düzenleyin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="home_title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ana Sayfa Başlığı</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="home_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ana Sayfa Açıklaması</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Ana sayfa meta açıklaması"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* İletişim Bilgileri */}
          <Card>
            <CardHeader>
              <CardTitle>İletişim Bilgileri</CardTitle>
              <CardDescription>
                Ziyaretçilerin göreceği iletişim bilgilerini düzenleyin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="contact_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-posta Adresi</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contact_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefon Numarası</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contact_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adres</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Tam adres bilgileri"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Alt Bilgi ve Sosyal Medya */}
          <Card>
            <CardHeader>
              <CardTitle>Alt Bilgi ve Sosyal Medya</CardTitle>
              <CardDescription>
                Site alt bilgi metni ve sosyal medya bağlantılarını düzenleyin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="footer_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alt Bilgi Metni</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="facebook_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Facebook URL</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="twitter_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Twitter URL</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="instagram_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instagram URL</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="linkedin_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn URL</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="youtube_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>YouTube URL</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Sistem Ayarları */}
          <Card>
            <CardHeader>
              <CardTitle>Sistem Ayarları</CardTitle>
              <CardDescription>
                Platformun otomatik davranışlarını yönetin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="user_cleanup_months"
                render={({ field }) => {
                  const cleanupMonths = form.watch('user_cleanup_months');
                  const warningMonth = cleanupMonths > 1 ? cleanupMonths - 1 : 0;

                  return (
                    <FormItem>
                      <FormLabel>Otomatik Kullanıcı Verileri Temizleme Süresi (Ay)</FormLabel>
                      <div className="flex items-center gap-4">
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="2-20 arası"
                            min={2}
                            max={20}
                            className="max-w-[120px]"
                            {...field}
                            onChange={event => field.onChange(parseInt(event.target.value, 10) || 0)}
                          />
                        </FormControl>
                        {warningMonth > 0 && (
                          <div className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md">
                            Uyarı e-postası <strong>{warningMonth}. ayda</strong> gönderilir.
                          </div>
                        )}
                      </div>
                      <FormDescription>
                        Kullanıcılar, seçilen süre boyunca inaktif kalırlarsa verileri (ilanlar, mesajlar vb.) otomatik olarak silinir.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="w-full md:w-auto"
            >
              {mutation.isPending ? (
                <>
                  <Save className="mr-2 h-4 w-4 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Ayarları Kaydet
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
