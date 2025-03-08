export async function getClientIp(): Promise<string> {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error("IP adresi alınamadı:", error);
    return "unknown";
  }
}
