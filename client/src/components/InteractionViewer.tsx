import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';

export const InteractionViewer = ({ sessionId, apiKey }: { sessionId: string, apiKey: string }) => {
    const [stats, setStats] = useState<any>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [sessionId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [statsData, logsData] = await Promise.all([
                api.get(`/sessions/${sessionId}/stats`, apiKey),
                api.get(`/sessions/${sessionId}/interactions`, apiKey)
            ]);
            setStats(statsData);
            setLogs(logsData);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Cargando estadísticas...</div>;

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="text-slate-500 text-sm">Total Interacciones</div>
                    <div className="text-3xl font-bold text-brand">{stats?.totalInteractions}</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="text-slate-500 text-sm">Usuarios Únicos</div>
                    <div className="text-3xl font-bold text-purple-500">{stats?.uniqueUsers}</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="text-slate-500 text-sm">Comando Más Usado</div>
                    <div className="text-xl font-bold text-emerald-500">
                        {stats?.breakdown?.[0]?.command || '-'}
                    </div>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b">
                    <h3 className="font-bold text-slate-700">Historial Reciente</h3>
                </div>
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase">
                        <tr>
                            <th className="px-6 py-3">Usuario</th>
                            <th className="px-6 py-3">Comando</th>
                            <th className="px-6 py-3">Fecha</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map((log: any) => (
                            <tr key={log.id} className="border-b hover:bg-slate-50">
                                <td className="px-6 py-3 font-medium">{log.userJid.split('@')[0]}</td>
                                <td className="px-6 py-3">
                                    <span className="bg-slate-100 px-2 py-1 rounded text-slate-600">{log.command}</span>
                                </td>
                                <td className="px-6 py-3 text-slate-400">
                                    {new Date(log.createdAt).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
