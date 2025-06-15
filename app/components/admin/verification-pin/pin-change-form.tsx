"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  currentPin: z.string().regex(/^\d{6}$/, "Mevcut PIN 6 haneli bir sayı olmalıdır."),
  newPin: z.string().regex(/^\d{6}$/, "Yeni PIN 6 haneli bir sayı olmalıdır."),
  confirmNewPin: z.string().regex(/^\d{6}$/, "Yeni PIN tekrarı 6 haneli bir sayı olmalıdır."),
}).refine((data) => data.newPin === data.confirmNewPin, {
  message: "Yeni PIN'ler eşleşmiyor.",
  path: ["confirmNewPin"],
});

type PinChangeFormValues = z.infer<typeof formSchema>;

export function PinChangeForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<PinChangeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentPin: '',
      newPin: '',
      confirmNewPin: '',
    },
  });

  const onSubmit = async (values: PinChangeFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/update-pin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPin: values.currentPin, newPin: values.newPin }),
      });

      if (response.ok) {
        toast({
          title: 'Başarılı',
          description: 'PIN başarıyla güncellendi.',
        });
        form.reset();
      } else {
        const errorText = await response.text();
        toast({
          title: 'Hata',
          description: `PIN güncellenemedi: ${errorText}`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Bir ağ hatası oluştu. Lütfen tekrar deneyin.',
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="currentPin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mevcut PIN</FormLabel>
              <FormControl>
                <Input type="password" placeholder="******" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="newPin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Yeni PIN</FormLabel>
              <FormControl>
                <Input type="password" placeholder="******" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmNewPin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Yeni PIN (Tekrar)</FormLabel>
              <FormControl>
                <Input type="password" placeholder="******" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
          PIN'i Güncelle
        </Button>
      </form>
    </Form>
  );
}
