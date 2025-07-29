import { db } from "@shared/db";
import { blogs, insertBlogSchema } from "@shared/schemas";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const allBlogs = await db.select().from(blogs);
    return NextResponse.json(allBlogs);
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return NextResponse.json({ message: "Error fetching blogs" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = insertBlogSchema.parse(body);
    const newBlog = await db.insert(blogs).values(validatedData).returning();
    return NextResponse.json(newBlog[0]);
  } catch (error) {
    console.error("Error creating blog:", error);
    return NextResponse.json({ message: "Error creating blog", error }, { status: 500 });
  }
}
