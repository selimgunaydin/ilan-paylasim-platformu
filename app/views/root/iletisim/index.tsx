'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@app/components/ui/card';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@app/components/ui/form';
import { Input } from '@app/components/ui/input';
import { Textarea } from '@app/components/ui/textarea';
import { Button } from '@app/components/ui/button';
import { useToast } from '@app/hooks/use-toast';
import { Mail, Phone, MapPin, Send, Loader2 } from 'lucide-react';

// Form şeması
const contactSchema = z.object({
  name: z.string().min(2, 'İsim en az 2 karakter olmalıdır'),
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  subject: z.string().min(2, 'Konu en az 2 karakter olmalıdır'),
  message: z.string().min(10, 'Mesaj en az 10 karakter olmalıdır')
});

type ContactFormValues = z.infer<typeof contactSchema>;

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: ''
    }
  });

  async function onSubmit(data: ContactFormValues) {
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Bir hata oluştu');
      }
      
      // Başarılı mesaj
      toast({
        title: 'Mesajınız gönderildi',
        description: result.message,
        variant: 'default',
      });
      
      // Formu sıfırla
      form.reset();
      
    } catch (error) {
      // Hata mesajı
      toast({
        title: 'Hata',
        description: error instanceof Error ? error.message : 'Mesaj gönderilirken bir hata oluştu',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 md:py-12">
      <div className="flex flex-col items-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-4">İletişim</h1>
        <p className="text-center text-muted-foreground max-w-2xl mb-8">
          Her türlü soru, öneri ve geri bildirimleriniz için bize ulaşabilirsiniz. En kısa sürede size dönüş yapacağız.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>İletişim Bilgileri</CardTitle>
              <CardDescription>Bizimle doğrudan iletişime geçebilirsiniz</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start">
                <Mail className="w-5 h-5 mt-1 mr-3 text-primary" />
                <div>
                  <h3 className="font-medium">E-posta</h3>
                  <p className="text-muted-foreground">info@example.com</p>
                </div>
              </div>
              <div className="flex items-start">
                <Phone className="w-5 h-5 mt-1 mr-3 text-primary" />
                <div>
                  <h3 className="font-medium">Telefon</h3>
                  <p className="text-muted-foreground">+90 212 123 45 67</p>
                </div>
              </div>
              <div className="flex items-start">
                <MapPin className="w-5 h-5 mt-1 mr-3 text-primary" />
                <div>
                  <h3 className="font-medium">Adres</h3>
                  <p className="text-muted-foreground">
                    Örnek Mahallesi, Örnek Caddesi No:1, İstanbul
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Mesaj Gönder</CardTitle>
              <CardDescription>Formumuz aracılığıyla bize mesaj gönderin</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>İsim Soyisim</FormLabel>
                          <FormControl>
                            <Input placeholder="İsim Soyisim" {...field} />
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
                          <FormLabel>E-posta</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="E-posta adresiniz" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Konu</FormLabel>
                        <FormControl>
                          <Input placeholder="Mesajınızın konusu" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mesaj</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Mesajınızı buraya yazın" 
                            className="min-h-[120px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Gönderiliyor...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Mesajı Gönder
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 