import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@app/components/ui/card';
import { FileText, Shield, LockKeyhole } from 'lucide-react';

export const metadata = {
  title: 'Sözleşmeler ve Politikalar',
  description: 'Kullanım koşulları, gizlilik politikası ve kişisel verilerin korunması hakkında bilgiler.',
};

export default function SozlesmelerPage() {
  const pages = [
    {
      title: 'Kullanım Koşulları',
      description: 'Platformumuzun kullanımına ilişkin koşullar ve sorumluluklar.',
      href: '/sozlesmeler/kullanim-kosullari',
      icon: <FileText className="h-6 w-6 text-primary" />,
    },
    {
      title: 'Gizlilik Politikası',
      description: 'Kişisel verilerinizin nasıl toplandığı, kullanıldığı ve korunduğuna dair bilgiler.',
      href: '/sozlesmeler/gizlilik-politikasi',
      icon: <Shield className="h-6 w-6 text-primary" />,
    },
    {
      title: 'KVKK Aydınlatma Metni',
      description: '6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında aydınlatma metni.',
      href: '/sozlesmeler/kvkk',
      icon: <LockKeyhole className="h-6 w-6 text-primary" />,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 md:py-12">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">Sözleşmeler ve Politikalar</h1>
      <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
        Platformumuzun kullanımına ilişkin sözleşmeler, politikalar ve yasal bilgilendirmeler.
      </p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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