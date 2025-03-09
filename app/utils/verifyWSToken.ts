import jwt from 'jsonwebtoken';

export const verifyWSToken = (token: string): { userId: number } | null => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: number;
      type: string;
      timestamp: number;
    };

    // Token tipini ve geçerliliğini kontrol et
    if (decoded.type !== 'websocket') {
      console.log('Geçersiz token tipi:', decoded.type);
      return null;
    }

    // Token'ın 15 dakikadan eski olmadığını kontrol et
    const now = Date.now();
    const tokenAge = now - decoded.timestamp;
    if (tokenAge > 15 * 60 * 1000) { // 15 dakika
      console.log('Token süresi dolmuş');
      return null;
    }

    return { userId: decoded.userId };
  } catch (error) {
    console.error("Token doğrulama hatası:", error);
    return null;
  }
};