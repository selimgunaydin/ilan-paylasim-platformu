"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  UniqueIdentifier,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "@app/components/ui/button";
import { Input } from "@app/components/ui/input";
import { Card } from "@app/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { SortableCategory } from "@app/components/admin/sortable-category";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@app/components/ui/dialog";
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

// Refined Type Definitions
export interface Category { // Base Category type
  id: number;
  name: string;
  parentId: number | null;
  slug: string;
  order: number;
  customTitle?: string | null;
  metaDescription?: string | null;
  content?: string | null;
  faqs?: any | null; 
}

export interface CategoryWithChildren extends Category { // Category with children property
  children: CategoryWithChildren[];
}

// Define the strictly typed structure SortableCategory expects
interface NormalizedCategoryForSortable extends Omit<CategoryWithChildren, 'customTitle' | 'metaDescription' | 'content' | 'faqs' | 'children'> {
  customTitle: string | null;
  metaDescription: string | null;
  content: string | null;
  faqs: string | null;
  children: NormalizedCategoryForSortable[];
}

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
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryWithChildren | null>( // Changed type to CategoryWithChildren for consistency
    null
  );
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Ana kategorileri getir
  const {
    data: fetchedCategories = [],
    isLoading,
    error,
  } = useQuery<CategoryWithChildren[]>({ 
    queryKey: ["categories"],
    queryFn: () => fetch("/api/admin/categories").then((res) => res.json()),
  });

  // categoryTree is the primary state for our categories, sorted.
  const categoryTree: CategoryWithChildren[] = fetchedCategories.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  // For UI <Select> elements that only need top-level categories
  const mainCategoriesForSelect = categoryTree.filter((cat) => cat.parentId === null);

  // Debugging useEffect for categoryTree structure (can be removed once stable)
  useEffect(() => {
    if (!isLoading && categoryTree && categoryTree.length > 0) { 
      console.log("--- useEffect: categoryTree (derived from fetchedCategories) updated ---");
      categoryTree.forEach(cat => {
        let childInfo = "NO children reported by API or children array is empty.";
        if (cat.children && cat.children.length > 0) {
          childInfo = `has ${cat.children.length} children (from API): [${cat.children.map(c => c.name).join(', ')}]`;
        }
        console.log(`Category ${cat.name} (ID: ${cat.id}, parentId: ${cat.parentId}, order: ${cat.order}) ${childInfo}`);
      });
      console.log("-------------------------------------");
    }
  }, [categoryTree, isLoading]); // Only depends on categoryTree and isLoading

  // Tüm kategorilerin ilan sayılarını tek seferde getir
  const { data: listingCounts = {} } = useQuery({
    queryKey: [
      "listingCounts",
      categoryTree.reduce(
        (acc, cat) => acc + cat.id + (cat.children?.map((c: CategoryWithChildren) => c.id).join(",") || ""),
        ""
      ),
    ],
    queryFn: async () => {
      const allCategoryIds: number[] = [];
      const collectIds = (categoriesToScan: CategoryWithChildren[]) => {
        for (const category of categoriesToScan) {
          allCategoryIds.push(category.id);
          if (category.children && category.children.length > 0) {
            collectIds(category.children);
          }
        }
      };
      collectIds(categoryTree); 

      if (allCategoryIds.length === 0) return {};

      const promises = allCategoryIds.map((id) =>
        fetch(`/api/admin/categories/${id}/listing-count`)
          .then((res) => res.json())
          .then((data) => ({ [id]: data.count }))
      );
      const results = await Promise.all(promises);
      return Object.assign({}, ...results);
    },
    enabled: !isLoading && categoryTree.length > 0, // Ensure it runs after categoryTree is populated and not loading
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
    onSuccess: () => { // Gelen 'data' (düz liste) doğrudan kullanılmayacak
      // 'categories' sorgusunu geçersiz kılarak hiyerarşik verinin yeniden çekilmesini sağla
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({
        title: "Başarılı",
        description: "Kategoriler yeniden sıralandı ve güncel liste getiriliyor.",
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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !categoryTree || categoryTree.length === 0) return;

    // Find the items in the current rendering (which is categoryTree for top-level)
    // This logic needs to be more sophisticated if we are dragging sub-categories
    // For now, assuming top-level drag or that SortableCategory handles sub-drags internally.
    const activeItem = categoryTree.find(cat => cat.id === active.id);
    const overItem = categoryTree.find(cat => cat.id === over.id);

    if (!activeItem || !overItem) {
        // This might happen if dragging a sub-category and our flat finders don't catch it.
        // The original logic from dnd-kit for finding items in nested structures might be needed here
        // or ensure SortableCategory correctly passes up child drag events.
        console.warn("Could not find active or over item in top-level categoryTree. Drag might be for a sub-category.");
        // Attempt to find in children if not found at top level - this is a quick fix, might need robust deep find
        // This part will be complex if we handle all drag scenarios here.
        // For now, let's assume SortableCategory provides necessary context or handles its children.
        // The key is that `reorderMutation.mutate` needs a list of sibling categories to reorder.
        // setActiveId(null); // Do this at the end
        // return; // Let's proceed with caution.
    }

    // Logic for determining siblings and parentId
    let parentIdToReorder: number | null = null;
    let itemsToReorder: CategoryWithChildren[] = [];

    // Try to find the actual active and over categories in the tree, potentially nested
    let actualActiveCategory: CategoryWithChildren | undefined;
    let actualOverCategory: CategoryWithChildren | undefined;
    let actualActiveParent: CategoryWithChildren | undefined;

    const findNestedCategoryAndParent = (items: CategoryWithChildren[], id: number, parent?: CategoryWithChildren): { cat?: CategoryWithChildren, parent?: CategoryWithChildren } => {
        for (const item of items) {
            if (item.id === id) return { cat: item, parent };
            if (item.children) {
                const found = findNestedCategoryAndParent(item.children, id, item);
                if (found.cat) return found;
            }
        }
        return {};
    };

    const activeSearchResult = findNestedCategoryAndParent(categoryTree, Number(active.id));
    actualActiveCategory = activeSearchResult.cat;
    actualActiveParent = activeSearchResult.parent;

    const overSearchResult = findNestedCategoryAndParent(categoryTree, Number(over.id));
    actualOverCategory = overSearchResult.cat;

    if (!actualActiveCategory || !actualOverCategory) {
        toast({ 
            title: "Hata", 
            description: "Sıralama için aktif veya hedef kategori bulunamadı.", 
            variant: "destructive" 
        });
        setActiveId(null);
        return;
    }

    // Check if they are siblings (same parent)
    const activeParentId = actualActiveParent ? actualActiveParent.id : null;
    const overParentId = (findNestedCategoryAndParent(categoryTree, Number(over.id))).parent?.id ?? null;

    if (activeParentId === overParentId) {
        parentIdToReorder = activeParentId;
        itemsToReorder = actualActiveParent ? actualActiveParent.children : categoryTree.filter(c => c.parentId === null);
    } else {
        toast({ 
            title: "Uyarı", 
            description: "Kategoriler sadece kendi seviyeleri içinde sıralanabilir.", 
            variant: "default" // Using default variant for warning, adjust if a specific 'warning' variant exists
        });
        setActiveId(null);
        return;
    }

    const oldIndex = itemsToReorder.findIndex((cat) => cat.id === Number(active.id));
    const newIndex = itemsToReorder.findIndex((cat) => cat.id === Number(over.id));

    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
        setActiveId(null);
        return; // Item not found in the list or no change in position
    }

    const reorderedSiblings = arrayMove(itemsToReorder, oldIndex, newIndex);

    const updates = reorderedSiblings.map((cat, index) => ({
      id: Number(cat.id),
      order: index, // Order within siblings is now 0-based index
      parentId: parentIdToReorder,
    }));

    if (updates.length > 0) {
        reorderMutation.mutate(updates);
    }

    setActiveId(null);
  };

  // Helper function to normalize category data for SortableCategory component
  const normalizeCategoryForSortable = (
    cat: CategoryWithChildren
  ): NormalizedCategoryForSortable => {
    return {
      // Spread all properties from Category that are not being overridden or are compatible
      id: cat.id,
      name: cat.name,
      parentId: cat.parentId,
      slug: cat.slug,
      order: cat.order,
      // Ensure these specific fields are string | null
      customTitle: cat.customTitle || null,
      metaDescription: cat.metaDescription || null,
      content: cat.content || null,
      faqs: typeof cat.faqs === 'string' ? cat.faqs : null, 
      children: cat.children
        ? cat.children.map(normalizeCategoryForSortable) // Recursively normalize children
        : [],
    };
  };

  // New handler to request deletion for ANY category (main or sub)
  // SortableCategory will call this with the specific category instance
  const requestCategoryDeletion = (categoryToRequest: CategoryWithChildren) => {
    // Pre-checks can be done here if necessary, but SortableCategory will also check listings and children
    // The main role of this function is to set the state for the confirmation dialog
    setCategoryToDelete(categoryToRequest);
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

  const handleEdit = useCallback((category: Category) => {
    // console.log("handleEdit (useCallback) çağrıldı, düzenlenmek istenen kategori:", JSON.stringify(category, null, 2));
    setEditingCategory(category);
    setEditForm({
      name: category.name,
      slug: category.slug,
      parentId: category.parentId,
      customTitle: category.customTitle || "",
      metaDescription: category.metaDescription || "",
      content: category.content || "",
      faqs: typeof category.faqs === 'string' ? category.faqs : (category.faqs ? JSON.stringify(category.faqs, null, 2) : ""),
    });
    setShowEditModal(true);
  }, [setEditingCategory, setEditForm, setShowEditModal]);

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
  if (!categoryTree) return <div>Kategori bulunamadı</div>;

  return (
    <div>
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
              {mainCategoriesForSelect.map((category) => (
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
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={categoryTree.map((cat) => cat.id)} // Use categoryTree for top-level sortable context
          strategy={verticalListSortingStrategy}
        >
          {categoryTree.map((category) => { // Iterate over categoryTree for rendering
            // Her kategori için ilan sayısını kontrol et
            const normalizedCat = normalizeCategoryForSortable(category);
            return (
              <SortableCategory
                key={normalizedCat.id}
                category={normalizedCat}
                onEdit={(categoryFromSortable) => {
                  // console.log("KategorilerPage (inline onEdit): SortableCategory'den onEdit çağrıldı. Gelen kategori:", JSON.stringify(categoryFromSortable, null, 2));
                  handleEdit(categoryFromSortable); // handleEdit'i gelen kategoriyle çağır
                }}
                onDelete={requestCategoryDeletion} // onDelete'i de benzer şekilde sarmalamak gerekebilir, şimdilik kalsın
                listingCounts={listingCounts}
              />
            );
          })}
        </SortableContext>
      </DndContext>

      {/* Kategori Düzenleme Modalı */}
      <Dialog
        open={showEditModal}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setShowEditModal(false);
            setEditingCategory(null); // Modalı kapatırken düzenlenmekte olan kategoriyi temizle
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle>Kategoriyi Düzenle</DialogTitle>
            <DialogDescription>
              Buradan "{editingCategory?.name}" kategorisinin bilgilerini güncelleyebilirsiniz.
            </DialogDescription>
          </DialogHeader>
          {editingCategory && (
            <div className="space-y-6 pt-4"> {/* pt-4 eklendi başlık ile form arasına boşluk için*/}
              {/* Form Alanları... */}
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
                    {mainCategoriesForSelect.map((category) =>
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
          )}
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
