"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminPinModal } from "./modals/admin-pin-modal";


interface ProtectedPageWrapperProps {
  children: React.ReactNode;
}

export default function ProtectedPageWrapper({ children }: ProtectedPageWrapperProps) {
  const [isVerified, setIsVerified] = useState(false);
  const router = useRouter();

  const handleSuccess = () => {
    setIsVerified(true);
  };

  const handleClose = () => {
    // Kullanıcı modalı kapatırsa, onu korumalı sayfadan uzaklaştır.
    // Bir önceki sayfaya yönlendirmek iyi bir seçenek.
    router.back();
  };

  if (!isVerified) {
    return (
      <AdminPinModal
        isOpen={true}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    );
  }

  return <>{children}</>;
}
