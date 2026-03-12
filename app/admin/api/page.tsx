"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Navbar } from "@/components/Navbar";
import { useState, useEffect } from "react";
import { Key, Plus, Trash2, Copy, ShieldAlert, ArrowLeft, Terminal, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function APIGatewayPage() {
    const [devToken, setDevToken] = useState<string | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem("bugscribe_dev_token");
        if (stored) setDevToken(stored);
    }, []);

    const userResult = useQuery(api.users.currentUser, { devToken: devToken || undefined });
    const isSuperAdmin = userResult?.role === "super_admin";
    
    // Mocking API keys for now since we don't have a specific table for platform-wide keys yet
    const projects = useQuery(api.projects.listProjects, devToken ? { devToken } : "skip") || [];

    if (!devToken || !isSuperAdmin) {
        return (
            <div className="min-h-screen relative">
                <div className="fixed inset-0 grid-bg pointer-events-none opacity-50" />
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 py-32 text-center">
                    <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">Unauthorized</h1>
                    <p className="text-slate-400 mb-8">You do not have permission to access the API Gateway.</p>
                    <Link href="/" className="btn-primary inline-flex">Return Home</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative">
            <div className="fixed inset-0 grid-bg pointer-events-none opacity-50" />
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 pt-32 pb-20 relative">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                    <div className="animate-slide-up">
                        <Link href="/admin" className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mb-4">
                            <ArrowLeft className="w-3 h-3" /> Back to Dashboard
                        </Link>
                        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                            <Key className="w-8 h-8 text-indigo-400" />
                            API Gateway
                        </h1>
                        <p className="text-slate-400 mt-1">Manage platform-wide access tokens and project API keys.</p>
                    </div>

                    <button className="btn-primary h-10 flex items-center gap-2 px-6 shadow-xl animate-slide-up" style={{ animationDelay: "100ms" }}>
                        <Plus className="w-4 h-4" /> Create Global Key
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-6 animate-fade-in">
                    {/* Key Management Card */}
                    <div className="card p-6 border-white/5 bg-[#111118]/50 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                            <Terminal className="w-32 h-32" />
                        </div>
                        
                        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <RefreshCw className="w-4 h-4 text-brand-400" />
                            Active API Keys
                        </h2>

                        <div className="space-y-4">
                            {projects.map((project: any) => (
                                <div key={project._id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-brand-500/20 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                                            <Key className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">{project.name} Key</p>
                                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{project.apiKey.slice(0, 16)}••••••••••••••••</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => {
                                                navigator.clipboard.writeText(project.apiKey);
                                                alert("API Key copied!");
                                            }}
                                            className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-brand-400 transition-all"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                        <button className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-red-400 transition-all">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {projects.length === 0 && (
                                <p className="text-center py-10 text-slate-500 text-sm italic">No active API keys found.</p>
                            )}
                        </div>
                    </div>

                    {/* Quick Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="card p-6 bg-indigo-500/5 border-indigo-500/10">
                            <h3 className="text-sm font-bold text-indigo-400 mb-2 uppercase tracking-wider">Authentication Header</h3>
                            <div className="bg-[#09090E] p-4 rounded-lg font-mono text-xs text-slate-300 border border-white/5">
                                Authorization: Bearer &lt;YOUR_API_KEY&gt;
                            </div>
                        </div>
                        <div className="card p-6 bg-brand-500/5 border-brand-500/10">
                            <h3 className="text-sm font-bold text-brand-400 mb-2 uppercase tracking-wider">Usage Tip</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Use global keys for platform integrations, or project-specific keys for the BugScribe widget. Never share your secret keys in client-side code that isn&apos;t the widget.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
