import React, { useEffect, useState } from 'react';
import { BotCard } from './BotCard';
import { LogOut } from 'lucide-react';

export const ProtectedDashboard = () => {
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const key = localStorage.getItem('tenantbots_key');
        if (!key) {
            window.location.href = '/login';
        } else {
            setApiKey(key);
            setIsChecking(false);
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('tenantbots_key');
        window.location.href = '/login';
    };

    if (isChecking) return null; // Or a loading spinner

    return (
        <main className="min-h-screen bg-bg-surface p-8">
            <header className="max-w-5xl mx-auto mb-12 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
                        TenantBots
                    </h1>
                    <p className="text-slate-500 mt-1">Gestión de sesiones de WhatsApp</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-sm text-slate-400">v1.2.0</div>
                    <button
                        onClick={handleLogout}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                        title="Cerrar Sesión"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <section className="max-w-5xl mx-auto">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8">
                    <h2 className="text-lg font-semibold mb-4 text-slate-800">Panel de Control</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <BotCard
                            id="bot-1"
                            name="Bot Principal"
                            initialStatus="DISCONNECTED"
                            apiKey={apiKey || ''}
                        />
                    </div>
                </div>
            </section>
        </main>
    );
};
