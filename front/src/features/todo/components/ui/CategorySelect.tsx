import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useTodoStore } from "@/store/useTodoStore";
import { Tag } from "lucide-react";
import { useEffect, useState } from "react";

interface CategorySelectProps {
  selectedCategoryId?: number;
  onCategoryChange: (categoryId: number) => void;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

export function CategorySelect({
  selectedCategoryId,
  onCategoryChange,
  onOpenChange,
  className,
}: CategorySelectProps) {
  const categories = useTodoStore((state) => state.categories);
  const fetchCategories = useTodoStore((state) => state.fetchCategories);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);
  
  const handleSelectCategory = (categoryId: number) => {
    onCategoryChange(categoryId);
    setOpen(false);
    onOpenChange?.(false);
  };

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  return (
    <Popover open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      onOpenChange?.(newOpen);
    }}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onPointerDown={(e) => e.stopPropagation()}
          className={cn(
            "h-6 min-w-[3.5rem] w-auto px-0 hover:bg-transparent hover:scale-105 transition-all duration-200",
            className
          )}
        >
          {selectedCategory ? (
              <Badge
                style={{
                  // @ts-ignore - CSS custom properties
                  '--bg-color': selectedCategory.color ? `${selectedCategory.color}20` : 'transparent',
                  '--hover-bg': selectedCategory.color ? `${selectedCategory.color}35` : 'transparent',
                  color: selectedCategory.color,
                  borderColor: selectedCategory.color ? `${selectedCategory.color}40` : undefined,
                }}
                variant="outline"
                className="h-full px-3 flex items-center justify-center border transition-colors duration-200 bg-[var(--bg-color)] hover:bg-[var(--hover-bg)] rounded-full"
              >
                <span className="truncate max-w-[100px]">{selectedCategory.name}</span>
              </Badge>
          ) : (
            <div className="flex items-center justify-center px-3 h-full w-full rounded-full border border-dashed text-muted-foreground hover:bg-accent/50 transition-colors">
              <Tag className="mr-1.5 h-3 w-3" />
              <span className="text-xs">Category</span>
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[200px] p-0" 
        align="start"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <ScrollArea className="h-48 p-2">
            <div className="space-y-1">
                {categories.length === 0 && (
                    <div className="text-xs text-center text-muted-foreground py-4">
                        No categories found
                    </div>
                )}
                {categories.map((category) => (
                    <button
                        key={category.id}
                        type="button"
                        className={cn(
                            "w-full flex items-center gap-2 p-2 rounded-sm cursor-pointer text-left text-sm transition-colors",
                            selectedCategoryId === category.id 
                                ? "bg-accent text-accent-foreground" 
                                : "hover:bg-accent hover:text-accent-foreground"
                        )}
                        onClick={() => handleSelectCategory(category.id)}
                    >
                        {category.color && (
                            <div 
                                className="w-3 h-3 rounded-full shrink-0" 
                                style={{ backgroundColor: category.color }}
                            />
                        )}
                        <span className="truncate">{category.name}</span>
                    </button>
                ))}
            </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
