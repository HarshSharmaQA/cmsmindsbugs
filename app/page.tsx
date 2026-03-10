"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { Plus, Bug, Globe, Key, Trash2, ArrowRight, Mail, User } from "lucide-react";
import { Navbar } from "@/components/Navbar";

export default function HomePage() {
    const [mounted, setMounted] = useState(false);
    const [devToken, setDevToken] = useState<string | null>(null);
    const [email, setEmail] = useState("");
    const [emailToCheck, setEmailToCheck] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [loggingIn, setLoggingIn] = useState(false);

    // null = not yet checked, true = existing user, false = new user
    const emailExists = useQuery(
        api.users.checkEmailExists,
        emailToCheck ? { email: emailToCheck } : "skip"
    );

    useEffect(() => {
        setMounted(true);
        const stored = localStorage.getItem("bugscribe_dev_token");
        if (stored) setDevToken(stored);
    }, []);

    const projects = useQuery(api.projects.listProjects, { devToken: devToken || undefined });
    const loginMutation = useMutation(api.users.loginUser);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;
        setLoggingIn(true);
        try {
            const token = await loginMutation({
                email: email.trim().toLowerCase(),
                password: password,
            });
            localStorage.setItem("bugscribe_dev_token", token);
            setDevToken(token);
        } catch (error: any) {
            console.error(error);
            alert(error.message || "Login Failed. Please try again.");
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
        } finally {
            setCreating(false);
        }
    };

    if (!mounted) {
        return <div className="min-h-screen bg-[#0A0A0A]"></div>;
    }

    return (
        <div className="min-h-screen">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-10">
                {!devToken ? (
                    <div className="max-w-md mx-auto py-12 animate-fade-in">
                        <div className="text-center mb-10">
                            <div className="w-20 h-20 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-6 mx-auto">
                                <Bug className="w-10 h-10 text-brand-500" />
                            </div>
                            <h1 className="text-4xl font-bold text-white tracking-tight mb-4">
                                Welcome to Bug<span className="text-gradient">Scribe</span>
                            </h1>
                            <p className="text-slate-400">
                                Enter your details to access the dashboard.
                                <br />(Convex Database Auth)
                            </p>
                        </div >

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
                            <p className="text-[10px] text-slate-500 text-center mt-6 uppercase tracking-widest font-semibold opacity-50">
                                Protected by Convex Native Session
                            </p>
                        </div>
                    </div >
                ) : (
                    <>
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
                        ) : (projects.length === 0) ? (
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
                                {projects.map((project) => (
                                    <ProjectCard
                                        key={project._id}
                                        project={project}
                                        onDelete={() => deleteProject({
                                            projectId: project._id,
                                            devToken: devToken || undefined
                                        })}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )
                }
            </main >
        </div >
    );
}

function ProjectCard({
    project,
    onDelete,
}: {
    project: { _id: string; name: string; domain?: string; description?: string; apiKey: string; createdAt: number };
    onDelete: () => void;
}) {
    const [confirmDelete, setConfirmDelete] = useState(false);

    return (
        <div className="card p-5 hover:border-brand-500/30 transition-all duration-200 group animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3">
                {!confirmDelete ? (
                    <button
                        onClick={() => setConfirmDelete(true)}
                        className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all p-1 rounded"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                ) : (
                    <div className="flex gap-1 animate-slide-up">
                        <button onClick={onDelete} className="text-[10px] text-red-100 px-2 py-0.5 rounded bg-red-600">
                            Confirm
                        </button>
                        <button onClick={() => setConfirmDelete(false)} className="text-[10px] text-slate-500 px-2 py-0.5 rounded bg-surface">
                            x
                        </button>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0">
                    <Bug className="w-5 h-5 text-brand-400" />
                </div>
                <div className="min-w-0">
                    <h3 className="font-semibold text-white truncate">{project.name}</h3>
                    {project.domain && (
                        <p className="text-slate-500 text-[10px] truncate flex items-center gap-1">
                            <Globe className="w-2.5 h-2.5 shrink-0" />
                            {project.domain}
                        </p>
                    )}
                </div>
            </div>

            {project.description && (
                <p className="text-slate-400 text-xs mb-4 line-clamp-2 h-8">{project.description}</p>
            )}

            <div className="divider mb-4" />

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-600 text-[10px]">
                    <Key className="w-3 h-3 text-slate-500" />
                    <span className="font-mono">{project.apiKey.slice(0, 12)}…</span>
                </div>
                <Link
                    href={`/dashboard/${project._id}`}
                    className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 font-medium transition-colors"
                >
                    Open
                    <ArrowRight className="w-3 h-3" />
                </Link>
            </div>
        </div>
    );
}
