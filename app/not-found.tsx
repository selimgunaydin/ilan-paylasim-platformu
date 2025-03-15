import { Card, CardContent } from "@app/components/ui/card";
import { AlertCircle, Home } from "lucide-react";
import Link from "next/link"; // Next.js kullanıyorsanız

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center">
      <Card className="w-full max-w-lg mx-4 shadow-lg">
        <CardContent className="pt-8 pb-6">
          <div className="flex items-center mb-6 gap-3">
            <AlertCircle className="h-10 w-10 text-red-600" />
            <h1 className="text-3xl font-bold text-gray-900">404 - Sayfa Bulunamadı</h1>
          </div>

          <p className="mt-2 text-base text-gray-700">
            Üzgünüz, aradığınız ilan veya sayfa bulunamadı. Yanlış bir adres girmiş olabilirsiniz ya da bu sayfa kaldırılmış olabilir.
          </p>

          <div className="mt-6 flex flex-col gap-4">
            <Link href="/">
              <button className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                <Home className="h-5 w-5" />
                Anasayfaya Dön
              </button>
            </Link>
            <p className="text-sm text-gray-600 text-center">
              Hala sorun yaşıyorsanız, <a href="/destek" className="text-blue-600 hover:underline">destek ekibimizle iletişime geçin</a>.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}