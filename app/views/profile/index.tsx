'use client'
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
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
  formData.append('image', file);
  const res = await fetch('/api/user/profile-image', { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Profil resmi yüklenemedi');
  const { imageUrl } = await res.json();
  return imageUrl;
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
    onSuccess: () => toast({ title: "Profil güncellendi" }),
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
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardContent className="p-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="profileImage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profil Resmi</FormLabel>
                    <FormControl>
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <img
                              src={getProfileImageUrl(field.value, initialData?.gender || 'unspecified', form.getValues('avatar'))}
                              alt="Profile"
                              className="w-16 h-16 rounded-full object-cover"
                            />
                            {field.value && (
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                                onClick={async () => {
                                  try {
                                    if (!field.value.startsWith('/avatars/')) {
                                      const res = await fetch('/api/user/profile-image', {
                                        method: 'DELETE'
                                      });

                                      if (!res.ok) {
                                        throw new Error('Profil resmi silinemedi');
                                      }
                                    }

                                    field.onChange('');
                                    toast({
                                      title: "Başarılı",
                                      description: "Profil resmi kaldırıldı",
                                    });
                                  } catch (error: any) {
                                    toast({
                                      title: "Hata",
                                      description: error.message,
                                      variant: "destructive"
                                    });
                                  }
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsAvatarModalOpen(true)}
                            >
                              Avatar Seç
                            </Button>
                            <div className="relative">
                              <Input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                onChange={async (e) => {
                                  try {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const imageUrl = await uploadImage(file);
                                      field.onChange(imageUrl);
                                      toast({
                                        title: "Başarılı",
                                        description: "Profil resmi güncellendi",
                                      });
                                    }
                                  } catch (error: any) {
                                    toast({
                                      title: "Hata",
                                      description: error.message,
                                      variant: "destructive"
                                    });
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                className="pointer-events-none z-10"
                              >
                                Resim Yükle
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <AvatarSelectorModal
                open={isAvatarModalOpen}
                onOpenChange={setIsAvatarModalOpen}
                onSelect={(avatarPath) => {
                  // Avatar seçildiğinde hem profileImage hem de avatar alanlarını güncelle
                  form.setValue('profileImage', avatarPath);
                  form.setValue('avatar', avatarPath);
                  // Form değerlerinin yeniden render edilmesini tetikle
                  form.trigger('profileImage');
                }}
                gender={initialData?.gender || 'unspecified'}
              />

              <FormField
                control={form.control}
                name="profileVisibility"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Açık Profil</FormLabel>
                      <FormDescription>
                        Açık olursa üyeler listesinde görünürsünüz ve insanlar size mesaj atabilir
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
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
                        <SelectTrigger>
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
                        <SelectTrigger>
                          <SelectValue placeholder="Yaş seçiniz" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ageOptions.map((age) => (
                          <SelectItem key={age} value={age.toString()}>
                            {age}
                          </SelectItem>
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
                        <SelectTrigger>
                          <SelectValue placeholder="Şehir seçiniz" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {turkishCities.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="aboutMe"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hakkımda (İlgi Alanları, Hobiler..)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Kendinizden bahsedin..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Üye Adı</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                      <Input {...field} disabled />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Şifrenizi değiştirmek istemiyorsanız, bu alanı boş bırakın.</p>
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Şifre</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                      <ul className="text-sm text-muted-foreground list-disc pl-4 mt-2">
                        <li>Şifre 5-12 karakter arasında olmalıdır</li>
                        <li>Kullanıcı adınızı içeremez</li>
                        <li>Aynı karakteri 3'ten fazla tekrar edemez</li>
                        <li>Çok yaygın şifreler kullanılamaz</li>
                      </ul>
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
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-4 space-y-4">
                <Button type="submit" className="w-full">Kaydet</Button>
                <Button
                  type="button"
                  variant="destructive"
                  className="w-full"
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
  );
}