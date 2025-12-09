import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';

interface Command {
    id: string;
    trigger: string;
    matchType: string;
    frequency: string;
    steps: any[];
}

export const CommandManager = ({ sessionId, apiKey }: { sessionId: string, apiKey: string }) => {
    const [commands, setCommands] = useState<Command[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingCmd, setEditingCmd] = useState<Command | null>(null); // If null, list mode. If set, edit mode.
    const [isNew, setIsNew] = useState(false);

    useEffect(() => {
        fetchCommands();
    }, [sessionId]);

    const fetchCommands = async () => {
        setLoading(true);
        try {
            const data = await api.get(`/sessions/${sessionId}/commands`, apiKey);
            setCommands(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Eliminar comando?')) return;
        await api.delete(`/commands/${id}`, apiKey);
        fetchCommands();
    };

    const handleSave = async (cmd: any) => {
        try {
            if (isNew) {
                await api.post(`/sessions/${sessionId}/commands`, apiKey, cmd);
            } else {
                await api.put(`/commands/${cmd.id}`, apiKey, cmd);
            }
            setEditingCmd(null);
            fetchCommands();
        } catch (e) {
            alert('Error guardando');
        }
    };

    if (loading) return <div>Cargando comandos...</div>;

    if (editingCmd) {
        return <CommandEditor
            command={editingCmd}
            onSave={handleSave}
            onCancel={() => setEditingCmd(null)}
        />;
    }

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">Comandos del Bot</h2>
                <button
                    onClick={() => { setIsNew(true); setEditingCmd({ id: '', trigger: '', matchType: 'CONTAINS', frequency: 'ALWAYS', steps: [] }); }}
                    className="bg-brand text-white px-3 py-1.5 rounded flex items-center gap-2 text-sm"
                >
                    <Plus size={16} /> Nuevo Comando
                </button>
            </div>

            <div className="space-y-3">
                {commands.map(cmd => (
                    <div key={cmd.id} className="border p-4 rounded-lg flex justify-between items-center hover:bg-slate-50">
                        <div>
                            <div className="font-bold text-slate-800">{cmd.trigger}</div>
                            <div className="text-xs text-slate-500 mt-1 flex gap-2">
                                <span className="bg-slate-200 px-1.5 py-0.5 rounded">{cmd.matchType}</span>
                                <span className="bg-slate-200 px-1.5 py-0.5 rounded">{cmd.frequency}</span>
                                <span>{cmd.steps.length} pasos</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => { setIsNew(false); setEditingCmd(cmd); }} className="text-blue-500 hover:bg-blue-50 p-2 rounded"><Edit2 size={16} /></button>
                            <button onClick={() => handleDelete(cmd.id)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={16} /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const CommandEditor = ({ command, onSave, onCancel }: any) => {
    const [formData, setFormData] = useState({ ...command });

    const addStep = (type: string) => {
        setFormData({
            ...formData,
            steps: [...formData.steps, { type, content: '', options: {}, order: formData.steps.length + 1 }]
        });
    };

    const updateStep = (index: number, field: string, value: any) => {
        const newSteps = [...formData.steps];
        newSteps[index] = { ...newSteps[index], [field]: value };
        setFormData({ ...formData, steps: newSteps });
    };

    const removeStep = (index: number) => {
        const newSteps = formData.steps.filter((_: any, i: number) => i !== index);
        setFormData({ ...formData, steps: newSteps });
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between mb-4 border-b pb-2">
                <h3 className="font-bold">Editar Comando</h3>
                <button onClick={onCancel}><X size={20} /></button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-xs text-slate-500">Trigger</label>
                    <input className="w-full border rounded p-2" value={formData.trigger} onChange={e => setFormData({ ...formData, trigger: e.target.value })} />
                </div>
                <div>
                    <label className="block text-xs text-slate-500">Match Type</label>
                    <select className="w-full border rounded p-2" value={formData.matchType} onChange={e => setFormData({ ...formData, matchType: e.target.value })}>
                        <option value="CONTAINS">Contiene</option>
                        <option value="EXACT">Exacto</option>
                        <option value="STARTS_WITH">Empieza con</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs text-slate-500">Frequency</label>
                    <select className="w-full border rounded p-2" value={formData.frequency} onChange={e => setFormData({ ...formData, frequency: e.target.value })}>
                        <option value="ALWAYS">Siempre</option>
                        <option value="ONCE">Una vez por usuario</option>
                    </select>
                </div>
            </div>

            <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-semibold">Pasos de Respuesta</label>
                    <div className="flex gap-1">
                        <button type='button' onClick={() => addStep('TEXT')} className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200">+ Texto</button>
                        <button type='button' onClick={() => addStep('IMAGE')} className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200">+ Imagen</button>
                        <button type='button' onClick={() => addStep('AUDIO')} className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200">+ Audio</button>
                        <button type='button' onClick={() => addStep('DELAY')} className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200">+ Delay</button>
                    </div>
                </div>
                <div className="space-y-2 bg-slate-50 p-4 rounded min-h-[100px]">
                    {formData.steps.map((step: any, i: number) => (
                        <div key={i} className="flex gap-2 items-start bg-white p-2 border rounded">
                            <div className="text-xs font-bold w-12 pt-2">{step.type}</div>
                            <div className="flex-1">
                                {step.type === 'DELAY' ? (
                                    <input type="number" placeholder="MS (ej. 1000)" className="w-full border rounded p-1 text-sm" value={step.content} onChange={(e) => updateStep(i, 'content', e.target.value)} />
                                ) : (
                                    <textarea placeholder={step.type === 'TEXT' ? 'Mensaje...' : 'URL...'} className="w-full border rounded p-1 text-sm" rows={2} value={step.content} onChange={(e) => updateStep(i, 'content', e.target.value)} />
                                )}
                            </div>
                            <button onClick={() => removeStep(i)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-end gap-2">
                <button onClick={onCancel} className="px-4 py-2 text-slate-600">Cancelar</button>
                <button onClick={() => onSave(formData)} className="px-4 py-2 bg-brand text-white rounded flex items-center gap-2"><Save size={16} /> Guardar</button>
            </div>
        </div>
    );
};
