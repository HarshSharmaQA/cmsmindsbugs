"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { 
    LayoutList, Plus, Trash, Edit2, Save, X, 
    ArrowUp, ArrowDown, ChevronRight, Settings,
    MessageSquare, Book, Users, Info, HelpCircle,
    CheckCircle, AlertCircle, Clock
} from "lucide-react";
import Link from "next/link";

const ICON_OPTIONS = [
    { name: "MessageSquare", icon: <MessageSquare className="w-4 h-4" /> },
    { name: "Book", icon: <Book className="w-4 h-4" /> },
    { name: "Users", icon: <Users className="w-4 h-4" /> },
    { name: "Info", icon: <Info className="w-4 h-4" /> },
    { name: "HelpCircle", icon: <HelpCircle className="w-4 h-4" /> },
    { name: "CheckCircle", icon: <CheckCircle className="w-4 h-4" /> },
    { name: "AlertCircle", icon: <AlertCircle className="w-4 h-4" /> },
    { name: "Clock", icon: <Clock className="w-4 h-4" /> },
    { name: "LayoutList", icon: <LayoutList className="w-4 h-4" /> },
];

export default function AdminModulesPage() {
    const [devToken, setDevToken] = useState<string | null>(null);
    useEffect(() => {
        setDevToken(localStorage.getItem("bugscribe_dev_token"));
    }, []);

    const user = useQuery(api.users.currentUser, { devToken: devToken || undefined });
    const modules = useQuery(api.modules.listModules, { devToken: devToken || undefined });
    
    const addModule = useMutation(api.modules.addModule);
    const updateModule = useMutation(api.modules.updateModule);
    const deleteModule = useMutation(api.modules.deleteModule);

    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<Id<"dashboardModules"> | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        icon: "MessageSquare",
        description: "",
        order: 0,
        isWiki: false
    });

    if (user === undefined || modules === undefined) return <div className="p-8 text-center">Loading...</div>;
    if (user?.role !== "super_admin") return <div className="p-8 text-center text-red-500 font-bold">Unauthorized</div>;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateModule({
                    moduleId: editingId,
                    ...formData,
                    devToken: devToken || undefined
                });
                setEditingId(null);
            } else {
                await addModule({
                    ...formData,
                    order: modules.length,
                    devToken: devToken || undefined
                });
                setIsAdding(false);
            }
            setFormData({ name: "", slug: "", icon: "MessageSquare", description: "", order: 0, isWiki: false });
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleEdit = (mod: any) => {
        setEditingId(mod._id);
        setFormData({
            name: mod.name,
            slug: mod.slug,
            icon: mod.icon,
            description: mod.description || "",
            order: mod.order,
            isWiki: mod.isWiki || false
        });
        setIsAdding(false);
    };

    const handleDelete = async (id: Id<"dashboardModules">) => {
        if (!confirm("Are you sure? This will delete all entries in this module!")) return;
        await deleteModule({ moduleId: id, devToken: devToken || undefined });
    };

    const moveOrder = async (mod: any, direction: 'up' | 'down') => {
        const idx = modules.findIndex(m => m._id === mod._id);
        if (direction === 'up' && idx > 0) {
            const prev = modules[idx - 1];
            await updateModule({ moduleId: mod._id, order: prev.order, devToken: devToken || undefined });
            await updateModule({ moduleId: prev._id, order: mod.order, devToken: devToken || undefined });
        } else if (direction === 'down' && idx < modules.length - 1) {
            const next = modules[idx + 1];
            await updateModule({ moduleId: mod._id, order: next.order, devToken: devToken || undefined });
            await updateModule({ moduleId: next._id, order: mod.order, devToken: devToken || undefined });
        }
    };

    return (
        <div className="min-h-screen bg-[#0F172A] text-slate-200">
            <Navbar />
            <div className="max-w-5xl mx-auto px-4 py-12">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Dashboard Modules</h1>
                        <p className="text-slate-400">Manage custom tabs and sections for the project dashboard.</p>
                    </div>
                    <button 
                        onClick={() => { setIsAdding(true); setEditingId(null); setFormData({ name: "", slug: "", icon: "MessageSquare", description: "", order: 0, isWiki: false }); }}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Add Module
                    </button>
                </div>

                {/* Grid of existing modules */}
                <div className="grid gap-4 mb-12">
                    {modules.map((mod, idx) => (
                        <div key={mod._id} className="card p-4 flex items-center gap-4 group">
                            <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-400">
                                {ICON_OPTIONS.find(i => i.name === mod.icon)?.icon || <LayoutList className="w-5 h-5" />}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-white">{mod.name}</h3>
                                <p className="text-xs text-slate-500 font-mono">/{mod.slug} {mod.isWiki && "(Wiki Mode)"}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => moveOrder(mod, 'up')}
                                    disabled={idx === 0}
                                    className="p-1.5 hover:bg-slate-800 rounded disabled:opacity-30"
                                >
                                    <ArrowUp className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => moveOrder(mod, 'down')}
                                    disabled={idx === modules.length - 1}
                                    className="p-1.5 hover:bg-slate-800 rounded disabled:opacity-30"
                                >
                                    <ArrowDown className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => handleEdit(mod)}
                                    className="p-1.5 hover:bg-blue-500/10 hover:text-blue-400 rounded transition-colors"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => handleDelete(mod._id)}
                                    className="p-1.5 hover:bg-red-500/10 hover:text-red-400 rounded transition-colors"
                                >
                                    <Trash className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Edit/Add Modal Overlay */}
                {(isAdding || editingId) && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="relative w-full max-w-md bg-surface-card border border-surface-border rounded-xl shadow-2xl p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-white">
                                    {editingId ? "Edit Module" : "New Dashboard Module"}
                                </h3>
                                <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="text-slate-500 hover:text-white">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Module Name</label>
                                    <input 
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="input w-full"
                                        placeholder="e.g. Suggestions"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Slug (URL Path)</label>
                                    <input 
                                        value={formData.slug}
                                        onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                        className="input w-full font-mono"
                                        placeholder="e.g. suggestions"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Icon</label>
                                    <div className="grid grid-cols-5 gap-2">
                                        {ICON_OPTIONS.map(opt => (
                                            <button
                                                key={opt.name}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, icon: opt.name })}
                                                className={`p-2 rounded-lg border transition-all flex items-center justify-center ${
                                                    formData.icon === opt.name 
                                                    ? "bg-brand-500/20 border-brand-500 text-brand-400" 
                                                    : "bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600"
                                                }`}
                                            >
                                                {opt.icon}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Description</label>
                                    <textarea 
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="input w-full min-h-[80px]"
                                        placeholder="Optional module description..."
                                    />
                                </div>
                                <div className="flex items-center gap-2 py-2">
                                    <input 
                                        type="checkbox"
                                        id="isWiki"
                                        checked={formData.isWiki}
                                        onChange={e => setFormData({ ...formData, isWiki: e.target.checked })}
                                        className="rounded border-slate-700 bg-slate-800 text-brand-500"
                                    />
                                    <label htmlFor="isWiki" className="text-sm text-slate-400">
                                        Wiki Mode (Single detail page layout)
                                    </label>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button 
                                        type="button"
                                        onClick={() => { setIsAdding(false); setEditingId(null); }}
                                        className="btn-ghost flex-1"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        className="btn-primary flex-1"
                                    >
                                        {editingId ? "Save Changes" : "Create Module"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
