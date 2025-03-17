import React, { useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Dialog, DialogContent } from "@app/components/ui/dialog";
import { AspectRatio } from "@app/components/ui/aspect-ratio";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
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
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [fullscreenEmblaRef, fullscreenEmblaApi] = useEmblaCarousel({
    loop: true,
  });
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [loadedImages, setLoadedImages] = useState<{ [key: string]: boolean }>(
    {}
  );

  const scrollPrev = () => emblaApi && emblaApi.scrollPrev();
  const scrollNext = () => emblaApi && emblaApi.scrollNext();
  const fullscreenScrollPrev = () =>
    fullscreenEmblaApi && fullscreenEmblaApi.scrollPrev();
  const fullscreenScrollNext = () =>
    fullscreenEmblaApi && fullscreenEmblaApi.scrollNext();

  const handleSelect = () => {
    if (emblaApi) {
      setSelectedImageIndex(emblaApi.selectedScrollSnap());
    }
  };

  const openFullscreen = (index: number) => {
    setFullscreenOpen(true);
    // After dialog opens, scroll to the selected image
    setTimeout(() => {
      if (fullscreenEmblaApi) {
        fullscreenEmblaApi.scrollTo(index);
      }
    }, 50);
  };

  React.useEffect(() => {
    if (emblaApi) {
      emblaApi.on("select", handleSelect);
      return () => {
        emblaApi.off("select", handleSelect);
      };
    }
  }, [emblaApi]);

  if (!images || images.length === 0) {
    return null;
  }

  // Process all image URLs once
  const processedImages = images.map((img) => getListingImageUrlClient(img));

  return (
    <div className="relative group w-full">
      {/* Main Gallery */}
      <div
        className="overflow-hidden rounded-lg border border-gray-200"
        ref={emblaRef}
      >
        <div className="flex">
          {processedImages.map((imageUrl, index) => (
            <div key={index} className="relative flex-[0_0_100%] min-w-0">
              <AspectRatio ratio={4 / 3}>
                <div
                  className="relative w-full h-full bg-gray-100"
                >
                  <img
                    src={imageUrl}
                    alt={title}
                    title={`${title}${
                      categoryName ? ` - ${categoryName}` : ""
                    }`}
                    className="object-cover w-full h-full transition-opacity duration-300"
                    loading={index === 0 ? "eager" : "lazy"}
                    onLoad={() => {
                      setLoadedImages((prev) => ({
                        ...prev,
                        [imageUrl]: true,
                      }));
                    }}
                    onError={() => {
                      setLoadedImages((prev) => ({
                        ...prev,
                        [imageUrl]: false,
                      }));
                    }}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 md:group-hover:opacity-100 transition-opacity bg-white/80 hover:bg-white shadow-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      openFullscreen(index);
                    }}
                  >
                    <Expand className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </AspectRatio>
            </div>
          ))}
        </div>
      </div>

      {/* Fullscreen Dialog */}
      <Dialog open={fullscreenOpen} onOpenChange={setFullscreenOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-[90vh] p-0 bg-black text-white border-none">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 sm:top-4 right-2 sm:right-4 z-50 text-white hover:bg-black/20"
            onClick={() => setFullscreenOpen(false)}
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>

          <div className="relative h-full w-full" ref={fullscreenEmblaRef}>
            <div className="flex h-full">
              {processedImages.map((imageUrl, index) => (
                <div
                  key={index}
                  className="relative flex-[0_0_100%] min-w-0 h-full flex items-center justify-center p-2 sm:p-4"
                >
                  <img
                    src={imageUrl}
                    alt={title}
                    title={`${title}${
                      categoryName ? ` - ${categoryName}` : ""
                    }`}
                    className="max-w-full max-h-full object-contain"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>

          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 text-white hover:bg-black/20 h-8 w-8 sm:h-10 sm:w-10"
                onClick={fullscreenScrollPrev}
              >
                <ChevronLeft className="h-5 w-5 sm:h-8 sm:w-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 text-white hover:bg-black/20 h-8 w-8 sm:h-10 sm:w-10"
                onClick={fullscreenScrollNext}
              >
                <ChevronRight className="h-5 w-5 sm:h-8 sm:w-8" />
              </Button>

              <div className="absolute bottom-3 sm:bottom-6 left-0 right-0 flex justify-center gap-2">
                {processedImages.map((_, idx) => (
                  <button
                    key={idx}
                    className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-colors ${
                      idx === selectedImageIndex
                        ? "bg-white"
                        : "bg-gray-500 hover:bg-gray-300"
                    }`}
                    onClick={() => fullscreenEmblaApi?.scrollTo(idx)}
                  />
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Navigation Buttons - Visible on desktop, touch enabled for mobile */}
      {images.length > 1 && (
        <>
          <Button
            variant="outline"
            size="sm"
            className="absolute left-2 top-1/2 -translate-y-1/2 opacity-60 sm:opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 hover:bg-white shadow-sm z-10 h-7 w-7 sm:h-8 sm:w-8"
            onClick={scrollPrev}
          >
            <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-60 sm:opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 hover:bg-white shadow-sm z-10 h-7 w-7 sm:h-8 sm:w-8"
            onClick={scrollNext}
          >
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </>
      )}

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-1 sm:gap-2 mt-2 sm:mt-3 overflow-x-auto pb-1 sm:pb-2">
          {processedImages.map((imageUrl, index) => (
            <button
              key={index}
              onClick={() => emblaApi?.scrollTo(index)}
              className={`relative flex-[0_0_60px] sm:flex-[0_0_80px] cursor-pointer overflow-hidden rounded-md transition-all ${
                selectedImageIndex === index
                  ? "ring-2 ring-blue-500 shadow-md"
                  : "opacity-70 hover:opacity-100"
              }`}
            >
              <AspectRatio ratio={4 / 3}>
                <img
                  src={imageUrl}
                  alt={`${title} - Önizleme ${index + 1}`}
                  title={`${title}${categoryName ? ` - ${categoryName}` : ""}`}
                  className="object-cover w-full h-full rounded-md"
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
