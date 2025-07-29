import { db } from "@shared/db";
import { blogs } from "@shared/schemas";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import type { Metadata } from 'next';
import { cache } from 'react';

// Tip: Parametreler için tip tanımı
type Props = {
  params: { slug: string };
};

// Veri Çekme Fonksiyonunu cache ile sarmalayarak tekrar eden sorguları engelle
const getBlog = cache(async (slug: string) => {
  const blog = await db.query.blogs.findFirst({
    where: eq(blogs.slug, slug),
  });

  if (!blog) {
    notFound();
  }

  return blog;
});

// Dinamik Meta Etiketleri Oluşturma
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const blog = await getBlog(params.slug);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

      const metadata: Metadata = {
    title: blog.metaTitle || blog.title,
    description: blog.metaDescription || blog.description,
    alternates: {
      canonical: `${siteUrl}/blog/${blog.slug}`,
    },
    openGraph: {
      title: blog.metaTitle || blog.title,
      description: blog.metaDescription || blog.description || "",
      url: `${siteUrl}/blog/${blog.slug}`,
      type: 'article',
      publishedTime: blog.createdAt.toISOString(),
      modifiedTime: blog.updatedAt.toISOString(),
    },
    twitter: {
      card: 'summary_large_image',
      title: blog.metaTitle || blog.title,
      description: blog.metaDescription || blog.description || "",
    },
  };

  // JSON-LD script'ini 'other' property'si ile ekle
  if (blog.schema) {
    metadata.other = {
      'application/ld+json': JSON.stringify(blog.schema),
    };
  }

  return metadata;
}

// Blog Detay Sayfası Komponenti
export default async function BlogDetailPage({ params }: Props) {
  const blog = await getBlog(params.slug);

  return (
    <div className="container mx-auto px-4 py-8">
      <article className="prose lg:prose-xl max-w-none">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 text-center">{blog.title}</h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto text-center mb-4">{blog.description}</p>
        <div className="text-sm text-gray-500 mt-4 text-center mb-8">
          Yayınlanma Tarihi: {new Date(blog.createdAt).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
        <div dangerouslySetInnerHTML={{ __html: blog.content || '' }} />
      </article>
    </div>
  );
}
