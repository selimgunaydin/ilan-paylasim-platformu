import { NextRequest, NextResponse } from "next/server";
import { db } from "@shared/db";
import { reports } from "@shared/schemas";
import { and, eq, desc, sql } from "drizzle-orm";
import { checkAdminAuth } from "@/utils/check-admin";

const allowedStatuses = new Set(["pending", "reviewed", "resolved"]);

export async function GET(request: NextRequest) {
  const auth = await checkAdminAuth(request);
  if (!auth) {
    return NextResponse.json({ message: "Yetkisiz erişim" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const reportTypeParam = searchParams.get("type");
  const statusParam = searchParams.get("status");
  const reportType = reportTypeParam === "listing" || reportTypeParam === "message" ? (reportTypeParam as "listing" | "message") : undefined;
  const status = statusParam && allowedStatuses.has(statusParam) ? statusParam : undefined;
  const page = Number(searchParams.get("page") ?? 1);
  const perPage = Math.min(Number(searchParams.get("perPage") ?? 20), 100);
  const offset = (page - 1) * perPage;

  try {
    const conds = [] as any[];
    if (reportType) conds.push(eq(reports.reportType, reportType));
    if (status) conds.push(eq(reports.status, status));
    const where = conds.length ? and(...conds) : undefined;

    const items = await db
      .select({
        id: reports.id,
        reportType: reports.reportType,
        contentId: reports.contentId,
        reason: reports.reason,
        status: reports.status,
        createdAt: reports.createdAt,
        reporterId: reports.reporterId,
        reportedUserId: reports.reportedUserId,
        reporterUsername: sql<string>`(select username from users u where u.id = ${reports.reporterId})`,
        reportedUsername: sql<string>`(select username from users u2 where u2.id = ${reports.reportedUserId})`,
      })
      .from(reports)
      .where(where as any)
      .orderBy(desc(reports.createdAt))
      .limit(perPage)
      .offset(offset);

    const data = items.map((r: any) => {
      const reporterLink = `/yonetim/users/${r.reporterId}`;
      const reportedLink = `/yonetim/users/${r.reportedUserId}`;
      const contentLink = r.reportType === "listing"
        ? `/yonetim/ilan/${r.contentId}`
        : `/yonetim/ilanmesajdetayi/${r.contentId}`;

      return {
        ...r,
        reporterLink,
        reportedLink,
        contentLink,
      };
    });

    return NextResponse.json({ items: data });
  } catch (e) {
    console.error("GET /api/admin/reports error", e);
    return NextResponse.json({ message: (e as Error).message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await checkAdminAuth(request);
  if (!auth) {
    return NextResponse.json({ message: "Yetkisiz erişim" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, status, notes } = body as { id: number; status: "pending" | "reviewed" | "resolved"; notes?: string };
    if (!id || !status || !allowedStatuses.has(status)) {
      return NextResponse.json({ message: "id ve status gereklidir" }, { status: 400 });
    }

    const [updated] = await db
      .update(reports)
      .set({
        status,
        reviewedAt: new Date(),
        reviewedBy: Number(auth.userId),
        notes: notes ?? null,
      })
      .where(eq(reports.id, id))
      .returning();

    return NextResponse.json({ item: updated });
  } catch (e) {
    console.error("PATCH /api/admin/reports error", e);
    return NextResponse.json({ message: (e as Error).message }, { status: 500 });
  }
}
