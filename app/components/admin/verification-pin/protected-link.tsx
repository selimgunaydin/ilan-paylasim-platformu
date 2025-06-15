"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminPinModal } from "./modals/admin-pin-modal";


interface ProtectedLinkProps {
  href: string;
  children: React.ReactElement;
}

export function ProtectedLink({ href, children }: ProtectedLinkProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsModalOpen(true);
  };

  const handleSuccess = () => {
    router.push(href);
  };

  const trigger = React.cloneElement(children, {
    ...children.props,
    onClick: handleTriggerClick,
  });

  //admin pin kontrolü için linklere eklenecek component

  return (
    <>
      {trigger}
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
