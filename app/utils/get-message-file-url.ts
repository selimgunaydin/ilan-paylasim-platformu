export function getMessageFileUrClient(key: string): string {
    if (!key) return "";
    return `https://${process.env.NEXT_PUBLIC_MESSAGE_BUCKET_URL}/${key}`;
  } 
