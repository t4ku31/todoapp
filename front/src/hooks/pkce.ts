// src/hooks/pkce.ts
import bcrypt from 'bcrypt';

export async function hashValue(value: string): Promise<string> {
    const hash = await bcrypt.hash(value, 10);
    return hash;
}
export async function verifyHash(value: string, hash: string): Promise<boolean> {
    const match = await bcrypt.compare(value, hash);
    return match;
}

export async function sha256(buffer: string): Promise<Uint8Array> {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(buffer));
    return new Uint8Array(digest);
}
export function base64urlEncode(uint8array: Uint8Array): string {
    const str = btoa(String.fromCharCode(...uint8array));
    return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
export function generateCodeVerifier(): string {
    const array = new Uint8Array(96);
    crypto.getRandomValues(array);
    return base64urlEncode(array);
}
export async function generateCodeChallenge(verifier: string): Promise<string> {
    const hashed = await sha256(verifier);
    return base64urlEncode(hashed);
}
