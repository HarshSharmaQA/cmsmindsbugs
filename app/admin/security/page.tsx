"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Navbar } from "@/components/Navbar";
import { useState, useEffect } from "react";
import { ShieldAlert, ArrowLeft, Lock, Eye, Globe, UserCheck, ShieldCheck, Activity, AlertCircle } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function SecurityAuditPage() {
    const [devToken, setDevToken] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem("bugscribe_dev_token");
        if (stored) setDevToken(stored);
        setMounted(true);
    }, []);

    const userResult = useQuery(api.users.currentUser, { devToken: devToken || undefined });
    const securityStats = useQuery(
        api.admin.getSecurityStats,
        devToken ? { devToken } : "skip"
    );
    const isSuperAdmin = userResult?.role === "super_admin";

    if (!mounted) {
        return <div className="min-h-screen bg-[#0A0A0A]" />;
    }

    // Show loading skeleton while devToken is known but user data is still being fetched
    if (devToken && userResult === undefined) {
        return (
            <div className="min-h-screen relative">
                <div className="fixed inset-0 grid-bg pointer-events-none opacity-50" />
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 py-32 flex flex-col items-center gap-4">
                    <div className="skeleton w-16 h-16 rounded-full mb-4" />
                    <p className="text-slate-500 animate-pulse">Loading Security Audit...</p>
                </div>
            </div>
        );
    }

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

    const events = securityStats?.recentEvents ?? [];

    const statCards = [
        {
            label: "Active Sessions",
            value: securityStats === undefined ? "—" : String(securityStats?.activeSessions ?? 0),
            icon: UserCheck,
            color: "text-brand-400",
        },
        {
            label: "Active API Keys",
            value: securityStats === undefined ? "—" : String(securityStats?.totalApiKeys ?? 0),
            icon: Lock,
            color: "text-rose-400",
        },
        {
            label: "Total Users",
            value: securityStats === undefined ? "—" : String(securityStats?.totalUsers ?? 0),
            icon: Globe,
            color: "text-indigo-400",
        },
        {
            label: "Recent Events",
            value: securityStats === undefined ? "—" : String(events.length),
            icon: ShieldCheck,
            color: "text-emerald-400",
        },
    ];

    const eventColorMap: Record<string, string> = {
        "Bug Created": "bg-green-500",
        "Status Changed": "bg-brand-500",
        "Priority Changed": "bg-amber-500",
        "Assignee Changed": "bg-blue-500",
        "Comment Added": "bg-indigo-500",
        "Tags Changed": "bg-teal-500",
        "Asset Attached": "bg-orange-500",
    };

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

                {/* Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    {statCards.map((stat, i) => (
                        <div key={i} className="card p-4 flex flex-col items-center text-center animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                            <stat.icon className={`w-5 h-5 mb-2 ${stat.color}`} />
                            <div className="text-xl font-bold text-white">{stat.value}</div>
                            <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Activity Log Table */}
                <div className="card overflow-hidden ring-1 ring-white/5 shadow-2xl animate-fade-in">
                    <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                        <h2 className="text-sm font-bold text-white flex items-center gap-2">
                            <Eye className="w-4 h-4 text-rose-400" />
                            Recent Platform Activity
                        </h2>
                        <span className="text-[10px] text-slate-500">{events.length} events</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[#0D0D14] border-b border-white/5">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Event Type</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Actor</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Detail</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 bg-[#111118]/50 text-sm">
                                {securityStats === undefined ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i}>
                                            <td className="px-6 py-4"><div className="skeleton h-4 w-32" /></td>
                                            <td className="px-6 py-4"><div className="skeleton h-4 w-40" /></td>
                                            <td className="px-6 py-4"><div className="skeleton h-4 w-48" /></td>
                                            <td className="px-6 py-4"><div className="skeleton h-4 w-20 ml-auto" /></td>
                                        </tr>
                                    ))
                                ) : events.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-16 text-center">
                                            <AlertCircle className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                                            <p className="text-slate-500 text-sm">No activity events recorded yet.</p>
                                            <p className="text-slate-600 text-xs mt-1">Events will appear here as users interact with projects and bugs.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    events.map((event) => (
                                        <tr key={event.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${eventColorMap[event.event] ?? "bg-slate-500"}`} />
                                                    <span className="font-bold text-slate-200">{event.event}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-400 font-medium truncate max-w-[180px]">{event.user}</td>
                                            <td className="px-6 py-4 text-slate-500 text-xs truncate max-w-[220px]">{event.detail || "—"}</td>
                                            <td className="px-6 py-4 text-right text-slate-500 text-xs whitespace-nowrap">
                                                {formatDistanceToNow(event.time, { addSuffix: true })}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
