import { PinChangeForm } from "../../../components/admin/verification-pin/pin-change-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin PIN Değiştir",
  description: "Yönetici güvenlik PIN'inizi güncelleyin.",
};

export default function AdminPinChangePage() {
  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Admin PIN Değiştir</h1>
      <PinChangeForm />
    </div>
  );
}
