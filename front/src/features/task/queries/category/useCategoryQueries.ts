import { useQuery } from "@tanstack/react-query";
import { categoryApi } from "../../api/categoryApi";
import { categoryKeys } from "../queryKeys";

export const useCategoriesQuery = (options?: { enabled?: boolean }) => {
	return useQuery({
		queryKey: categoryKeys.lists(),
		queryFn: () => categoryApi.fetchCategories(),
		enabled: options?.enabled ?? true,
		staleTime: 1000 * 60 * 5, // 5 minutes
	});
};
