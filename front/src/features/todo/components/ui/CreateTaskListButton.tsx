import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { TaskList } from "@/types/types";
import CreateTaskListForm from "../forms/CreateTaskListForm";

interface CreateTaskListButtonProps {
	onTaskListCreated: (newTaskList: TaskList) => void;
	className?: string;
}

export default function CreateTaskListButton({
	onTaskListCreated,
	className,
}: CreateTaskListButtonProps) {
	const [isEditing, setIsEditing] = useState(false);

	const toggleEditing = () => {
		setIsEditing(!isEditing);
	};

	const handleTaskListCreated = (newTaskList: TaskList) => {
		onTaskListCreated(newTaskList);
		toggleEditing();
	};

	if (isEditing) {
		return (
			<CreateTaskListForm
				onTaskListCreated={handleTaskListCreated}
				onCancel={toggleEditing}
				className={className}
			/>
		);
	}

	return (
		<Button
			onClick={toggleEditing}
			variant="default"
			size="default"
			className={className}
		>
			<Plus className="size-5" />
			新しいタスクリストを作成
		</Button>
	);
}
