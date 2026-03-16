"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Navbar } from "@/components/Navbar";
import { useState, useEffect } from "react";
import { Users, Search, Download, ShieldAlert, ArrowLeft, Mail, Calendar, Key, UserMinus } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function UserDirectoryPage() {
    const [devToken, setDevToken] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const stored = localStorage.getItem("bugscribe_dev_token");
        if (stored) setDevToken(stored);
    }, []);

    const userResult = useQuery(api.users.currentUser, { devToken: devToken || undefined });
    const isSuperAdmin = userResult?.role === "super_admin";
    const allUsers = useQuery(api.admin.getStats, { devToken: devToken || undefined })?.recentUsers || [];
    const deleteUser = useMutation(api.users.deleteUser);
    const setPassword = useMutation(api.users.setUserPassword);
    const toggleDeactivation = useMutation(api.users.toggleUserDeactivation);

    const filteredUsers = allUsers.filter((u: any) => 
        u.email.toLowerCase().includes(search.toLowerCase()) || 
        (u.name && u.name.toLowerCase().includes(search.toLowerCase()))
    );

    const handleDelete = async (email: string) => {
        if (!window.confirm(`Are you sure you want to permanently delete user ${email}? This action cannot be undone.`)) {
            return;
        }

        try {
            await deleteUser({ email, devToken: devToken || undefined });
            alert("User deleted successfully.");
        } catch (err: any) {
            alert(err.message || "Failed to delete user.");
        }
    };

    const handleToggleDeactivation = async (email: string, isCurrentlyDeactivated: boolean) => {
        const action = isCurrentlyDeactivated ? "reactivate" : "deactivate";
        if (!window.confirm(`Are you sure you want to ${action} user ${email}?`)) {
            return;
        }

        try {
            await toggleDeactivation({ email, deactivate: !isCurrentlyDeactivated, devToken: devToken || undefined });
            alert(`User ${action}d successfully.`);
        } catch (err: any) {
            alert(err.message || `Failed to ${action} user.`);
        }
    };

    const handleSetPassword = async (email: string) => {
        const newPassword = window.prompt(`Enter new password for ${email}:`);
        if (!newPassword) return;

        try {
            await setPassword({ email, password: newPassword, devToken: devToken || undefined });
            alert("Password updated successfully.");
        } catch (err: any) {
            alert(err.message || "Failed to update password.");
        }
    };

    const handleExport = () => {
        const headers = ["Name", "Email", "Role", "Created"];
        const rows = filteredUsers.map((u: any) => [
            u.name || "Anonymous",
            u.email,
            u.role,
            u._creationTime ? format(u._creationTime, "yyyy-MM-dd HH:mm:ss") : "N/A"
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `bugscribe_users_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!devToken || !isSuperAdmin) {
        return (
            <div className="min-h-screen relative">
                <div className="fixed inset-0 grid-bg pointer-events-none opacity-50" />
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 py-32 text-center">
                    <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">Unauthorized</h1>
                    <p className="text-slate-400 mb-8">You do not have permission to view the User Directory.</p>
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
                            <Users className="w-8 h-8 text-brand-400" />
                            User Directory
                        </h1>
                        <p className="text-slate-400 mt-1">Manage and export platform-wide user data.</p>
                    </div>

                    <div className="flex items-center gap-3 animate-slide-up" style={{ animationDelay: "100ms" }}>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input 
                                type="text"
                                placeholder="Search users..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="input pl-10 h-10 w-64"
                            />
                        </div>
                        <button 
                            onClick={handleExport}
                            className="btn-ghost h-10 flex items-center gap-2 px-4 shadow-lg active:scale-95"
                        >
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    </div>
                </div>

                <div className="card overflow-hidden ring-1 ring-white/5 shadow-2xl animate-fade-in">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[#0D0D14] border-b border-white/5">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">User Details</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Role</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Joined</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 bg-[#111118]/50">
                                {filteredUsers.map((user: any) => (
                                    <tr key={user._id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 font-bold">
                                                    {(user.name || user.email || "U")[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-white">{user.name || "Anonymous"}</div>
                                                    <div className="text-xs text-slate-500 flex items-center gap-1">
                                                        <Mail className="w-3 h-3" /> {user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
                                                user.role === 'super_admin' 
                                                ? 'bg-brand-500/10 text-brand-400 border-brand-500/30' 
                                                : 'bg-slate-800 text-slate-400 border-slate-700'
                                            } uppercase tracking-tighter`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="text-xs text-slate-400 flex items-center justify-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {user._creationTime ? format(user._creationTime, "MMM dd, yyyy") : "N/A"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {user.isDeactivated ? (
                                                <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-red-500/10 text-red-500 border border-red-500/20 uppercase">Deactivated</span>
                                            ) : (
                                                <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase">Active</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => handleToggleDeactivation(user.email, !!user.isDeactivated)}
                                                    className={`p-2 rounded-lg transition-all shadow-sm ${user.isDeactivated ? 'bg-emerald-500/5 text-emerald-400 hover:bg-emerald-400/10' : 'bg-amber-500/5 text-amber-400 hover:bg-amber-400/10'}`}
                                                    title={user.isDeactivated ? "Reactivate User" : "Deactivate User"}
                                                >
                                                    <ShieldAlert className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleSetPassword(user.email)}
                                                    className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-brand-400 hover:bg-brand-400/10 transition-all shadow-sm" 
                                                    title="Set New Password"
                                                >
                                                    <Key className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(user.email)}
                                                    className="p-2 rounded-lg bg-red-500/5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all shadow-sm" 
                                                    title="Permanently Delete User"
                                                >
                                                    <UserMinus className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filteredUsers.length === 0 && (
                        <div className="py-20 text-center">
                            <Users className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                            <p className="text-slate-500">No users found matching your search.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
