/**
 * Yasaklı kullanıcı adlarını içeren ve kontrol eden yardımcı fonksiyonlar
 */

// Yasaklı kullanıcı adları listesi
export const FORBIDDEN_USERNAMES = [
  'admin', 'administrator', 'root', 'system', 'moderator', 'mod',
  'support', 'help', 'info', 'contact', 'webmaster', 'owner',
  'security', 'staff', 'team', 'official', 'yonetici', 'yönetici',
  'destek', 'test', 'demo', 'superadmin', 'sysadmin', 'helpdesk',
  'supermod', 'operator', 'bot', 'api', 'anonymous', 'guest',
  'user', 'null', 'unknown', 'service', 'musteri hizmetleri',
  'teknik destek', 'sistemyoneticisi', 'superyonetici', 'adminyonetici'
];

/**
 * Verilen kullanıcı adının yasaklı olup olmadığını kontrol eder
 * @param username Kontrol edilecek kullanıcı adı
 * @returns {boolean} Kullanıcı adı yasaklı ise true, değilse false
 */
export function isForbiddenUsername(username: string): boolean {
  return FORBIDDEN_USERNAMES.includes(username.toLowerCase());
}