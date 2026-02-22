import { apiClient } from "@/config/env";
import type { Category } from "../types";

export const categoryApi = {
	fetchCategories: async (): Promise<Category[]> => {
		const response = await apiClient.get<Category[]>("/api/categories");
		return response.data;
	},

	createCategory: async (
		data: Pick<Category, "name" | "color">,
	): Promise<Category> => {
		const response = await apiClient.post<Category>("/api/categories", data);
		return response.data;
	},

	updateCategory: async (
		id: number,
		updates: Partial<Category>,
	): Promise<Category> => {
		const response = await apiClient.patch<Category>(
			`/api/categories/${id}`,
			updates,
		);
		return response.data;
	},

	deleteCategory: async (id: number): Promise<void> => {
		await apiClient.delete(`/api/categories/${id}`);
	},
};
