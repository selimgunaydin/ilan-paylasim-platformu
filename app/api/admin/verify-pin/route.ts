import { db } from "@shared/db";
import { site_settings } from "@shared/schemas";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/api/auth/auth-options";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.isAdmin) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { pin } = body;

    if (typeof pin !== 'string' || !/^\d{6}$/.test(pin)) {
      return new NextResponse("PIN 6 haneli bir sayı olmalıdır.", { status: 400 });
    }

    const settings = await db.query.site_settings.findFirst();

    if (!settings) {
      return new NextResponse("Site settings not found.", { status: 500 });
    }

    const isMatch = Number(pin) === settings.admin_verification_pin;

    if (!isMatch) {
      return new NextResponse("Invalid PIN", { status: 401 });
    }

    return NextResponse.json({ message: "PIN verified successfully" }, { status: 200 });

  } catch (error) {
    console.error("[VERIFY_PIN_POST]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
