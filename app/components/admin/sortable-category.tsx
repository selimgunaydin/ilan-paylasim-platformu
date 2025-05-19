import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@app/components/ui/button";
import { Card } from "@app/components/ui/card";
import { GripVertical, ChevronRight, ChevronDown, HelpCircle } from "lucide-react";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@app/components/ui/tooltip";

interface ProcessedCategoryType {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  order: number;
  customTitle: string | null;
  metaDescription: string | null;
  content: string | null;
  faqs: string | null; 
  children: ProcessedCategoryType[];
}

interface SortableCategoryProps {
  category: ProcessedCategoryType;
  onEdit: (category: ProcessedCategoryType) => void;
  onDelete?: (category: ProcessedCategoryType) => void;
  depth?: number;
  listingCounts: { [categoryId: number]: number };
}

export function SortableCategory({
  category,
  onEdit,
  onDelete,
  depth = 0,
  listingCounts,
}: SortableCategoryProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginLeft: `${depth * 2}rem`,
    opacity: isDragging ? 0.5 : 1, 
  };

  const hasListings = listingCounts[category.id] > 0;

  const showDeleteButton = !!onDelete && (!category.children || category.children.length === 0) && !hasListings;

  return (
    <TooltipProvider delayDuration={300}>
      <div>
        <Card
          ref={setNodeRef}
          style={style}
          className="p-2 flex items-center gap-2 mb-2"
        >
          {category.children && category.children.length > 0 ? (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-500 hover:text-gray-700 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500"
              aria-label={isExpanded ? "Alt kategorileri gizle" : "Alt kategorileri göster"}
            >
              {isExpanded ? (
                <ChevronDown size={20} />
              ) : (
                <ChevronRight size={20} />
              )}
            </button>
          ) : (
            <span className="w-8"></span> 
          )}

          <button
            className="cursor-grab active:cursor-grabbing p-1"
            {...attributes}
            {...listeners}
            aria-label={`Kategoriyi sürükle: ${category.name}`}
          >
            <GripVertical className="h-5 w-5 text-gray-400" />
          </button>

          <span className={`flex-1 ${depth === 0 ? 'font-bold' : ''}`}>{category.name}</span>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(category)}>
              Düzenle
            </Button>
            {showDeleteButton && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDelete(category)} 
                  >
                    Sil
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Bu kategoride yayında, pasife alınmış veya onay bekleyen ilan bulunmamaktadır.</p>
                </TooltipContent>
              </Tooltip>
            )}
            {!showDeleteButton && onDelete && (!category.children || category.children.length === 0) && hasListings && (
                <Tooltip>
                    <TooltipTrigger className="p-1 rounded-full text-gray-400 hover:text-gray-600">
                        <HelpCircle size={18} />
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Bu kategoride aktif, pasif veya onay bekleyen ilanlar bulunduğu için silinemez.</p>
                    </TooltipContent>
                </Tooltip>
            )}
          </div>
        </Card>

        {isExpanded && category.children && category.children.length > 0 && (
          <div>
            {category.children.map((child) => (
              <SortableCategory
                key={child.id}
                category={child}
                onEdit={onEdit}
                onDelete={onDelete}
                depth={depth + 1}
                listingCounts={listingCounts}
              />
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}