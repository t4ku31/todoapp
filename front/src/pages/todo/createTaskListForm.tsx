import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { apiClient } from '@/config/env';
import { cn } from '@/lib/utils';
import type { TaskList } from '@/types/types';
import { format } from 'date-fns';
import { CalendarIcon, Check, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';

export interface TaskInput {
    title: string;
}

interface CreateTaskListFormProps {
    onTaskListCreated: (newTaskList: TaskList) => void;
    onCancel: () => void;
    className?: string;
}

export default function CreateTaskListForm({ onTaskListCreated, onCancel, className }: CreateTaskListFormProps) {
    const [title, setTitle] = useState('');
    const [tasks, setTasks] = useState<TaskInput[]>([]);
    const [date, setDate] = useState<Date>(new Date());

    // Add new task
    const handleAddTask = () => {
        setTasks([...tasks, { title: '' }]);
    };

    // Remove task
    const handleRemoveTask = (index: number) => {
        const newTasks = [...tasks];
        newTasks.splice(index, 1);
        setTasks(newTasks);
    };

    // Update task value
    const handleTaskChange = (index: number, value: string) => {
        const newTasks = [...tasks];
        newTasks[index].title = value;
        setTasks(newTasks);
    };

    // Save task list
    const handleSave = async () => {
        if (title.trim()) {
            const validTasks = tasks.filter(t => t.title.trim() !== '');
            const tasklist = {
                title: title,
                tasks: validTasks,
                dueDate: date ? format(date, 'yyyy-MM-dd') : null,
            };
            try {
                console.log("Request new list:", tasklist);
                const response = await apiClient.post<TaskList>('/api/tasklists', tasklist);
                console.log("Response new list:", response.data);
                onTaskListCreated(response.data);
            } catch (error) {
                console.error("Failed to create task list:", error);
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSave();
        } else if (e.key === 'Escape') {
            onCancel();
        }
    };

    return (
        <div className={`flex flex-col gap-3 p-4 border rounded-lg bg-card shadow-sm ${className}`}>
            <div className="flex items-center gap-2">
                <Input
                    autoFocus
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="リスト名を入力..."
                    className="font-semibold"
                />
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                                "w-[240px] justify-start text-left font-normal",
                                !date && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "PPP") : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            initialFocus
                            className="p-4 [&_td]:w-10 [&_td]:h-10 [&_th]:w-10 [&_th]:h-10 [&_button]:w-10 [&_button]:h-10"
                        />
                    </PopoverContent>
                </Popover>
                <Button onClick={handleSave} size="sm" variant="outline" className="h-9 w-9 p-0 shrink-0">
                    <Check className="size-4" />
                </Button>
                <Button onClick={onCancel} size="sm" variant="ghost" className="h-9 w-9 p-0 shrink-0">
                    <X className="size-4" />
                </Button>
            </div>

            <div className="space-y-2 pl-4 border-l-2 border-muted ml-2">
                {tasks.map((task, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <Input
                            value={task.title}
                            onChange={(e) => handleTaskChange(index, e.target.value)}
                            placeholder={`タスク ${index + 1}`}
                            className="h-8 text-sm"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddTask();
                                }
                            }}
                        />
                        <Button
                            onClick={() => handleRemoveTask(index)}
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        >
                            <Trash2 className="size-4" />
                        </Button>
                    </div>
                ))}
                <Button
                    onClick={handleAddTask}
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground h-8 px-2"
                >
                    <Plus className="size-3 mr-1" />
                    タスクを追加
                </Button>
            </div>
        </div>
    );
}
