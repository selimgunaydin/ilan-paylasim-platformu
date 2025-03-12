'use client'

import Link from "next/link";
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useState } from "react";

export function Footer() {
  const [email, setEmail] = useState("");
  
  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // Burada e-posta aboneliği işlemi yapılabilir
    alert(`${email} adresi bültenimize kaydedildi!`);
    setEmail("");
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Üst Kısım */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Hakkımızda */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">İlan Platformu</h3>
            <p className="mb-4 text-gray-400">
              Türkiye'nin en hızlı büyüyen ilan platformu. Binlerce ilan arasından 
              aradığınızı kolayca bulun veya kendi ilanınızı ücretsiz yayınlayın.
            </p>
            <div className="flex space-x-4 mt-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter size={20} />
              </a>
            </div>
          </div>

          {/* Hızlı Bağlantılar */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Hızlı Bağlantılar</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white transition-colors flex items-center">
                  <ArrowRight size={14} className="mr-2" />
                  Ana Sayfa
                </Link>
              </li>
              <li>
                <Link href="/kategoriler" className="text-gray-400 hover:text-white transition-colors flex items-center">
                  <ArrowRight size={14} className="mr-2" />
                  Kategoriler
                </Link>
              </li>
              <li>
                <Link href="/ilan-ekle" className="text-gray-400 hover:text-white transition-colors flex items-center">
                  <ArrowRight size={14} className="mr-2" />
                  İlan Ver
                </Link>
              </li>
              <li>
                <Link href="/ilanlarim" className="text-gray-400 hover:text-white transition-colors flex items-center">
                  <ArrowRight size={14} className="mr-2" />
                  İlanlarım
                </Link>
              </li>
              <li>
                <Link href="/favorilerim" className="text-gray-400 hover:text-white transition-colors flex items-center">
                  <ArrowRight size={14} className="mr-2" />
                  Favorilerim
                </Link>
              </li>
            </ul>
          </div>

          {/* İletişim */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">İletişim</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <MapPin size={20} className="mr-2 mt-1 text-blue-500" />
                <span>Atatürk Bulvarı No:123, Ankara, Türkiye</span>
              </li>
              <li className="flex items-center">
                <Phone size={20} className="mr-2 text-blue-500" />
                <span>+90 (312) 123 45 67</span>
              </li>
              <li className="flex items-center">
                <Mail size={20} className="mr-2 text-blue-500" />
                <span>info@ilanplatformu.com</span>
              </li>
            </ul>
          </div>

          {/* Bülten */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Bültenimize Abone Olun</h3>
            <p className="mb-4 text-gray-400">
              En yeni ilanlar ve fırsatlardan haberdar olmak için bültenimize abone olun.
            </p>
            <form onSubmit={handleSubscribe} className="flex flex-col space-y-2">
              <Input
                type="email"
                placeholder="E-posta adresiniz"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-gray-800 border-gray-700 text-white"
              />
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                Abone Ol
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Alt Kısım - Telif Hakkı */}
      <div className="border-t border-gray-800 py-6">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-500">
            &copy; {currentYear} İlan Platformu. Tüm hakları saklıdır.
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Link href="/gizlilik-politikasi" className="text-sm text-gray-500 hover:text-white transition-colors">
              Gizlilik Politikası
            </Link>
            <Link href="/kullanim-kosullari" className="text-sm text-gray-500 hover:text-white transition-colors">
              Kullanım Koşulları
            </Link>
            <Link href="/yardim" className="text-sm text-gray-500 hover:text-white transition-colors">
              Yardım
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
} 