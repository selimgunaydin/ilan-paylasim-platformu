import { useState, useRef, useEffect } from "react";
import { Button } from "@app/components/ui/button";
import { Textarea } from "@app/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Paperclip, X, Image as ImageIcon, FileText, Music, Video, Archive, File, Send, Trash2, Mic } from "lucide-react";

// Check if audio format is supported
const getSupportedAudioFormat = () => {
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  // iPhone için özel format kontrolü
  if (isMobile && /iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    if (MediaRecorder.isTypeSupported('audio/aac')) {
      return 'audio/aac';
    }
    if (MediaRecorder.isTypeSupported('audio/mpeg')) {
      return 'audio/mpeg';
    }
    return 'audio/mp4';
  }

  // Android ve diğer cihazlar için
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/mpeg'
  ];

  if (MediaRecorder && MediaRecorder.isTypeSupported) {
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
  }
  return null;
};

// Merkezi dosya limit tanımları file-constants.ts'den alınmıştır
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB - Merkezi limit kullanılıyor
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic"
];

// iPhone video formatları eklendi
const ALLOWED_FILE_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  "application/vnd.oasis.opendocument.text",
  "application/vnd.oasis.opendocument.spreadsheet",
  "application/vnd.oasis.opendocument.presentation",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/mp4", // iPhone ses kaydı formatı
  "video/mp4",
  "video/webm",
  "video/quicktime", // .MOV formatı
  "video/x-m4v",    // iPhone video formatı
  "application/zip",
  "application/x-rar-compressed"
];

// Dosya türüne göre ikon belirleme
const getFileIcon = (file: File) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return <ImageIcon className="h-4 w-4" />;
  }
  if (file.type.startsWith('video/')) {
    return <Video className="h-4 w-4" />;
  }
  if (file.type.startsWith('audio/')) {
    return <Music className="h-4 w-4" />;
  }
  if (file.type.includes('zip') || file.type.includes('rar')) {
    return <Archive className="h-4 w-4" />;
  }
  if (file.type.includes('pdf') || file.type.includes('document') || file.type.includes('text')) {
    return <FileText className="h-4 w-4" />;
  }
  return <File className="h-4 w-4" />;
};

// Dosya önizleme bileşeni
const FilePreview: React.FC<{ file: File; onRemove: () => void }> = ({ file, onRemove }) => {
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);

  return (
    <div className="flex items-center justify-between bg-muted p-2 rounded-md">
      <div className="flex items-center gap-2">
        {isImage ? (
          <img
            src={URL.createObjectURL(file)}
            alt={file.name}
            className="h-8 w-8 object-cover rounded"
          />
        ) : (
          getFileIcon(file)
        )}
        <span className="text-sm truncate max-w-[200px]">{file.name}</span>
        <span className="text-xs text-muted-foreground">
          ({(file.size / (1024 * 1024)).toFixed(2)} MB)
        </span>
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

type Message = {
  id: number;
  senderId: number;
  content: string;
  files?: string[];
  fileTypes?: string[];
  createdAt: string;
};

type MessageFormProps = {
  onSuccess?: () => void;
  messages?: Message[];
  onDeleteMessage?: (messageId: number) => void;
} & (
  | {
      // For new conversations
      listingId: number;
      receiverId: number;
      conversationId?: never;
    }
  | {
      // For existing conversations
      conversationId: number;
      listingId?: never;
      receiverId?: never;
    }
);

export function MessageForm({
  listingId,
  receiverId,
  conversationId,
  onSuccess,
  messages,
  onDeleteMessage,
}: MessageFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
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

  // Ses kaydı başlatma/durdurma fonksiyonu
  const toggleRecording = async () => {
    if (isRecording) {
      if (!mediaRecorderRef.current) return;

      try {
        mediaRecorderRef.current.stop();
        setIsRecording(false);

        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
        }

        mediaRecorderRef.current.onstop = async () => {
          try {
            if (audioChunksRef.current.length === 0) {
              throw new Error('Ses kaydı alınamadı');
            }

            // Get supported format
            const mimeType = getSupportedAudioFormat();
            if (!mimeType) {
              throw new Error('Ses kaydı desteklenmiyor');
            }

            // Create blob
            const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

            if (audioBlob.size === 0) {
              throw new Error('Ses kaydı boş');
            }

            // Create file name
            const extension = mimeType.split('/')[1].split(';')[0];
            const fileName = `voice-${Date.now()}.${extension}`;

            try {
              // iPhone için özel dosya oluşturma yöntemi
              if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                setSelectedFiles(prev => [...prev, audioBlob]);
              } else {
                // Diğer cihazlar için normal File oluşturma
                const file = new File([audioBlob], fileName, {
                  type: mimeType,
                });
                setSelectedFiles(prev => [...prev, file]);
              }

              // Clean up
              audioChunksRef.current = [];
              setRecordingDuration(0);

              // Stop tracks
              const tracks = mediaRecorderRef.current?.stream.getTracks();
              tracks?.forEach(track => track.stop());
              mediaRecorderRef.current = null;

            } catch (error) {
              console.error('Dosya oluşturma hatası:', error);
              throw new Error('Ses dosyası oluşturulamadı');
            }

          } catch (error) {
            console.error('Ses kaydı hatası:', error);
            toast({
              title: "Hata",
              description: error instanceof Error ? error.message : "Ses kaydı yapılamadı",
              variant: "destructive",
            });
          }
        };
      } catch (error) {
        console.error('Kayıt durdurma hatası:', error);
        toast({
          title: "Hata",
          description: "Kayıt durdurulamadı",
          variant: "destructive",
        });
      }
    } else {
      try {
        // Check format support
        const mimeType = getSupportedAudioFormat();
        if (!mimeType) {
          throw new Error('Ses kaydı desteklenmiyor');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });

        const mediaRecorder = new MediaRecorder(stream, { mimeType });

        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.start(100); // Her 100ms'de bir veri topla
        setIsRecording(true);
        setRecordingDuration(0);
        recordingTimerRef.current = setInterval(() => {
          setRecordingDuration(prev => prev + 1);
        }, 1000);
      } catch (error) {
        console.error('Kayıt başlatma hatası:', error);
        let errorMessage = "Mikrofon erişimi sağlanamadı. ";

        if (error instanceof Error) {
          if (error.name === 'NotAllowedError') {
            errorMessage = "Lütfen mikrofon izinlerini kontrol edin.";
          } else if (error.name === 'NotFoundError') {
            errorMessage = "Mikrofon bulunamadı.";
          } else if (error.name === 'NotSupportedError') {
            errorMessage = "Ses kaydı desteklenmiyor.";
          } else {
            errorMessage += error.message;
          }
        }

        toast({
          title: "Hata",
          description: errorMessage,
          variant: "destructive",
        });
      }
    }
  };

  // Dosya seçme işleyicisi - Merkezi limit kontrolü
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    // Dosya boyutu ve türü kontrolü - Merkezi limitler kullanılıyor
    const invalidFiles = files.filter(file => {
      const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
      const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_FILE_SIZE;

      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        toast({
          title: "Hata",
          description: `Desteklenmeyen dosya türü`,
          variant: "destructive",
        });
        return true;
      }

      if (file.size > maxSize) {
        toast({
          title: "Hata",
          description: `Dosya boyutu çok büyük (${(file.size / (1024 * 1024)).toFixed(2)}MB)`,
          variant: "destructive",
        });
        return true;
      }

      return false;
    });

    // Geçerli dosyaları ekle
    const validFiles = files.filter(file => !invalidFiles.includes(file));
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  // Dosya kaldırma işleyicisi
  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Mesaj silme işleyicisi
  const handleDeleteMessage = async (messageId: number) => {
    if (!onDeleteMessage) return;

    try {
      onDeleteMessage(messageId);
    } catch (error) {
      console.error("Error deleting message:", error);
      toast({
        title: "Hata",
        description: "Mesaj silinemedi",
        variant: "destructive",
      });
    }
  };

  // Form gönderme işleyicisi
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Eğer kayıt devam ediyorsa, önce kaydı durdur
    if (isRecording) {
      await toggleRecording();
      // Dosyanın oluşturulmasını bekle
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (!message.trim() && selectedFiles.length === 0) return;

    setIsSending(true);
    try {
      const formData = new FormData();

      // Dosyaları FormData'ya ekle
      selectedFiles.forEach((file, index) => {
        // Blob kontrolü
        if (file instanceof Blob) {
          // iPhone için özel işlem
          const extension = 'mp4'; // Varsayılan uzantı
          const fileName = `voice-${Date.now()}-${index}.${extension}`;
          formData.append('files', new File([file], fileName, { type: 'audio/mp4' }));
        } else {
          formData.append('files', file);
        }
      });

      if (conversationId) {
        formData.append('conversationId', conversationId.toString());
        formData.append('message', message.trim());

        const messageResponse = await fetch("/api/messages", {
          method: "POST",
          body: formData,
        });

        if (!messageResponse.ok) {
          const errorData = await messageResponse.json();
          throw new Error(errorData.error || "Mesaj gönderilemedi");
        }

        // Mesaj başarıyla gönderildi
        const messageData = await messageResponse.json();
        console.log('Mesaj başarıyla gönderildi:', messageData);
        
        setMessage("");
        setSelectedFiles([]);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        // Önce konuşma var mı kontrol et
        const conversationResponse = await fetch(`/api/conversations/find`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            listingId,
            receiverId,
          }),
        });

        if (!conversationResponse.ok) {
          throw new Error("Konuşma başlatılamadı");
        }

        const conversationData = await conversationResponse.json();
        
        // Konuşma nesnesinin doğru şekilde alındığından emin ol
        if (!conversationData.conversation || !conversationData.conversation.id) {
          console.error("Konuşma verisi eksik veya hatalı:", conversationData);
          throw new Error("Konuşma verisi eksik veya hatalı");
        }

        // Mesajı gönder
        formData.append('conversationId', conversationData.conversation.id.toString());
        formData.append('message', message.trim());

        const messageResponse = await fetch("/api/messages", {
          method: "POST",
          body: formData,
        });

        if (!messageResponse.ok) {
          const errorData = await messageResponse.json();
          throw new Error(errorData.error || "Mesaj gönderilemedi");
        }

        // Mesaj başarıyla gönderildi
        const messageData = await messageResponse.json();
        console.log('Mesaj başarıyla gönderildi:', messageData);
        
        setMessage("");
        setSelectedFiles([]);
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      console.error("Mesaj gönderme hatası:", error);
      toast({
        title: "Hata",
        description: error instanceof Error ? error.message : "Mesaj gönderilemedi",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Seçilen dosyaların listesi */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          {selectedFiles.map((file, index) => (
            <FilePreview
              key={index}
              file={file}
              onRemove={() => handleRemoveFile(index)}
            />
          ))}
        </div>
      )}

      {/* Mesaj gönderme alanı */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        {/* Dosya ekleme butonu */}
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

        {/* Mikrofon butonu */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`shrink-0 transition-colors duration-200 relative ${
            isRecording
              ? 'text-red-600 dark:text-red-500 bg-red-50 dark:bg-red-900/20'
              : ''
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
            placeholder={isRecording ? "Ses kaydediliyor..." : "Mesajınız..."}
            className="min-h-[40px] max-h-[100px] py-2 resize-none overflow-hidden rounded-[25px] border-2 border-[#d5d5d5] !important focus-visible:ring-0 focus-visible:ring-offset-0 px-4"
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

        {/* Gönder butonu */}
        <Button
          type="submit"
          size="sm"
          className="shrink-0 bg-blue-500 hover:bg-blue-600 text-white rounded-full h-10 w-10 p-0 flex items-center justify-center"
          disabled={isSending || (!message.trim() && selectedFiles.length === 0 && !isRecording)}
        >
          {isSending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </form>
    </div>
  );
}