import { toast } from "sonner";
import { create } from "zustand";
import { apiClient } from "@/config/env";
import type { Category } from "@/types/types";
import { normalizeError } from "@/utils/error";

interface CategoryState {
	categories: Category[];
	createCategory: (name: string, color: string) => Promise<void>;
	updateCategory: (id: number, updates: Partial<Category>) => Promise<void>;
	deleteCategory: (id: number) => Promise<void>;
	fetchCategories: () => Promise<void>;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
	categories: [],

	fetchCategories: async () => {
		try {
			const response = await apiClient.get<Category[]>("/api/categories");
			set({ categories: response.data });
		} catch (err) {
			console.error("Failed to fetch categories:", err);
		}
	},

	createCategory: async (name, color) => {
		try {
			const response = await apiClient.post<Category>("/api/categories", {
				name,
				color,
			});
			set((state) => ({
				categories: [...state.categories, response.data],
			}));
			toast.success("カテゴリを作成しました");
		} catch (err) {
			console.error("Failed to create category:", err);
			const appError = normalizeError(err);
			toast.error("作成失敗", { description: appError.message });
			throw err;
		}
	},

	updateCategory: async (id, updates) => {
		// Optimistic update
		const originalCategories = get().categories;
		set((state) => ({
			categories: state.categories.map((c) =>
				c.id === id ? { ...c, ...updates } : c,
			),
		}));

		try {
			await apiClient.patch(`/api/categories/${id}`, updates);
		} catch (err) {
			console.error("Failed to update category:", err);
			const appError = normalizeError(err);
			toast.error("更新失敗", { description: appError.message });
			set({ categories: originalCategories }); // Revert
			throw err;
		}
	},

	deleteCategory: async (id) => {
		try {
			await apiClient.delete(`/api/categories/${id}`);
			set((state) => ({
				categories: state.categories.filter((c) => c.id !== id),
			}));
			toast.success("カテゴリを削除しました");
		} catch (err) {
			console.error("Failed to delete category:", err);
			const appError = normalizeError(err);
			toast.error("削除失敗", { description: appError.message });
			throw err;
		}
	},
}));
