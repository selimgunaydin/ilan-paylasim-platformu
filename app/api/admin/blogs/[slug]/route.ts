import { db } from "@shared/db";
import { blogs, insertBlogSchema } from "@shared/schemas";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    const blogPost = await db.query.blogs.findFirst({
      where: eq(blogs.slug, slug),
    });

    if (!blogPost) {
      return NextResponse.json({ error: "Blog yazısı bulunamadı" }, { status: 404 });
    }

    return NextResponse.json(blogPost);
  } catch (error) {
    console.error("Blog getirilirken hata oluştu:", error);
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const body = await req.json();
    const validatedData = insertBlogSchema.parse(body);
    const updatedBlog = await db
      .update(blogs)
      .set(validatedData)
      .where(eq(blogs.slug, slug))
      .returning();

    if (updatedBlog.length === 0) {
      return NextResponse.json({ message: "Blog not found" }, { status: 404 });
    }

    return NextResponse.json(updatedBlog[0]);
  } catch (error) {
    console.error("Error updating blog:", error);
    return NextResponse.json(
      { message: "Error updating blog", error },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const deletedBlog = await db
      .delete(blogs)
      .where(eq(blogs.slug, slug))
      .returning();

    if (deletedBlog.length === 0) {
      return NextResponse.json({ message: "Blog not found" }, { status: 404 });
    }

    return NextResponse.json(deletedBlog[0]);
  } catch (error) {
    console.error("Error deleting blog:", error);
    return NextResponse.json(
      { message: "Error deleting blog", error },
      { status: 500 }
    );
  }
}
