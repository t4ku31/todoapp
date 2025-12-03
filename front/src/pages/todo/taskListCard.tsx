import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusChangeButton } from "@/pages/todo/StatusChangeButton";
import type { TaskList, TaskStatus } from "@/types/types";
import { ClearButton } from "./ClearButton";
import { EditableDate } from "./EditableDate";
import { EditableTitle } from "./EditableTitle";

interface TaskCardProps {
    taskLists: TaskList[];
    loading: boolean;
    error: string | null;
    onStatusChange: (taskId: number, newStatus: TaskStatus) => void;
    onTaskTitleChange: (taskId: number, newTitle: string) => Promise<void>;
    onTaskListTitleChange: (taskListId: number, newTitle: string) => Promise<void>;
    onTaskListDateChange: (taskListId: number, newDate: string) => Promise<void>;
    onIsCompletedChange: (taskListId: number, isCompleted: boolean) => Promise<void>;
}

export default function TaskCard({ taskLists, loading, error, onStatusChange, onTaskTitleChange, onTaskListTitleChange, onTaskListDateChange, onIsCompletedChange }: TaskCardProps) {

    return (
        <>
            <Card className="flex-[0.7] h-[70%] overflow-x-auto">
                <CardHeader>
                    <CardTitle>Task Lists</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading && (
                        <p className="text-gray-500 text-center py-4">Loading task lists...</p>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                            <p className="font-bold">Error</p>
                            <p>{error}</p>
                        </div>
                    )}

                    {!loading && !error && taskLists.length === 0 && (
                        <p className="text-gray-500 text-center py-4">No task lists found.</p>
                    )}

                    {!loading && !error && taskLists.length > 0 && (
                        <div className="space-y-6">
                            {taskLists.map(taskList => {
                                // Validation: Check if all tasks are completed
                                const canComplete = taskList.tasks?.every(task => task.status === 'COMPLETED') ?? true;
                                const disabledReason = !canComplete ? "すべてのタスクを完了してください" : undefined;

                                return (
                                    <div key={taskList.id} className="border rounded-lg p-4">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex-1">
                                                <EditableTitle
                                                    id={taskList.id}
                                                    title={taskList.title}
                                                    onTitleChange={onTaskListTitleChange}
                                                />
                                                <EditableDate
                                                    id={taskList.id}
                                                    date={taskList.dueDate}
                                                    onDateChange={onTaskListDateChange}
                                                />
                                            </div>
                                            <ClearButton
                                                isCompleted={taskList.isCompleted}
                                                onToggleCompletion={() => onIsCompletedChange(taskList.id, !taskList.isCompleted)}
                                                disabled={!canComplete}
                                                disabledReason={disabledReason}
                                            />
                                        </div>

                                        {taskList.tasks && taskList.tasks.length > 0 ? (
                                            <div className="space-y-2">
                                                {taskList.tasks.map(task => (
                                                    <div key={task.id} className="flex items-start gap-2 p-3 bg-gray-50 rounded border">
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <EditableTitle
                                                                        id={task.id}
                                                                        title={task.title}
                                                                        onTitleChange={onTaskTitleChange}
                                                                    />
                                                                    {task.detail && (
                                                                        <p className="text-sm text-gray-600 mt-1">{task.detail}</p>
                                                                    )}
                                                                </div>
                                                                <StatusChangeButton
                                                                    status={task.status}
                                                                    onChange={(newStatus) => onStatusChange(task.id, newStatus)}
                                                                />
                                                            </div>
                                                            <div className="flex gap-3 mt-2 text-xs text-gray-500">
                                                                {task.limit && (
                                                                    <span>Due: {new Date(task.limit).toLocaleDateString()}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-400 text-sm">No tasks in this list</p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </>
    )
}