'use client'

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@app/components/ui/card";
import { Button } from "@app/components/ui/button";
import { useSearchParams, useRouter } from "next/navigation";
import { apiRequest } from "@/lib/queryClient";
import type { PaymentResponse } from "@/types/payment";

export default function PaymentPage() {
  const [paymentToken, setPaymentToken] = useState("");
  const [showPayTR, setShowPayTR] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const search = useSearchParams();
  const router = useRouter();

  const listingId = new URLSearchParams(search).get("listing_id");

  useEffect(() => {
    if (!listingId) {
      router.push("/create-listing");
      return;
    }
  }, [listingId, router]);

  useEffect(() => {
    if (listingId && showPayTR) {
      const createPayment = async () => {
        try {
          setError(null);
          console.log("Ödeme başlatılıyor...", { listingId });

          const response = await apiRequest<PaymentResponse>({
            url: "/api/payments/create",
            method: "POST",
            data: { listingId }
          });

          if (response.token) {
            console.log("Ödeme token'ı alındı");
            setPaymentToken(response.token);
          } else {
            throw new Error("Ödeme token'ı alınamadı");
          }
        } catch (error) {
          console.error("Ödeme başlatma hatası:", error);
          setError("Ödeme başlatılamadı. Lütfen tekrar deneyiniz.");
          setShowPayTR(false);
        }
      };

      createPayment();
    }
  }, [listingId, showPayTR]);

  useEffect(() => {
    if (paymentToken) {
      const paytrFrame = document.getElementById("paytr-frame") as HTMLIFrameElement;
      if (paytrFrame) {
        console.log("PayTR iframe yükleniyor...");
        paytrFrame.src = `https://www.paytr.com/odeme/guvenli/${paymentToken}`;
      }
    }
  }, [paymentToken]);

  return (
    <div className="min-h-screen bg-background p-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Ödeme Sayfası</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border rounded p-4">
              <h3 className="text-lg font-semibold">30 Gün Öncelikli Listeleme (Test Modu)</h3>
              <p className="text-2xl font-bold mt-2">1.00 TL</p>
              <ul className="mt-4 space-y-2">
                <li>✓ 30 gün boyunca listelerde üst sırada görünüm</li>
                <li>✓ Öne çıkan ilanlar bölümünde yer alma</li>
              </ul>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded">
                {error}
              </div>
            )}

            {!showPayTR ? (
              <Button onClick={() => setShowPayTR(true)} className="w-full">
                Ödemeyi Başlat
              </Button>
            ) : (
              <div className="w-full min-h-[600px] border rounded">
                {paymentToken ? (
                  <iframe
                    id="paytr-frame"
                    className="w-full h-[600px]"
                    frameBorder="0"
                    scrolling="no"
                    title="PayTR Payment Frame"
                  ></iframe>
                ) : (
                  <div className="flex items-center justify-center h-[600px]">
                    Ödeme başlatılıyor...
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}