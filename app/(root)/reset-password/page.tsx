import ResetPasswordView from '@/views/root/auth/reset-password'

export async function generateMetadata() {
  return {
    title: "Şifremi Sıfırla",
    description: "Şifremi sıfırlama sayfası",
  };
}
export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token: string };
}) {
  return (
    <ResetPasswordView searchParams={searchParams} />
  )
}
