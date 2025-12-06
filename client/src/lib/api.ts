const API_URL = import.meta.env.PUBLIC_API_URL || '/api';
const API_KEY = import.meta.env.PUBLIC_API_KEY || ''; // Frontend needs a way to store this, for now user might input it or we build it

export const api = {
    async get(endpoint: string, apiKey: string) {
        const res = await fetch(`${API_URL}${endpoint}`, {
            headers: {
                'x-api-key': apiKey
            }
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },

    async post(endpoint: string, apiKey: string, body: any) {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey
            },
            body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    },

    async delete(endpoint: string, apiKey: string) {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'DELETE',
            headers: {
                'x-api-key': apiKey
            }
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    }
};
