'use client';
import { useAuth } from "@/hooks/use-auth";
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
import { X } from 'lucide-react';
import { turkishCities } from "@/lib/constants";
import { getProfileImageUrl } from "@/lib/avatar";
import { AvatarSelectorModal } from "@app/components/ui/avatar-selector-modal";

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
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Profil güncellenemedi");
      return res.json();
    },
    onSuccess: () => toast({ title: "Profil güncellendi", variant: "success" }),
    onError: (error: Error) => toast({ title: "Hata", description: error.message, variant: "destructive" }),
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/user", { method: "DELETE" });
      if (!res.ok) throw new Error("Hesap silinemedi");
    },
    onSuccess: () => router.push('/'),
    onError: (error: Error) => toast({ title: "Hata", description: error.message, variant: "destructive" }),
  });

  const handleDeleteAccount = () => {
    if (window.confirm("Hesabınızı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.")) {
      deleteAccountMutation.mutate();
    }
  };

  const onSubmit = async (data: any) => {
    if (data.password && data.password !== data.passwordConfirm) {
      return toast({ title: "Hata", description: "Şifreler eşleşmiyor", variant: "destructive" });
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
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Profilim</h1>
        
        <Card className="shadow-lg rounded-xl overflow-hidden">
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Profile Image Section */}
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="relative">
                    <img
                      src={getProfileImageUrl(form.getValues('profileImage'), initialData?.gender || 'unspecified', form.getValues('avatar'))}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                    />
                    {form.getValues('profileImage') && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
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
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={() => setIsAvatarModalOpen(true)}>
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
                            const imageUrl = await uploadImage(file);
                            form.setValue('profileImage', imageUrl);
                            toast({ title: "Başarılı", description: "Profil resmi güncellendi", variant: "success" });
                          }
                        }}
                      />
                      <Button type="button" variant="outline" className="pointer-events-none">
                        Resim Yükle
                      </Button>
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

                {/* Form Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Üye Adı</FormLabel>
                        <FormControl>
                          <Input {...field} className="rounded-md" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-posta</FormLabel>
                        <FormControl>
                          <Input {...field} disabled className="rounded-md bg-gray-100" />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cinsiyet</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="rounded-md">
                              <SelectValue placeholder="Cinsiyet seçiniz" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="female">Kadın</SelectItem>
                            <SelectItem value="male">Erkek</SelectItem>
                            <SelectItem value="unspecified">Belirtmek İstemiyorum</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Yaş</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="rounded-md">
                              <SelectValue placeholder="Yaş seçiniz" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ageOptions.map((age) => (
                              <SelectItem key={age} value={age.toString()}>{age}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Yaşadığım Şehir</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="rounded-md">
                              <SelectValue placeholder="Şehir seçiniz" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {turkishCities.map((city) => (
                              <SelectItem key={city} value={city}>{city}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="profileVisibility"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 col-span-full">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Açık Profil</FormLabel>
                          <FormDescription>
                            Profiliniz üyeler listesinde görünür ve mesaj alabilirsiniz
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="aboutMe"
                    render={({ field }) => (
                      <FormItem className="col-span-full">
                        <FormLabel>Hakkımda</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Kendinizden bahsedin..."
                            className="resize-none rounded-md min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Password Section */}
                <div className="space-y-4 border-t pt-6">
                  <p className="text-sm text-gray-600">Şifrenizi değiştirmek istemiyorsanız bu alanı boş bırakın.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Şifre</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} className="rounded-md" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="passwordConfirm"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Şifre (Tekrar)</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} className="rounded-md" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <Button type="submit" className="w-full sm:w-auto flex-1 bg-blue-600 hover:bg-blue-700 rounded-md">
                    Kaydet
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    className="w-full sm:w-auto flex-1 rounded-md"
                    onClick={handleDeleteAccount}
                  >
                    Hesabı Sil
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}