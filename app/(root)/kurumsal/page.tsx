import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@app/components/ui/card';
import { Building2, HelpCircle } from 'lucide-react';

export const metadata = {
  title: 'Kurumsal Sayfalar',
  description: 'Şirketimiz hakkında detaylı bilgiler, sıkça sorulan sorular ve kurumsal içerikler.',
};

export default function KurumsalPage() {
  const pages = [
    {
      title: 'Hakkımızda',
      description: 'Şirketimizin hikayesi, misyonu ve vizyonu hakkında bilgi alın.',
      href: '/kurumsal/hakkimizda',
      icon: <Building2 className="h-6 w-6 text-primary" />,
    },
    {
      title: 'Sıkça Sorulan Sorular',
      description: 'Platformumuz hakkında en çok sorulan soruların cevaplarını bulun.',
      href: '/kurumsal/sss',
      icon: <HelpCircle className="h-6 w-6 text-primary" />,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 md:py-12">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">Kurumsal</h1>
      <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
        Platformumuz hakkında detaylı bilgiler ve kurumsal içeriklerimiz.
      </p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {pages.map((page) => (
          <Link key={page.href} href={page.href}>
            <Card className="h-full transition-all hover:shadow-md">
              <CardHeader>
                <div className="flex items-center gap-3">
                  {page.icon}
                  <CardTitle>{page.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">{page.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
} 