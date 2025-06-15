import { db } from "@shared/db";
import { site_settings } from "@shared/schemas";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/api/auth/auth-options";
import { eq } from "drizzle-orm";

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.isAdmin) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { currentPin, newPin } = body;

    if (typeof currentPin !== 'string' || !/^\d{6}$/.test(currentPin)) {
      return new NextResponse("Mevcut PIN 6 haneli bir sayı olmalıdır.", { status: 400 });
    }

    if (typeof newPin !== 'string' || !/^\d{6}$/.test(newPin)) {
      return new NextResponse("Yeni PIN 6 haneli bir sayı olmalıdır.", { status: 400 });
    }

    const settings = await db.query.site_settings.findFirst();

    if (!settings) {
      return new NextResponse("Site settings not found.", { status: 500 });
    }

    const isMatch = Number(currentPin) === settings.admin_verification_pin;

    if (!isMatch) {
      return new NextResponse("Invalid current PIN", { status: 401 });
    }

    await db.update(site_settings)
      .set({ admin_verification_pin: Number(newPin) })
      .where(eq(site_settings.id, settings.id));

    return NextResponse.json({ message: "PIN updated successfully" }, { status: 200 });

  } catch (error) {
    console.error("[UPDATE_PIN_PUT]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
