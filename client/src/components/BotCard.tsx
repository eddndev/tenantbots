import React, { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { Smartphone, RefreshCcw, Power, Trash2, CheckCircle, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

interface BotProps {
    id: string; // This is the 'name' of the bot in DB
    name: string; // Display name
    initialStatus: string;
    apiKey: string;
    onDelete: () => void;
}

export const BotCard = ({ id, name, initialStatus, apiKey, onDelete }: BotProps) => {
    const [status, setStatus] = useState(initialStatus);
    const [qr, setQr] = useState<string | null>(null);
    const [realId, setRealId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Initial check: Does this bot exist in DB?
    // We expect the parent to pass the real ID if possible, but keeping this logic for now is okay
    // Actually, if we are listing from DB, 'id' passed here IS the real UUID if we change the parent to pass it.
    // BUT the current prop is named 'id' but used as 'name' in the previous "hardcoded" version.
    // Let's adapt: The parent will pass the REAL DB RECORD.
    // So 'id' should be the UUID. 'name' is the name.

    // Changing logic: 'id' is now the UUID. We don't need to looking it up by name.
    useEffect(() => {
        setRealId(id);
        setStatus(initialStatus);
    }, [id, initialStatus]);

    // Poll status/QR using the REAL ID
    useEffect(() => {
        if (!realId || status === 'CONNECTED' || status === 'DISCONNECTED') {
            // If disconnected, we might still want to poll occasionally to see if it starts? 
            // Or just when CONNECTING/QR.
            // Let's keep polling unless verified connected? 
            // Actually typically: poll if 'QR' or 'CONNECTING'. Stop if 'CONNECTED' or 'DISCONNECTED' (unless we triggered start)
        }

        if (status === 'CONNECTED') return;

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
            // Start creates session if not exists, but here it exists.
            // WE send { name } to POST /sessions, which returns sessionId.
            await api.post('/sessions', apiKey, { name: name });
            setStatus('CONNECTING');
        } catch (err) {
            alert('Error starting bot');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('¿Estás seguro de eliminar este bot?')) return;
        setDeleting(true);
        try {
            await onDelete();
        } catch (e) {
            alert('Error deleting');
            setDeleting(false);
        }
    };

    return (
        <div className="konpo-card p-6 flex flex-col items-center space-y-4 w-full relative group">
            <button
                onClick={handleDelete}
                disabled={deleting}
                className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                title="Eliminar Bot"
            >
                <Trash2 className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-between w-full pr-8">
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

            <div className="w-full aspect-square bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100 overflow-hidden relative">
                {status === 'CONNECTED' ? (
                    <div className="text-center text-green-600">
                        <CheckCircle className="w-16 h-16 mx-auto mb-2 opacity-20" />
                        <span className="text-sm font-medium">WhatsApp Conectado</span>
                    </div>
                ) : qr && status === 'QR' ? (
                    <div className="p-4 bg-white">
                        <QRCode value={qr} size={150} />
                    </div>
                ) : (
                    <div className="text-slate-400 text-sm flex flex-col items-center">
                        {loading ? <Loader2 className="w-8 h-8 animate-spin mb-2" /> : <Power className="w-8 h-8 mb-2 opacity-20" />}
                        <span>{loading ? 'Iniciando...' : 'Apagado'}</span>
                    </div>
                )}
            </div>

            <div className="flex w-full space-x-2 pt-2">
                <button
                    onClick={handleStart}
                    disabled={status === 'CONNECTED' || loading || deleting}
                    className="flex-1 bg-primary hover:bg-primary-hover text-white py-2 px-4 rounded-lg font-medium text-sm transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
                >
                    {status === 'CONNECTED' ? 'Funcionando' : 'Iniciar Bot'}
                </button>
            </div>
        </div>
    );
};
