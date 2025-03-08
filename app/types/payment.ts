// PayTR ödeme yanıt tipi
export interface PaymentResponse {
  token: string;
  merchant_oid: string;
  ok?: boolean;
  status?: string;
  message?: string;
}

// PayTR ödeme durumu yanıt tipi
export interface PaymentStatusResponse {
  status: string;
  active: boolean;
}

// Ödeme ayarları API yanıt tipi
export interface PaymentSettingsResponse {
  id: number;
  premium_listing_price: number;
  listing_duration: number;
  premium_member_price: number;
  default_payment_gateway: 'paytr' | 'iyzico' | 'stripe';
  paytr_merchant_id?: string;
  paytr_secret_key?: string;
  paytr_merchant_key?: string;
  paytr_sandbox: boolean;
  iyzico_api_key?: string;
  iyzico_secret_key?: string;
  iyzico_base_url?: string;
  stripe_public_key?: string;
  stripe_secret_key?: string;
  stripe_webhook_secret?: string;
  stripe_currency?: string;
  updated_at: string;
  updated_by: number;
}