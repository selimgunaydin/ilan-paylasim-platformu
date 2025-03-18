'use client'

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter, useParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@app/components/ui/button";
import { Input } from "@app/components/ui/input";
import { Textarea } from "@app/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@app/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@app/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@app/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@app/components/ui/radio-group";
import type { Category, Listing } from "@shared/schemas";
import { turkishCities } from "@/lib/constants";
import { queryClient } from "@/lib/queryClient";
import { useSession } from "next-auth/react";

export default function EditListing() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { data: session } = useSession();
  const router = useRouter();

  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      city: "",
      categoryId: "",
      contactPerson: "",
      phone: "",
      listingType: "standard",
      images: undefined as FileList | undefined,
    },
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => fetch("/api/categories").then((res) => res.json()),
  });

  // Query to check user's status including used_free_ad
  const { data: userData } = useQuery({
    queryKey: ["user-status"],
    queryFn: async () => {
      const response = await fetch("/api/user/status");
      if (!response.ok) throw new Error("Failed to fetch user status");
      return response.json();
    },
  });

  // Fetch listing details
  const { data: listing, isLoading: isLoadingListing } = useQuery<Listing>({
    queryKey: ["listing", id],
    queryFn: async () => {
      const response = await fetch(`/api/listings/${id}`);
      if (!response.ok) {
        throw new Error("İlan bulunamadı");
      }
      return response.json();
    },
    enabled: !!id,
  });

  // Redirect if listing is not editable
  useEffect(() => {
    if (listing && !isLoadingListing) {
      // Kullanıcı kontrolü
      if (!session?.user || listing.userId !== Number(session.user.id)) {
        toast({
          title: "Hata",
          description: "Bu ilanı düzenleme yetkiniz yok",
          variant: "destructive",
        });
        router.push("/dashboard");
        return;
      }

      // İlan düzenleme kontrolü
      const isRejected = !listing.approved && !listing.active;
      const isExpired = listing.approved && !listing.active;

      if (!isRejected && !isExpired) {
        toast({
          title: "Hata",
          description: "Sadece reddedilmiş veya süresi dolmuş ilanlar düzenlenebilir",
          variant: "destructive",
        });
        router.push("/dashboard");
        return;
      }

      // If user has used their free listing, force premium type
      if (userData?.used_free_ad === 1) {
        form.setValue("listingType", "premium");
      }

      // Form değerlerini set et
      form.reset({
        title: listing.title,
        description: listing.description,
        city: listing.city,
        categoryId: String(listing.categoryId),
        contactPerson: listing.contactPerson || "",
        phone: listing.phone || "",
        listingType: userData?.used_free_ad === 1 ? "premium" : listing.listingType,
      });
    }
  }, [listing, session?.user, form, isLoadingListing, userData]);

  const updateMutation = useMutation({
    mutationFn: async (values: any) => {
      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("description", values.description);
      formData.append("city", values.city);
      formData.append("categoryId", values.categoryId);
      formData.append("listingType", values.listingType);
      formData.append("contactPerson", values.contactPerson || "");
      formData.append("phone", values.phone || "");

      if (values.images) {
        Array.from(values.images as FileList).forEach((file: File) => {
          formData.append("images", file);
        });
      }

      const response = await fetch(`/api/listings/${id}`, {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "İlan güncellenemedi");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate both user listings and pending listings queries
      queryClient.invalidateQueries({ queryKey: ["pending-listings"] });
      queryClient.invalidateQueries({ queryKey: ["listings", "user"] });

      toast({
        title: "Başarılı",
        description: "İlan güncellendi ve onay için gönderildi",
      });
      router.push("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (values: any) => {
    try {
      if (!values.categoryId || !values.title || !values.description || !values.city) {
        throw new Error("Zorunlu alanları doldurunuz");
      }

      // Additional validation for listing type
      if (userData?.used_free_ad === 1 && values.listingType === "standard") {
        throw new Error("Ücretsiz ilan hakkınızı kullandığınız için sadece öncelikli (premium) ilan verebilirsiniz");
      }

      await updateMutation.mutateAsync(values);
    } catch (error: any) {
      console.error("Form submission error:", error);
      toast({
        title: "Hata",
        description: error.message || "İlan güncellenirken bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  if (isLoadingListing) {
    return <div className="p-8 text-center">Yükleniyor...</div>;
  }

  if (!listing) {
    return <div className="p-8 text-center">İlan bulunamadı</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <header className="bg-white/30 backdrop-blur-md border-b border-white/20 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">İlanı Düzenle</h1>
        </div>
      </header>
      <div className="container mx-auto px-4 py-8">
        <Card className="bg-white/30 backdrop-blur-md border border-white/20 shadow-lg rounded-xl max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>İlanı Düzenle</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                {userData?.used_free_ad === 1 && (
                  <div className="bg-yellow-50 p-4 rounded-md mb-4">
                    <p className="text-yellow-800">
                      Ücretsiz ilan hakkınızı kullandığınız için sadece öncelikli (premium) ilan verebilirsiniz.
                    </p>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="title"
                  rules={{ required: "İlan başlığı zorunludur" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>İlan Başlığı</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  rules={{ required: "İlan detayı zorunludur" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>İlan Detayı</FormLabel>
                      <FormControl>
                        <Textarea {...field} className="min-h-[200px]" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  rules={{ required: "Şehir seçimi zorunludur" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Şehir</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Şehir seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {turkishCities.map((city) => (
                            <SelectItem key={city} value={city}>
                              {city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="categoryId"
                  rules={{ required: "Kategori seçimi zorunludur" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategori</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Kategori seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map((category) => (
                            <SelectItem
                              key={category.id}
                              value={String(category.id)}
                            >
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactPerson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>İlgili Kişi</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefon</FormLabel>
                      <FormControl>
                        <Input {...field} type="tel" />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="images"
                  render={({ field: { onChange, value, ...field } }) => (
                    <FormItem>
                      <FormLabel>Resimler (Opsiyonel)</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          multiple
                          accept="image/jpeg,image/png,image/webp,image/svg+xml"
                          onChange={(e) => onChange(e.target.files)}
                          {...field}
                        />
                      </FormControl>
                      <p className="text-sm text-muted-foreground">
                        Maksimum 5 adet resim yükleyebilirsiniz (her biri max. 1MB)
                      </p>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="listingType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Listeleme Türü</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                          disabled={userData?.used_free_ad === 1}
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem 
                                value="standard" 
                                disabled={userData?.used_free_ad === 1}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Standart Listeleme (Ücretsiz)
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="premium" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Öncelikli Listeleme (Ücretli)
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit"
                  disabled={updateMutation.isPending}
                >
                  İlanı Güncelle
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}