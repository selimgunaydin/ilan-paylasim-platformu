import React, { useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Dialog, DialogContent, DialogTrigger } from "@app/components/ui/dialog";
import { AspectRatio } from "@app/components/ui/aspect-ratio";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import { Button } from "@app/components/ui/button";
import { getListingImageUrlClient } from '@/utils/get-message-file-url';
interface ImageGalleryProps {
  images: string[];
  title: string;
}

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [loadedImages, setLoadedImages] = useState<{ [key: string]: boolean }>({});

  const scrollPrev = () => emblaApi && emblaApi.scrollPrev();
  const scrollNext = () => emblaApi && emblaApi.scrollNext();

  const handleSelect = () => {
    if (emblaApi) {
      setSelectedImageIndex(emblaApi.selectedScrollSnap());
    }
  };

  React.useEffect(() => {
    if (emblaApi) {
      emblaApi.on('select', handleSelect);
      return () => {
        emblaApi.off('select', handleSelect);
      };
    }
  }, [emblaApi]);

  if (!images || images.length === 0) {
    console.log("No images provided to ImageGallery");
    return null;
  }

  console.log("ImageGallery received images:", images);

  return (
    <div className="relative group">
      {/* Ana Galeri */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {images.map((image, index) => (
            <div key={index} className="relative flex-[0_0_100%] min-w-0">
              <AspectRatio ratio={4/3}>
                <div className={`relative w-full h-full bg-gray-100 ${!loadedImages[image] ? 'animate-pulse' : ''}`}>
                  <img
                    src={getListingImageUrlClient(image)}
                    alt={`${title} - Resim ${index + 1}`}
                    className={`object-cover w-full h-full transition-opacity duration-300 ${loadedImages[image] ? 'opacity-100' : 'opacity-0'}`}
                    loading="lazy"
                    onLoad={(e) => {
                      console.log("Image loaded:", image);
                      setLoadedImages(prev => ({ ...prev, [image]: true }));
                    }}
                    onError={(e) => {
                      console.error("Image load error:", image);
                      setLoadedImages(prev => ({ ...prev, [image]: false }));
                    }}
                  />
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon"
                        className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setFullscreenImage(image)}
                      >
                        <Expand className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[90vw] max-h-[90vh] p-0">
                      <img
                        src={fullscreenImage || ''}
                        alt={`${title} - Tam Ekran`}
                        className="w-full h-full object-contain"
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </AspectRatio>
            </div>
          ))}
        </div>
      </div>

      {/* Navigasyon Butonları */}
      {images.length > 1 && (
        <>
          <Button
            variant="outline"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={scrollPrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={scrollNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </>
      )}

      {/* Thumbnail Navigasyon */}
      {images.length > 1 && (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
          {images.map((thumb, index) => (
            <button
              key={index}
              onClick={() => emblaApi?.scrollTo(index)}
              className={`relative flex-[0_0_80px] cursor-pointer overflow-hidden rounded-md ${
                selectedImageIndex === index ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <AspectRatio ratio={4/3}>
                <img
                  src={thumb}
                  alt={`Küçük resim ${index + 1}`}
                  className="object-cover w-full h-full"
                  loading="lazy"
                />
              </AspectRatio>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}