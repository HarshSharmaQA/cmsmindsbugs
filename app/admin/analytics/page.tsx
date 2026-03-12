"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Navbar } from "@/components/Navbar";
import { useState, useEffect } from "react";
import { BarChart3, ArrowLeft, TrendingUp, Users, Clock, MousePointer2, AlertCircle, ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function AnalyticsPage() {
    const [devToken, setDevToken] = useState<string | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem("bugscribe_dev_token");
        if (stored) setDevToken(stored);
    }, []);

    const userResult = useQuery(api.users.currentUser, { devToken: devToken || undefined });
    const isSuperAdmin = userResult?.role === "super_admin";
    
    if (!devToken || !isSuperAdmin) {
        return (
            <div className="min-h-screen relative">
                <div className="fixed inset-0 grid-bg pointer-events-none opacity-50" />
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 py-32 text-center">
                    <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">Unauthorized</h1>
                    <p className="text-slate-400 mb-8">You do not have permission to view system analytics.</p>
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
                            <BarChart3 className="w-8 h-8 text-blue-400" />
                            System Analytics
                            <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full uppercase tracking-tighter">PRO Active</span>
                        </h1>
                        <p className="text-slate-400 mt-1">Deep insights into how your platform is being used.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    {[
                        { label: "Total Page Views", value: "24,892", grow: "+12.5%", icon: TrendingUp, color: "text-emerald-400" },
                        { label: "Active Widgets", value: "156", grow: "+4.2%", icon: MousePointer2, color: "text-blue-400" },
                        { label: "Avg. Resolution Time", value: "4.2h", grow: "-18%", icon: Clock, color: "text-indigo-400" },
                    ].map((stat, i) => (
                        <div key={i} className="card p-6 border-white/5 bg-[#111118]/50 animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-2 rounded-lg bg-white/5 ${stat.color}`}>
                                    <stat.icon className="w-5 h-5" />
                                </div>
                                <span className={`text-[10px] font-bold ${stat.grow.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {stat.grow}
                                </span>
                            </div>
                            <div className="text-3xl font-bold text-white mb-1 tracking-tight">{stat.value}</div>
                            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">{stat.label}</div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="card p-8 bg-[#111118]/50 border-white/5 min-h-[400px] flex flex-col items-center justify-center text-center">
                        <TrendingUp className="w-12 h-12 text-slate-800 mb-4" />
                        <h3 className="text-lg font-bold text-white mb-2">Usage Trends</h3>
                        <p className="text-sm text-slate-500 max-w-xs">Chart integration coming soon. Visualizing daily active users and bug reporting frequency.</p>
                    </div>
                    <div className="card p-8 bg-[#111118]/50 border-white/5 min-h-[400px] flex flex-col items-center justify-center text-center">
                        <Users className="w-12 h-12 text-slate-800 mb-4" />
                        <h3 className="text-lg font-bold text-white mb-2">User Acquisition</h3>
                        <p className="text-sm text-slate-500 max-w-xs">Heatmap of where your users are logging in from across the globe.</p>
                    </div>
                </div>

                {/* PRO Features Alert */}
                <div className="mt-10 p-6 rounded-2xl bg-gradient-to-r from-blue-600/10 to-indigo-600/10 border border-blue-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4 text-center md:text-left">
                        <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-white font-bold">You&apos;re on the Pro Plan</h4>
                            <p className="text-slate-400 text-sm">Advanced cohort analysis and exportable reporting are included in your subscription.</p>
                        </div>
                    </div>
                    <button className="btn-primary whitespace-nowrap px-8">Refresh Data</button>
                </div>
            </main>
        </div>
    );
}
