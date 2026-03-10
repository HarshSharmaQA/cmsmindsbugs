"use client";

export const dynamic = 'force-dynamic';

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Navbar } from "@/components/Navbar";
import { useState, useEffect } from "react";
import { Users, Layout, Bug, ShieldAlert, BarChart3, Clock, ArrowLeft, Key } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function AdminDashboard() {
    const [devToken, setDevToken] = useState<string | null>(null);
    const [pageMounted, setPageMounted] = useState(false);

    useEffect(() => {
        setPageMounted(true);
        const stored = localStorage.getItem("bugscribe_dev_token");
        if (stored) setDevToken(stored);
    }, []);

    const stats = useQuery(api.admin.getStats, { devToken: devToken || undefined });
    const userResult = useQuery(api.users.currentUser, { devToken: devToken || undefined });
    const setPasswordMutation = useMutation(api.users.setUserPassword);

    const isSuperAdmin = userResult?.role === "super_admin";

    // Set Password Modal State
    const [selectedUserForPassword, setSelectedUserForPassword] = useState<{ email: string, name: string } | null>(null);
    const [newPassword, setNewPassword] = useState("");
    const [settingPassword, setSettingPassword] = useState(false);

    const handleSetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUserForPassword || !newPassword.trim()) return;

        setSettingPassword(true);
        try {
            await setPasswordMutation({
                email: selectedUserForPassword.email,
                password: newPassword,
                devToken: devToken || undefined,
            });
            alert("Password updated successfully!");
            setSelectedUserForPassword(null);
            setNewPassword("");
        } catch (error: any) {
            console.error(error);
            alert(error.message || "Failed to set password");
        } finally {
            setSettingPassword(false);
        }
    };

    if (!pageMounted) return null;

    if (stats === undefined) {
        return (
            <div className="min-h-screen bg-surface">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 py-24 flex flex-col items-center">
                    <div className="skeleton w-16 h-16 rounded-full mb-4" />
                    <p className="text-slate-500 animate-pulse">Loading Admin Console...</p>
                </div>
            </div>
        );
    }

    if (!devToken || !isSuperAdmin) {
        return (
            <div className="min-h-screen bg-surface">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 py-24 text-center">
                    <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">Unauthorized Access</h1>
                    <p className="text-slate-400 mb-8">This area is reserved for Super Administrators. Please log in with an authorized email.</p>
                    <Link href="/" className="btn-primary inline-flex">Return Home</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface text-slate-200">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 py-10">
                {/* Header */}
                <div className="mb-10 flex items-center justify-between">
                    <div className="animate-slide-up">
                        <div className="flex items-center gap-2 text-brand-400 text-xs font-bold uppercase tracking-widest mb-2">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            System Administration
                        </div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Super Admin Dashboard</h1>
                        <p className="text-slate-400 mt-1">Platform-wide overview and system health.</p>
                    </div>
                    <Link href="/" className="btn-ghost flex items-center gap-2">
                        <ArrowLeft className="w-4 h-4" /> Back to My Projects
                    </Link>
                </div>

                {/* Stat Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 animate-fade-in">
                    <div className="card p-6 border-l-4 border-l-brand-500 shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400">
                                <Users className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-medium text-slate-500 py-1 px-2 bg-slate-800 rounded">Total Users</span>
                        </div>
                        <div className="text-4xl font-bold text-white">{stats?.totalUsers || 0}</div>
                        <p className="text-xs text-slate-500 mt-2 italic">Active across all projects</p>
                    </div>

                    <div className="card p-6 border-l-4 border-l-amber-500 shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                                <Layout className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-medium text-slate-500 py-1 px-2 bg-slate-800 rounded">Total Projects</span>
                        </div>
                        <div className="text-4xl font-bold text-white">{stats?.totalProjects || 0}</div>
                        <p className="text-xs text-slate-500 mt-2 italic">Created by platform users</p>
                    </div>

                    <div className="card p-6 border-l-4 border-l-red-500 shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
                                <Bug className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-medium text-slate-500 py-1 px-2 bg-slate-800 rounded">Total Bugs</span>
                        </div>
                        <div className="text-4xl font-bold text-white">{stats?.totalBugs || 0}</div>
                        <p className="text-xs text-slate-500 mt-2 italic">Issues reported via widget</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-slide-up">
                    {/* Recent Users */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <Clock className="w-4 h-4 text-brand-400" />
                            <h2 className="text-lg font-bold text-white">Newest Users</h2>
                        </div>
                        <div className="card overflow-hidden ring-1 ring-surface-border">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-900/50 border-b border-surface-border">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">User</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Role</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-surface-border/50">
                                    {stats?.recentUsers.map((user: { _id: string, name?: string, email: string, role: string }) => (
                                        <tr key={user._id} className="hover:bg-slate-800/20 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-white">{user.name || "Anonymous User"}</div>
                                                <div className="text-xs text-slate-500">{user.email}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ${user.role === 'super_admin' ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'
                                                    }`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => setSelectedUserForPassword({ email: user.email, name: user.name || "Anonymous User" })}
                                                    className="btn-ghost px-2 py-1 text-[10px] inline-flex items-center gap-1"
                                                >
                                                    <Key className="w-3 h-3" />
                                                    Set Password
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Recent Projects */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <BarChart3 className="w-4 h-4 text-amber-400" />
                            <h2 className="text-lg font-bold text-white">Recent Projects</h2>
                        </div>
                        <div className="card overflow-hidden ring-1 ring-surface-border">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-900/50 border-b border-surface-border">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Project Name</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Created</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-surface-border/50">
                                    {stats?.recentProjects.map((project: { _id: string, name: string, domain?: string, createdAt: number }) => (
                                        <tr key={project._id} className="hover:bg-slate-800/20 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-white">{project.name}</div>
                                                <div className="text-xs text-slate-500 truncate max-w-[200px]">{project.domain || "No domain"}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right text-xs text-slate-400 whitespace-nowrap">
                                                {formatDistanceToNow(project.createdAt, { addSuffix: true })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>

            {/* Set Password Modal */}
            {selectedUserForPassword && (
                <div className="relative z-[100]">
                    <div className="fixed inset-0 bg-black/60 z-[100] animate-fade-in" onClick={() => setSelectedUserForPassword(null)} />
                    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] max-w-[95vw] bg-[#1a1d27] border border-[#2a2d3e] rounded-xl z-[101] animate-slide-up shadow-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-semibold text-white text-lg">Set Password</h3>
                            <button onClick={() => setSelectedUserForPassword(null)} className="text-slate-500 hover:text-white transition-colors text-lg leading-none">
                                ×
                            </button>
                        </div>
                        <p className="text-xs text-slate-400 mb-4">
                            Give <strong className="text-slate-200">{selectedUserForPassword.name}</strong> ({selectedUserForPassword.email}) a password to log in.
                        </p>
                        <form onSubmit={handleSetPassword} className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-400 font-medium block mb-1.5">New Password</label>
                                <input
                                    className="input w-full text-sm"
                                    type="password"
                                    placeholder="••••••••"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-3 justify-end pt-4">
                                <button type="button" onClick={() => setSelectedUserForPassword(null)} className="btn-ghost">
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={settingPassword}>
                                    {settingPassword ? "Setting..." : "Save Password"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
