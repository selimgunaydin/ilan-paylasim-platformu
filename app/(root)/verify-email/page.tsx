import VerifyEmailView from '@/views/root/auth/verify-email'

export async function generateMetadata() {
  return {
    title: "Email Doğrulama",
    description: "Email doğrulama sayfası",
  };
}

export default function VerifyEmailPage() {
  return (
    <VerifyEmailView />
  )
}
