import React, { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { Smartphone, RefreshCcw, Power, Trash2, CheckCircle, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

interface BotProps {
    id: string; // This is the 'name' of the bot in DB
    name: string; // Display name
    initialStatus: string;
    apiKey: string;
}

export const BotCard = ({ id, name, initialStatus, apiKey }: BotProps) => {
    const [status, setStatus] = useState(initialStatus);
    const [qr, setQr] = useState<string | null>(null);
    const [realId, setRealId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Initial check: Does this bot exist in DB?
    useEffect(() => {
        const checkExists = async () => {
            try {
                const sessions = await api.get('/sessions', apiKey);
                const found = sessions.find((s: any) => s.name === id);
                if (found) {
                    setRealId(found.id);
                    setStatus(found.status || 'OFFLINE');
                }
            } catch (e) { console.error(e); }
        };
        checkExists();
    }, [id, apiKey]);

    // Poll status/QR using the REAL ID
    useEffect(() => {
        if (!realId || status === 'CONNECTED') return;

        const interval = setInterval(async () => {
            try {
                const data = await api.get(`/sessions/${realId}`, apiKey);
                setStatus(data.status);
                if (data.status === 'QR' && data.qr) {
                    setQr(data.qr);
                } else {
                    setQr(null);
                }
            } catch (e) {
                console.error("Polling error", e);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [realId, apiKey, status]);

    const handleStart = async () => {
        setLoading(true);
        try {
            // Start creates or returns the session with UUID
            const res = await api.post('/sessions', apiKey, { name: id });
            setRealId(res.sessionId); // Capture the real UUID
            setStatus('CONNECTING');
        } catch (err) {
            alert('Error starting bot');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="konpo-card p-6 flex flex-col items-center space-y-4 w-full max-w-sm mx-auto">
            <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-2">
                    <Smartphone className={`w-6 h-6 ${status === 'CONNECTED' ? 'text-green-500' : 'text-slate-400'}`} />
                    <h3 className="font-semibold text-lg text-slate-800">{name}</h3>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${status === 'CONNECTED' ? 'bg-green-100 text-green-700' :
                    status === 'QR' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                    {status}
                </span>
            </div>

            <div className="w-full aspect-square bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100 overflow-hidden">
                {status === 'CONNECTED' ? (
                    <div className="text-center text-green-600">
                        <CheckCircle className="w-16 h-16 mx-auto mb-2 opacity-20" />
                        <span className="text-sm font-medium">WhatsApp Conectado</span>
                    </div>
                ) : qr && status === 'QR' ? (
                    <div className="p-4 bg-white">
                        <QRCode value={qr} size={200} />
                    </div>
                ) : (
                    <div className="text-slate-400 text-sm">
                        {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : 'Esperando inicio...'}
                    </div>
                )}
            </div>

            <div className="flex w-full space-x-2 pt-2">
                <button
                    onClick={handleStart}
                    disabled={status === 'CONNECTED' || loading}
                    className="flex-1 bg-primary hover:bg-primary-hover text-white py-2 px-4 rounded-lg font-medium text-sm transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Iniciando...' : 'Iniciar Bot'}
                </button>
            </div>
        </div>
    );
};
