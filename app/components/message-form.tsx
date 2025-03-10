'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@app/components/ui/button';
import { Textarea } from '@app/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Paperclip, X, Image as ImageIcon, FileText, Music, Video, Archive, File as FileIcon, Send, Mic } from 'lucide-react';
import { Socket } from 'socket.io-client';

// Check if audio format is supported
const getSupportedAudioFormat = () => {
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (isMobile && /iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    if (MediaRecorder.isTypeSupported('audio/aac')) return 'audio/aac';
    if (MediaRecorder.isTypeSupported('audio/mpeg')) return 'audio/mpeg';
    return 'audio/mp4';
  }

  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/mpeg'];
  return types.find((type) => MediaRecorder.isTypeSupported(type)) || null;
};

// Merkezi dosya limit tanımları
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic'];
const ALLOWED_FILE_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/vnd.oasis.opendocument.presentation',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/mp4',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-m4v',
  'application/zip',
  'application/x-rar-compressed',
];

// Dosya türüne göre ikon belirleme
const getFileIcon = (file: File) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.type)) return <ImageIcon className="h-4 w-4" />;
  if (file.type.startsWith('video/')) return <Video className="h-4 w-4" />;
  if (file.type.startsWith('audio/')) return <Music className="h-4 w-4" />;
  if (file.type.includes('zip') || file.type.includes('rar')) return <Archive className="h-4 w-4" />;
  if (file.type.includes('pdf') || file.type.includes('document') || file.type.includes('text')) return <FileText className="h-4 w-4" />;
  return <FileIcon className="h-4 w-4" />;
};

// Dosya önizleme bileşeni
const FilePreview: React.FC<{ file: File; onRemove: () => void }> = ({ file, onRemove }) => {
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);

  return (
    <div className="flex items-center justify-between bg-muted p-2 rounded-md">
      <div className="flex items-center gap-2">
        {isImage ? (
          <img src={URL.createObjectURL(file)} alt={file.name} className="h-8 w-8 object-cover rounded" />
        ) : (
          getFileIcon(file)
        )}
        <span className="text-sm truncate max-w-[200px]">{file.name}</span>
        <span className="text-xs text-muted-foreground">({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="text-destructive hover:text-destructive/90"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

type MessageFormProps = {
  socket: Socket | null; // socket null olabilir
  conversationId: number;
  receiverId: number;
  onSuccess: (content: string, files?: string[]) => void;
};

export function MessageForm({ socket, conversationId, receiverId, onSuccess }: MessageFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ses kaydı için state ve ref'ler
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout>();

  if (!user) return null;

  // Ses kaydı başlatma/durdurma
  const toggleRecording = async () => {
    if (isRecording) {
      if (!mediaRecorderRef.current) return;
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    } else {
      try {
        const mimeType = getSupportedAudioFormat();
        if (!mimeType) throw new Error('Ses kaydı desteklenmiyor');

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });

        const mediaRecorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          const extension = mimeType.split('/')[1].split(';')[0];
          const fileName = `voice-${Date.now()}.${extension}`;
          const file = new File([audioBlob], fileName, { type: mimeType });
          setSelectedFiles((prev) => [...prev, file]);
          audioChunksRef.current = [];
          setRecordingDuration(0);
          stream.getTracks().forEach((track) => track.stop());
          mediaRecorderRef.current = null;
        };

        mediaRecorder.start(100);
        setIsRecording(true);
        setRecordingDuration(0);
        recordingTimerRef.current = setInterval(() => setRecordingDuration((prev) => prev + 1), 1000);
      } catch (error) {
        console.error('Kayıt başlatma hatası:', error);
        toast({
          title: 'Hata',
          description: error instanceof Error ? error.message : 'Ses kaydı başlatılamadı',
          variant: 'destructive',
        });
      }
    }
  };

  // Dosya seçme
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter((file) => {
      const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
      const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_FILE_SIZE;

      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        toast({
          title: 'Hata',
          description: `Desteklenmeyen dosya türü: ${file.name}`,
          variant: 'destructive',
        });
        return false;
      }
      if (file.size > maxSize) {
        toast({
          title: 'Hata',
          description: `Dosya boyutu çok büyük: ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
          variant: 'destructive',
        });
        return false;
      }
      return true;
    });
    setSelectedFiles((prev) => [...prev, ...validFiles]);
  };

  // Dosya kaldırma
  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Mesaj gönderme
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isRecording) {
      await toggleRecording();
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    if (!message.trim() && selectedFiles.length === 0) return;

    if (!socket) {
      toast({
        title: 'Bağlantı Hatası',
        description: 'Mesaj gönderilemiyor. Lütfen sayfayı yenileyin.',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);
    try {
      let uploadedFileUrls: string[] = [];
      
      // Önce dosyaları yükle
      if (selectedFiles.length > 0) {
        const formData = new FormData();
        formData.append('conversationId', conversationId.toString());
        selectedFiles.forEach((file) => formData.append('files', file));

        
        const uploadResponse = await fetch('/api/messages/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          throw new Error('Dosya yükleme başarısız');
        }
        
        const uploadResult = await uploadResponse.json();
        uploadedFileUrls = uploadResult.fileUrls || [];
      }

      // Socket.IO ile mesajı gönder
      socket.emit('sendMessage', {
        conversationId,
        content: message.trim(),
        files: uploadedFileUrls,
        receiverId,
      });

      // Mesaj gönderildikten sonra state'i temizle
      setMessage('');
      setSelectedFiles([]);
      
      // Başarı callback'ini çağır
      onSuccess(message.trim(), uploadedFileUrls);
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
      toast({
        title: 'Hata',
        description: error instanceof Error ? error.message : 'Mesaj gönderilemedi',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4">
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          {selectedFiles.map((file, index) => (
            <FilePreview key={index} file={file} onRemove={() => handleRemoveFile(index)} />
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="shrink-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={isRecording}
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`shrink-0 transition-colors duration-200 relative ${
            isRecording ? 'text-red-600 dark:text-red-500 bg-red-50 dark:bg-red-900/20' : ''
          }`}
          onClick={toggleRecording}
        >
          <Mic className={`h-5 w-5 ${isRecording ? 'animate-[pulse_1s_ease-in-out_infinite]' : ''}`} />
          {isRecording && (
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-600 animate-[pulse_1s_ease-in-out_infinite]" />
          )}
        </Button>

        <div className="flex-1 relative">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={isRecording ? 'Ses kaydediliyor...' : 'Mesajınız...'}
            className="min-h-[40px] max-h-[100px] py-2 resize-none overflow-hidden rounded-[25px] border-2 border-[#d5d5d5] focus-visible:ring-0 focus-visible:ring-offset-0 px-4"
            disabled={isRecording}
          />
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept={ALLOWED_FILE_TYPES.join(',')}
          />
        </div>

        <Button
          type="submit"
          size="sm"
          className="shrink-0 bg-blue-500 hover:bg-blue-600 text-white rounded-full h-10 w-10 p-0 flex items-center justify-center"
          disabled={isSending || (!message.trim() && selectedFiles.length === 0 && !isRecording)}
        >
          {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </Button>
      </form>
    </div>
  );
}