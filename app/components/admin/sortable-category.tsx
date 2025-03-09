import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Category } from "@/schemas/schema";
import { Button } from "@app/components/ui/button";
import { Card } from "@app/components/ui/card";
import { GripVertical, ChevronRight, ChevronDown } from "lucide-react";
import { useState } from "react";

interface SortableCategoryProps {
  category: Category & { children?: (Category & { children?: Category[] })[] };
  onEdit: (category: Category) => void;
  onDelete?: (category: Category) => void;
  depth?: number;
}

export function SortableCategory({
  category,
  onEdit,
  onDelete,
  depth = 0,
}: SortableCategoryProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginLeft: `${depth * 2}rem`,
  };

  return (
    <div>
      <Card
        ref={setNodeRef}
        style={style}
        className="p-2 flex items-center gap-2 mb-2"
      >
        {category.children && category.children.length > 0 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-500 hover:text-gray-700"
          >
            {isExpanded ? (
              <ChevronDown size={20} />
            ) : (
              <ChevronRight size={20} />
            )}
          </button>
        )}

        <button
          className="cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5 text-gray-400" />
        </button>

        <span className="flex-1">{category.name}</span>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(category)}>
            Düzenle
          </Button>
          {/* Alt kategorisi olmayan ve içinde ilan olmayan kategorilerde sil butonu göster */}
          {onDelete && (!category.children || category.children.length === 0) && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(category)}
            >
              Sil
            </Button>
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
            />
          ))}
        </div>
      )}
    </div>
  );
}