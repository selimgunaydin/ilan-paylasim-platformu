// Avatar URL'lerini merkezi olarak yöneten utility fonksiyonlar

// Sabit URL tanımlamaları
const AVATAR_BASE_PATH = "/avatars";
const FEMALE_AVATAR_PATH = `${AVATAR_BASE_PATH}/female`;
const MALE_AVATAR_PATH = `${AVATAR_BASE_PATH}/male`;

// Cinsiyete göre mevcut avatarları döndüren fonksiyon
export const getAvailableAvatars = (gender: string): string[] => {
  switch (gender) {
    case "male":
      // Erkek avatarlarını döndür (male1.jpg - male23.jpg)
      return Array.from(
        { length: 2 },
        (_, i) => `${MALE_AVATAR_PATH}/male${i + 1}.png`
      );
    case "female":
      // Kadın avatarlarını döndür (female1.jpg - female24.jpg)
      return Array.from(
        { length: 2 },
        (_, i) => `${FEMALE_AVATAR_PATH}/female${i + 1}.png`
      );
    default:
      // Tüm avatarları döndür
      const maleAvatars = Array.from(
        { length: 2 },
        (_, i) => `${MALE_AVATAR_PATH}/male${i + 1}.png`
      );
      const femaleAvatars = Array.from(
        { length: 2 },
        (_, i) => `${FEMALE_AVATAR_PATH}/female${i + 1}.png`
      );
      return [...maleAvatars, ...femaleAvatars];
  }
};

// Cinsiyete göre default avatar path'lerini döndüren fonksiyon
export const getDefaultAvatarPath = (gender: string): string => {
  switch (gender) {
    case "male":
      return `${AVATAR_BASE_PATH}/male_default.png`;
    case "female":
      return `${AVATAR_BASE_PATH}/female_default.png`;
    default:
      return `${AVATAR_BASE_PATH}/default.png`;
  }
};

// Kullanıcının profil resmini veya avatarını döndüren fonksiyon
export const getProfileImageUrl = (
  profileImage: string | null | undefined,
  gender: string,
  avatar?: string | null
): string => {
  // 1. Eğer profil resmi varsa ve Cloudflare'de yüklüyse onu göster
  if (profileImage) {
    // Eğer zaten tam URL ise olduğu gibi döndür
    if (profileImage.startsWith("http")) {
      return profileImage;
    }
    // Eğer R2 profile path'i ise (yeni format)
    else if (profileImage.startsWith("profiles/")) {
      return `https://images.ilandaddy.com/${profileImage}`;
    }
    // Eğer local path ise (eski format)
    else if (profileImage.startsWith("/uploads/")) {
      return profileImage;
    }
    // Sadece dosya adı ise (Cloudflare formatı)
    else {
      return `https://images.ilandaddy.com/${profileImage}`;
    }
  }

  // 2. Eğer seçilmiş bir avatar varsa onu göster
  if (avatar) {
    return avatar;
  }

  // 3. Hiçbiri yoksa cinsiyete göre default avatar göster
  return getDefaultAvatarPath(gender);
};
