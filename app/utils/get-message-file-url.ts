export function getMessageFileUrClient(key: string): string {
    if (!key) return "";
    return `https://${process.env.NEXT_PUBLIC_MESSAGE_BUCKET_URL}/${key}`;
  } 

  export function getListingImageUrlClient(key: string): string {
    console.log(key)
    if (!key) return "";
    
    // Eğer zaten tam URL ise olduğu gibi döndür
    if (key.startsWith("http")) {
      return key;
    }
    
    // Eğer yeni format (listings/ ile başlayan) ise
    if (key.startsWith("listings/")) {
      return `${process.env.NEXT_PUBLIC_LISTING_BUCKET_URL}${key}`;
    }
    
    // Eğer eski format ise (sadece dosya adı)
    return `${process.env.NEXT_PUBLIC_LISTING_BUCKET_URL}${key}`;
  }