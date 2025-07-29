"use client";

import React, { useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@app/components/ui/button";
import { Input } from "@app/components/ui/input";
import { Textarea } from "@app/components/ui/textarea";
import { Label } from "@app/components/ui/label";
import { useToast } from "@app/hooks/use-toast";
import { insertBlogSchema, type Blog, type InsertBlog } from "@shared/schemas";
import { apiRequest } from "@/lib/queryClient";
import { SiteSettings } from "@shared/schemas";

interface BlogFormProps {
  blog?: Blog | null;
  onSuccess: () => void;
}

interface SiteSettingsProps {
  settings: SiteSettings 
}

const slugify = (text: string) => {
  const a = 'şŞıİçÇüÜöÖğĞ';
  const b = 'ssiccuuoogg';
  const p = new RegExp(a.split('').join('|'), 'g');

  return text.toString().toLowerCase()
    .replace(p, c => b.charAt(a.indexOf(c)))
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

const BlogForm: React.FC<BlogFormProps> = ({ blog, onSuccess }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors }, watch, setValue } = useForm<InsertBlog>({
    resolver: zodResolver(insertBlogSchema),
    defaultValues: blog ? { ...blog, schema: JSON.stringify(blog.schema, null, 2) } : { schema: JSON.stringify({ '@context': 'https://schema.org', '@type': 'BlogPosting' }, null, 2) },
  });

  useEffect(() => {
    if (blog) {
      reset({ ...blog, schema: JSON.stringify(blog.schema, null, 2) });
    } else {
      reset({ title: '', slug: '', description: '', content: '', metaTitle: '', metaDescription: '', schema: JSON.stringify({ '@context': 'https://schema.org', '@type': 'BlogPosting' }, null, 2) });
    }
  }, [blog, reset]);

  const watchedTitle = watch("title");
  const watchedDescription = watch("description");
  const watchedContent = watch("content");
  const watchedMetaTitle = watch("metaTitle");
  const watchedMetaDescription = watch("metaDescription");
  const watchedSlug = watch("slug");

  useEffect(() => {
    if (watchedTitle) {
      setValue("slug", slugify(watchedTitle), { shouldValidate: true });
    }
  }, [watchedTitle, setValue]);

  // Dinamik JSON-LD BlogPosting şeması üretimi
  useEffect(() => {
    const jsonld = {
      "@context": "https://schema.org",
      "@type": "Article",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": watchedSlug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/blog/${watchedSlug}` : ""
      },
      "headline": watchedMetaTitle || watchedTitle || "",
      "description": watchedMetaDescription || watchedDescription || "",
      "image": "/default-image.png", // TODO: Dinamikleştirilebilir, şimdilik statik veya boş bırakılabilir
      "author": {
        "@type": "Person",
        "name": "Site Admin" // TODO: Dinamik yazar desteği eklenebilir
      },
      "publisher": {
        "@type": "Organization",
        "name": "İlan Platformu", // TODO: .env veya config ile dinamik yapılabilir
        "logo": {
          "@type": "ImageObject",
          "url": "/default-image.png" // TODO: Dinamik/logo upload ile güncellenebilir
        }
      },
      "datePublished": new Date().toISOString(),
      "dateModified": new Date().toISOString(),
      "articleBody": watchedContent || ""
    };
    setValue("schema", JSON.stringify(jsonld, null, 2));
    // eslint-disable-next-line
  }, [watchedTitle, watchedDescription, watchedContent, watchedMetaTitle, watchedMetaDescription, watchedSlug, setValue]);

  const mutation = useMutation({
    mutationFn: (data: InsertBlog) => {
      const url = blog ? `/api/admin/blogs/${blog.slug}` : '/api/admin/blogs';
      const method = blog ? 'PUT' : 'POST';
      return apiRequest({ url, method, data });
    },
    onSuccess: () => {
      toast({ title: "Başarılı!", description: `Blog yazısı ${blog ? 'güncellendi' : 'oluşturuldu'}.` });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/blogs'] });
      onSuccess();
    },
    onError: (error: any) => {
      toast({ title: "Hata!", description: error.message || 'Bir hata oluştu.', variant: "destructive" });
    },
  });

  const onSubmit: SubmitHandler<InsertBlog> = (data) => {
    // The schema is sent as a string and validated on the server.
    // Drizzle will handle converting the string to a jsonb type for the database.
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* <h2 className="text-2xl font-bold">{blog ? "Blog Yazısını Düzenle" : "Yeni Blog Yazısı Oluştur"}</h2> */}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="title">Başlık</Label>
          <Input id="title" {...register("title")} />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
        </div>
        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" {...register("slug")} />
          {errors.slug && <p className="text-red-500 text-sm mt-1">{errors.slug.message}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="description">Kısa Açıklama</Label>
        <Textarea id="description" {...register("description")} />
        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
      </div>

      <div>
        <Label htmlFor="content">İçerik</Label>
        <Textarea id="content" {...register("content")} rows={10} />
        {errors.content && <p className="text-red-500 text-sm mt-1">{errors.content.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="metaTitle">Meta Başlık</Label>
          <Input id="metaTitle" {...register("metaTitle")} />
          {errors.metaTitle && <p className="text-red-500 text-sm mt-1">{errors.metaTitle.message}</p>}
        </div>
        <div>
          <Label htmlFor="metaDescription">Meta Açıklama</Label>
          <Input id="metaDescription" {...register("metaDescription")} />
          {errors.metaDescription && <p className="text-red-500 text-sm mt-1">{errors.metaDescription.message}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="schema">JSON-LD Schema</Label>
        <Textarea id="schema" {...register("schema")} rows={10} />
        {errors.schema && <p className="text-red-500 text-sm mt-1">{errors.schema.message}</p>}
      </div>

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onSuccess}>İptal</Button>
        <Button type="submit">{blog ? "Güncelle" : "Oluştur"}</Button>
      </div>
    </form>
  );
};

export default BlogForm;
