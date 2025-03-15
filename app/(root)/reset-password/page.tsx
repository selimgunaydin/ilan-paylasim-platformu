import ResetPasswordView from '@/views/auth/reset-password'

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token: string };
}) {
  return (
    <ResetPasswordView searchParams={searchParams} />
  )
}
