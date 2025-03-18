export function getMessageFileUrClient(key: string): string {
    if (!key) return "";
    return `${process.env.NEXT_PUBLIC_MESSAGE_BUCKET_URL}/${key}`;
  } 

  export function getListingImageUrlClient(key: string): string {
    if (!key) return "";
    
    // If it's already a full URL, return it as is
    if (key.startsWith("http")) {
      return key;
    }
    
    // If it's the new format (starting with listings/)
    if (key.startsWith("listings/")) {
      return `${process.env.NEXT_PUBLIC_LISTING_BUCKET_URL}${key}`;
    }
    
    // If it's the old format (just filename)
    return `${process.env.NEXT_PUBLIC_LISTING_BUCKET_URL}${key}`;
  }