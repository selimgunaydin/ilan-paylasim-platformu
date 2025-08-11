import { NextRequest, NextResponse } from "next/server";
import { db } from "@shared/db";
import { reports, insertReportSchema } from "@shared/schemas";
import { getServerSession } from "next-auth";
import { authOptions } from "@/api/auth/auth-options";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Şikayet göndermek için giriş yapmalısınız" },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validation
    const validatedData = insertReportSchema.parse({
      ...body,
      reporterId: parseInt(session.user.id),
    });

    // Kendi içeriğini şikayet etmeyi engelle
    if (validatedData.reporterId === validatedData.reportedUserId) {
      return NextResponse.json(
        { message: "Kendi içeriğinizi şikayet edemezsiniz" },
        { status: 400 }
      );
    }

    // Aynı içerik için daha önce şikayet yapılmış mı kontrol et
    const existingReport = await db
      .select()
      .from(reports)
      .where(
        and(
          eq(reports.reporterId, validatedData.reporterId),
          eq(reports.contentId, validatedData.contentId),
          eq(reports.reportType, validatedData.reportType)
        )
      )
      .limit(1);

    if (existingReport.length > 0) {
      return NextResponse.json(
        { message: "Bu içerik için zaten şikayet gönderdiniz" },
        { status: 400 }
      );
    }

    // Şikayeti kaydet
    const [newReport] = await db
      .insert(reports)
      .values(validatedData)
      .returning();

    return NextResponse.json(
      { 
        message: "Şikayetiniz başarıyla kaydedildi",
        reportId: newReport.id 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Report creation error:", error);

    // Zod validation error
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { message: "Geçersiz veri gönderildi" },
        { status: 400 }
      );
    }

    // Handle common Postgres errors (FK/constraint)
    const err = error as any;
    if (err && typeof err === "object" && typeof err.code === "string") {
      // 23503: foreign_key_violation, 23505: unique_violation
      if (err.code === "23503") {
        return NextResponse.json(
          { message: "Geçersiz referans: kullanıcı veya içerik bulunamadı" },
          { status: 400 }
        );
      }
      if (err.code === "23505") {
        return NextResponse.json(
          { message: "Aynı içerik için zaten şikayet mevcut" },
          { status: 400 }
        );
      }
    }

    // Fall back to returning the actual error message for easier debugging in dev
    const message = (error as Error)?.message || "Şikayet kaydedilirken bir hata oluştu";
    return NextResponse.json({ message }, { status: 500 });
  }
}
