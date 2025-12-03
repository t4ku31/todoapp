import { useState } from 'react';

export default function Debug() {
    const [resourceResponse, setResourceResponse] = useState<string>('');
    const [tokenResponse, setTokenResponse] = useState<string>('');
    const [meResponse, setMeResponse] = useState<string>('');

    const fetchResource = async () => {
        try {
            const res = await fetch('/bff/debug/resource');
            const text = await res.text();
            setResourceResponse(text);
        } catch (e) {
            setResourceResponse('Error: ' + e);
        }
    };

    const fetchToken = async () => {
        try {
            const res = await fetch('/bff/debug/token');
            const json = await res.json();
            setTokenResponse(JSON.stringify(json, null, 2));
        } catch (e) {
            setTokenResponse('Error: ' + e);
        }
    };

    const fetchMe = async () => {
        try {
            const res = await fetch('/bff/debug/me');
            const json = await res.json();
            setMeResponse(JSON.stringify(json, null, 2));
        } catch (e) {
            setMeResponse('Error: ' + e);
        }
    };

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-2xl font-bold">Debug OAuth2 Flow</h1>

            <div className="space-y-4">
                <h2 className="text-xl font-semibold">1. Resource Server (Frontend &rarr; BFF &rarr; Resource)</h2>
                <button
                    onClick={fetchResource}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Call /bff/resource
                </button>
                <pre className="p-4 bg-gray-100 rounded mt-2 overflow-auto">
                    {resourceResponse || 'No response yet'}
                </pre>
            </div>

            <div className="space-y-4">
                <h2 className="text-xl font-semibold">2. Access Token (BFF &rarr; Auth0)</h2>
                <button
                    onClick={fetchToken}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                    Call /bff/token
                </button>
                <pre className="p-4 bg-gray-100 rounded mt-2 overflow-auto">
                    {tokenResponse || 'No response yet'}
                </pre>
            </div>

            <div className="space-y-4">
                <h2 className="text-xl font-semibold">3. User Info (BFF Session)</h2>
                <button
                    onClick={fetchMe}
                    className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                >
                    Call /bff/me
                </button>
                <pre className="p-4 bg-gray-100 rounded mt-2 overflow-auto">
                    {meResponse || 'No response yet'}
                </pre>
            </div>
        </div>
    );
}
