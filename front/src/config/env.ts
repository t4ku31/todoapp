import axios from "axios";
import { toast } from "sonner";

/**
 * Environment configuration
 */
export const env = {
	/**
	 * BFF API base URL
	 * @default 'https://localhost/bff'
	 */
	bffApiBaseUrl:
		import.meta.env.VITE_BFF_API_BASE_URL || "https://localhost/bff",
} as const;

/**
 * Axios instance configured for BFF API
 */
export const apiClient = axios.create({
	baseURL: env.bffApiBaseUrl,
	withCredentials: true, // Include cookies for authentication
	headers: {
		"Content-Type": "application/json",
	},
});

/**
 * Response interceptor for error handling
 */
apiClient.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response) {
			// Server responded with error status
			console.error("API Error:", error.response.status, error.response.data);

			if (error.response.status === 401) {
				// Session expired or unauthorized, redirect to login
				window.location.href = `${env.bffApiBaseUrl}/oauth2/authorization/bff-client`;
			} else {
				// Show formatted error toast
				const data = error.response.data;
				const errorType = data?.error || `Error ${error.response.status}`;
				const errorMessage = data?.message || "エラーが発生しました";

				toast.error(errorType, {
					description: errorMessage,
				});
			}
		} else if (error.request) {
			// Request made but no response received
			console.error("Network Error:", error.message);
			toast.error("Network Error", {
				description: "ネットワークエラーが発生しました",
			});
		} else {
			// Something else happened
			console.error("Error:", error.message);
			toast.error("Error", {
				description: "予期せぬエラーが発生しました",
			});
		}
		return Promise.reject(error);
	},
);
