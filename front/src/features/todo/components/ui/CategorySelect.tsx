import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useTodoStore } from "@/store/useTodoStore";
import { Tag } from "lucide-react";
import { useState } from "react";

interface CategorySelectProps {
  selectedCategoryId?: number;
  onCategoryChange: (categoryId: number) => void;
  className?: string;
}

export function CategorySelect({
  selectedCategoryId,
  onCategoryChange,
  className,
}: CategorySelectProps) {
  const categories = useTodoStore((state) => state.categories);
  const [open, setOpen] = useState(false);

  const handleSelectCategory = (categoryId: number) => {
    onCategoryChange(categoryId);
    setOpen(false);
  };

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 px-2 text-xs font-normal hover:bg-muted",
            className
          )}
        >
          {selectedCategory ? (
              <Badge
                style={{
                  backgroundColor: selectedCategory.color ? `${selectedCategory.color}20` : undefined,
                  color: selectedCategory.color,
                  borderColor: selectedCategory.color ? `${selectedCategory.color}40` : undefined,
                }}
                variant="outline"
                className="px-1 py-0 border"
              >
                {selectedCategory.name}
              </Badge>
          ) : (
            <div className="flex items-center text-muted-foreground">
              <Tag className="mr-1 h-3 w-3" />
              <span>Add Category</span>
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <ScrollArea className="h-48 p-2">
            <div className="space-y-1">
                {categories.length === 0 && (
                    <div className="text-xs text-center text-muted-foreground py-4">
                        No categories found
                    </div>
                )}
                {categories.map((category) => (
                    <div
                        key={category.id}
                        className="flex items-center space-x-2 p-2 hover:bg-accent rounded-sm cursor-pointer"
                        onClick={() => handleSelectCategory(category.id)}
                    >
                        <Checkbox 
                            checked={selectedCategoryId === category.id}
                            onCheckedChange={() => handleSelectCategory(category.id)}
                            className="rounded-full" 
                        />
                        <div className="flex items-center gap-2">
                            {category.color && (
                                <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: category.color }}
                                />
                            )}
                            <span className="text-sm">{category.name}</span>
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
