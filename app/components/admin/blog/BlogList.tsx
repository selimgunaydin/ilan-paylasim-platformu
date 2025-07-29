"use client";

import React from "react";
import type { Blog } from "@shared/schemas";
import { useToast } from "@app/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { Button } from "../../ui/button";
import { Skeleton } from "../../ui/skeleton";
import { Eye, Pencil, Trash2 } from "lucide-react";

interface BlogListProps {
  onEdit: (blog: Blog) => void;
}

const BlogList: React.FC<BlogListProps> = ({ onEdit }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: blogs, isLoading, isError } = useQuery<Blog[]>({
    queryKey: ["/api/admin/blogs"],
    queryFn: getQueryFn("/api/admin/blogs"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest({ url: `/api/admin/blogs/${id}`, method: "DELETE" }),
    onSuccess: () => {
      toast({
        title: "Başarılı!",
        description: "Blog yazısı başarıyla silindi.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blogs"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata!",
        description: error.message || "Blog yazısı silinirken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <div>
        <h3 className="mb-4">Blog Listesi</h3>
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (isError) {
    return <div>Bloglar yüklenirken bir hata oluştu.</div>;
  }

  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">ID</TableHead>
            <TableHead className="min-w-[200px]">Başlık</TableHead>
            <TableHead className="min-w-[200px] hidden md:table-cell">Meta Başlık</TableHead>
            <TableHead className="w-[120px] text-right">Tarih</TableHead>
            <TableHead className="w-[240px] text-right">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {blogs?.map((blog) => (
            <TableRow key={blog.id}>
              <TableCell className="font-medium">{blog.id}</TableCell>
              <TableCell className="font-medium">{blog.title}</TableCell>
              <TableCell className="hidden md:table-cell text-muted-foreground">{blog.metaTitle}</TableCell>
              <TableCell className="text-right">
                <div className="text-sm text-muted-foreground">
                  {new Date(blog.createdAt).toLocaleDateString('tr-TR')}
                </div>
              </TableCell>
              <TableCell className="text-right space-x-2 justify-center">
                <Button 
                  variant="outline" 
                  size="sm" 
                  asChild
                  className="h-8 w-8"
                >
                  <a href={`/blog/${blog.slug}`} target="_blank" rel="noopener noreferrer">
                    <Eye />
                  </a>
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={() => onEdit(blog)}
                  className="h-8 w-12"
                >
                  <Pencil />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(blog.id)}
                  disabled={deleteMutation.isPending}
                  className="h-8 w-8"
                >
                  <Trash2 />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default BlogList;
