// src/types/pkce.d.ts
declare module "@/hooks/pkce" {
    export function sha256(buffer: string): Promise<Uint8Array>;
    export function base64urlEncode(uint8array: Uint8Array): string;
    export function generateCodeVerifier(): string;
    export function generateCodeChallenge(verifier: string): Promise<string>;
}
