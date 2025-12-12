import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiClient } from "@/config/env";
import CreateTaskListButton from "@/features/todo/components/CreateTaskListButton";
import TaskListCard from "@/features/todo/components/TaskListCard";
import { sortTasks } from "@/features/todo/utils/taskSorter";
import type { TaskList, TaskStatus } from "@/types/types";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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
                // Sort tasks in each list
                const sortedLists = response.data.map(list => ({
                    ...list,
                    tasks: sortTasks(list.tasks || [])
                }));
                setTaskLists(sortedLists);
                setError(null);
            } catch (err) {
                console.error('Failed to fetch tasklists:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch tasklists');
            } finally {
                setLoading(false);
            }
        };

        fetchTaskLists();
    }, []);

    // Add new task list to state
    const handleAddTaskList = (newTaskList: TaskList) => {
        // Sort tasks for the new list (though initially empty or pre-filled)
        const sortedList = {
            ...newTaskList,
            tasks: sortTasks(newTaskList.tasks || [])
        };
        setTaskLists(prev => [...prev, sortedList]);
    };

    // Handle task status change
    const handleStatusChange = async (taskId: number, newStatus: TaskStatus) => {
        try {
            // Optimistic update with sorting
            setTaskLists(prevLists => prevLists.map(list => {
                if (list.tasks && list.tasks.some(t => t.id === taskId)) {
                    const updatedTasks = list.tasks.map(task =>
                        task.id === taskId ? { ...task, status: newStatus } : task
                    );
                    return {
                        ...list,
                        tasks: sortTasks(updatedTasks)
                    };
                }
                return list;
            }));

            await apiClient.patch(`/api/tasks/${taskId}`, { status: newStatus });
        } catch (err) {
            console.error('Failed to update task status:', err);
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

            await apiClient.patch(`/api/tasks/${taskId}`, { title: newTitle });
        } catch (err) {
            console.error('Failed to update task title:', err);
            throw err;
        }
    };

    const handleTaskListTitleChange = async (taskListId: number, newTitle: string) => {
        try {
            // Optimistic update
            setTaskLists(prevLists => prevLists.map(list =>
                list.id === taskListId ? { ...list, title: newTitle } : list
            ));

            await apiClient.patch(`/api/tasklists/${taskListId}`, { title: newTitle });
        } catch (err) {
            console.error('Failed to update task list title:', err);
            throw err;
        }
    };

    const handleTaskListDateChange = async (taskListId: number, newDate: string) => {
        try {
            // Optimistic update
            setTaskLists(prevLists => prevLists.map(list =>
                list.id === taskListId ? { ...list, dueDate: newDate } : list
            ));

            await apiClient.patch(`/api/tasklists/${taskListId}`, { dueDate: newDate });
        } catch (err) {
            console.error('Failed to update task list date:', err);
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

            throw err;
        }
    };

    const handleDeleteTaskList = async (taskListId: number) => {
        try {
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
            const response = await apiClient.post<any>('/api/tasks', { title, taskListId });
            const newTask = response.data;

            setTaskLists(prevLists => prevLists.map(list => {
                if (list.id === taskListId) {
                    const updatedTasks = [...(list.tasks || []), {
                        id: newTask.id,
                        title: newTask.title,
                        status: newTask.status || 'PENDING',
                        taskListId: taskListId
                    }];
                    return {
                        ...list,
                        tasks: sortTasks(updatedTasks)
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