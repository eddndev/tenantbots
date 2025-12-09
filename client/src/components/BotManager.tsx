import React, { useEffect, useState } from 'react';
import { CommandManager } from './CommandManager';
import { InteractionViewer } from './InteractionViewer';
import { ArrowLeft, MessageSquare, BarChart2 } from 'lucide-react';

export const BotManager = () => {
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [tab, setTab] = useState<'commands' | 'interactions'>('commands');

    useEffect(() => {
        const key = localStorage.getItem('tenantbots_key');
        if (!key) {
            window.location.href = '/login';
            return;
        }
        setApiKey(key);

        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        if (!id) {
            window.location.href = '/';
            return;
        }
        setSessionId(id);
    }, []);

    if (!apiKey || !sessionId) return null;

    return (
        <main className="min-h-screen bg-bg-surface p-8">
            <header className="max-w-6xl mx-auto mb-8">
                <button onClick={() => window.location.href = '/'} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-4">
                    <ArrowLeft size={20} /> Volver al Dashboard
                </button>
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold">Gestión de Robot</h1>
                        <p className="text-slate-500">Configura respuestas y visualiza estadísticas</p>
                    </div>
                    <div className="flex bg-white rounded-lg p-1 shadow-sm border">
                        <button
                            onClick={() => setTab('commands')}
                            className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors ${tab === 'commands' ? 'bg-brand text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <MessageSquare size={16} /> Comandos
                        </button>
                        <button
                            onClick={() => setTab('interactions')}
                            className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors ${tab === 'interactions' ? 'bg-brand text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <BarChart2 size={16} /> Interacciones
                        </button>
                    </div>
                </div>
            </header>

            <section className="max-w-6xl mx-auto">
                {tab === 'commands' ? (
                    <CommandManager sessionId={sessionId} apiKey={apiKey} />
                ) : (
                    <InteractionViewer sessionId={sessionId} apiKey={apiKey} />
                )}
            </section>
        </main>
    );
};
