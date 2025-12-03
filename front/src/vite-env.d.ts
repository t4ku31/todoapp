/// <reference types="vite/client" />

interface ImportMetaEnv {
    /**
     * BFF API base URL
     * @default '/api'
     */
    readonly VITE_BFF_API_BASE_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
