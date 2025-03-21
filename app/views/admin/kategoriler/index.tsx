"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Category } from "@shared/schemas";
import { Button } from "@app/components/ui/button";
import { Input } from "@app/components/ui/input";
import { Card } from "@app/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { SortableCategory } from "@app/components/admin/sortable-category";
import { Dialog, DialogContent } from "@app/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@app/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@app/components/ui/select";
import { Loader2 } from "lucide-react";
export default function KategorilerPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newCategory, setNewCategory] = useState({
    name: "",
    parentId: null as number | null,
    slug: "",
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    slug: "",
    parentId: null as number | null,
    customTitle: "",
    metaDescription: "",
    content: "",
    faqs: "",
  });
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  // Silme onayı için state ekle
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Ana kategorileri getir
  const {
    data: categories = [],
    isLoading,
    error,
  } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => fetch("/api/admin/categories").then((res) => res.json()),
  });

  // Sadece ana kategorileri filtrele (parent_id null olanlar)
  const mainCategories = categories.filter((cat) => cat.parentId === null);

  // Tüm kategorilerin ilan sayılarını tek seferde getir
  const { data: listingCounts = {} } = useQuery({
    queryKey: ["category-listing-counts"],
    queryFn: async () => {
      const promises = categories.map((category) =>
        fetch(`/api/admin/categories/${category.id}/listing-count`)
          .then((res) => res.json())
          .then((data) => ({ [category.id]: data.count }))
      );
      const results = await Promise.all(promises);
      return Object.assign({}, ...results);
    },
    enabled: categories.length > 0,
  });

  const reorderMutation = useMutation({
    mutationFn: (
      updates: { id: number; order: number; parentId: number | null }[]
    ) =>
      fetch("/api/admin/categories/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      }).then((res) => res.json()),
    onSuccess: (data) => {
      queryClient.setQueryData(["categories"], data);
      toast({
        title: "Başarılı",
        description: "Kategoriler yeniden sıralandı",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !categories) return;

    const oldIndex = categories.findIndex((cat) => cat.id === active.id);
    const newIndex = categories.findIndex((cat) => cat.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedCategories = arrayMove(categories, oldIndex, newIndex);

    const updates = reorderedCategories.map((cat, index) => ({
      id: Number(cat.id),
      order: index,
      parentId: cat.parentId ? Number(cat.parentId) : null,
    }));

    if (updates.length > 0) {
      reorderMutation.mutate(updates);
    }
  };

  const addMutation = useMutation({
    mutationFn: async (newCat: {
      name: string;
      parentId: number | null;
      slug: string;
    }) => {
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newCat),
      });
      if (!response.ok) {
        throw new Error("Kategori eklenemedi");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setNewCategory({ name: "", parentId: null, slug: "" });
      toast({
        title: "Başarılı",
        description: "Kategori başarıyla eklendi",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (category: Category) =>
      fetch(`/api/admin/categories/${category.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(category),
      }).then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setShowEditModal(false);
      toast({
        title: "Başarılı",
        description: "Kategori başarıyla güncellendi",
      });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Kategori güncellenirken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  // Silme mutation'ı ekle
  // Kategori silme işlemi için mutation
  const deleteMutation = useMutation({
    mutationFn: async (categoryId: number) => {
      // Önce kategorinin silinebilir olup olmadığını kontrol et
      const checkResponse = await fetch(
        `/api/admin/categories/${categoryId}/can-delete`
      );
      const checkData = await checkResponse.json();

      if (!checkData.canDelete) {
        throw new Error(checkData.reason);
      }

      // Kategoriyi sil
      const deleteResponse = await fetch(
        `/api/admin/categories/${categoryId}/force`,
        {
          method: "DELETE",
        }
      );

      if (!deleteResponse.ok) {
        const error = await deleteResponse.json();
        throw new Error(error.error);
      }

      return deleteResponse.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setCategoryToDelete(null);
      toast({
        title: "Başarılı",
        description: "Kategori başarıyla silindi",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
      setCategoryToDelete(null);
    },
  });

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setEditForm({
      name: category.name,
      slug: category.slug,
      parentId: category.parentId,
      customTitle: category.customTitle || "",
      metaDescription: category.metaDescription || "",
      content: category.content || "",
      faqs: category.faqs || "",
    });
    setShowEditModal(true);
  };

  const handleUpdate = () => {
    if (!editingCategory) return;

    updateMutation.mutate({
      ...editingCategory,
      name: editForm.name,
      slug: editForm.slug,
      parentId: editForm.parentId,
      customTitle: editForm.customTitle,
      metaDescription: editForm.metaDescription,
      content: editForm.content,
      faqs: editForm.faqs,
    });
  };

  // Silme onayı için fonksiyon
  const handleDeleteConfirm = () => {
    if (categoryToDelete) {
      deleteMutation.mutate(categoryToDelete.id);
    }
  };

  if (isLoading)
    return (
      <div className="flex flex-col gap-2 items-center justify-center h-screen">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  if (error)
    return (
      <div>
        Hata: {error instanceof Error ? error.message : "Bir hata oluştu"}
      </div>
    );
  if (!categories) return <div>Kategori bulunamadı</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-8">Kategoriler</h1>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Yeni Kategori Ekle</h2>
        <div className="flex gap-2">
          <Input
            value={newCategory.name}
            onChange={(e) =>
              setNewCategory({ ...newCategory, name: e.target.value })
            }
            placeholder="Kategori adı"
          />
          <Input
            value={newCategory.slug}
            onChange={(e) =>
              setNewCategory({ ...newCategory, slug: e.target.value })
            }
            placeholder="Slug"
          />
          {/* Üst kategori seçme alanı */}
          <Select
            value={newCategory.parentId?.toString() || "root"}
            onValueChange={(value) =>
              setNewCategory({
                ...newCategory,
                parentId: value === "root" ? null : parseInt(value),
              })
            }
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Üst kategori seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="root">Ana Kategori</SelectItem>
              {mainCategories.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => addMutation.mutate(newCategory)}>Ekle</Button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={categories.map((cat) => cat.id)}
          strategy={verticalListSortingStrategy}
        >
          {categories.map((category) => {
            // Her kategori için ilan sayısını kontrol et
            const hasListings = listingCounts[category.id] > 0;

            return (
              <SortableCategory
                key={category.id}
                category={category}
                onEdit={() => handleEdit(category)}
                // Sadece ilan sayısı kontrolü yap, alt kategori kontrolü SortableCategory içinde yapılıyor
                onDelete={
                  listingCounts[category.id] > 0
                    ? undefined
                    : () => setCategoryToDelete(category)
                }
              />
            );
          })}
        </SortableContext>
      </DndContext>

      {/* Kategori düzenleme modalı */}
      <Dialog
        open={showEditModal}
        onOpenChange={(open) => setShowEditModal(open)}
      >
        <DialogContent>
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-4">Kategori Düzenle</h2>
            <div className="space-y-4">
              <Input
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                placeholder="Kategori Adı"
              />
              <Input
                value={editForm.slug}
                onChange={(e) =>
                  setEditForm({ ...editForm, slug: e.target.value })
                }
                placeholder="Slug"
              />
              {/* Üst kategori seçme alanı */}
              <Select
                value={editForm.parentId?.toString() || "root"}
                onValueChange={(value) =>
                  setEditForm({
                    ...editForm,
                    parentId: value === "root" ? null : parseInt(value),
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Üst kategori seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">Ana Kategori</SelectItem>
                  {/* Sadece ana kategorileri listele */}
                  {mainCategories.map((category) =>
                    // Kendisini üst kategori olarak seçememesi için kontrol ekle
                    editingCategory && category.id !== editingCategory.id ? (
                      <SelectItem
                        key={category.id}
                        value={category.id.toString()}
                      >
                        {category.name}
                      </SelectItem>
                    ) : null
                  )}
                </SelectContent>
              </Select>

              {/* SEO Fields */}
              <div className="pt-4 border-t">
                <h3 className="text-md font-semibold mb-2">SEO Ayarları</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm mb-1">
                      Özel Başlık (Title)
                    </label>
                    <Input
                      value={editForm.customTitle}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          customTitle: e.target.value,
                        })
                      }
                      placeholder="SEO Başlık (Boş bırakılırsa kategori adı kullanılır)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-1">Meta Açıklama</label>
                    <textarea
                      value={editForm.metaDescription}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          metaDescription: e.target.value,
                        })
                      }
                      placeholder="Meta açıklama"
                      className="w-full px-3 py-2 border rounded-md"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-1">
                      Kategori İçeriği (Makale)
                    </label>
                    <textarea
                      value={editForm.content}
                      onChange={(e) =>
                        setEditForm({ ...editForm, content: e.target.value })
                      }
                      placeholder="Kategori sayfasında gösterilecek içerik"
                      className="w-full px-3 py-2 border rounded-md"
                      rows={5}
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-1">S.S.S (JSON)</label>
                    <textarea
                      value={editForm.faqs}
                      onChange={(e) =>
                        setEditForm({ ...editForm, faqs: e.target.value })
                      }
                      placeholder='[{"question":"Soru 1?","answer":"Cevap 1"},{"question":"Soru 2?","answer":"Cevap 2"}]'
                      className="w-full px-3 py-2 border rounded-md font-mono text-sm"
                      rows={5}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      JSON formatında S.S.S. sorularını girin
                    </p>
                  </div>
                </div>
              </div>

              <Button onClick={handleUpdate}>Güncelle</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Silme onayı diyaloğu */}
      <AlertDialog
        open={!!categoryToDelete}
        onOpenChange={(open) => !open && setCategoryToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kategoriyi Sil</AlertDialogTitle>
            <AlertDialogDescription>
              "{categoryToDelete?.name}" kategorisini silmek istediğinizden emin
              misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCategoryToDelete(null)}>
              İptal
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
