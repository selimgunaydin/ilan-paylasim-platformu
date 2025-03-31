const names = [
    "Ahmet", "Mehmet", "Ayşe", "Fatma", "Mustafa", "Ali", "Zeynep", "Emine", "Hasan", "Hüseyin",
    "Elif", "Merve", "Burak", "Seda", "Ömer", "Yasemin", "İbrahim", "Can", "Ebru", "Kadir",
    "Selin", "Tuğba", "Murat", "Esra", "Deniz", "Berk", "Aslı", "Hakan", "Gül", "Barış",
    "Derya", "Tolga", "Serkan", "Ceren", "Arda", "Büşra", "Onur", "Melis", "Furkan", "Gamze",
    "Eren", "Hande", "Umut", "Pınar", "Yiğit", "Betül", "Çağla", "Okan", "Nazlı", "Volkan"
  ];
  
  const lastNames = [
    "Yılmaz", "Kaya", "Demir", "Çelik", "Şahin", "Yıldız", "Aydın", "Öztürk", "Kılıç", "Arslan",
    "Doğan", "Koç", "Kurt", "Erdoğan", "Taş", "Güler", "Aksoy", "Polat", "Türk", "Çetin",
    "Korkmaz", "Uslu", "Avcı", "Kaplan", "Güneş", "Şen", "Bulut", "Karaca", "Ateş", "Sönmez",
    "Keskin", "Ünal", "Tekin", "Bayrak", "Toprak", "Deniz", "Özcan", "Aktaş", "Coşkun", "Şimşek",
    "Karahan", "Çalışkan", "Akgün", "Koca", "Soyadı", "Yeşil", "Mert", "Can", "Durmaz", "Baş"
  ];
  
  function hashCode(str: string) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
  
  function getRandomName(conversationId: string) {
    const idStr = String(conversationId);
  
    const hash = hashCode(idStr);
    const nameIndex = hash % names.length;
    const lastNameIndex = (hash >> 5) % lastNames.length;
  
    const selectedName = names[nameIndex];
    const selectedLastName = lastNames[lastNameIndex];
  
    return `${selectedName} ${selectedLastName}`;
  }

export function getDummyUser(conversationId: string) {
  const name = getRandomName(conversationId);
  return name;
}
  