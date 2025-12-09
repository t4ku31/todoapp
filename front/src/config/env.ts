import axios from 'axios';

/**
 * Environment configuration
 */
export const env = {
    /**
     * BFF API base URL
     * @default 'https://localhost/bff'
     */
    bffApiBaseUrl: import.meta.env.VITE_BFF_API_BASE_URL || 'https://localhost/bff',
} as const;

/**
 * Axios instance configured for BFF API
 */
export const apiClient = axios.create({
    baseURL: env.bffApiBaseUrl,
    withCredentials: true, // Include cookies for authentication
    headers: {
        'Content-Type': 'application/json',
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
            console.error('API Error:', error.response.status, error.response.data);

            if (error.response.status === 401) {
                // Session expired or unauthorized, redirect to login
                window.location.href = `${env.bffApiBaseUrl}/oauth2/authorization/bff-client`;
            }
        } else if (error.request) {
            // Request made but no response received
            console.error('Network Error:', error.message);
        } else {
            // Something else happened
            console.error('Error:', error.message);
        }
        return Promise.reject(error);
    }
);
