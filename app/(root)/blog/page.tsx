import type { Metadata } from 'next';
import Link from 'next/link';
import { desc } from 'drizzle-orm';
import { blogs, type Blog } from '@shared/schemas';
import { db } from '@shared/db';

// Blog ana sayfası için statik metadata
export const metadata: Metadata = {
  title: 'Blog | Proje Adınız',
  description: 'Teknoloji, geliştirme ve daha fazlası üzerine en son yazılarımızı okuyun.',
};

async function getBlogs() {
  const allBlogs = await db.query.blogs.findMany({
    orderBy: [desc(blogs.createdAt)],
  });
  return allBlogs;
}

export default async function BlogPage() {
  const allBlogs = await getBlogs();

  return (
    <div className="container mx-auto px-4 py-12">
      <header className="text-center mb-12">
        <h1 className="text-5xl font-extrabold text-gray-900">Blog</h1>
        <p className="mt-4 text-lg text-gray-600">En son yazılarımız ve güncellemelerimiz.</p>
      </header>

      {allBlogs.length === 0 ? (
        <p className="text-center text-gray-500">Henüz yayınlanmış bir blog yazısı bulunmuyor.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {allBlogs.map((blog: Blog) => (
            <Link href={`/blog/${blog.slug}`} key={blog.id} className="block group">
              <div className="border rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300 h-full flex flex-col">
                <div className="p-6 flex-grow">
                  <h2 className="text-2xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors duration-300 mb-2">{blog.title}</h2>
                  <p className="text-gray-600 line-clamp-3">{blog.description}</p>
                </div>
                <div className="bg-gray-50 p-4 mt-auto">
                    <span className="text-blue-600 font-semibold">Devamını Oku &rarr;</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
//admin panelden gelen seo uyumlu bilgileri çekecek blog sayfası.
