import { useState, useEffect } from "react";

// Admin paneline erişim kontrolü şifre alerti
export default function AdminPanelProtection({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (sessionStorage.getItem('admin_authenticated') === 'true') {
      setIsAuthenticated(true);
      setIsLoading(false);
      return;
    }

    const password = prompt('Admin paneline erişmek için lütfen şifreyi girin:');

    if (password === process.env.NEXT_PUBLIC_ADMIN_PANEL_PASSWORD) {
      sessionStorage.setItem('admin_authenticated', 'true');
      setIsAuthenticated(true);
    } else {
      if (password !== null) { // Kullanıcı 'iptal' demediyse uyar
        alert('Hatalı şifre! Ana sayfaya yönlendiriliyorsunuz...');
      }
      window.location.href = '/';
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // This part will be briefly visible before redirection
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Yetkiniz yok. Yönlendiriliyorsunuz...</p>
      </div>
    );
  }

  return <>{children}</>;
}
