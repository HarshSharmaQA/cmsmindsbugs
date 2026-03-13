"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Navbar } from "@/components/Navbar";
import { useState, useEffect } from "react";
import { BarChart3, ArrowLeft, TrendingUp, Users, Clock, Bug, ShieldAlert, Activity, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

export default function AnalyticsPage() {
    const [devToken, setDevToken] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem("bugscribe_dev_token");
        if (stored) setDevToken(stored);
        setMounted(true);
    }, []);

    const userResult = useQuery(api.users.currentUser, { devToken: devToken || undefined });
    const analyticsStats = useQuery(
        api.admin.getAnalyticsStats,
        devToken ? { devToken } : "skip"
    );
    const isSuperAdmin = userResult?.role === "super_admin";

    if (!mounted) {
        return <div className="min-h-screen bg-[#0A0A0A]" />;
    }

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

    const isLoading = analyticsStats === undefined;

    const topStats = [
        {
            label: "Total Bugs Reported",
            value: isLoading ? "—" : String(analyticsStats?.totalBugs ?? 0),
            sub: isLoading ? "" : `${analyticsStats?.recentBugs ?? 0} in last 7 days`,
            icon: Bug,
            color: "text-rose-400",
            grow: analyticsStats && analyticsStats.recentBugs > 0 ? `+${analyticsStats.recentBugs} this week` : "No new bugs this week",
            growPositive: (analyticsStats?.recentBugs ?? 0) > 0,
        },
        {
            label: "Active Projects",
            value: isLoading ? "—" : String(analyticsStats?.totalProjects ?? 0),
            sub: "Projects with widget deployed",
            icon: Activity,
            color: "text-blue-400",
            grow: isLoading ? "" : `${analyticsStats?.totalUsers ?? 0} users total`,
            growPositive: true,
        },
        {
            label: "Avg. Resolution Time",
            value: isLoading ? "—" : analyticsStats?.avgResolutionHours === 0
                ? "N/A"
                : `${analyticsStats?.avgResolutionHours}h`,
            sub: "For resolved & closed bugs",
            icon: Clock,
            color: "text-indigo-400",
            grow: analyticsStats?.avgResolutionHours === 0 ? "No resolved bugs yet" : "Across all resolved bugs",
            growPositive: false,
        },
    ];

    const priorityBars = analyticsStats ? [
        { label: "Critical", count: analyticsStats.byPriority.critical, color: "bg-red-500", textColor: "text-red-400" },
        { label: "High", count: analyticsStats.byPriority.high, color: "bg-amber-500", textColor: "text-amber-400" },
        { label: "Medium", count: analyticsStats.byPriority.medium, color: "bg-blue-500", textColor: "text-blue-400" },
        { label: "Low", count: analyticsStats.byPriority.low, color: "bg-emerald-500", textColor: "text-emerald-400" },
    ] : [];

    const statusBars = analyticsStats ? [
        { label: "Open", count: analyticsStats.byStatus.open, color: "bg-sky-500", icon: AlertCircle },
        { label: "In Progress", count: analyticsStats.byStatus.in_progress, color: "bg-brand-500", icon: Activity },
        { label: "Resolved", count: analyticsStats.byStatus.resolved, color: "bg-green-500", icon: CheckCircle2 },
        { label: "Closed", count: analyticsStats.byStatus.closed, color: "bg-slate-500", icon: XCircle },
    ] : [];

    const maxPriority = Math.max(...priorityBars.map((b) => b.count), 1);
    const maxStatus = Math.max(...statusBars.map((b) => b.count), 1);

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
                        </h1>
                        <p className="text-slate-400 mt-1">Live insights derived from real platform data.</p>
                    </div>
                </div>

                {/* Top Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    {topStats.map((stat, i) => (
                        <div key={i} className="card p-6 border-white/5 bg-[#111118]/50 animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-2 rounded-lg bg-white/5 ${stat.color}`}>
                                    <stat.icon className="w-5 h-5" />
                                </div>
                                <span className={`text-[10px] font-bold ${stat.growPositive ? "text-emerald-400" : "text-slate-500"}`}>
                                    {stat.grow}
                                </span>
                            </div>
                            <div className="text-3xl font-bold text-white mb-1 tracking-tight">
                                {isLoading ? <div className="skeleton h-8 w-20" /> : stat.value}
                            </div>
                            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">{stat.label}</div>
                            {stat.sub && <div className="text-[10px] text-slate-600 mt-1">{stat.sub}</div>}
                        </div>
                    ))}
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
                    {/* Bugs by Priority */}
                    <div className="card p-6 bg-[#111118]/50 border-white/5">
                        <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                            <Bug className="w-4 h-4 text-rose-400" />
                            Bugs by Priority
                        </h3>
                        {isLoading ? (
                            <div className="space-y-4">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="space-y-1">
                                        <div className="skeleton h-3 w-16" />
                                        <div className="skeleton h-4 w-full" />
                                    </div>
                                ))}
                            </div>
                        ) : analyticsStats?.totalBugs === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <Bug className="w-10 h-10 text-slate-800 mb-3" />
                                <p className="text-slate-500 text-sm">No bugs reported yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {priorityBars.map((bar) => (
                                    <div key={bar.label}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className={`text-xs font-bold ${bar.textColor}`}>{bar.label}</span>
                                            <span className="text-xs text-slate-400 font-mono">{bar.count}</span>
                                        </div>
                                        <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden">
                                            <div
                                                className={`h-2.5 rounded-full ${bar.color} transition-all duration-700`}
                                                style={{ width: `${(bar.count / maxPriority) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Bugs by Status */}
                    <div className="card p-6 bg-[#111118]/50 border-white/5">
                        <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-brand-400" />
                            Bugs by Status
                        </h3>
                        {isLoading ? (
                            <div className="space-y-4">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="space-y-1">
                                        <div className="skeleton h-3 w-16" />
                                        <div className="skeleton h-4 w-full" />
                                    </div>
                                ))}
                            </div>
                        ) : analyticsStats?.totalBugs === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <Activity className="w-10 h-10 text-slate-800 mb-3" />
                                <p className="text-slate-500 text-sm">No bugs to display.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {statusBars.map((bar) => (
                                    <div key={bar.label}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-1.5">
                                                <bar.icon className="w-3.5 h-3.5 text-slate-400" />
                                                <span className="text-xs font-bold text-slate-300">{bar.label}</span>
                                            </div>
                                            <span className="text-xs text-slate-400 font-mono">{bar.count}</span>
                                        </div>
                                        <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden">
                                            <div
                                                className={`h-2.5 rounded-full ${bar.color} transition-all duration-700`}
                                                style={{ width: `${(bar.count / maxStatus) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Platform Summary */}
                <div className="card p-6 bg-[#111118]/50 border-white/5 animate-fade-in">
                    <h3 className="text-sm font-bold text-white mb-5 flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-400" />
                        Platform Summary
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: "Total Users", value: isLoading ? "—" : String(analyticsStats?.totalUsers ?? 0), color: "text-brand-400" },
                            { label: "Total Projects", value: isLoading ? "—" : String(analyticsStats?.totalProjects ?? 0), color: "text-amber-400" },
                            { label: "Total Activities", value: isLoading ? "—" : String(analyticsStats?.totalActivities ?? 0), color: "text-blue-400" },
                            { label: "Total Bugs", value: isLoading ? "—" : String(analyticsStats?.totalBugs ?? 0), color: "text-rose-400" },
                        ].map((item, i) => (
                            <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                                <div className={`text-2xl font-bold ${item.color} mb-1`}>{item.value}</div>
                                <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{item.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
