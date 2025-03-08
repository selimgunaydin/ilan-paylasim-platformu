'use client'

import * as React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest, getQueryFn } from "@/lib/queryClient";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@app/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@app/components/ui/card";
import { Input } from "@app/components/ui/input";
import { Button } from "@app/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@app/components/ui/select";
import { Switch } from "@app/components/ui/switch";
import { insertPaymentSettingsSchema } from "@shared/schema";
import type { PaymentSettingsResponse } from "@/types/payment";
import type { z } from "zod";

type FormData = z.infer<typeof insertPaymentSettingsSchema>;

const defaultValues: FormData = {
  premium_listing_price: 0,
  listing_duration: 30,
  premium_member_price: 0,
  default_payment_gateway: 'paytr',
  paytr_merchant_id: '',
  paytr_secret_key: '',
  paytr_merchant_key: '',
  paytr_sandbox: true,
  iyzico_api_key: '',
  iyzico_secret_key: '',
  iyzico_base_url: 'https://sandbox-api.iyzipay.com',
  stripe_public_key: '',
  stripe_secret_key: '',
  stripe_webhook_secret: '',
  stripe_currency: 'try'
};

export default function PaymentSettingsPage() {
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(insertPaymentSettingsSchema),
    defaultValues
  });

  const { data: settings, isLoading, error } = useQuery<PaymentSettingsResponse>({
    queryKey: ['/api/admin/payment-settings'],
    queryFn: getQueryFn(),
    retry: false
  });

  React.useEffect(() => {
    if (settings) {
      console.log('Veritabanından gelen ayarlar:', settings);
      // Null değerleri varsayılan değerlerle değiştir
      const formData = {
        premium_listing_price: settings.premium_listing_price ?? defaultValues.premium_listing_price,
        listing_duration: settings.listing_duration ?? defaultValues.listing_duration,
        premium_member_price: settings.premium_member_price ?? defaultValues.premium_member_price,
        default_payment_gateway: settings.default_payment_gateway ?? defaultValues.default_payment_gateway,
        paytr_merchant_id: settings.paytr_merchant_id ?? defaultValues.paytr_merchant_id,
        paytr_secret_key: settings.paytr_secret_key ?? defaultValues.paytr_secret_key,
        paytr_merchant_key: settings.paytr_merchant_key ?? defaultValues.paytr_merchant_key,
        paytr_sandbox: settings.paytr_sandbox ?? defaultValues.paytr_sandbox,
        iyzico_api_key: settings.iyzico_api_key ?? defaultValues.iyzico_api_key,
        iyzico_secret_key: settings.iyzico_secret_key ?? defaultValues.iyzico_secret_key,
        iyzico_base_url: settings.iyzico_base_url ?? defaultValues.iyzico_base_url,
        stripe_public_key: settings.stripe_public_key ?? defaultValues.stripe_public_key,
        stripe_secret_key: settings.stripe_secret_key ?? defaultValues.stripe_secret_key,
        stripe_webhook_secret: settings.stripe_webhook_secret ?? defaultValues.stripe_webhook_secret,
        stripe_currency: settings.stripe_currency ?? defaultValues.stripe_currency
      };

      console.log('Form reset edilecek veriler:', formData);
      form.reset(formData);
    }
  }, [settings, form]);

  const updateMutation = useMutation({
    mutationFn: async (values: FormData) => {
      console.log('Gönderilecek form değerleri:', values);
      const response = await apiRequest<PaymentSettingsResponse, FormData>({
        url: '/api/admin/payment-settings',
        method: 'PUT',
        data: values
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: 'Başarılı',
        description: 'Ticari ayarlar başarıyla güncellendi',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/payment-settings'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Hata',
        description: error.message || 'Ayarlar güncellenirken bir hata oluştu',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (values: FormData) => {
    console.log('Form submit değerleri:', values);
    updateMutation.mutate(values);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Ayarlar yüklenirken bir hata oluştu: {error instanceof Error ? error.message : 'Bilinmeyen hata'}
      </div>
    );
  }

  // Debug için form değerlerini konsola yazdır
  console.log('Güncel form değerleri:', form.getValues());

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Ticari Ayarlar</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Premium Alan Ayarları */}
          <Card>
            <CardHeader>
              <CardTitle>Premium Alan Ayarları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="premium_listing_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>İlan Fiyatı (TL)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={e => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="listing_duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>İlan Döngüsü (Gün)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={e => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="premium_member_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Yüksek Üye Fiyatı (Aylık/TL)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={e => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Ödeme Altyapısı Seçimi */}
          <Card>
            <CardHeader>
              <CardTitle>Ödeme Altyapısı</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="default_payment_gateway"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Varsayılan Ödeme Altyapısı</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Ödeme altyapısı seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="paytr">PayTR</SelectItem>
                        <SelectItem value="iyzico">İyzico</SelectItem>
                        <SelectItem value="stripe">Stripe</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* PayTR Ayarları */}
          <Card>
            <CardHeader>
              <CardTitle>PayTR Ayarları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="paytr_merchant_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mağaza Kimliği (Merchant ID)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paytr_secret_key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gizli Anahtar (Secret Key)</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paytr_merchant_key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Merchant Key</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paytr_sandbox"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Test Modu</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* İyzico Ayarları */}
          <Card>
            <CardHeader>
              <CardTitle>İyzico Ayarları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="iyzico_api_key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Key</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="iyzico_secret_key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secret Key</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="iyzico_base_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API URL</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Stripe Ayarları */}
          <Card>
            <CardHeader>
              <CardTitle>Stripe Ayarları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="stripe_public_key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Public Key</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stripe_secret_key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secret Key</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stripe_webhook_secret"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Webhook Secret</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stripe_currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Para Birimi</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="try" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Button 
            type="submit" 
            className="w-full"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? "Kaydediliyor..." : "Ayarları Kaydet"}
          </Button>
        </form>
      </Form>
    </div>
  );
}