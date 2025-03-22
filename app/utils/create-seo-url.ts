export const createSeoUrl = (title: string): string => {
    if (!title) return "";
    
    // Turkish character mapping
    const turkishChars: Record<string, string> = {
      'ı': 'i', 'İ': 'I', 'ğ': 'g', 'Ğ': 'G',
      'ü': 'u', 'Ü': 'U', 'ş': 's', 'Ş': 'S',
      'ö': 'o', 'Ö': 'O', 'ç': 'c', 'Ç': 'C',
      'â': 'a', 'î': 'i', 'û': 'u', 'ô': 'o',
      'ë': 'e', 'ï': 'i', 'ÿ': 'y', 'é': 'e',
      'è': 'e', 'ê': 'e', 'à': 'a', 'á': 'a'
    };
    
    // Replace Turkish characters
    let seoUrl = title.toLowerCase();
    
    // Replace all Turkish characters
    for (const [turkishChar, englishChar] of Object.entries(turkishChars)) {
      seoUrl = seoUrl.replace(new RegExp(turkishChar, 'g'), englishChar);
    }
    
    // Remove special characters and replace spaces with dashes
    seoUrl = seoUrl
      .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and dashes
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with dashes
      .replace(/-+/g, '-'); // Replace multiple dashes with single dash
      
    return seoUrl;
  };