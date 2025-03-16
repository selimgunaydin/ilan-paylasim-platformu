import { getServerSession } from "next-auth/next"
import { db } from "@shared/db"
import { users } from "@shared/schemas"
import { eq } from "drizzle-orm"
import Profile from '@/views/root/profile'
import { redirect } from "next/navigation"
import { authOptions } from "@/api/auth/[...nextauth]/route"

export async function generateMetadata() {
  return {
    title: "Profilim",
    description: "Profilim sayfası",
  };
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect("/giris")
  }

  const userId = Number(session.user.id)
  
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      id: true,
      username: true,
      email: true,
      emailVerified: true,
      isAdmin: true,
      lastSeen: true,
      used_free_ad: true,
      profileImage: true,
      profileVisibility: true,
      gender: true,
      age: true,
      city: true,
      aboutMe: true,
      avatar: true,
      yuksekUye: true,
      status: true,
      phone: true
    }
  })

  if (!user) {
    redirect("/giris")
  }

  return (
    <Profile initialData={user} />
  )
}
