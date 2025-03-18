'use client';
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent } from "@app/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@app/components/ui/form";
import { Input } from "@app/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@app/components/ui/select";
import { Switch } from "@app/components/ui/switch";
import { Textarea } from "@app/components/ui/textarea";
import { Button } from "@app/components/ui/button";
import { X, User, Upload, Save, Trash2, AlertTriangle } from 'lucide-react';
import { turkishCities } from "@/lib/constants";
import { getProfileImageUrl } from "@/lib/avatar";
import { AvatarSelectorModal } from "@app/components/ui/avatar-selector-modal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@app/components/ui/alert-dialog";

const uploadImage = async (file: File) => {
  const formData = new FormData();
  formData.append('profileImage', file);
  const res = await fetch('/api/user/upload-profile-image', { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Profil resmi yüklenemedi');
  return (await res.json()).user.profileImage;
};

export default function Profile({ initialData }: any) {
  const { toast } = useToast();
  const router = useRouter();
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm({
    defaultValues: {
      username: initialData.username || "",
      email: initialData.email || "",
      password: "",
      passwordConfirm: "",
      profileImage: initialData.profileImage || "",
      avatar: initialData.avatar || "",
      profileVisibility: initialData.profileVisibility || false,
      gender: initialData.gender || "unspecified",
      age: initialData.age?.toString() || "",
      city: initialData.city || "",
      aboutMe: initialData.aboutMe || "",
    },
    mode: "onChange"
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      setLoading(true);
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Profil güncellenemedi");
      return res.json();
    },
    onSuccess: () => {
      setLoading(false);
      toast({ 
        title: "Profil güncellendi", 
        description: "Bilgileriniz başarıyla kaydedildi",
        variant: "success" 
      });
    },
    onError: (error: Error) => {
      setLoading(false);
      toast({ 
        title: "Hata", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      setLoading(true);
      const res = await fetch("/api/user", { method: "DELETE" });
      if (!res.ok) throw new Error("Hesap silinemedi");
    },
    onSuccess: () => router.push('/'),
    onError: (error: Error) => {
      setLoading(false);
      toast({ title: "Hata", description: error.message, variant: "destructive" });
    },
  });

  const handleDeleteAccount = () => {
    setIsDeleteDialogOpen(false);
    deleteAccountMutation.mutate();
  };

  const onSubmit = async (data: any) => {
    if (data.password && data.password !== data.passwordConfirm) {
      return toast({ 
        title: "Hata", 
        description: "Şifreler eşleşmiyor", 
        variant: "destructive" 
      });
    }

    const updateData = {
      username: data.username,
      profileImage: data.profileImage,
      profileVisibility: data.profileVisibility,
      gender: data.gender,
      age: parseInt(data.age, 10),
      city: data.city,
      aboutMe: data.aboutMe,
      ...(data.password ? { password: data.password } : {}),
    };

    updateProfileMutation.mutate(updateData);
  };

  const ageOptions = Array.from({ length: 73 }, (_, i) => i + 18);

  return (
    <div className="container min-h-screen pt-4 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profilim</h1>
        <p className="text-gray-600">
          Kişisel bilgilerinizi güncelleyebilirsiniz
        </p>
      </div>
        <Card className=" rounded-xl overflow-hidden border">
          <CardContent className="p-0">
            {/* Profile Header with Banner */}
            <div className="bg-gradient-to-r from-gray-200 to-gray-100 h-32 sm:h-40 relative">
              <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-white p-1 shadow-lg">
                    <img
                      src={getProfileImageUrl(form.getValues('profileImage'), initialData?.gender || 'unspecified', form.getValues('avatar'))}
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  {form.getValues('profileImage') && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-7 w-7 rounded-full p-0 shadow-md"
                      onClick={async () => {
                        try {
                          if (!form.getValues('profileImage').startsWith('/avatars/')) {
                            const res = await fetch('/api/user/profile-image', { method: 'DELETE' });
                            if (!res.ok) throw new Error('Profil resmi silinemedi');
                          }
                          form.setValue('profileImage', '');
                          toast({ title: "Başarılı", description: "Profil resmi kaldırıldı", variant: "success" });
                        } catch (error: any) {
                          toast({ title: "Hata", description: error.message, variant: "destructive" });
                        }
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button 
                    type="button" 
                    variant="secondary" 
                    size="sm" 
                    className="rounded-full text-xs px-4 shadow-md"
                    onClick={() => setIsAvatarModalOpen(true)}
                  >
                    <User className="h-3.5 w-3.5 mr-1" />
                    Avatar Seç
                  </Button>
                  <div className="relative">
                    <Input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const imageUrl = await uploadImage(file);
                            form.setValue('profileImage', imageUrl);
                            toast({ title: "Başarılı", description: "Profil resmi güncellendi", variant: "success" });
                          } catch (error: any) {
                            toast({ title: "Hata", description: error.message, variant: "destructive" });
                          }
                        }
                      }}
                    />
                    <Button 
                      type="button" 
                      variant="secondary" 
                      size="sm" 
                      className="rounded-full text-xs px-4 shadow-md pointer-events-none"
                    >
                      <Upload className="h-3.5 w-3.5 mr-1" />
                      Resim Yükle
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <AvatarSelectorModal
              open={isAvatarModalOpen}
              onOpenChange={setIsAvatarModalOpen}
              onSelect={(avatarPath) => {
                form.setValue('profileImage', avatarPath);
                form.setValue('avatar', avatarPath);
                form.trigger('profileImage');
              }}
              gender={initialData?.gender || 'unspecified'}
            />

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 p-6 pt-20">
                {/* Form Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Üye Adı</FormLabel>
                        <FormControl>
                          <Input {...field} className="rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 shadow-sm" />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">E-posta</FormLabel>
                        <FormControl>
                          <Input {...field} disabled className="rounded-lg bg-gray-50 border-gray-300 text-gray-500 shadow-sm" />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Cinsiyet</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 shadow-sm">
                              <SelectValue placeholder="Cinsiyet seçiniz" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="female">Kadın</SelectItem>
                            <SelectItem value="male">Erkek</SelectItem>
                            <SelectItem value="unspecified">Belirtmek İstemiyorum</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Yaş</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 shadow-sm">
                              <SelectValue placeholder="Yaş seçiniz" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ageOptions.map((age) => (
                              <SelectItem key={age} value={age.toString()}>{age}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Yaşadığım Şehir</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 shadow-sm">
                              <SelectValue placeholder="Şehir seçiniz" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {turkishCities.map((city) => (
                              <SelectItem key={city} value={city}>{city}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="profileVisibility"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 col-span-full shadow-sm bg-blue-50 border-blue-100">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base font-medium text-gray-800">Açık Profil</FormLabel>
                          <FormDescription className="text-xs text-gray-600">
                            Profiliniz üyeler listesinde görünür ve mesaj alabilirsiniz
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch 
                            checked={field.value} 
                            onCheckedChange={field.onChange} 
                            className="data-[state=checked]:bg-blue-600"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="aboutMe"
                    render={({ field }) => (
                      <FormItem className="col-span-full">
                        <FormLabel className="text-sm font-medium text-gray-700">Hakkımda</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Kendinizden bahsedin..."
                            className="resize-none rounded-lg min-h-[120px] border-gray-300 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Password Section */}
                <div className="space-y-4 border-t pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-lg font-medium text-gray-900">Şifre Değiştir</h2>
                    <div className="flex-1 border-t border-gray-200"></div>
                  </div>
                  <p className="text-sm text-gray-600">Şifrenizi değiştirmek istemiyorsanız bu alanları boş bırakın.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">Yeni Şifre</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              {...field} 
                              className="rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 shadow-sm" 
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="passwordConfirm"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">Şifre (Tekrar)</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              {...field} 
                              className="rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 shadow-sm" 
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full sm:w-auto flex-1 bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md transition-all duration-200 py-2"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        İşleniyor...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center">
                        <Save className="h-4 w-4 mr-2" />
                        Değişiklikleri Kaydet
                      </span>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={loading}
                    className="w-full sm:w-auto flex-1 border-red-500 text-red-500 hover:bg-red-50 rounded-lg shadow-sm transition-all duration-200 py-2"
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Hesabı Sil
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-red-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Hesabı Sil
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Hesabınızı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve tüm verileriniz kalıcı olarak silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Vazgeç</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700 rounded-lg"
              onClick={handleDeleteAccount}
            >
              Hesabımı Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}