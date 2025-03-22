import React from 'react';
import { Card, CardContent } from '@app/components/ui/card';
import { Building2, Target, Award, Users, Rocket } from 'lucide-react';

export const metadata = {
  title: 'Hakkımızda',
  description: 'İlan Platformu olarak kim olduğumuz, vizyonumuz ve misyonumuz hakkında bilgi edinin.',
};

export default function HakkimizdaPage() {
  return (
    <div className="max-w-7xl mx-auto py-8 px-4 md:py-12">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">Hakkımızda</h1>
      <div className="space-y-8">
        {/* Giriş Bölümü */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="md:w-1/3 flex justify-center">
                <div className="bg-primary/10 p-5 rounded-full">
                  <Building2 className="h-24 w-24 text-primary" />
                </div>
              </div>
              <div className="md:w-2/3">
                <h2 className="text-2xl font-bold mb-4">Biz Kimiz?</h2>
                <p className="text-muted-foreground mb-4">
                  İlan Platformu olarak, 2024 yılında kurulmuş olan şirketimiz, kullanıcılarımıza çeşitli kategorilerde 
                  ilan paylaşma ve keşfetme imkanı sunan yenilikçi bir online platformdur. Amacımız, kullanıcılarımızın 
                  ihtiyaçlarını karşılayacak ilanları kolaylıkla bulabilecekleri ve kendi ilanlarını güvenle paylaşabilecekleri 
                  bir alan oluşturmaktır.
                </p>
                <p className="text-muted-foreground">
                  İnovatif yaklaşımımız ve kullanıcı odaklı hizmet anlayışımızla, Türkiye'nin en çok tercih edilen 
                  ilan platformlarından biri olmayı hedefliyoruz. Kaliteli hizmet, güvenilirlik ve kullanıcı memnuniyeti 
                  bizim için her zaman önceliklidir.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Misyon & Vizyon */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="bg-primary/10 p-4 rounded-full mb-4">
                  <Target className="h-12 w-12 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-4">Misyonumuz</h2>
                <p className="text-muted-foreground">
                  Kullanıcılarımıza güvenli, kolay ve etkili bir ilan paylaşım deneyimi sunmak. 
                  Her gün daha fazla kişinin ihtiyaçlarını karşılayabilecekleri içeriklere hızlıca 
                  ulaşabilmelerini sağlayarak, kullanıcılarımızın hayatını kolaylaştırmayı amaçlıyoruz.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="bg-primary/10 p-4 rounded-full mb-4">
                  <Rocket className="h-12 w-12 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-4">Vizyonumuz</h2>
                <p className="text-muted-foreground">
                  Türkiye'nin lider ilan platformu olmak ve yenilikçi çözümlerle sektöre öncülük etmek. 
                  Kullanıcı deneyimini sürekli geliştirerek, herkesin ilk tercihi olan, güvenilir ve 
                  teknolojik altyapısıyla fark yaratan bir platform olmayı hedefliyoruz.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Değerlerimiz */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold mb-6 text-center">Değerlerimiz</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center text-center">
                <div className="bg-primary/10 p-3 rounded-full mb-3">
                  <Award className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Kalite</h3>
                <p className="text-muted-foreground">
                  Her zaman en kaliteli hizmeti sunmak için çalışıyoruz.
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="bg-primary/10 p-3 rounded-full mb-3">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Güvenilirlik</h3>
                <p className="text-muted-foreground">
                  Kullanıcılarımızın güvenliği ve memnuniyeti bizim için en önemli önceliktir.
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="bg-primary/10 p-3 rounded-full mb-3">
                  <Rocket className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Yenilikçilik</h3>
                <p className="text-muted-foreground">
                  Teknolojik gelişmeleri takip ederek platformumuzu sürekli geliştiriyoruz.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 