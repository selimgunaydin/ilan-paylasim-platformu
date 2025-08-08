"use client";

import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, Twitter, Youtube, Linkedin, Mail, Phone, MapPin } from "lucide-react";
import { SiteSettings } from "@shared/schemas";

interface FooterProps {
  settings: SiteSettings;
}

export function Footer({ settings }: FooterProps) {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto py-12 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo and info */}
          <div className="space-y-4">
            {settings?.site_logo ? (
              <Image
                src={settings.site_logo}
                alt={settings?.site_name || "İlan Platformu"}
                width={150}
                height={50}
                className="h-10 w-auto object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            ) : (
              <h2 className="text-2xl font-bold text-white">
                {settings?.site_name || "İlan Platformu"}
              </h2>
            )}
            <p className="text-gray-400 text-sm mt-2">
              {settings?.home_description || "Türkiye'nin ilan paylaşım platformu"}
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Hızlı Bağlantılar</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/blog" className="text-gray-400 hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/kurumsal" className="text-gray-400 hover:text-white transition-colors">
                  Kurumsal
                </Link>
              </li>
              <li>
                <Link href="/sozlesmeler" className="text-gray-400 hover:text-white transition-colors">
                  Sözleşmeler
                </Link>
              </li>
              <li>
                <Link href="/iletisim" className="text-gray-400 hover:text-white transition-colors">
                  İletişim
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">İletişim</h3>
            <ul className="space-y-3">
              {settings?.contact_phone.length > 1 && (
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-indigo-400" />
                  <span className="text-gray-400">{settings.contact_phone}</span>
                </li>
              )}
              {settings?.contact_email.length > 1 && (
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-indigo-400" />
                  <span className="text-gray-400">{settings.contact_email}</span>
                </li>
              )}
              {settings?.contact_address.length > 1 && (
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-indigo-400 mt-1" />
                  <span className="text-gray-400">{settings.contact_address}</span>
                </li>
              )}
            </ul>
          </div>

          {/* Social media */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Sosyal Medya</h3>
            <div className="flex gap-4">
              {settings?.facebook_url && (
                <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-indigo-400 transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              {settings?.twitter_url && (
                <a href={settings.twitter_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-indigo-400 transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
              )}
              {settings?.instagram_url && (
                <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-indigo-400 transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {settings?.youtube_url && (
                <a href={settings.youtube_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-indigo-400 transition-colors">
                  <Youtube className="w-5 h-5" />
                </a>
              )}
              {settings?.linkedin_url && (
                <a href={settings.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-indigo-400 transition-colors">
                  <Linkedin className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 text-center text-sm text-gray-400">
          <p>© {currentYear} {settings?.site_name || "İlan Platformu"}. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </footer>
  );
} 