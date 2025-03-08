
const COMMON_PASSWORDS = ['123456', 'password', 'admin', 'qwerty', 'asdfgh'];

// Yasaklı kullanıcı adları listesi
export const FORBIDDEN_USERNAMES = [
  'admin',
  'administrator',
  'moderator',
  'mod',
  'support',
  'help',
  'info',
  'root',
  'system',
  'webmaster',
  'yonetici',
  'yönetici',
  'destek',
  'test',
  'demo',
  'superadmin',
  'sysadmin',
  'owner',
  'helpdesk',
  'security',
  'supermod',
  'operator',
  'bot',
  'api',
  'anonymous',
  'guest',
  'user',
  'null',
  'unknown',
  'service',
  'musteri hizmetleri',
  'teknik destek',
  'sistemyoneticisi',
  'superyonetici',
  'adminyonetici'
];

export function validatePassword(password: string, username: string) {
  if (password.length < 5 || password.length > 12) {
    return { valid: false, message: 'Şifre 5-12 karakter arasında olmalıdır' };
  }

  if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
    return { valid: false, message: `Bu şifre çok yaygın kullanılıyor ve güvenli değil. Lütfen daha karmaşık bir şifre seçin` };
  }

  if (password.toLowerCase().includes(username.toLowerCase())) {
    return { valid: false, message: 'Şifre kullanıcı adınızı içeremez' };
  }

  const repeatingChars = /(.)\1{3,}/;
  if (repeatingChars.test(password)) {
    return { valid: false, message: 'Şifre aynı karakteri 3 kereden fazla içeremez (örn: aaaa)' };
  }

  return { valid: true };
}
