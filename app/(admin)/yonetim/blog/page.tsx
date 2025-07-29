import BlogManagement from "@app/components/admin/blog/BlogManagement";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog Yönetimi",
  description: "Yeni blog yazıları ekleyin, mevcutları düzenleyin veya silin.",
};

export default function BlogAdminPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Blog Yönetimi</h1>
      <BlogManagement />
    </div>
  );
}
