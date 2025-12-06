import React, { useEffect, useState } from 'react';
import { BotCard } from './BotCard';
import { LogOut, Plus, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

interface Session {
    id: string;
    name: string;
    status: string;
}

export const ProtectedDashboard = () => {
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [isChecking, setIsChecking] = useState(true);
    const [bots, setBots] = useState<Session[]>([]);
    const [loadingBots, setLoadingBots] = useState(false);
    const [newBotName, setNewBotName] = useState('');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        const key = localStorage.getItem('tenantbots_key');
        if (!key) {
            window.location.href = '/login';
        } else {
            setApiKey(key);
            setIsChecking(false);
            fetchBots(key);
        }
    }, []);

    const fetchBots = async (key: string) => {
        setLoadingBots(true);
        try {
            const data = await api.get('/sessions', key);
            setBots(data);
        } catch (e) {
            console.error("Error fetching bots", e);
        } finally {
            setLoadingBots(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('tenantbots_key');
        window.location.href = '/login';
    };

    const handleCreateBot = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newBotName.trim() || !apiKey) return;

        setCreating(true);
        try {
            await api.post('/sessions', apiKey, { name: newBotName });
            setNewBotName('');
            await fetchBots(apiKey);
        } catch (error) {
            alert('Error creating bot');
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteBot = async (id: string) => {
        if (!apiKey) return;
        await api.delete(`/sessions/${id}`, apiKey);
        setBots(bots.filter(b => b.id !== id));
    };

    if (isChecking) return null;

    return (
        <main className="min-h-screen bg-bg-surface p-8">
            <header className="max-w-6xl mx-auto mb-12 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
                        TenantBots
                    </h1>
                    <p className="text-slate-500 mt-1">Gestión de sesiones de WhatsApp</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleLogout}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                        title="Cerrar Sesión"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <section className="max-w-6xl mx-auto">
                {/* Create Bar */}
                <div className="mb-8 p-4 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="flex-1">
                        <h3 className="text-sm font-semibold text-slate-700">Crear Nuevo Robot</h3>
                        <p className="text-xs text-slate-400">Asigna un nombre único para identificar esta sesión.</p>
                    </div>
                    <form onSubmit={handleCreateBot} className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Nombre (ej. Ventas, Soporte)"
                            value={newBotName}
                            onChange={(e) => setNewBotName(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-brand outline-none"
                        />
                        <button
                            type="submit"
                            disabled={creating || !newBotName}
                            className="bg-brand hover:bg-brand-hover text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                        >
                            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            Crear
                        </button>
                    </form>
                </div>

                {loadingBots ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 text-brand animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {bots.map((bot) => (
                            <BotCard
                                key={bot.id}
                                id={bot.id}
                                name={bot.name}
                                initialStatus={bot.status}
                                apiKey={apiKey || ''}
                                onDelete={() => handleDeleteBot(bot.id)}
                            />
                        ))}

                        {bots.length === 0 && (
                            <div className="col-span-full text-center py-12 text-slate-400">
                                No hay bots activos. ¡Crea uno nuevo!
                            </div>
                        )}
                    </div>
                )}
            </section>
        </main>
    );
};
