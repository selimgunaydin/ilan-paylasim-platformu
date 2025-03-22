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
      <div className="flex flex-col gap-2 items-center justify-center h-screen">
        <h1>Ücretsiz ilan limitiniz doldu.</h1>
      </div>
    );
  }

  return <CreateListingView />;
}
