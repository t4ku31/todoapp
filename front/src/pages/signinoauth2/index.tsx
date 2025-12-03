// src/App.jsx

import { generateCodeChallenge, generateCodeVerifier } from "@/hooks/pkce";

export default function App() {
    async function startLogin() {
        const verifier = generateCodeVerifier();
        const challenge = await generateCodeChallenge(verifier);
        sessionStorage.setItem("pkce_verifier", verifier);

        const params = new URLSearchParams({
            response_type: "code",
            client_id: "spa-client",
            redirect_uri: "http://localhost:3000/callback",
            scope: "openid profile",
            code_challenge: challenge,
            code_challenge_method: "S256",
            state: crypto.randomUUID(),
        });

        window.location.href = `http://localhost:9000/oauth2/authorize?${params.toString()}`;
    }

    return (
        <div className="flex flex-col items-center justify-center h-screen" >
            <h1 className="text-xl mb-4" > PKCE Login Demo </h1>
            < button
                onClick={startLogin}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
                Login with OAuth2
            </button>
        </div>
    );
}
