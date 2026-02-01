import axios from "axios";

// Application common error type
export type AppError = {
	message: string;
	statusCode?: number;
	code?: string;
};

/**
 * Parse unknown errors and convert them into safe objects for UI display
 */
export const normalizeError = (error: unknown): AppError => {
	if (axios.isAxiosError(error)) {
		// 1. When there is an explicit error response from the server
		if (error.response) {
			const data = error.response.data as {
				error?: { message?: string } | string;
				message?: string;
			};
			// Supports { error: { message: "..." } }, { error: "..." }, and { message: "..." }
			const serverMessage =
				(typeof data?.error === "object" ? data.error?.message : data?.error) ||
				data?.message;

			return {
				message:
					serverMessage ||
					`サーバーエラーが発生しました (${error.response.status})`,
				statusCode: error.response.status,
			};
		}

		// 2. Timeout
		if (error.code === "ECONNABORTED") {
			return {
				message:
					"リクエストがタイムアウトしました。通信環境を確認してください。",
				code: error.code,
			};
		}

		// 3. Network error (server unreachable)
		if (error.request) {
			return {
				message: "サーバーに接続できません。ネットワークを確認してください。",
				code: "NETWORK_ERROR",
			};
		}
	}

	// 4. Other errors (programming mistakes, etc.)
	if (error instanceof Error) {
		return { message: error.message };
	}

	return { message: "予期せぬエラーが発生しました。" };
};
