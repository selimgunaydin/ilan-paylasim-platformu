'use client'

// @ts-ignore - Tip tanımlaması eksik modül
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import React from 'react';

export function ReCaptchaProvider({ children }: { children: React.ReactNode }) {
  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ''}
      scriptProps={{
        async: true,
        defer: true,
        appendTo: 'head',
        nonce: undefined,
      }}
    >
      {children}
    </GoogleReCaptchaProvider>
  );
}

// Login formunda kullanılacak custom hook
export function useRecaptchaToken(action: string) {
  const { executeRecaptcha } = useGoogleReCaptcha();
  
  const getToken = React.useCallback(async () => {
    if (!executeRecaptcha) {
      return null;
    }
    
    try {
      return await executeRecaptcha(action);
    } catch (error) {
      console.error('reCAPTCHA token alınırken hata:', error);
      return null;
    }
  }, [executeRecaptcha, action]);
  
  return getToken;
}
