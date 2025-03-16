import PaymentView from '@/views/root/odeme'

export async function generateMetadata() {
  return {
    title: "Ödeme",
    description: "Ödeme sayfası",
  };
}

export default function PaymentPage() {
  return (
    <PaymentView />
  )
}
