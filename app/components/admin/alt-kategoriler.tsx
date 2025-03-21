import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Category } from "@shared/schemas";
import { Button } from "@app/components/ui/button";
import { Input } from "@app/components/ui/input";
import { Card } from "@app/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
// Alt kategoriler sayfası
export default function AltKategorilerPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // URL'den kategori ID'sini al
  const categoryId = parseInt(window.location.pathname.split('/').pop() || '0');

  // Ana kategoriyi ve alt kategorileri getir
  const { data: categories = [], isLoading, error } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await fetch("/api/admin/categories");
      if (!response.ok) {
        throw new Error("Kategoriler yüklenemedi");
      }
      return response.json();
    },
  });

  // Ana kategoriyi bul
  const mainCategory = categories.find(c => c.id === categoryId);

  // Alt kategorileri filtrele
  const subCategories = categories.filter(c => c.parentId === categoryId);

  // Yeni alt kategori state'i
  const [newCategory, setNewCategory] = useState({
    name: "",
    parentId: categoryId,
    slug: "",
  });

  // Slug oluşturma fonksiyonu
  const createSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  // Yeni alt kategori ekleme mutasyonu
  const createCategoryMutation = useMutation({
    mutationFn: async (category: { name: string; parentId: number | null; slug: string }) => {
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(category),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Kategori eklenemedi");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setNewCategory({ name: "", parentId: categoryId, slug: "" });
      toast({
        title: "Başarılı",
        description: "Alt kategori eklendi",
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

  // Kategori güncelleme mutasyonu
  const updateCategoryMutation = useMutation({
    mutationFn: async (category: Category) => {
      const response = await fetch(`/api/admin/categories/${category.id}`, {
        method: "PATCH", // Kept as PATCH, change to PUT if API requires it
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(category),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Kategori güncellenemedi");
      }
      return response.json(); // This line was missing from the changes
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setEditingCategory(null);
      toast({
        title: "Başarılı",
        description: "Alt kategori güncellendi",
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

  // Kategori silme mutasyonu 
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Kategori silinemedi");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({
        title: "Başarılı",
        description: "Alt kategori silindi",
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

  // Yükleme durumu kontrolü
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 items-center justify-center h-screen">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  // Hata durumu kontrolü
  if (error) {
    return <div>Hata: {error instanceof Error ? error.message : 'Bir hata oluştu'}</div>;
  }

  // Ana kategori bulunamadı kontrolü
  if (!mainCategory) {
    return <div>Kategori bulunamadı</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          onClick={() => window.location.href = '/yonetim/kategoriler'}
        >
          ← Geri
        </Button>
        <h1 className="text-2xl font-bold">{mainCategory.name} - Alt Kategoriler</h1>
      </div>

      {/* Yeni Alt Kategori Ekleme Formu */}
      <Card className="p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Yeni Alt Kategori Ekle</h2>
        <div className="flex gap-4">
          <Input
            placeholder="Alt Kategori Adı"
            value={newCategory.name}
            onChange={(e) => {
              const name = e.target.value;
              setNewCategory(prev => ({
                ...prev,
                name,
                slug: createSlug(name)
              }));
            }}
          />
          <Button
            onClick={() => createCategoryMutation.mutate(newCategory)}
            disabled={!newCategory.name}
          >
            Ekle
          </Button>
        </div>
      </Card>

      {/* Alt Kategoriler Listesi */}
      <div className="space-y-4">
        {subCategories.map((category) => (
          <Card key={category.id} className="p-4 flex items-center justify-between">
            <span>{category.name}</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingCategory(category)}
              >
                Düzenle
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (confirm('Bu alt kategoriyi silmek istediğinizden emin misiniz?')) {
                    deleteCategoryMutation.mutate(category.id);
                  }
                }}
              >
                Sil
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Düzenleme Modalı */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <Card className="p-4 w-96">
            <h2 className="text-lg font-semibold mb-4">Alt Kategori Düzenle</h2>
            <Input
              className="mb-4"
              value={editingCategory.name}
              onChange={(e) => {
                const name = e.target.value;
                setEditingCategory(prev => ({
                  ...prev!,
                  name,
                  slug: createSlug(name)
                }));
              }}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setEditingCategory(null)}
              >
                İptal
              </Button>
              <Button
                onClick={() => updateCategoryMutation.mutate(editingCategory)}
              >
                Kaydet
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}