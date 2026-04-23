"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import {
    Plus, Bug, Globe, Key, Trash2, ArrowRight, X,
    Copy, Check, Search, Users, AlertTriangle, ChevronDown,
    BarChart3, Clock, Shield, ArrowLeft, LayoutList, CheckCircle2,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ToastContainer, useToast } from "@/components/ui/Toast";
import { LoginModal } from "@/components/LoginModal";

export const dynamic = "force-dynamic";

// ─── UserRow ──────────────────────────────────────────────────────────────────
function UserRow({
    user, currentUserEmail, onApprove, onRoleChange, onDelete,
}: {
    user: any;
    currentUserEmail: string;
    onApprove: () => Promise<void>;
    onRoleChange: (role: "user" | "super_admin") => Promise<void>;
    onDelete: () => Promise<void>;
}) {
    const [confirmDelete, setConfirmDelete] = useState(false);
    const isSelf = user.email === currentUserEmail;

    return (
        <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border transition-all gap-4 sm:gap-0 ${!user.isApproved ? "bg-orange-500/5 border-orange-500/20" : "bg-[#0d0d14] border-surface-border"}`}>
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: "rgba(0,212,255,0.12)", border: "1px solid rgba(0,212,255,0.2)", color: "#00D4FF" }}>
                    {(user.name || user.email || "U")[0].toUpperCase()}
                </div>
                <div>
                    <p className="text-sm font-semibold text-white">
                        {user.name || "Anonymous"}
                        {isSelf && <span className="ml-2 text-[10px] text-brand-400 font-medium">(you)</span>}
                    </p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                    <div className="flex gap-1.5 mt-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${user.role === "super_admin" ? "bg-brand-500/15 text-brand-300" : "bg-slate-500/15 text-slate-400"}`}>
                            {user.role === "super_admin" ? "Super Admin" : "User"}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${user.isApproved ? "bg-green-500/15 text-green-400" : "bg-orange-500/15 text-orange-400"}`}>
                            {user.isApproved ? "Approved" : "Pending"}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {!user.isApproved && (
                    <button onClick={onApprove} className="btn-primary py-1.5 px-3 text-xs">
                        <Check className="w-3 h-3" /> Approve
                    </button>
                )}
                {!isSelf && (
                    <select
                        className="input py-1.5 px-2 h-auto text-xs w-28"
                        value={user.role}
                        onChange={e => onRoleChange(e.target.value as "user" | "super_admin")}
                    >
                        <option value="user">User</option>
                        <option value="super_admin">Super Admin</option>
                    </select>
                )}
                {!isSelf && user.role !== "super_admin" && (
                    confirmDelete ? (
                        <div className="flex gap-1">
                            <button onClick={() => { onDelete(); setConfirmDelete(false); }}
                                className="text-[10px] text-red-100 px-2 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 transition-colors">
                                Confirm
                            </button>
                            <button onClick={() => setConfirmDelete(false)}
                                className="text-[10px] text-slate-400 px-2 py-1.5 rounded-lg bg-surface hover:bg-surface-hover transition-colors">
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => setConfirmDelete(true)}
                            className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    )
                )}
            </div>
        </div>
    );
}

/**
 * ProjectCard Component
 * 
 * Renders a high-level overview of a project with real-time bug statistics.
 * Uses glassmorphism and modern CSS transitions for a premium feel.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.project - The project data from Convex
 * @param {Function} props.onDelete - Callback for project deletion
 * @param {boolean} props.isSuperAdmin - Whether the current user has admin privileges
 * @param {string|null} props.devToken - Optional development token for authentication
 */
function ProjectCard({
    project, onDelete, isSuperAdmin, devToken,
}: {
    project: { _id: string; name: string; domain?: string; description?: string; apiKey: string; createdAt: number };
    onDelete: () => void;
    isSuperAdmin: boolean;
    devToken: string | null;
}) {
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [copied, setCopied] = useState(false);
    const bugCount = useQuery(api.bugs.getBugCount, { projectId: project._id as any, devToken: devToken || undefined });

    const copyKey = () => {
        navigator.clipboard.writeText(project.apiKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const age = Math.floor((Date.now() - project.createdAt) / 86400000);
    const ageLabel = age === 0 ? "Today" : age === 1 ? "Yesterday" : `${age}d ago`;

    return (
        <div className="group relative bg-[#11111a] border border-white/5 rounded-[24px] p-6 hover:border-brand-500/40 transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col min-h-[260px]">
            {/* Background Glow */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-brand-500/10 blur-[80px] rounded-full group-hover:bg-brand-500/20 transition-all duration-700" />
            
            {/* Delete button */}
            <div className="absolute top-4 right-4 z-10">
                {isSuperAdmin && (
                    !confirmDelete ? (
                        <button onClick={() => setConfirmDelete(true)}
                            className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all p-2 rounded-xl hover:bg-red-500/10">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    ) : (
                        <div className="flex gap-1 animate-in slide-in-from-right-2 duration-300">
                            <button onClick={onDelete} className="text-[10px] font-black uppercase tracking-widest text-white px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20">Delete</button>
                            <button onClick={() => setConfirmDelete(false)} className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10">×</button>
                        </div>
                    )
                )}
            </div>

            {/* Header */}
            <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500/20 to-brand-500/5 border border-brand-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                    <Bug className="w-7 h-7 text-brand-400" />
                </div>
                <div className="min-w-0 flex-1 pt-1">
                    <h3 className="font-black text-lg text-white truncate tracking-tight group-hover:text-brand-300 transition-colors">{project.name}</h3>
                    {project.domain ? (
                        <p className="text-slate-500 text-[11px] truncate flex items-center gap-1.5 mt-1 font-medium">
                            <Globe className="w-3 h-3 text-brand-500/50" />
                            {project.domain.replace(/^https?:\/\//, '')}
                        </p>
                    ) : (
                        <p className="text-slate-600 text-[11px] mt-1 font-black uppercase tracking-widest opacity-50">No domain linked</p>
                    )}
                </div>
            </div>

            {/* Description */}
            <div className="flex-1">
                {project.description ? (
                    <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 mb-6 font-medium italic opacity-80 group-hover:opacity-100 transition-opacity">
                        &ldquo;{project.description}&rdquo;
                    </p>
                ) : (
                    <div className="h-10 mb-6" />
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 flex flex-col gap-1 hover:bg-white/[0.05] transition-colors">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total</span>
                    <span className="text-sm font-black text-white">{bugCount?.total ?? "0"}</span>
                </div>
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 flex flex-col gap-1 hover:bg-white/[0.05] transition-colors">
                    <span className="text-[9px] font-black text-sky-500 uppercase tracking-widest">Open</span>
                    <span className="text-sm font-black text-sky-400">{bugCount?.open ?? "0"}</span>
                </div>
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 flex flex-col gap-1 hover:bg-white/[0.05] transition-colors">
                    <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">Critical</span>
                    <span className="text-sm font-black text-red-400">{bugCount?.critical ?? "0"}</span>
                </div>
            </div>

            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent mb-6" />

            {/* Footer */}
            <div className="flex items-center justify-between">
                <button 
                    onClick={copyKey} 
                    className="group/key flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.02] border border-white/5 text-[10px] font-mono text-slate-500 hover:text-brand-400 hover:border-brand-500/30 transition-all"
                    title="Copy API key"
                >
                    {copied ? <Check className="w-3 h-3 text-green-400" /> : <Key className="w-3 h-3 group-hover/key:rotate-12 transition-transform" />}
                    <span>{project.apiKey.slice(0, 8)}…</span>
                </button>
                
                <Link 
                    href={`/dashboard/${project._id}`} 
                    className="flex items-center gap-2 px-4 py-2 bg-brand-500/10 hover:bg-brand-500 text-brand-400 hover:text-white rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 shadow-lg shadow-brand-500/0 hover:shadow-brand-500/20 active:scale-95"
                >
                    Launch <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>
        </div>
    );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────
function DashboardPageContent() {
    const { toasts, toast, removeToast } = useToast();
    const [devToken, setDevToken] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [projName, setProjName] = useState("");
    const [projDomain, setProjDomain] = useState("");
    const [projDescription, setProjDescription] = useState("");
    const [creating, setCreating] = useState(false);
    const [newApiKey, setNewApiKey] = useState<string | null>(null);
    const [showUserManagement, setShowUserManagement] = useState(false);
    const [userSearch, setUserSearch] = useState("");
    const [userFilter, setUserFilter] = useState<"all" | "pending" | "approved">("all");

    const currentUser = useQuery(api.users.currentUser, { devToken: devToken || undefined });
    const projects = useQuery(api.projects.listProjects, { devToken: devToken || undefined });
    const allUsers = useQuery(api.users.listUsersForAdmin, { devToken: devToken || undefined });
    const isSuperAdmin = currentUser?.role === "super_admin";

    const approveUserMut = useMutation(api.users.approveUser);
    const setRoleMut = useMutation(api.users.setUserRole);
    const deleteUserMut = useMutation(api.users.deleteUser);
    const createProject = useMutation(api.projects.createProject);
    const deleteProject = useMutation(api.projects.deleteProject);

    useEffect(() => {
        const stored = localStorage.getItem("bugscribe_dev_token");
        if (stored) setDevToken(stored);
        setMounted(true);
    }, []);

    useEffect(() => {
        if (devToken && currentUser === null) {
            localStorage.removeItem("bugscribe_dev_token");
            setDevToken(null);
            setShowLoginModal(true);
        }
    }, [devToken, currentUser]);

    const filteredUsers = (allUsers ?? []).filter(u => {
        const matchSearch = !userSearch ||
            u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
            u.email.toLowerCase().includes(userSearch.toLowerCase());
        const matchFilter =
            userFilter === "all" ||
            (userFilter === "pending" && !u.isApproved) ||
            (userFilter === "approved" && u.isApproved);
        return matchSearch && matchFilter;
    });

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!projName.trim()) return;
        setCreating(true);
        try {
            const result = await createProject({
                name: projName.trim(),
                domain: projDomain.trim() || undefined,
                description: projDescription.trim() || undefined,
                devToken: devToken || undefined,
            });
            setNewApiKey(result.apiKey);
            setProjName(""); setProjDomain(""); setProjDescription("");
            setShowForm(false);
            toast.success("Project created successfully!");
        } catch (err: any) {
            toast.error(err.message || "Failed to create project.");
        } finally {
            setCreating(false);
        }
    };

    if (!mounted) return <div className="min-h-screen bg-[#0A0A0A]" />;

    // If not logged in, show a prompt
    if (!devToken || currentUser === null) {
        return (
            <div className="min-h-screen relative">
                <div className="fixed inset-0 grid-bg pointer-events-none opacity-50" />
                <Navbar />
                <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onSuccess={() => window.location.reload()} />
                <main className="max-w-3xl mx-auto px-4 pt-32 pb-20 text-center">
                    <div className="w-20 h-20 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-6" style={{ boxShadow: "0 0 40px rgba(0,212,255,0.1)" }}>
                        <Shield className="w-10 h-10 text-brand-400" />
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-4">Sign in to access your Dashboard</h1>
                    <p className="text-slate-400 mb-8">Manage your projects, track bugs, and collaborate with your team.</p>
                    <button onClick={() => setShowLoginModal(true)} className="btn-primary px-8 py-3 text-base mx-auto">
                        Sign In <ArrowRight className="w-4 h-4" />
                    </button>
                    <div className="mt-6">
                        <Link href="/" className="text-sm text-slate-500 hover:text-white transition-colors flex items-center justify-center gap-1">
                            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
                        </Link>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen relative">
            <div className="fixed inset-0 grid-bg pointer-events-none opacity-50" />
            <Navbar />
            <ToastContainer toasts={toasts} onRemove={removeToast} />

            <main className="flex-1 container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 relative z-10">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-[10px] font-black uppercase tracking-widest text-brand-400 animate-in fade-in slide-in-from-left-4 duration-700">
                            <Shield className="w-3 h-3" />
                            Enterprise Quality Control
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tight animate-in fade-in slide-in-from-left-6 duration-700 delay-100">
                            Project <span className="text-brand-500">Command</span>
                        </h1>
                        <p className="text-slate-500 max-w-md text-lg font-medium leading-relaxed animate-in fade-in slide-in-from-left-8 duration-700 delay-200">
                            Real-time quality signals and operational insights for your product delivery.
                        </p>
                    </div>

                    <div className="flex items-center gap-4 animate-in fade-in slide-in-from-right-6 duration-700 delay-300">
                        <div className="hidden sm:flex items-center gap-2 p-1 bg-white/5 rounded-2xl border border-white/10">
                            <button className="px-4 py-2 rounded-xl bg-brand-500 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-brand-500/20">Projects</button>
                            <button className="px-4 py-2 rounded-xl text-slate-500 hover:text-white text-xs font-black uppercase tracking-widest transition-colors">Activity</button>
                        </div>
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="btn-primary px-6 h-12 rounded-2xl flex items-center gap-3 shadow-[0_20px_40px_-10px_rgba(59,130,246,0.3)] hover:scale-105 active:scale-95 transition-all"
                        >
                            <Plus className="w-5 h-5" />
                            <span className="font-black uppercase tracking-widest text-xs">New Project</span>
                        </button>
                    </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-400">
                    {[
                        { label: "Active Projects", value: projects?.length || 0, icon: <LayoutList className="w-5 h-5" />, color: "text-brand-400", bg: "bg-brand-500/10" },
                        { label: "Total Issues", value: projects?.length || 0, icon: <Bug className="w-5 h-5" />, color: "text-sky-400", bg: "bg-sky-500/10" },
                        { label: "Resolved", value: "84%", icon: <CheckCircle2 className="w-5 h-5" />, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                        { label: "Avg. Resolution", value: "1.2d", icon: <Clock className="w-5 h-5" />, color: "text-amber-400", bg: "bg-amber-500/10" },
                    ].map((stat, i) => (
                        <div key={i} className="bg-[#11111a] border border-white/5 rounded-[28px] p-6 group hover:border-white/10 transition-all duration-500 relative overflow-hidden">
                            <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} blur-[60px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
                            <div className="relative z-10 flex items-center gap-5">
                                <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center ${stat.color} border border-white/5 group-hover:scale-110 transition-transform duration-500 shadow-inner`}>
                                    {stat.icon}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{stat.label}</span>
                                    <span className="text-2xl font-black text-white mt-0.5">{stat.value}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-sm font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-brand-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                        Live Projects
                    </h2>
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-brand-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Search projects..." 
                            className="bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-xs font-bold text-white outline-none focus:border-brand-500/50 transition-all w-64"
                        />
                    </div>
                </div>

                {/* Super Admin: User Management */}
                {isSuperAdmin && (
                    <div className="mb-8 flex gap-3 animate-slide-up">
                        <button
                            onClick={() => setShowUserManagement(!showUserManagement)}
                            className={`btn-ghost flex items-center gap-2 ${showUserManagement ? "bg-brand-500/10 border-brand-500/30 text-white" : ""}`}
                        >
                            <Users className="w-4 h-4" />
                            Manage Users
                            {(allUsers?.filter(u => !u.isApproved).length ?? 0) > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full bg-orange-500 text-black text-[10px] font-bold">
                                    {allUsers?.filter(u => !u.isApproved).length}
                                </span>
                            )}
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showUserManagement ? "rotate-180" : ""}`} />
                        </button>
                    </div>
                )}

                {isSuperAdmin && showUserManagement && (
                    <div className="card p-6 mb-12 animate-slide-up border-brand-500/20">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div>
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-brand-400" /> User Management
                                </h2>
                                <p className="text-xs text-slate-500 mt-1">{allUsers?.length ?? 0} total users</p>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold">
                                    <Check className="w-3 h-3" /> {allUsers?.filter(u => u.isApproved).length ?? 0} Approved
                                </span>
                                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold">
                                    <AlertTriangle className="w-3 h-3" /> {allUsers?.filter(u => !u.isApproved).length ?? 0} Pending
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 mb-5">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                                <input
                                    className="input pl-9 text-sm"
                                    placeholder="Search by name or email…"
                                    value={userSearch}
                                    onChange={e => setUserSearch(e.target.value)}
                                />
                            </div>
                            <div className="flex rounded-lg border border-surface-border overflow-hidden text-xs font-medium">
                                {(["all", "approved", "pending"] as const).map(f => (
                                    <button key={f} onClick={() => setUserFilter(f)}
                                        className={`px-3 py-2 capitalize transition-colors ${userFilter === f ? "bg-brand-500/20 text-brand-300" : "text-slate-400 hover:text-white"}`}>
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            {filteredUsers.length === 0 && <p className="text-slate-500 text-sm text-center py-8">No users match your search.</p>}
                            {filteredUsers.map(user => (
                                <UserRow
                                    key={user._id}
                                    user={user}
                                    currentUserEmail={currentUser?.email ?? ""}
                                    onApprove={async () => { await approveUserMut({ email: user.email, devToken: devToken || undefined }); toast.success(`${user.name || user.email} approved`); }}
                                    onRoleChange={async (role) => { await setRoleMut({ email: user.email, role, devToken: devToken || undefined }); toast.success("Role updated"); }}
                                    onDelete={async () => { await deleteUserMut({ email: user.email, devToken: devToken || undefined }); toast.success(`${user.name || user.email} removed`); }}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* New API Key Banner */}
                {newApiKey && (
                    <div className="card p-4 mb-6 border-brand-500/30 bg-brand-500/5 animate-slide-up">
                        <div className="flex items-start gap-3">
                            <Key className="w-5 h-5 text-brand-400 mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white">Project created! Here is your Widget API Key:</p>
                                <p className="text-xs text-slate-400 mt-1">Copy this now — it will not be shown again.</p>
                                <code className="mt-2 block bg-surface rounded-lg px-3 py-2 text-brand-300 text-xs font-mono break-all">{newApiKey}</code>
                            </div>
                            <button onClick={() => setNewApiKey(null)} className="text-slate-500 hover:text-slate-300 text-lg leading-none">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* New Project Form */}
                {showForm && (
                    <div className="card p-6 mb-8 animate-slide-up shadow-2xl ring-1 ring-brand-500/20">
                        <h2 className="font-semibold text-white mb-4">Create New Project</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-slate-400 font-medium block mb-1.5">Project Name *</label>
                                    <input className="input" placeholder="e.g. BugScribe Production" value={projName} onChange={e => setProjName(e.target.value)} required />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 font-medium block mb-1.5">Domain</label>
                                    <input className="input" placeholder="e.g. app.bugscribe.io" value={projDomain} onChange={e => setProjDomain(e.target.value)} />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 font-medium block mb-1.5">Description</label>
                                <input className="input" placeholder="Visual feedback for the main web application..." value={projDescription} onChange={e => setProjDescription(e.target.value)} />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="btn-primary" disabled={creating}>{creating ? "Creating..." : "Create Project"}</button>
                                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">Cancel</button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Projects Grid */}
                {projects === undefined ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-[280px] rounded-[32px] bg-white/[0.02] border border-white/5 animate-pulse" />
                        ))}
                    </div>
                ) : projects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-[#11111a] border border-dashed border-white/5 rounded-[48px] group">
                        <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-8 border border-white/5 group-hover:scale-110 transition-transform duration-700 shadow-inner">
                            <Bug className="w-10 h-10 text-brand-500 opacity-20" />
                        </div>
                        <h3 className="text-xl font-black text-white mb-3">No projects tracked yet</h3>
                        <p className="text-slate-500 max-w-xs text-center text-sm font-medium leading-relaxed mb-10">
                            Connect your first application to start capturing world-class quality insights.
                        </p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="btn-primary px-8 h-12 rounded-2xl flex items-center gap-3"
                        >
                            <Plus className="w-5 h-5" />
                            <span className="font-black uppercase tracking-widest text-xs">Create First Project</span>
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {projects.map((p: any) => (
                            <ProjectCard
                                key={p._id}
                                project={p}
                                isSuperAdmin={isSuperAdmin}
                                onDelete={async () => { await deleteProject({ projectId: p._id, devToken: devToken || undefined }); toast.success("Project deleted."); }}
                                devToken={devToken}
                            />
                        ))}
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}

export default function DashboardPage() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    if (!mounted) return <div className="min-h-screen bg-[#0A0A0A]" />;
    return <DashboardPageContent />;
}
