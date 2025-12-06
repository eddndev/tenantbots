import React, { useState } from 'react';
import { KeyRound, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { api } from '../lib/api';

export const LoginForm = () => {
    const [apiKey, setApiKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Validate key by hitting a public endpoint that requires auth (or just health check with header)
            // We'll use get sessions to verify access rights
            await api.get('/sessions', apiKey);

            // If success, save and redirect
            localStorage.setItem('tenantbots_key', apiKey);
            window.location.href = '/';
        } catch (err) {
            setError('Clave de acceso incorrecta');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="konpo-card p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-brand/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand/20">
                        <ShieldCheck className="w-8 h-8 text-brand" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Acceso Seguro</h1>
                    <p className="text-slate-500 mt-2">Dime el secreto para entrar a TenantBots</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="apikey" className="text-sm font-medium text-slate-700 ml-1">
                            Código de Acceso (API Key)
                        </label>
                        <div className="relative">
                            <KeyRound className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                            <input
                                id="apikey"
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all placeholder:text-slate-400 font-mono text-sm"
                                placeholder="sk_..."
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 flex items-center gap-2 animate-in fade-in">
                            <span>🚫 {error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !apiKey}
                        className="w-full bg-brand hover:bg-brand-hover text-white font-medium py-3 px-4 rounded-xl transition-all shadow-lg shadow-brand/20 hover:shadow-brand/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Ingresar <ArrowRight className="w-4 h-4" /></>}
                    </button>
                </form>
            </div>

            <p className="text-center text-xs text-slate-400 mt-8">
                &copy; {new Date().getFullYear()} TenantBots System
            </p>
        </div>
    );
};
