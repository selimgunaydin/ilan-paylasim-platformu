import AuthView from '@/views/root/auth'

export async function generateMetadata() {
  return {
    title: "Giriş",
    description: "Giriş sayfası",
  };
}

export default function AuthPage() {
  return (
    <AuthView />
  )
}
