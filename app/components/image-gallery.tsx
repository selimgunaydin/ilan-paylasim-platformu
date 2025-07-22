import React, { useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Dialog, DialogPortal, DialogOverlay } from "@app/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AspectRatio } from "@app/components/ui/aspect-ratio";
import { ChevronLeft, ChevronRight, Expand, X, Play, Pause } from "lucide-react";
import { Button } from "@app/components/ui/button";
import { getListingImageUrlClient } from "@/utils/get-message-file-url";

interface ImageGalleryProps {
  images: string[];
  title: string;
  categoryName?: string;
}

export function ImageGallery({
  images,
  title,
  categoryName,
}: ImageGalleryProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    align: "start",
    skipSnaps: false,
    dragFree: false
  });
  const [fullscreenEmblaRef, fullscreenEmblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
    skipSnaps: false,
    dragFree: false
  });
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const scrollPrev = () => emblaApi && emblaApi.scrollPrev();
  const scrollNext = () => emblaApi && emblaApi.scrollNext();
  const fullscreenScrollPrev = () => fullscreenEmblaApi && fullscreenEmblaApi.scrollPrev();
  const fullscreenScrollNext = () => fullscreenEmblaApi && fullscreenEmblaApi.scrollNext();

  const handleSelect = () => {
    if (emblaApi) {
      setSelectedImageIndex(emblaApi.selectedScrollSnap());
    }
  };

  const handleFullscreenSelect = () => {
    if (fullscreenEmblaApi) {
      setSelectedImageIndex(fullscreenEmblaApi.selectedScrollSnap());
    }
  };

  const openFullscreen = (index: number) => {
    setSelectedImageIndex(index);
    setFullscreenOpen(true);
    setTimeout(() => {
      if (fullscreenEmblaApi) {
        fullscreenEmblaApi.scrollTo(index);
      }
    }, 50);
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
  };

  React.useEffect(() => {
    if (emblaApi) {
      emblaApi.on("select", handleSelect);
      return () => {
        emblaApi.off("select", handleSelect);
      };
    }
  }, [emblaApi]);

  React.useEffect(() => {
    if (fullscreenEmblaApi) {
      fullscreenEmblaApi.on("select", handleFullscreenSelect);
      return () => {
        fullscreenEmblaApi.off("select", handleFullscreenSelect);
      };
    }
  }, [fullscreenEmblaApi]);

  // Auto-play functionality
  React.useEffect(() => {
    if (!isAutoPlaying || !emblaApi || images.length <= 1) return;

    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 4000); // 4 saniye aralıkla bir sonraki oto-play görseli göster

    return () => clearInterval(interval);
  }, [isAutoPlaying, emblaApi, images.length]);

  if (!images || images.length === 0) {
    return (
      <div className="w-full bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center p-8">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-500">Bu ilan için görsel bulunmuyor</p>
        </div>
      </div>
    );
  }

  const processedImages = images.map((img) => getListingImageUrlClient(img));

  return (
    <div className="relative group w-full">
      {/* Main Gallery Container */}
      <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Main Carousel */}
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex">
            {processedImages.map((imageUrl, index) => (
              <div key={index} className="relative flex-[0_0_100%] min-w-0">
                <AspectRatio ratio={16 / 9}>
                  <div className="relative w-full h-full bg-gradient-to-br from-gray-50 to-gray-100">
                    <img
                      src={imageUrl}
                      alt={`${title} - Görsel ${index + 1}`}
                      title={`${title}${categoryName ? ` - ${categoryName}` : ""}`}
                      className="object-cover w-full h-full transition-all duration-300 hover:scale-105"
                      loading={index === 0 ? "eager" : "lazy"}
                    />
                    
                    {/* Image Overlay with Controls */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-3 right-3 flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-md"
                          onClick={(e) => {
                            e.stopPropagation();
                            openFullscreen(index);
                          }}
                        >
                          <Expand className="h-4 w-4" />
                        </Button>
                        {images.length > 1 && (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-md"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleAutoPlay();
                            }}
                          >
                            {isAutoPlaying ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Image Counter */}
                    {images.length > 1 && (
                      <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded-full text-xs font-medium">
                        {selectedImageIndex + 1} / {images.length}
                      </div>
                    )}
                  </div>
                </AspectRatio>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="sm"
              className="absolute left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white/90 hover:bg-white shadow-lg h-10 w-10 p-0 z-10"
              onClick={scrollPrev}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white/90 hover:bg-white shadow-lg h-10 w-10 p-0 z-10"
              onClick={scrollNext}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="mt-3 sm:mt-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {processedImages.map((imageUrl, index) => (
              <button
                key={index}
                onClick={() => emblaApi?.scrollTo(index)}
                className={`relative flex-shrink-0 overflow-hidden rounded-lg transition-all duration-200 ${
                  selectedImageIndex === index
                    ? "ring-2 ring-blue-500 shadow-lg scale-105"
                    : "opacity-70 hover:opacity-100 hover:scale-105"
                }`}
              >
                <div className="w-16 h-12 sm:w-20 sm:h-15">
                  <img
                    src={imageUrl}
                    alt={`${title} - Önizleme ${index + 1}`}
                    className="object-cover w-full h-full rounded-lg"
                    loading="lazy"
                  />
                </div>
                {selectedImageIndex === index && (
                  <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Fullscreen Dialog */}
      <Dialog open={fullscreenOpen} onOpenChange={setFullscreenOpen}>
        <DialogPortal>
          <DialogOverlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content
            className="dialog-fullscreen rounded-[2rem] fixed left-[50%] top-[50%] z-50 w-full max-w-[98vw] max-h-[98vh] h-[98vh] translate-x-[-50%] translate-y-[-50%] bg-black/60 backdrop-blur-md text-white border-none rounded-none overflow-hidden p-0 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]"
          >
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 text-white hover:bg-white/20 rounded-full h-10 w-10"
            onClick={() => setFullscreenOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Fullscreen Carousel */}
          <div className="relative w-full h-full flex items-center justify-center" ref={fullscreenEmblaRef}>
            <div className="flex w-full h-full">
              {processedImages.map((imageUrl, index) => (
                <div
                  key={index}
                  className="relative flex-[0_0_100%] min-w-0 w-full h-full flex items-center justify-center p-2 sm:p-4"
                >
                  <img
                    src={imageUrl}
                    alt={`${title} - Tam Ekran ${index + 1}`}
                    className="max-w-full max-h-full w-auto h-auto object-contain"
                    loading="lazy"
                    style={{ maxHeight: 'calc(100vh - 120px)' }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Fullscreen Navigation */}
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 rounded-full h-10 w-10 sm:h-12 sm:w-12 z-40"
                onClick={fullscreenScrollPrev}
              >
                <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 rounded-full h-10 w-10 sm:h-12 sm:w-12 z-40"
                onClick={fullscreenScrollNext}
              >
                <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>

              {/* Fullscreen Dots */}
              <div className="absolute bottom-4 sm:bottom-6 left-0 right-0 flex justify-center gap-2 sm:gap-3 z-40">
                {processedImages.map((_, idx) => (
                  <button
                    key={idx}
                    className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-200 ${
                      idx === selectedImageIndex
                        ? "bg-white scale-125"
                        : "bg-white/50 hover:bg-white/75"
                    }`}
                    onClick={() => fullscreenEmblaApi?.scrollTo(idx)}
                  />
                ))}
              </div>

              {/* Fullscreen Counter */}
              <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1.5 rounded-full text-sm font-medium z-40">
                {selectedImageIndex + 1} / {images.length}
              </div>
            </>
          )}
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
    </div>
  );
}
