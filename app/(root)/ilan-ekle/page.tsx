import CreateListingView from "@/views/root/ilan-ekle";
import { headers } from "next/headers";
export async function generateMetadata() {
  return {
    title: "İlan Ekle",
    description: "İlan ekleme sayfası",
  };
}

const fetchUserStatus = async () => {
  const headersList = headers();
  const cookies = headersList.get("cookie");
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/user/status`,
    {
      headers: {
        Cookie: cookies || "",
      },
      cache: "no-store",
    }
  );
  if (!response.ok) throw new Error(response.statusText);
  return response.json();
};

export default async function CreateListingPage() {
  const userStatus = await fetchUserStatus();

  if (
    userStatus.user.used_free_ad === 1 &&
    userStatus.user.yuksekUye === false
  ) {
    return (
      <div className="flex flex-col gap-6 items-center justify-center h-screen bg-gray-100 text-center px-4">
        {/* Başlık */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
          Ücretsiz İlan Limitiniz Doldu
        </h1>

        {/* Açıklama */}
        <p className="text-lg text-gray-600 max-w-md">
          Ücretsiz ilan hakkınızı kullandınız. Daha fazla ilan eklemek için
          premium üyeliğe geçiş yapabilirsiniz!
        </p>

        {/* İkon veya Görsel (opsiyonel) */}
        <div className="flex justify-center">
          <svg
            className="w-24 h-24 text-yellow-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* Buton */}
        <a
          href="/premium-uye-ol"
          className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300"
        >
          Premium Üye Ol
        </a>

        {/* Alternatif Bilgi */}
        <p className="text-sm text-gray-500">
          Detaylı bilgi için{" "}
          <a href="/iletisim" className="underline hover:text-blue-600">
            destek sayfamızı
          </a>{" "}
          ziyaret edebilirsiniz.
        </p>
      </div>
    );
  }

  return <CreateListingView />;
}
