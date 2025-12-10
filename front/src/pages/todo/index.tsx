import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiClient } from "@/config/env";
import type { TaskList, TaskStatus } from "@/types/types";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import CreateTaskListButton from "./createButton";
import TaskListCard from "./taskListCard";

export default function Todo() {
    const [taskLists, setTaskLists] = useState<TaskList[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch tasklists on initial render
    useEffect(() => {
        const fetchTaskLists = async () => {
            try {
                setLoading(true);
                const response = await apiClient.get<TaskList[]>('/api/tasklists');
                console.log(response.data);
                setTaskLists(response.data);
                setError(null);
            } catch (err) {
                console.error('Failed to fetch tasklists:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch tasklists');
            } finally {
                setLoading(false);
            }
        };

        fetchTaskLists();
        console.log("taskLists", taskLists);
    }, []);

    // Add new task list to state
    const handleAddTaskList = (newTaskList: TaskList) => {
        setTaskLists(prev => [...prev, newTaskList]);
    };

    // Handle task status change
    const handleStatusChange = async (taskId: number, newStatus: TaskStatus) => {
        try {
            // Optimistic update
            setTaskLists(prevLists => prevLists.map(list => ({
                ...list,
                tasks: list.tasks ? list.tasks.map(task =>
                    task.id === taskId ? { ...task, status: newStatus } : task
                ) : []
            })));

            console.log("Updated task status:", taskId, newStatus);

            await apiClient.patch(`/api/tasks/${taskId}`, { status: newStatus });
        } catch (err) {
            console.error('Failed to update task status:', err);
            // Revert optimistic update (optional, but good practice)
            // For simplicity, we might just re-fetch or show error. 
            // Here we just log it. Ideally we should revert state.
        }
    };

    // Handle task title change
    const handleTaskTitleChange = async (taskId: number, newTitle: string) => {
        try {
            // Optimistic update
            setTaskLists(prevLists => prevLists.map(list => ({
                ...list,
                tasks: list.tasks ? list.tasks.map(task =>
                    task.id === taskId ? { ...task, title: newTitle } : task
                ) : []
            })));

            console.log("Updated task title:", taskId, newTitle);

            await apiClient.patch(`/api/tasks/${taskId}`, { title: newTitle });
        } catch (err) {
            console.error('Failed to update task title:', err);
            // Re-throw to let component handle the error
            throw err;
        }
    };

    const handleTaskListTitleChange = async (taskListId: number, newTitle: string) => {
        try {
            // Optimistic update
            setTaskLists(prevLists => prevLists.map(list =>
                list.id === taskListId ? { ...list, title: newTitle } : list
            ));

            console.log("Updated task list title:", taskListId, newTitle);

            await apiClient.patch(`/api/tasklists/${taskListId}`, { title: newTitle });
        } catch (err) {
            console.error('Failed to update task list title:', err);
            // Re-throw to let component handle the error
            throw err;
        }
    };

    const handleTaskListDateChange = async (taskListId: number, newDate: string) => {
        try {
            // Optimistic update
            setTaskLists(prevLists => prevLists.map(list =>
                list.id === taskListId ? { ...list, dueDate: newDate } : list
            ));

            console.log("Updated task list date:", taskListId, newDate);

            await apiClient.patch(`/api/tasklists/${taskListId}`, { dueDate: newDate });
        } catch (err) {
            console.error('Failed to update task list date:', err);
            // Re-throw to let component handle the error
            throw err;
        }
    };

    const handleIsCompletedChange = async (taskListId: number, isCompleted: boolean) => {
        // Store previous state for revert
        const previousLists = taskLists;

        try {
            // Optimistic update
            setTaskLists(prevLists => prevLists.map(list =>
                list.id === taskListId ? { ...list, isCompleted: isCompleted } : list
            ));

            console.log("Updated task list completion:", taskListId, isCompleted);

            await apiClient.patch(`/api/tasklists/${taskListId}`, { isCompleted: isCompleted });
        } catch (err: any) {
            console.error('Failed to update task list completion:', err);
            // Revert optimistic update on error
            setTaskLists(previousLists);

            // Show error toast
            const errorMessage = err.response?.data?.message ||
                err.response?.data?.error ||
                'すべてのタスクを完了してから、リストを完了してください';
            toast.error('タスクリストを完了できません', {
                description: errorMessage,
            });

            // Re-throw to let component handle the error
            throw err;
        }
    };

    const handleDeleteTaskList = async (taskListId: number) => {
        try {
            console.log("Deleting task list:", taskListId);
            await apiClient.delete(`/api/tasklists/${taskListId}`);
            setTaskLists(prevLists => prevLists.filter(list => list.id !== taskListId));
            toast.success("タスクリストを削除しました");
        } catch (err: any) {
            console.error('Failed to delete task list:', err);
            const errorMessage = err.response?.data?.message || err.response?.data?.error || 'タスクリストの削除に失敗しました';
            toast.error('削除失敗', {
                description: errorMessage,
            });
        }
    };

    const handleDeleteTask = async (taskId: number) => {
        try {
            console.log("Deleting task:", taskId);

            // Wait for backend validation/processing
            await apiClient.delete(`/api/tasks/${taskId}`);

            // Update UI only after success
            setTaskLists(prevLists => prevLists.map(list => ({
                ...list,
                tasks: list.tasks ? list.tasks.filter(task => task.id !== taskId) : []
            })));

            toast.success("タスクを削除しました");
        } catch (err: any) {
            console.error('Failed to delete task:', err);
            const errorMessage = err.response?.data?.message || err.response?.data?.error || 'タスクの削除に失敗しました';
            toast.error('削除失敗', {
                description: errorMessage,
            });
        }
    };

    const handleCreateTask = async (taskListId: number, title: string) => {
        try {
            console.log("Creating task:", taskListId, title);
            const response = await apiClient.post<any>('/api/tasks', { title, taskListId });
            const newTask = response.data;
            console.log("Created task:", newTask);
            setTaskLists(prevLists => prevLists.map(list => {
                if (list.id === taskListId) {
                    return {
                        ...list,
                        tasks: [...(list.tasks || []), {
                            id: newTask.id,
                            title: newTask.title,
                            status: newTask.status || 'PENDING',
                            taskListId: taskListId
                        }]
                    };
                }
                return list;
            }));

            toast.success("タスクを追加しました");
        } catch (err: any) {
            console.error('Failed to create task:', err);
            const errorMessage = err.response?.data?.message || err.response?.data?.error || 'タスクの作成に失敗しました';
            toast.error('作成失敗', {
                description: errorMessage,
            });
            throw err;
        }
    };

    const activeTaskLists = taskLists.filter(list => !list.isCompleted);
    const completedTaskLists = taskLists.filter(list => list.isCompleted);

    return (
        <div className="flex flex-col gap-6 h-full w-full p-8 overflow-hidden">
            <div className="flex justify-between items-center shrink-0">
                <h1 className="text-2xl font-bold">タスクリスト</h1>
                <CreateTaskListButton onTaskListCreated={handleAddTaskList} />
            </div>

            <div className="flex-1 overflow-hidden">
                <Tabs defaultValue="active" className="h-full flex flex-col">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="active">Active Tasks</TabsTrigger>
                        <TabsTrigger value="completed">Completed Tasks</TabsTrigger>
                    </TabsList>

                    <TabsContent value="active" className="flex-1 overflow-y-auto pr-2 mt-0 h-full">
                        <TaskListCard
                            taskLists={activeTaskLists}
                            loading={loading}
                            error={error}
                            onStatusChange={handleStatusChange}
                            onTaskTitleChange={handleTaskTitleChange}
                            onTaskListTitleChange={handleTaskListTitleChange}
                            onTaskListDateChange={handleTaskListDateChange}
                            onIsCompletedChange={handleIsCompletedChange}
                            onDeleteTaskList={handleDeleteTaskList}
                            onDeleteTask={handleDeleteTask}
                            onCreateTask={handleCreateTask}
                        />
                    </TabsContent>

                    <TabsContent value="completed" className="flex-1 overflow-y-auto pr-2 mt-0 h-full">
                        <TaskListCard
                            taskLists={completedTaskLists}
                            loading={loading}
                            error={error}
                            onStatusChange={handleStatusChange}
                            onTaskTitleChange={handleTaskTitleChange}
                            onTaskListTitleChange={handleTaskListTitleChange}
                            onTaskListDateChange={handleTaskListDateChange}
                            onIsCompletedChange={handleIsCompletedChange}
                            onDeleteTaskList={handleDeleteTaskList}
                            onDeleteTask={handleDeleteTask}
                            onCreateTask={handleCreateTask}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}