"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import {
    Plus, Bug, Globe, Key, Trash2, ArrowRight, Mail, User, MapPin,
    Pencil, Star, IndianRupee, X, ShoppingCart, EyeOff, Eye,
    Copy, Check, Search, Users, AlertTriangle, ChevronDown,
    BarChart3, Clock, Shield, LogOut,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { MapCarousel } from "@/components/ui/map-carousel";
import { ToastContainer, useToast } from "@/components/ui/Toast";
import { RenderBlock } from "@/app/[...slug]/page";
import { createDefaultHome } from "@/convex/pages";


export const dynamic = 'force-dynamic';

// ─── Home Page ────────────────────────────────────────────────────────────────

function HomePageContent() {
    const { toasts, toast, removeToast } = useToast();
    const [devToken, setDevToken] = useState<string | null>(null);
    const [email, setEmail] = useState("");
    const [emailToCheck, setEmailToCheck] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [loggingIn, setLoggingIn] = useState(false);

    const emailExists = useQuery(
        api.users.checkEmailExists,
        emailToCheck ? { email: emailToCheck } : "skip"
    );

    useEffect(() => {
        const stored = localStorage.getItem("bugscribe_dev_token");
        if (stored) setDevToken(stored);
    }, []);

    const [pendingApproval, setPendingApproval] = useState(false);

    const projects = useQuery(api.projects.listProjects, { devToken: devToken || undefined });
    const currentUser = useQuery(api.users.currentUser, { devToken: devToken || undefined });
    const homePage = useQuery(api.pages.getBySlug, { slug: "home" });

    useEffect(() => {
        // If we have a local token but the backend confirms this user doesn't exist (e.g. DB cleared), log out automatically.
        if (devToken && currentUser === null) {
            localStorage.removeItem("bugscribe_dev_token");
            setDevToken(null);
            window.location.reload();
        }
    }, [devToken, currentUser]);

    const isSuperAdmin = currentUser?.role === "super_admin";
    const loginMutation = useMutation(api.users.loginUser);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;
        setLoggingIn(true);
        try {
            const { token, isApproved } = await loginMutation({
                email: email.trim().toLowerCase(),
                name: name.trim() || undefined,
                password: password,
            });

            if (!isApproved) {
                setPendingApproval(true);
                setLoggingIn(false);
                return;
            }

            localStorage.setItem("bugscribe_dev_token", token);
            window.location.reload();
        } catch (error: any) {
            toast.error(error.message || "Login failed. Please try again.");
        } finally {
            setLoggingIn(false);
        }
    };

    const createProject = useMutation(api.projects.createProject);
    const deleteProject = useMutation(api.projects.deleteProject);

    const [showForm, setShowForm] = useState(false);
    const [projName, setProjName] = useState("");
    const [projDomain, setProjDomain] = useState("");
    const [projDescription, setProjDescription] = useState("");
    const [creating, setCreating] = useState(false);
    const [newApiKey, setNewApiKey] = useState<string | null>(null);
    const [showUserManagement, setShowUserManagement] = useState(false);
    const [userSearch, setUserSearch] = useState("");
    const [userFilter, setUserFilter] = useState<"all" | "pending" | "approved">("all");

    const allUsers = useQuery(api.users.listUsersForAdmin, { devToken: devToken || undefined });
    const approveUserMut = useMutation(api.users.approveUser);
    const setRoleMut = useMutation(api.users.setUserRole);
    const deleteUserMut = useMutation(api.users.deleteUser);

    // Derived states

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
            setProjName("");
            setProjDomain("");
            setProjDescription("");
            setShowForm(false);
            toast.success("Project created successfully!");
        } catch (err: any) {
            toast.error(err.message || "Failed to create project.");
        } finally {
            setCreating(false);
        }
    };



    return (
        <div className="min-h-screen">
            <Navbar />
            <ToastContainer toasts={toasts} onRemove={removeToast} />
            <main className="max-w-[1600px] mx-auto px-4 py-8">

                {/* ── Custom Landing Page via Blocks ── */}
                {!devToken && homePage && homePage.isPublished && (
                    <div className="-mx-4 mb-24">
                        {homePage.blocks.map((block: any) => (
                            <RenderBlock key={block.id} block={block} pageSlug="home" />
                        ))}
                    </div>
                )}

                {/* ── Login Form Section ── */}
                {!devToken && (
                    <div id="login-form" className={`max-w-md mx-auto animate-fade-in relative z-10 ${homePage?.isPublished ? "mt-12 pt-16 border-t border-surface-border" : "py-12"}`}>
                        <div className="text-center mb-10">
                            <div className="w-20 h-20 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-6 mx-auto">
                                <Bug className="w-10 h-10 text-brand-500" />
                            </div>
                            <h1 className="text-4xl font-bold text-white tracking-tight mb-4">
                                {homePage?.isPublished ? (
                                    <>Log In to <span className="text-gradient">Dashboard</span></>
                                ) : (
                                    <>Welcome to Bug<span className="text-gradient">Scribe</span></>
                                )}
                            </h1>
                            <p className="text-slate-400">
                                Enter your details to access the dashboard.
                                <br />(Convex Database Auth)
                            </p>
                        </div>

                        <div className="card p-8 border-surface-border">
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div>
                                    <label className="text-xs text-slate-400 font-medium block mb-1.5">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input
                                            type="email"
                                            className="input pl-10"
                                            placeholder="you@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            onBlur={() => setEmailToCheck(email.trim().toLowerCase())}
                                            required
                                        />
                                    </div>
                                </div>
                                {emailExists === false && (
                                    <div>
                                        <label className="text-xs text-slate-400 font-medium block mb-1.5">Your Name <span className="text-slate-600">(new account)</span></label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                            <input
                                                type="text"
                                                className="input pl-10"
                                                placeholder="Harsh"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                autoFocus
                                            />
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <label className="text-xs text-slate-400 font-medium block mb-1.5">Password *</label>
                                    <div className="relative">
                                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input
                                            type="password"
                                            className="input pl-10"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="btn-primary w-full justify-center h-11" disabled={loggingIn}>
                                    {loggingIn ? "Logging in..." : "Continue to Dashboard"}
                                </button>
                            </form>

                            {pendingApproval && (
                                <div className="mt-6 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-center animate-slide-up">
                                    <p className="text-orange-400 text-sm font-medium">Account Pending Approval</p>
                                    <p className="text-slate-500 text-[11px] mt-1">Please wait for a Super Admin to approve your access.</p>
                                </div>
                            )}

                            <p className="text-[10px] text-slate-500 text-center mt-6 uppercase tracking-widest font-semibold opacity-50">
                                Protected by Convex Native Session
                            </p>
                        </div>
                    </div>
                )}

                {/* Map section — visible to logged out visitors OR logged in super admins */}
                {/* Note: Map settings was extracted to /admin/locations */}

                {!devToken ? null : (
                    <div className="mt-12">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-8 animate-slide-up">
                            <div>
                                <h1 className="text-2xl font-bold text-white">Projects</h1>
                                <p className="text-slate-400 text-sm mt-1">
                                    Manage your tracked applications
                                </p>
                            </div>
                            <button onClick={() => setShowForm(!showForm)} className="btn-primary">
                                <Plus className="w-4 h-4" />
                                New Project
                            </button>
                        </div>

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
                                {/* Header */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                    <div>
                                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                            <Shield className="w-5 h-5 text-brand-400" />
                                            User Management
                                        </h2>
                                        <p className="text-xs text-slate-500 mt-1">{allUsers?.length ?? 0} total users</p>
                                    </div>
                                    {/* Stats pills */}
                                    <div className="flex gap-2 flex-wrap">
                                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold">
                                            <Check className="w-3 h-3" />
                                            {allUsers?.filter(u => u.isApproved).length ?? 0} Approved
                                        </span>
                                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold">
                                            <AlertTriangle className="w-3 h-3" />
                                            {allUsers?.filter(u => !u.isApproved).length ?? 0} Pending
                                        </span>
                                    </div>
                                </div>

                                {/* Search + Filter */}
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
                                            <button
                                                key={f}
                                                onClick={() => setUserFilter(f)}
                                                className={`px-3 py-2 capitalize transition-colors ${userFilter === f ? "bg-brand-500/20 text-brand-300" : "text-slate-400 hover:text-white"}`}
                                            >
                                                {f}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* User list */}
                                <div className="space-y-2">
                                    {filteredUsers.length === 0 && (
                                        <p className="text-slate-500 text-sm text-center py-8">No users match your search.</p>
                                    )}
                                    {filteredUsers.map(user => (
                                        <UserRow
                                            key={user._id}
                                            user={user}
                                            currentUserEmail={currentUser?.email ?? ""}
                                            onApprove={async () => {
                                                await approveUserMut({ email: user.email, devToken: devToken || undefined });
                                                toast.success(`${user.name || user.email} approved`);
                                            }}
                                            onRoleChange={async (role: "user" | "super_admin") => {
                                                await setRoleMut({ email: user.email, role, devToken: devToken || undefined });
                                                toast.success("Role updated");
                                            }}
                                            onDelete={async () => {
                                                await deleteUserMut({ email: user.email, devToken: devToken || undefined });
                                                toast.success(`${user.name || user.email} removed`);
                                            }}
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
                                        <code className="mt-2 block bg-surface rounded-lg px-3 py-2 text-brand-300 text-xs font-mono break-all">
                                            {newApiKey}
                                        </code>
                                    </div>
                                    <button onClick={() => setNewApiKey(null)} className="text-slate-500 hover:text-slate-300 text-lg leading-none">×</button>
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
                                            <input
                                                className="input"
                                                placeholder="e.g. BugScribe Production"
                                                value={projName}
                                                onChange={(e) => setProjName(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-400 font-medium block mb-1.5">Domain</label>
                                            <input
                                                className="input"
                                                placeholder="e.g. app.bugscribe.io"
                                                value={projDomain}
                                                onChange={(e) => setProjDomain(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 font-medium block mb-1.5">Description</label>
                                        <input
                                            className="input"
                                            placeholder="Visual feedback for the main web application..."
                                            value={projDescription}
                                            onChange={(e) => setProjDescription(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button type="submit" className="btn-primary" disabled={creating}>
                                            {creating ? "Creating..." : "Create Project"}
                                        </button>
                                        <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Projects Grid */}
                        {projects === undefined ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="card p-6 space-y-3">
                                        <div className="skeleton h-5 w-3/4" />
                                        <div className="skeleton h-4 w-1/2" />
                                        <div className="skeleton h-4 w-full" />
                                    </div>
                                ))}
                            </div>
                        ) : projects.length === 0 ? (
                            <div className="text-center py-24 animate-fade-in card border-dashed border-2 bg-transparent">
                                <div className="w-16 h-16 rounded-2xl bg-surface-card border border-surface-border flex items-center justify-center mx-auto mb-4">
                                    <Bug className="w-7 h-7 text-slate-500" />
                                </div>
                                <h3 className="text-white font-semibold text-lg">No projects active</h3>
                                <p className="text-slate-500 text-sm mt-2 mb-6 max-w-sm mx-auto">Create a project and install the snippet to start seeing visual bug reports.</p>
                                <button onClick={() => setShowForm(true)} className="btn-primary mx-auto">
                                    <Plus className="w-4 h-4" />
                                    Get Started
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {projects.map((project: any) => (
                                    <ProjectCard
                                        key={project._id}
                                        project={project}
                                        isSuperAdmin={isSuperAdmin}
                                        devToken={devToken}
                                        onDelete={() => deleteProject({
                                            projectId: project._id,
                                            devToken: devToken || undefined
                                        })}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

// ─── UserRow ─────────────────────────────────────────────────────────────────
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
        <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border transition-all gap-4 sm:gap-0 ${!user.isApproved ? "bg-orange-500/5 border-orange-500/20" : "bg-[#0d0d14] border-surface-border"
            }`}>
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.2)', color: '#00D4FF' }}>
                    {(user.name || user.email || "U")[0].toUpperCase()}
                </div>
                <div>
                    <p className="text-sm font-semibold text-white">
                        {user.name || "Anonymous"}
                        {isSelf && <span className="ml-2 text-[10px] text-brand-400 font-medium">(you)</span>}
                    </p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                    <div className="flex gap-1.5 mt-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${user.role === "super_admin" ? "bg-brand-500/15 text-brand-300" : "bg-slate-500/15 text-slate-400"
                            }`}>{user.role === "super_admin" ? "Super Admin" : "User"}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${user.isApproved ? "bg-green-500/15 text-green-400" : "bg-orange-500/15 text-orange-400"
                            }`}>{user.isApproved ? "Approved" : "Pending"}</span>
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

// ─── ProjectCard ─────────────────────────────────────────────────────────────
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
        <div className="card p-5 hover:border-brand-500/30 transition-all duration-200 group animate-fade-in relative overflow-hidden flex flex-col">
            {/* Delete button */}
            <div className="absolute top-3 right-3">
                {isSuperAdmin && (
                    !confirmDelete ? (
                        <button
                            onClick={() => setConfirmDelete(true)}
                            className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all p-1.5 rounded-lg hover:bg-red-500/10"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    ) : (
                        <div className="flex gap-1 animate-slide-up">
                            <button onClick={onDelete} className="text-[10px] text-red-100 px-2 py-1 rounded bg-red-600 hover:bg-red-700">Confirm</button>
                            <button onClick={() => setConfirmDelete(false)} className="text-[10px] text-slate-400 px-2 py-1 rounded bg-surface hover:bg-surface-hover">×</button>
                        </div>
                    )
                )}
            </div>

            {/* Header */}
            <div className="flex items-center gap-3 mb-3 pr-8">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0">
                    <Bug className="w-5 h-5 text-brand-400" />
                </div>
                <div className="min-w-0">
                    <h3 className="font-semibold text-white truncate">{project.name}</h3>
                    {project.domain && (
                        <p className="text-slate-500 text-[10px] truncate flex items-center gap-1 mt-0.5">
                            <Globe className="w-2.5 h-2.5 shrink-0" />{project.domain}
                        </p>
                    )}
                </div>
            </div>

            {project.description && (
                <p className="text-slate-400 text-xs mb-3 line-clamp-2">{project.description}</p>
            )}

            {/* Bug count pills */}
            <div className="flex items-center gap-2 mb-4">
                <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-surface text-slate-400 text-[11px] font-medium">
                    <BarChart3 className="w-3 h-3" />
                    {bugCount?.total ?? "—"} bugs
                </span>
                {(bugCount?.open ?? 0) > 0 && (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-sky-500/10 text-sky-400 text-[11px] font-semibold">
                        {bugCount?.open} open
                    </span>
                )}
                {(bugCount?.critical ?? 0) > 0 && (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/12 text-red-400 text-[11px] font-semibold">
                        <AlertTriangle className="w-2.5 h-2.5" />{bugCount?.critical} critical
                    </span>
                )}
            </div>

            <div className="divider mb-3" />

            {/* Footer */}
            <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center gap-2">
                    <button
                        onClick={copyKey}
                        className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 hover:text-brand-400 transition-colors group/copy"
                        title="Copy API key"
                    >
                        {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                        <span>{project.apiKey.slice(0, 10)}…</span>
                    </button>
                </div>
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-[10px] text-slate-600">
                        <Clock className="w-2.5 h-2.5" />{ageLabel}
                    </span>
                    <Link
                        href={`/dashboard/${project._id}`}
                        className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 font-semibold transition-colors"
                    >
                        Open <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function HomePage() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    if (!mounted) return <div className="min-h-screen bg-[#0A0A0A]" />;
    return <HomePageContent />;
}
