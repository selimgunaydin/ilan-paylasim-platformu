// Dosya yükleme yardımcı fonksiyonları

/**
 * Dosya yükleme API yanıt tipi
 */
interface FileUploadResponse {
  success: boolean;
  files: string[];
  fileTypes: string[];
}

/**
 * Dosyaları NextJS API'sine yükler
 * @param files - Yüklenecek dosyalar dizisi
 * @returns Yüklenen dosyaların URL'leri ve tiplerine dair bilgiler
 */
export async function uploadFiles(
  files: File[]
): Promise<{ files: string[]; fileTypes: string[] }> {
  if (!files || files.length === 0) {
    return { files: [], fileTypes: [] };
  }

  const formData = new FormData();

  // Dosyaları FormData'ya ekle
  files.forEach((file) => {
    formData.append("files", file);
  });

  // Dosyaları yükle
  const response = await fetch("/api/files/upload", {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Dosya yükleme hatası");
  }

  const data = (await response.json()) as FileUploadResponse;

  return {
    files: data.files,
    fileTypes: data.fileTypes,
  };
}

/**
 * Mesaj gönderme veri tipi
 */
interface MessageSendData {
  conversationId: number | string;
  message: string;
  files: string[];
  fileTypes: string[];
}

/**
 * Mesajı dosyalarla birlikte gönderir
 * @param conversationId - Konuşma ID'si
 * @param message - Mesaj içeriği
 * @param files - Dosyalar (opsiyonel)
 * @returns Oluşturulan mesaj
 */
export async function sendMessageWithFiles(
  conversationId: number | string,
  message: string,
  files?: File[]
) {
  // Dosya varsa önce yükle
  let fileData = { files: [] as string[], fileTypes: [] as string[] };

  if (files && files.length > 0) {
    fileData = await uploadFiles(files);
  }

  // Mesaj verisi
  const messageData: MessageSendData = {
    conversationId,
    message,
    files: fileData.files,
    fileTypes: fileData.fileTypes,
  };

  // Mesajı gönder
  const response = await fetch("/api/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(messageData),
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Mesaj gönderilemedi");
  }

  return response.json();
}
