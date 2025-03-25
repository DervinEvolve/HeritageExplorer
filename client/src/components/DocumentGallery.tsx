import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Document {
  id: string;
  title: string;
  imageUrl: string;
  description: string;
  type: "manuscript" | "letter" | "artifact" | "record";
}

interface DocumentGalleryProps {
  documents: Document[];
}

const FALLBACK_IMAGES = {
  manuscript: "/placeholder-manuscript.jpg",
  letter: "/placeholder-letter.jpg",
  artifact: "/placeholder-manuscript.jpg",
  record: "/placeholder-record.jpg"
};

export function DocumentGallery({ documents }: DocumentGalleryProps) {
  const [[page, direction], setPage] = useState([0, 0]);
  const [imageError, setImageError] = useState<Record<string, boolean>>({});

  // Reset image errors when documents change
  useEffect(() => {
    setImageError({});
    setPage([0, 0]);
  }, [documents]);

  const paginate = (newDirection: number) => {
    setPage([
      (page + newDirection + documents.length) % documents.length,
      newDirection
    ]);
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.5,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.5,
    }),
  };

  const handleImageError = (documentId: string, documentType: Document["type"]) => {
    console.warn(`Using fallback image for document ${documentId} of type ${documentType}`);
    setImageError(prev => ({ ...prev, [documentId]: true }));
  };

  const getImageUrl = (document: Document) => {
    if (imageError[document.id] || !document.imageUrl || document.imageUrl === "https://example.com/placeholder.jpg") {
      return FALLBACK_IMAGES[document.type] || FALLBACK_IMAGES.manuscript;
    }
    return document.imageUrl;
  };

  if (!documents.length) return null;

  return (
    <div className="relative w-full max-w-4xl mx-auto h-[600px] overflow-hidden rounded-lg">
      <div className="absolute inset-0 flex items-center justify-center">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={page}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
              scale: { duration: 0.2 },
            }}
            className="absolute w-full h-full"
          >
            <Card className="w-full h-full p-6 bg-background/95 backdrop-blur">
              <div className="relative h-full flex flex-col">
                <div className="relative w-full h-64 mb-4 overflow-hidden rounded-md">
                  {imageError[documents[page].id] ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <ImageOff className="h-12 w-12 text-muted-foreground" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Using placeholder image</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <motion.img
                      src={getImageUrl(documents[page])}
                      alt={documents[page].title}
                      onError={() => handleImageError(documents[page].id, documents[page].type)}
                      className="w-full h-full object-contain"
                      layoutId={`image-${documents[page].id}`}
                    />
                  )}
                </div>
                <motion.h2
                  layoutId={`title-${documents[page].id}`}
                  className="text-2xl font-bold mb-2"
                >
                  {documents[page].title}
                </motion.h2>
                <motion.p
                  layoutId={`type-${documents[page].id}`}
                  className="text-sm text-muted-foreground mb-4"
                >
                  {documents[page].type.charAt(0).toUpperCase() + documents[page].type.slice(1)}
                </motion.p>
                <motion.p
                  layoutId={`description-${documents[page].id}`}
                  className="text-muted-foreground flex-1"
                >
                  {documents[page].description}
                </motion.p>
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      {documents.length > 1 && (
        <>
          <Button
            variant="outline"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10"
            onClick={() => paginate(-1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10"
            onClick={() => paginate(1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
}