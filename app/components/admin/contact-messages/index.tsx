'use client';

import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@app/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@app/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@app/components/ui/tabs';
import { Button } from '@app/components/ui/button';
import { Badge } from '@app/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@app/components/ui/dialog';
import { Checkbox } from '@app/components/ui/checkbox';
import { Label } from '@app/components/ui/label';
import { useToast } from '@app/hooks/use-toast';
import { Eye, Trash2, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

// Mesaj tipi
interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  ip_address?: string;
}

// İletişim mesajları bileşeni
export function ContactMessagesPage() {
  // State tanımlamaları
  const [allMessages, setAllMessages] = useState<ContactMessage[]>([]);
  const [unreadMessages, setUnreadMessages] = useState<ContactMessage[]>([]);
  const [readMessages, setReadMessages] = useState<ContactMessage[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  // Mesajları yükle
  const fetchMessages = async (tabKey: string = activeTab) => {
    setLoading(true);
    try {
      let url = '/api/contact';
      if (tabKey === 'unread') {
        url += '?isRead=false';
      } else if (tabKey === 'read') {
        url += '?isRead=true';
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Mesajlar yüklenirken bir hata oluştu');
      }

      const data = await response.json();
      
      // Tüm mesajları state'e kaydet
      if (tabKey === 'all') {
        setAllMessages(data.messages);
      } else if (tabKey === 'unread') {
        setUnreadMessages(data.messages);
      } else if (tabKey === 'read') {
        setReadMessages(data.messages);
      }
      
    } catch (error) {
      toast({
        title: 'Hata',
        description: error instanceof Error ? error.message : 'Mesajlar yüklenirken bir hata oluştu',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // İlk yükleme
  useEffect(() => {
    fetchMessages('all');
    fetchMessages('unread');
    fetchMessages('read');
  }, []);

  // Tab değiştiğinde
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Mesajı okundu olarak işaretle
  const markAsRead = async (id: number) => {
    try {
      const response = await fetch(`/api/contact/${id}/read`, {
        method: 'PUT',
      });

      if (!response.ok) {
        throw new Error('Mesaj durumu güncellenirken bir hata oluştu');
      }

      toast({
        title: 'Başarılı',
        description: 'Mesaj okundu olarak işaretlendi',
      });

      // Mesajları yeniden yükle
      fetchMessages('all');
      fetchMessages('unread');
      fetchMessages('read');
      
    } catch (error) {
      toast({
        title: 'Hata',
        description: error instanceof Error ? error.message : 'Bir hata oluştu',
        variant: 'destructive',
      });
    }
  };

  // Mesajı sil
  const deleteMessage = async (id: number) => {
    if (!confirm('Bu mesajı silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      const response = await fetch(`/api/contact/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Mesaj silinirken bir hata oluştu');
      }

      toast({
        title: 'Başarılı',
        description: 'Mesaj başarıyla silindi',
      });

      // Mesajları yeniden yükle
      fetchMessages('all');
      fetchMessages('unread');
      fetchMessages('read');
      
    } catch (error) {
      toast({
        title: 'Hata',
        description: error instanceof Error ? error.message : 'Bir hata oluştu',
        variant: 'destructive',
      });
    }
  };

  // Mesaj detaylarını göster
  const viewMessageDetails = (message: ContactMessage) => {
    setSelectedMessage(message);
    setIsDialogOpen(true);

    // Eğer mesaj okunmadıysa, okundu olarak işaretle
    if (!message.isRead) {
      markAsRead(message.id);
    }
  };

  // Mesajları getir
  const getMessagesForActiveTab = () => {
    switch (activeTab) {
      case 'unread':
        return unreadMessages;
      case 'read':
        return readMessages;
      default:
        return allMessages;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'dd MMMM yyyy HH:mm', { locale: tr });
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>İletişim Mesajları</CardTitle>
          <CardDescription>
            Site üzerinden gönderilen iletişim mesajlarını görüntüleyin ve yönetin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange}>
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="all">
                  Tüm Mesajlar ({allMessages.length})
                </TabsTrigger>
                <TabsTrigger value="unread">
                  Okunmamış ({unreadMessages.length})
                </TabsTrigger>
                <TabsTrigger value="read">
                  Okunmuş ({readMessages.length})
                </TabsTrigger>
              </TabsList>
              <Button variant="outline" size="sm" onClick={() => fetchMessages(activeTab)}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Yenile
              </Button>
            </div>

            <TabsContent value="all" className="mt-0">
              <MessagesTable 
                messages={allMessages} 
                loading={loading} 
                onView={viewMessageDetails} 
                onDelete={deleteMessage} 
                formatDate={formatDate}
              />
            </TabsContent>
            
            <TabsContent value="unread" className="mt-0">
              <MessagesTable 
                messages={unreadMessages} 
                loading={loading} 
                onView={viewMessageDetails} 
                onDelete={deleteMessage} 
                formatDate={formatDate}
              />
            </TabsContent>
            
            <TabsContent value="read" className="mt-0">
              <MessagesTable 
                messages={readMessages} 
                loading={loading} 
                onView={viewMessageDetails} 
                onDelete={deleteMessage} 
                formatDate={formatDate}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Mesaj Detay Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Mesaj Detayı</DialogTitle>
            <DialogDescription>
              {selectedMessage && (
                <span className="text-sm text-muted-foreground">
                  {selectedMessage.name} tarafından {formatDate(selectedMessage.createdAt)} tarihinde gönderildi
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedMessage && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium">Gönderen</h3>
                  <p>{selectedMessage.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">E-posta</h3>
                  <p>{selectedMessage.email}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium">Konu</h3>
                <p>{selectedMessage.subject}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium">Mesaj</h3>
                <p className="whitespace-pre-wrap rounded-md bg-muted p-3">{selectedMessage.message}</p>
              </div>
              
              {selectedMessage.ip_address && (
                <div>
                  <h3 className="text-sm font-medium">IP Adresi</h3>
                  <p>{selectedMessage.ip_address}</p>
                </div>
              )}
              
              <div className="flex justify-end gap-2">
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    setIsDialogOpen(false);
                    deleteMessage(selectedMessage.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Sil
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Mesaj tablosu alt bileşeni
function MessagesTable({ 
  messages, 
  loading, 
  onView, 
  onDelete, 
  formatDate 
}: { 
  messages: ContactMessage[]; 
  loading: boolean; 
  onView: (message: ContactMessage) => void; 
  onDelete: (id: number) => void; 
  formatDate: (date: string) => string;
}) {
  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">Durum</TableHead>
            <TableHead>Gönderen</TableHead>
            <TableHead>E-posta</TableHead>
            <TableHead>Konu</TableHead>
            <TableHead>Tarih</TableHead>
            <TableHead className="text-right">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                Mesajlar yükleniyor...
              </TableCell>
            </TableRow>
          ) : messages.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                Mesaj bulunamadı.
              </TableCell>
            </TableRow>
          ) : (
            messages.map((message) => (
              <TableRow key={message.id}>
                <TableCell>
                  {message.isRead ? (
                    <Badge variant="outline">Okundu</Badge>
                  ) : (
                    <Badge>Yeni</Badge>
                  )}
                </TableCell>
                <TableCell>{message.name}</TableCell>
                <TableCell>{message.email}</TableCell>
                <TableCell>{message.subject}</TableCell>
                <TableCell>{formatDate(message.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => onView(message)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => onDelete(message.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
} 