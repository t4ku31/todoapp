export const taskKeys = {
	all: ["tasks"] as const,
	lists: () => [...taskKeys.all, "lists"] as const,
	trash: () => [...taskKeys.all, "trash"] as const,
	detail: (id: number) => [...taskKeys.all, "detail", id] as const,
};

export const categoryKeys = {
	all: ["categories"] as const,
	lists: () => [...categoryKeys.all, "list"] as const,
};
