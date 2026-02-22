import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { normalizeError } from "@/utils/error";
import { categoryApi } from "../../api/categoryApi";
import type { Category } from "../../types";
import { categoryKeys } from "../queryKeys";

export const useCreateCategoryMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: Pick<Category, "name" | "color">) =>
			categoryApi.createCategory(data),
		onSuccess: (newCategory) => {
			toast.success("カテゴリを作成しました");
			// Append optimistic update or invalidate
			queryClient.setQueryData<Category[]>(categoryKeys.lists(), (old) =>
				old ? [...old, newCategory] : [newCategory],
			);
		},
		onError: (error) => {
			const appError = normalizeError(error);
			toast.error("作成失敗", { description: appError.message });
		},
	});
};

export const useUpdateCategoryMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, updates }: { id: number; updates: Partial<Category> }) =>
			categoryApi.updateCategory(id, updates),
		onMutate: async ({ id, updates }) => {
			await queryClient.cancelQueries({ queryKey: categoryKeys.lists() });
			const previousCategories = queryClient.getQueryData<Category[]>(
				categoryKeys.lists(),
			);

			if (previousCategories) {
				queryClient.setQueryData<Category[]>(
					categoryKeys.lists(),
					previousCategories.map((c) =>
						c.id === id ? { ...c, ...updates } : c,
					),
				);
			}

			return { previousCategories };
		},
		onSuccess: () => {
			toast.success("カテゴリを更新しました");
		},
		onError: (error, _variables, context) => {
			const appError = normalizeError(error);
			toast.error("更新失敗", { description: appError.message });
			if (context?.previousCategories) {
				queryClient.setQueryData(
					categoryKeys.lists(),
					context.previousCategories,
				);
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
		},
	});
};

export const useDeleteCategoryMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: number) => categoryApi.deleteCategory(id),
		onMutate: async (id) => {
			await queryClient.cancelQueries({ queryKey: categoryKeys.lists() });
			const previousCategories = queryClient.getQueryData<Category[]>(
				categoryKeys.lists(),
			);

			if (previousCategories) {
				queryClient.setQueryData<Category[]>(
					categoryKeys.lists(),
					previousCategories.filter((c) => c.id !== id),
				);
			}
			return { previousCategories };
		},
		onSuccess: () => {
			toast.success("カテゴリを削除しました");
		},
		onError: (error, _variables, context) => {
			const appError = normalizeError(error);
			toast.error("削除失敗", { description: appError.message });
			if (context?.previousCategories) {
				queryClient.setQueryData(
					categoryKeys.lists(),
					context.previousCategories,
				);
			}
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: categoryKeys.lists() });
		},
	});
};
