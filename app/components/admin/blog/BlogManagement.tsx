"use client";

import React, { useState } from "react";
import { Button } from "@app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@app/components/ui/card";
import BlogList from "@app/components/admin/blog/BlogList";
import BlogForm from "@app/components/admin/blog/BlogForm";
import type { Blog } from "@shared/schemas";

const BlogManagement: React.FC = () => {
  const [viewMode, setViewMode] = useState<'list' | 'add' | 'edit'>('list');
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);

  const handleEdit = (blog: Blog) => {
    setEditingBlog(blog);
    setViewMode('edit');
  };

  const handleAddNew = () => {
    setEditingBlog(null);
    setViewMode('add');
  };

  const handleBackToList = () => {
    setEditingBlog(null);
    setViewMode('list');
  };

  const viewTitles = {
    list: 'Blog Listesi',
    add: 'Blog Ekle',
    edit: 'Blog Düzenle'
  };

  const state = {
    list: { text: 'Listeleme', color: 'bg-blue-100 text-blue-800' },
    add: { text: 'Yazma', color: 'bg-green-100 text-green-800' },
    edit: { text: 'Düzenleme', color: 'bg-orange-100 text-orange-800' }
  };

  return (
    <Card className="p-0">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{viewTitles[viewMode]}</CardTitle>
        <div className="flex items-center space-x-2">
          <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${state[viewMode].color}`}>
            {state[viewMode].text} Modu
          </span>
        </div>
        {viewMode === 'list' ? (
          <Button onClick={handleAddNew}>Yeni Blog Ekle</Button>
        ) : (
          <Button variant="outline" onClick={handleBackToList}>Geri Dön</Button>
        )}
      </CardHeader>
      <CardContent>
        {viewMode === 'list' && <BlogList onEdit={handleEdit} />}
        {(viewMode === 'add' || viewMode === 'edit') && (
          <BlogForm blog={editingBlog} onSuccess={handleBackToList} />
        )}
      </CardContent>
    </Card>
  );
};

export default BlogManagement;
