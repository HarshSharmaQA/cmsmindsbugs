"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Navbar } from "@/components/Navbar";
import { useState, useEffect } from "react";
import { ShieldAlert, ArrowLeft, Lock, Eye, Globe, UserCheck, ShieldCheck, Activity } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function SecurityAuditPage() {
    const [devToken, setDevToken] = useState<string | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem("bugscribe_dev_token");
        if (stored) setDevToken(stored);
    }, []);

    const userResult = useQuery(api.users.currentUser, { devToken: devToken || undefined });
    const isSuperAdmin = userResult?.role === "super_admin";
    
    // Placeholder audit logs
    const auditLogs = [
        { id: 1, event: "Login Success", user: "harshsharmaqa@gmail.com", ip: "192.168.1.1", location: "Mumbai, IN", time: Date.now() - 1000*60*30 },
        { id: 2, event: "API Key Created", user: "admin@bugscribe.com", ip: "104.28.2.45", location: "Singapore, SG", time: Date.now() - 1000*60*120 },
        { id: 3, event: "Page Deleted", user: "harshsharmaqa@gmail.com", ip: "192.168.1.1", location: "Mumbai, IN", time: Date.now() - 1000*60*600 },
        { id: 4, event: "Role Changed", user: "system", ip: "internal", location: "Cloud", time: Date.now() - 1000*60*3600 },
    ];

    if (!devToken || !isSuperAdmin) {
        return (
            <div className="min-h-screen relative">
                <div className="fixed inset-0 grid-bg pointer-events-none opacity-50" />
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 py-32 text-center">
                    <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">Unauthorized</h1>
                    <p className="text-slate-400 mb-8">You do not have permission to access the Security Audit logs.</p>
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
                            <ShieldCheck className="w-8 h-8 text-rose-400" />
                            Security Audit
                        </h1>
                        <p className="text-slate-400 mt-1">Real-time log of security events and access patterns.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 text-green-400 text-[10px] font-bold uppercase border border-green-500/20">
                            <Activity className="w-3 h-3 animate-pulse" /> Live Monitoring
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: "Active Sessions", value: "12", icon: UserCheck, color: "text-brand-400" },
                        { label: "Blocked IPs", value: "0", icon: Lock, color: "text-rose-400" },
                        { label: "API Requests", value: "1.2k", icon: Globe, color: "text-indigo-400" },
                        { label: "Security Score", value: "98/100", icon: ShieldCheck, color: "text-emerald-400" },
                    ].map((stat, i) => (
                        <div key={i} className="card p-4 flex flex-col items-center text-center animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                            <stat.icon className={`w-5 h-5 mb-2 ${stat.color}`} />
                            <div className="text-xl font-bold text-white">{stat.value}</div>
                            <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{stat.label}</div>
                        </div>
                    ))}
                </div>

                <div className="card overflow-hidden ring-1 ring-white/5 shadow-2xl animate-fade-in">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[#0D0D14] border-b border-white/5">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Event Type</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">User</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">IP Address</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 bg-[#111118]/50 text-sm">
                                {auditLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${log.event.includes('Success') ? 'bg-green-500' : log.event.includes('Deleted') ? 'bg-rose-500' : 'bg-brand-500'}`} />
                                                <span className="font-bold text-slate-200">{log.event}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-400 font-medium">{log.user}</td>
                                        <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                                            {log.ip} <span className="text-[10px] opacity-40">({log.location})</span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-500 text-xs">
                                            {format(log.time, "HH:mm:ss")}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
