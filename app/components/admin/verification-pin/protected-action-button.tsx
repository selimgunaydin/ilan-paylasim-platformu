"use client";

import React, { useState } from "react";

import { Button, ButtonProps } from "@app/components/ui/button";
import { AdminPinModal } from "./modals/admin-pin-modal";

interface ProtectedActionButtonProps extends ButtonProps {
  onVerified: () => void;
  children: React.ReactNode;
}

//admin pin kontrolü için butonlara eklenecek component

export function ProtectedActionButton({
  onVerified,
  children,
  ...props
}: ProtectedActionButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleButtonClick = () => {
    setIsModalOpen(true);
  };

  const handleSuccess = () => {
    onVerified();
  };

  return (
    <>
      <Button {...props} onClick={handleButtonClick}>
        {children}
      </Button>
      {isModalOpen && (
        <AdminPinModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}
