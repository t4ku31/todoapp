import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Pencil } from "lucide-react";
import { useState } from "react";

interface EditableDateProps {
    id: number;
    date: string | null; // ISO 8601 date string
    onDateChange: (id: number, newDate: string) => Promise<void>;
}

export function EditableDate({ id, date, onDateChange }: EditableDateProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const currentDate = date ? new Date(date) : undefined;

    const handleSelect = async (newDate: Date | undefined) => {
        if (newDate) {
            const formattedDate = format(newDate, "yyyy-MM-dd");
            setIsOpen(false); // Close popover immediately on selection
            await onDateChange(id, formattedDate);
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <div
                    className="flex items-center gap-2 group cursor-pointer w-fit"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    <div className="flex items-center text-sm text-gray-600 mb-3">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? (
                            <span>Due Date: {date}</span>
                        ) : (
                            <span>Set Due Date</span>
                        )}
                    </div>
                    <Pencil
                        className={cn(
                            "w-4 h-4 text-gray-400 transition-opacity mb-3",
                            isHovered || isOpen ? "opacity-100" : "opacity-0"
                        )}
                    />
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={currentDate}
                    onSelect={handleSelect}
                    initialFocus
                    className="p-4 [&_td]:w-10 [&_td]:h-10 [&_th]:w-10 [&_th]:h-10 [&_button]:w-10 [&_button]:h-10"
                />
            </PopoverContent>
        </Popover>
    );
}
