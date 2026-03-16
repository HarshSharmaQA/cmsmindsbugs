"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { useState, use, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
    ArrowLeft, Clock, ExternalLink, User, Mail,
    Monitor, AlertTriangle, CheckCircle2, CircleDot, XCircle,
    GripVertical, Users, UserPlus, Trash, Plus, Search,
    Calendar, Tag, Copy, Check, ChevronDown, Send,
    Globe, Settings, Key, Eye, EyeOff, Shield, Zap,
    MessageSquare, Bug, Image as ImageIcon, Video, LayoutList,
    Kanban as KanbanIcon, X, Activity, Hash, Download,
    Book, Info, HelpCircle, AlertCircle, Edit2, Target
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { formatDistanceToNow } from "date-fns";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

export const dynamic = 'force-dynamic';

// Statuses are now dynamic
type Status = string;
type Priority = "low" | "medium" | "high" | "critical";

const DEFAULT_COLUMNS = [
    { status: "open", label: "New Issues", icon: <CircleDot className="w-4 h-4" />, color: "text-blue-400" },
    { status: "in_progress", label: "In Progress", icon: <AlertTriangle className="w-4 h-4" />, color: "text-amber-400" },
    { status: "resolved", label: "Resolved", icon: <CheckCircle2 className="w-4 h-4" />, color: "text-green-400" },
    { status: "closed", label: "Closed", icon: <XCircle className="w-4 h-4" />, color: "text-slate-500" },
];

const ICON_OPTIONS_MAP: Record<string, React.ReactNode> = {
    MessageSquare: <MessageSquare className="w-4 h-4" />,
    Book: <Book className="w-4 h-4" />,
    Users: <Users className="w-4 h-4" />,
    Info: <Info className="w-4 h-4" />,
    HelpCircle: <HelpCircle className="w-4 h-4" />,
    CheckCircle: <CheckCircle2 className="w-4 h-4" />,
    AlertCircle: <AlertCircle className="w-4 h-4" />,
    Clock: <Clock className="w-4 h-4" />,
    LayoutList: <LayoutList className="w-4 h-4" />,
};

const PRIORITY_CONFIG: Record<Priority, { label: string; className: string }> = {
    low: { label: "Low", className: "bg-slate-800 text-slate-400 border border-slate-700" },
    medium: { label: "Medium", className: "bg-blue-900/50 text-blue-300 border border-blue-800" },
    high: { label: "High", className: "bg-amber-900/50 text-amber-300 border border-amber-800" },
    critical: { label: "Critical", className: "bg-red-900/50 text-red-300 border border-red-800" },
};

// ─── Utility ──────────────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: Priority }) {
    const cfg = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.medium;
    return (
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${cfg.className}`}>
            {cfg.label}
        </span>
    );
}

function StatusBadge({ status, projectStatuses }: { status: Status; projectStatuses?: any[] }) {
    const s = projectStatuses?.find(ps => ps.value === status) || DEFAULT_COLUMNS.find(c => c.status === status) || { label: status, color: "text-slate-400" };

    const colorMap: Record<string, string> = {
        "text-blue-400": "bg-blue-900/50 text-blue-300 border border-blue-800",
        "text-amber-400": "bg-amber-900/50 text-amber-300 border border-amber-800",
        "text-green-400": "bg-green-900/50 text-green-300 border border-green-800",
        "text-slate-500": "bg-slate-800 text-slate-400 border border-slate-700",
        "text-red-400": "bg-red-900/50 text-red-300 border border-red-800",
        "text-indigo-400": "bg-indigo-900/50 text-indigo-300 border border-indigo-800",
        "text-purple-400": "bg-purple-900/50 text-purple-300 border border-purple-800",
        "text-pink-400": "bg-pink-900/50 text-pink-300 border border-pink-800",
        "text-cyan-400": "bg-cyan-900/50 text-cyan-300 border border-cyan-800",
    };

    const badgeClass = colorMap[s.color] || "bg-slate-800 text-slate-400 border border-slate-700";

    return (
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${badgeClass}`}>
            {s.label || status}
        </span>
    );
}

function CopyButton({ text, label }: { text: string; label?: string }) {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button onClick={copy} className="btn-ghost text-xs flex items-center gap-1.5 h-8 px-3">
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            {label ?? (copied ? "Copied!" : "Copy")}
        </button>
    );
}

// ─── KanbanColumn ─────────────────────────────────────────────────────────────

function KanbanColumn({ status, label, icon, color, bugs, onSelect }: {
    status: Status; label: string; icon: React.ReactNode; color: string;
    bugs: any[]; onSelect: (id: Id<"bugs">) => void;
}) {
    return (
        <Droppable droppableId={status}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex flex-col rounded-xl border transition-colors min-h-[400px] ${snapshot.isDraggingOver
                        ? "border-brand-500/50 bg-brand-500/5"
                        : "border-surface-border bg-surface-card"
                        }`}
                >
                    {/* Column Header */}
                    <div className={`flex items-center gap-2 px-4 py-3 border-b border-surface-border ${color} sticky top-[130px] md:top-[146px] lg:top-[154px] z-30 bg-[#111118]/95 backdrop-blur-2xl rounded-t-xl group-hover:bg-[#16161F]`}>
                        {icon || <CircleDot className="w-4 h-4" />}
                        <span className="text-sm font-semibold">{label}</span>
                        <span className="ml-auto bg-surface-border text-slate-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            {bugs.length}
                        </span>
                    </div>

                    {/* Cards */}
                    <div className="flex-1 flex flex-col gap-2 p-3 overflow-y-auto">
                        {bugs.map((bug, index) => (
                            <Draggable key={bug._id} draggableId={bug._id} index={index}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        onClick={() => onSelect(bug._id)}
                                        className={`group relative rounded-lg border flex flex-col overflow-hidden cursor-pointer transition-all ${snapshot.isDragging
                                            ? "border-brand-500 shadow-xl shadow-brand-500/20 rotate-2 bg-surface-elevated scale-[1.02] z-50"
                                            : "border-surface-border bg-surface-elevated hover:border-slate-600 hover:shadow-md hover:-translate-y-0.5"
                                            }`}
                                    >
                                        {bug.screenshotUrl && bug.mediaType !== "video" && (
                                            <div className="w-full h-40 border-b border-surface-border bg-slate-900/50 relative overflow-hidden shrink-0 group-hover:h-48 transition-all duration-300">
                                                <img
                                                    src={bug.screenshotUrl}
                                                    alt={bug.title}
                                                    className="w-full h-full object-cover object-top opacity-90 group-hover:opacity-100 transition-opacity"
                                                />
                                            </div>
                                        )}
                                        <div className="p-3 relative flex-1 flex flex-col">
                                            <div
                                                {...provided.dragHandleProps}
                                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-white p-1 bg-surface-elevated/80 rounded backdrop-blur-sm z-50 mb-1"
                                                title="Drag to move"
                                            >
                                                <GripVertical className="w-3.5 h-3.5" />
                                            </div>
                                            {bug.url && bug.url !== "Unknown" && (
                                                <button
                                                    onClick={(e) => { 
                                                        e.stopPropagation(); 
                                                        let exactUrl = bug.url;
                                                        if (bug.scrollX !== undefined && bug.scrollY !== undefined) {
                                                            const separator = exactUrl.includes('#') ? '&' : '#';
                                                            exactUrl = `${exactUrl}${separator}bugscribe-highlight=${bug.scrollX},${bug.scrollY}`;
                                                        }
                                                        window.open(exactUrl, '_blank');
                                                    }}
                                                    className="absolute top-2 right-10 opacity-0 group-hover:opacity-100 transition-opacity text-brand-400 hover:text-brand-300 p-1 bg-surface-elevated/80 rounded backdrop-blur-sm z-50"
                                                    title="Locate bug on page"
                                                >
                                                    <Target className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                            <div className="flex items-start gap-2 mb-2 pr-12">
                                                <Bug className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
                                                <p className="text-sm font-medium text-white leading-tight line-clamp-2">{bug.title}</p>
                                            </div>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <PriorityBadge priority={bug.priority} />
                                                {bug.type && bug.type !== "general" && (
                                                    <span className="inline-flex items-center gap-0.5 text-[10px] text-brand-300 bg-brand-900/30 border border-brand-800/50 px-1.5 py-0.5 rounded font-medium capitalize">
                                                        {bug.type.replace(/-/g, ' ')}
                                                    </span>
                                                )}
                                                {bug.screenshotUrl && bug.mediaType === "video" && (
                                                    <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-400 bg-surface-border px-1.5 py-0.5 rounded font-medium">
                                                        <Video className="w-3 h-3" /> Video
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-3 pt-2 border-t border-surface-border flex items-center gap-1.5 text-[10px] text-slate-500 mt-auto">
                                                <Clock className="w-3 h-3 text-slate-600" />
                                                {formatDistanceToNow(new Date(bug.createdAt), { addSuffix: true })}
                                                {bug.url && bug.url !== "Unknown" && (
                                                    <span className="ml-auto truncate max-w-[80px]" title={bug.url}>
                                                        {new URL(bug.url).hostname}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                        {bugs.length === 0 && (
                            <div className="flex-1 flex items-center justify-center text-slate-700 text-xs py-8">
                                Drop issues here
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Droppable>
    );
}

// ─── ListView ─────────────────────────────────────────────────────────────────

function ListView({ bugs, onSelect }: { bugs: any[]; onSelect: (id: Id<"bugs">) => void }) {
    if (bugs.length === 0) {
        return (
            <div className="card p-12 text-center">
                <Bug className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-400 text-sm font-medium">No issues yet</p>
                <p className="text-slate-400 text-sm mt-0.5 line-clamp-1">Click &ldquo;+ New Issue&rdquo; to create your first bug report</p>
            </div>
        );
    }

    return (
        <div className="card overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-surface-border text-[11px] text-slate-500 uppercase tracking-wider">
                        <th className="px-4 py-3 text-left font-medium">Issue</th>
                        <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Status</th>
                        <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Priority</th>
                        <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">Source URL</th>
                        <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Reported</th>
                        <th className="px-4 py-3 font-medium"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                    {bugs.map((bug) => (
                        <tr
                            key={bug._id}
                            onClick={() => onSelect(bug._id)}
                            className="hover:bg-surface-elevated cursor-pointer transition-colors group"
                        >
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-2.5">
                                    {bug.screenshotUrl ? (
                                        <img
                                            src={bug.screenshotUrl}
                                            alt=""
                                            className="w-8 h-8 rounded object-cover border border-surface-border shrink-0"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded bg-surface-border flex items-center justify-center shrink-0">
                                            <Bug className="w-3.5 h-3.5 text-slate-600" />
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-medium text-white text-sm leading-tight">{bug.title}</p>
                                        {bug.description && (
                                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{bug.description}</p>
                                        )}
                                    </div>
                                </div>
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell">
                                <StatusBadge status={bug.status} projectStatuses={[]} />
                            </td>
                            <td className="px-4 py-3 hidden sm:table-cell">
                                <PriorityBadge priority={bug.priority} />
                            </td>
                            <td className="px-4 py-3 hidden lg:table-cell">
                                {bug.url && bug.url !== "Unknown" ? (
                                    <span className="text-xs text-slate-400 truncate max-w-[160px] block" title={bug.url}>
                                        {bug.url.replace(/^https?:\/\//, "").substring(0, 40)}
                                    </span>
                                ) : (
                                    <span className="text-xs text-slate-600">—</span>
                                )}
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell text-xs text-slate-500">
                                {formatDistanceToNow(new Date(bug.createdAt), { addSuffix: true })}
                            </td>
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-1">
                                    {bug.url && bug.url !== "Unknown" && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                let exactUrl = bug.url;
                                                if (bug.scrollX !== undefined && bug.scrollY !== undefined) {
                                                    const separator = exactUrl.includes('#') ? '&' : '#';
                                                    exactUrl = `${exactUrl}${separator}bugscribe-highlight=${bug.scrollX},${bug.scrollY}`;
                                                }
                                                window.open(exactUrl, '_blank');
                                            }}
                                            className="p-1.5 rounded hover:bg-surface-elevated transition-colors"
                                            title="Locate bug on page"
                                        >
                                            <Target className="w-3.5 h-3.5 text-brand-400 hover:text-brand-300 transition-colors" />
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const href = typeof window !== "undefined" ? `${window.location.origin}/dashboard/${bug.projectId}?bugId=${bug._id}` : "";
                                            if (href) navigator.clipboard.writeText(href);
                                        }}
                                        className="p-1.5 rounded hover:bg-surface-elevated transition-colors"
                                        title="Copy shareable link"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-colors" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ─── TeamManagement ───────────────────────────────────────────────────────────

function TeamManagement({ members, project, isAdmin, devToken }: {
    members: any[]; project: any; isAdmin: any; devToken: string | null;
}) {
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<"admin" | "editor" | "viewer">("editor");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const inviteMember = useMutation(api.projects.inviteMember);
    const removeMember = useMutation(api.projects.removeMember);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(""); setSuccess("");
        if (!email.trim()) return;
        setLoading(true);
        try {
            await inviteMember({ projectId: project._id, email: email.trim(), role, devToken: devToken || undefined });
            setEmail("");
            setSuccess(`${email} has been added as ${role}.`);
            setTimeout(() => setSuccess(""), 3000);
        } catch (err: any) {
            setError(err.message || "Failed to invite member");
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (membershipId: Id<"projectMembers">) => {
        if (!confirm("Remove this member from the project?")) return;
        try {
            await removeMember({ membershipId, devToken: devToken || undefined });
        } catch (err: any) {
            alert(err.message || "Failed to remove member");
        }
    };

    const roleColors: Record<string, string> = {
        owner: "bg-brand-900/50 text-brand-300 border border-brand-800",
        admin: "bg-amber-900/50 text-amber-300 border border-amber-800",
        editor: "bg-blue-900/50 text-blue-300 border border-blue-800",
        viewer: "bg-slate-800 text-slate-400 border border-slate-700",
    };

    return (
        <div className="max-w-2xl space-y-6">
            {/* Member List */}
            <div className="card overflow-hidden">
                <div className="px-4 py-3 border-b border-surface-border flex items-center gap-2">
                    <Users className="w-4 h-4 text-brand-400" />
                    <h3 className="text-sm font-semibold text-white">Team Members</h3>
                    <span className="ml-auto text-xs text-slate-500">{members.length} member{members.length !== 1 ? "s" : ""}</span>
                </div>
                {members.length === 0 ? (
                    <div className="px-4 py-8 text-center text-slate-500 text-sm">No team members yet</div>
                ) : (
                    <ul className="divide-y divide-surface-border">
                        {members.map((m) => (
                            <li key={m._id} className="flex items-center gap-3 px-4 py-3">
                                <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center shrink-0">
                                    <User className="w-4 h-4 text-brand-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">{m.name || m.email || m.userId}</p>
                                    {m.name && m.email && (
                                        <p className="text-xs text-slate-500 truncate">{m.email}</p>
                                    )}
                                </div>
                                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded capitalize ${roleColors[m.role] ?? roleColors.viewer}`}>
                                    {m.role}
                                </span>
                                {isAdmin && m.role !== "owner" && (
                                    <button
                                        onClick={() => handleRemove(m._id)}
                                        className="btn-ghost p-1.5 text-slate-600 hover:text-red-400 transition-colors"
                                    >
                                        <Trash className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Invite Form */}
            {isAdmin && (
                <div className="card p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <UserPlus className="w-4 h-4 text-brand-400" />
                        <h3 className="text-sm font-semibold text-white">Invite Member</h3>
                    </div>
                    {error && <p className="text-xs text-red-400 mb-3 p-2 bg-red-900/20 rounded border border-red-800">{error}</p>}
                    {success && <p className="text-xs text-green-400 mb-3 p-2 bg-green-900/20 rounded border border-green-800">{success}</p>}
                    <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-2">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="member@company.com"
                            className="input flex-1 text-sm h-9"
                            required
                        />
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value as any)}
                            className="input text-sm h-9 w-full sm:w-auto"
                        >
                            <option value="admin">Admin</option>
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>
                        </select>
                        <button type="submit" disabled={loading} className="btn-primary text-sm h-9 px-4 whitespace-nowrap">
                            {loading ? "Inviting…" : "Invite"}
                        </button>
                    </form>
                    <p className="text-xs text-slate-600 mt-2">The user must have a BugScribe account before being invited.</p>
                </div>
            )}
        </div>
    );
}

// ─── SettingsView ─────────────────────────────────────────────────────────────

function SettingsView({ project, devToken, isAdmin }: { project: any; devToken: string | null; isAdmin: any }) {
    const [name, setName] = useState(project.name ?? "");
    const [domain, setDomain] = useState(project.domain ?? "");
    const [description, setDescription] = useState(project.description ?? "");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [showKey, setShowKey] = useState(false);
    const updateProject = useMutation(api.projects.updateProject);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await updateProject({ projectId: project._id, name, domain, description, devToken: devToken || undefined });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err: any) {
            alert(err.message || "Failed to save");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-2xl space-y-6">
            {/* Project Details */}
            <div className="card p-5">
                <div className="flex items-center gap-2 mb-5">
                    <Settings className="w-4 h-4 text-brand-400" />
                    <h3 className="text-sm font-semibold text-white">Project Settings</h3>
                </div>
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="block text-xs text-slate-400 mb-1.5 font-medium">Project Name</label>
                        <input value={name} onChange={(e) => setName(e.target.value)} className="input w-full text-sm h-9" required />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1.5 font-medium">Domain / URL</label>
                        <input
                            value={domain}
                            onChange={(e) => setDomain(e.target.value)}
                            placeholder="https://yoursite.com"
                            className="input w-full text-sm h-9"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1.5 font-medium">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            placeholder="What is this project about?"
                            className="input w-full text-sm resize-none pt-2"
                        />
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" disabled={saving || !isAdmin} className="btn-primary text-sm h-9 px-5">
                            {saved ? "✓ Saved!" : saving ? "Saving…" : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>

            {/* API Key */}
            <div className="card p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Key className="w-4 h-4 text-brand-400" />
                    <h3 className="text-sm font-semibold text-white">API Key</h3>
                </div>
                <p className="text-xs text-slate-500 mb-3">Use this key to authenticate bug reports from the widget or extension.</p>
                <div className="flex items-center gap-2 p-3 bg-surface-elevated rounded-lg border border-surface-border font-mono text-xs">
                    <span className="flex-1 truncate text-slate-300">
                        {showKey ? project.apiKey : "•".repeat(Math.min(project.apiKey?.length ?? 20, 32))}
                    </span>
                    <button onClick={() => setShowKey(!showKey)} className="btn-ghost p-1 text-slate-500">
                        {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <CopyButton text={project.apiKey} />
                </div>
            </div>

            {/* Project ID */}
            <div className="card p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-4 h-4 text-slate-400" />
                    <h3 className="text-sm font-semibold text-white">Project ID</h3>
                </div>
                <div className="flex items-center gap-2 p-3 bg-surface-elevated rounded-lg border border-surface-border font-mono text-xs">
                    <span className="flex-1 truncate text-slate-400">{project._id}</span>
                    <CopyButton text={project._id} />
                </div>
            </div>
        </div>
    );
}

// ─── IntegrationsView ─────────────────────────────────────────────────────────

function IntegrationsView({ project, devToken }: { project: any; devToken: string | null }) {
    const connectionKey = btoa(`${project._id}|${project.apiKey}`);

    const widgetScript = `<script src="https://bugscripe.vercel.app/widget/bugscribe-widget.js"
  data-project-id="${project._id}"
  data-api-key="${project.apiKey}"
  async>
</script>`;

    return (
        <div className="max-w-2xl space-y-6">
            {/* Chrome Extension */}
            <div className="card p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-4 h-4 text-brand-400" />
                    <h3 className="text-sm font-semibold text-white">Chrome Extension</h3>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                    Copy your connection key and paste it into the BugScribe Chrome Extension to start capturing bugs on any website.
                </p>
                <div className="flex items-center gap-2 p-3 bg-surface-elevated rounded-lg border border-surface-border font-mono text-xs">
                    <span className="flex-1 truncate text-slate-300">{connectionKey}</span>
                    <CopyButton text={connectionKey} label="Copy Key" />
                </div>
            </div>

            {/* Widget Embed */}
            <div className="card p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Globe className="w-4 h-4 text-brand-400" />
                    <h3 className="text-sm font-semibold text-white">Widget Embed</h3>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                    Add this script tag to your website&apos;s <code className="text-slate-300">&lt;body&gt;</code> to enable the floating bug reporter widget.
                </p>
                <div className="relative">
                    <pre className="p-4 bg-surface-elevated rounded-lg border border-surface-border text-xs text-slate-300 overflow-x-auto leading-relaxed">
                        <code>{widgetScript}</code>
                    </pre>
                    <div className="absolute top-2 right-2">
                        <CopyButton text={widgetScript} />
                    </div>
                </div>
            </div>

            {/* Quick-start */}
            <div className="card p-5 border-brand-800/50 bg-brand-900/10">
                <h3 className="text-sm font-semibold text-white mb-3">Quick Reference</h3>
                <div className="space-y-2 text-xs">
                    <div className="flex gap-3">
                        <span className="text-slate-500 w-24 shrink-0">API Endpoint</span>
                        <code className="text-slate-300">POST https://bugscripe.vercel.app/api/reports</code>
                    </div>
                    <div className="flex gap-3">
                        <span className="text-slate-500 w-24 shrink-0">Project ID</span>
                        <code className="text-slate-300">{project._id}</code>
                    </div>
                    <div className="flex gap-3">
                        <span className="text-slate-500 w-24 shrink-0">API Key</span>
                        <code className="text-slate-300">{project.apiKey?.substring(0, 8)}…</code>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── BugDetailDrawer ──────────────────────────────────────────────────────────

const BUG_TYPES = [
    { value: "general", label: "General" },
    { value: "ui", label: "UI / Visual" },
    { value: "performance", label: "Performance" },
    { value: "security", label: "Security" },
    { value: "crash", label: "Crash" },
    { value: "network", label: "Network" },
    { value: "accessibility", label: "Accessibility" },
];

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
    created: <Bug className="w-3 h-3 text-brand-400" />,
    status_changed: <CircleDot className="w-3 h-3 text-blue-400" />,
    priority_changed: <AlertTriangle className="w-3 h-3 text-amber-400" />,
    comment_added: <MessageSquare className="w-3 h-3 text-green-400" />,
    assignee_changed: <User className="w-3 h-3 text-indigo-400" />,
    tags_changed: <Hash className="w-3 h-3 text-slate-400" />,
    type_changed: <Tag className="w-3 h-3 text-slate-400" />,
    category_changed: <LayoutList className="w-3 h-3 text-slate-400" />,
    asset_added: <ImageIcon className="w-3 h-3 text-brand-400" />,
};

function TagsInput({ tags, onChange, disabled }: { tags: string[]; onChange: (tags: string[]) => void; disabled?: boolean }) {
    const [input, setInput] = useState("");
    const addTag = () => {
        const val = input.trim().toLowerCase().replace(/\s+/g, "-");
        if (val && !tags.includes(val)) onChange([...tags, val]);
        setInput("");
    };
    return (
        <div className="flex flex-wrap gap-1.5 items-center border border-surface-border rounded-lg px-2 py-1.5 bg-surface-elevated min-h-[36px]">
            {tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-brand-900/40 text-brand-300 border border-brand-800">
                    #{tag}
                    {!disabled && (
                        <button onClick={() => onChange(tags.filter(t => t !== tag))} className="hover:text-red-400 transition-colors">
                            <X className="w-2.5 h-2.5" />
                        </button>
                    )}
                </span>
            ))}
            {!disabled && (
                <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }}
                    onBlur={addTag}
                    placeholder={tags.length === 0 ? "Add tags..." : ""}
                    className="flex-1 min-w-[80px] bg-transparent text-xs text-white outline-none placeholder:text-slate-600"
                />
            )}
        </div>
    );
}

function BugDetailDrawer({ bugId, onClose, onStatusChange, devToken, canDelete, canUpdate, projectMembers }: {
    bugId: Id<"bugs">; onClose: () => void;
    onStatusChange: (s: Status) => Promise<void>;
    devToken: string | null;
    canDelete: boolean;
    canUpdate: boolean;
    projectMembers: any[];
}) {
    const storedToken = typeof window !== "undefined" ? localStorage.getItem("bugscribe_dev_token") : null;
    const token = devToken || storedToken || undefined;

    const bug = useQuery(api.bugs.getBug, { bugId, devToken: token });
    const activities = useQuery(api.activities.getActivities, { bugId, devToken: token });
    const customModules = useQuery(api.modules.listModules, { devToken: token || undefined });
    const currentUser = useQuery(api.users.currentUser, { devToken: token || undefined });
    const addComment = useMutation(api.comments.addComment);
    const deleteBug = useMutation(api.bugs.deleteBug);
    const updatePriority = useMutation(api.bugs.updatePriority);
    const updateBug = useMutation(api.bugs.updateBug);

    const isSuperAdmin = currentUser?.role === "super_admin";

    const [comment, setComment] = useState("");
    const [posting, setPosting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [activeTab, setActiveTab] = useState<"details" | "screenshot" | "env" | "activity">("details");

    // Editable field states
    const [tagInput, setTagInput] = useState<string[]>([]);
    const [savingTags, setSavingTags] = useState(false);
    const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null);
    const [savingAssignee, setSavingAssignee] = useState(false);
    const [dueDate, setDueDate] = useState("");
    const [savingDue, setSavingDue] = useState(false);
    const [bugType, setBugType] = useState("general");
    const [savingType, setSavingType] = useState(false);
    const [bugCategory, setBugCategory] = useState("");
    const [savingCategory, setSavingCategory] = useState(false);
    const [showQuickAddType, setShowQuickAddType] = useState(false);

    // Sync local state when bug loads
    useEffect(() => {
        if (bug) {
            setTagInput(bug.tags ?? []);
            setSelectedAssignee(bug.assigneeId ?? null);
            setBugType(bug.type ?? "general");
            setBugCategory(bug.category ?? "");
            if (bug.dueDate) {
                const d = new Date(bug.dueDate);
                setDueDate(d.toISOString().split("T")[0]);
            } else {
                setDueDate("");
            }
        }
    }, [bug?._id]);

    const shareUrl = typeof window !== "undefined" && bug ? `${window.location.origin}/dashboard/${bug.projectId}?bugId=${bug._id}` : "";

    const handleComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!comment.trim() || !bug) return;
        setPosting(true);
        try {
            await addComment({ bugId, author: "Team", body: comment.trim(), devToken: token });
            setComment("");
        } catch (err: any) {
            alert(err.message);
        } finally {
            setPosting(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Permanently delete this bug report?")) return;
        setDeleting(true);
        try {
            await deleteBug({ bugId, devToken: token });
            onClose();
        } catch (err: any) {
            alert(err.message);
            setDeleting(false);
        }
    };

    const handleSaveTags = async (newTags: string[]) => {
        setTagInput(newTags);
        setSavingTags(true);
        try {
            await updateBug({ bugId, tags: newTags, devToken: token });
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSavingTags(false);
        }
    };

    const handleAssigneeChange = async (val: string) => {
        const newVal = val === "" ? null : val;
        setSelectedAssignee(newVal);
        setSavingAssignee(true);
        try {
            await updateBug({ bugId, assigneeId: newVal, devToken: token });
        } catch (err: any) { alert(err.message); } finally { setSavingAssignee(false); }
    };

    const handleDueDateChange = async (val: string) => {
        setDueDate(val);
        setSavingDue(true);
        try {
            const ts = val ? new Date(val).getTime() : null;
            await updateBug({ bugId, dueDate: ts, devToken: token });
        } catch (err: any) { alert(err.message); } finally { setSavingDue(false); }
    };

    const handleTypeChange = async (val: string) => {
        setBugType(val);
        setSavingType(true);
        try {
            await updateBug({ bugId, type: val, devToken: token });
        } catch (err: any) { alert(err.message); } finally { setSavingType(false); }
    };

    const handleCategoryChange = async (val: string) => {
        setBugCategory(val);
        setSavingCategory(true);
        try {
            await updateBug({ bugId, category: val, devToken: token });
        } catch (err: any) { alert(err.message); } finally { setSavingCategory(false); }
    };

    return (<>
        <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Drawer */}
            <div className="relative ml-auto w-full max-w-[540px] h-full bg-surface-card border-l border-surface-border flex flex-col shadow-2xl overflow-hidden">
                {!bug ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="skeleton w-12 h-12 rounded-full" />
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="flex items-start gap-3 px-5 py-4 border-b border-surface-border shrink-0">
                            <Bug className="w-4 h-4 text-brand-400 mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <h2 className="text-sm font-semibold text-white leading-snug">{bug.title}</h2>
                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                    <StatusBadge status={bug.status as Status} />
                                    <PriorityBadge priority={bug.priority as Priority} />
                                    <span className="text-[10px] text-slate-500">
                                        {formatDistanceToNow(new Date(bug.createdAt), { addSuffix: true })}
                                    </span>
                                </div>
                            </div>
                            {shareUrl && (
                                <CopyButton text={shareUrl} label="Copy Link" />
                            )}
                            <button onClick={onClose} className="btn-ghost p-1.5 text-slate-500 hover:text-white shrink-0 bg-surface-elevated/50 rounded shadow-sm border border-surface-border">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Large Image Preview (Cover) */}
                        {bug.screenshotUrl && bug.mediaType !== "video" && (
                            <div className="w-full border-b border-surface-border bg-black/40 shrink-0 relative flex items-center justify-center overflow-hidden" style={{ maxHeight: '220px' }}>
                                <img
                                    src={bug.screenshotUrl}
                                    alt="Preview"
                                    className="w-full h-full object-contain backdrop-blur-sm"
                                />
                                <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-surface-card/20 to-transparent pointer-events-none" />
                            </div>
                        )}

                        {/* Status & Priority Controls */}
                        <div className="flex items-center gap-2 px-5 py-3 border-b border-surface-border bg-surface-elevated">
                            <div className="flex-1">
                                <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Status</label>
                                <select
                                    value={bug.status}
                                    onChange={(e) => onStatusChange(e.target.value as Status)}
                                    className="input text-xs h-8 w-full"
                                    disabled={!canUpdate}
                                >
                                    <option value="open">Open</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="resolved">Resolved</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Priority</label>
                                <select
                                    value={bug.priority}
                                    onChange={(e) => updatePriority({ bugId, priority: e.target.value as Priority, devToken: token })}
                                    className="input text-xs h-8 w-full"
                                    disabled={!canUpdate}
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-0 border-b border-surface-border px-5 shrink-0 overflow-x-auto whitespace-nowrap" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            {(["details", "screenshot", "env", "activity"] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-3 py-2.5 text-xs font-medium capitalize border-b-2 transition-colors ${activeTab === tab
                                        ? "border-brand-500 text-brand-400"
                                        : "border-transparent text-slate-500 hover:text-slate-300"
                                        }`}
                                >
                                    {tab === "env" ? "Environment" : tab === "activity" ? "Activity" : tab}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                            {activeTab === "details" && (
                                <>
                                    {/* Categorization & Assignment */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <label className="text-[10px] text-slate-500 uppercase tracking-wider">Type</label>
                                                {isSuperAdmin && canUpdate && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowQuickAddType(true)}
                                                        className="inline-flex items-center gap-1 text-[10px] text-brand-400 hover:text-brand-300 transition-colors font-medium"
                                                        title="Add new module type"
                                                    >
                                                        <Plus className="w-2.5 h-2.5" /> New Type
                                                    </button>
                                                )}
                                            </div>
                                            <select
                                                value={bugType}
                                                onChange={(e) => handleTypeChange(e.target.value)}
                                                className="input text-xs h-8 w-full"
                                                disabled={!canUpdate || savingType}
                                            >
                                                <optgroup label="Bug Types">
                                                    {BUG_TYPES.map(t => (
                                                        <option key={t.value} value={t.value}>{t.label}</option>
                                                    ))}
                                                </optgroup>
                                                {customModules && customModules.length > 0 && (
                                                    <optgroup label="Dashboard Modules">
                                                        {customModules.map((mod: any) => (
                                                            <option key={mod.slug} value={mod.slug}>{mod.name}</option>
                                                        ))}
                                                    </optgroup>
                                                )}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Category</label>
                                            <input
                                                value={bugCategory}
                                                onChange={(e) => setBugCategory(e.target.value)}
                                                onBlur={() => handleCategoryChange(bugCategory)}
                                                placeholder="e.g. Authentication"
                                                className="input text-xs h-8 w-full"
                                                disabled={!canUpdate || savingCategory}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Due Date</label>
                                            <input
                                                type="date"
                                                value={dueDate}
                                                onChange={(e) => handleDueDateChange(e.target.value)}
                                                className="input text-xs h-8 w-full"
                                                disabled={!canUpdate || savingDue}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Assignee</label>
                                            <select
                                                value={selectedAssignee ?? ""}
                                                onChange={(e) => handleAssigneeChange(e.target.value)}
                                                className="input text-xs h-8 w-full"
                                                disabled={!canUpdate || savingAssignee}
                                            >
                                                <option value="">Unassigned</option>
                                                {projectMembers.map((m: any) => (
                                                    <option key={m.userId} value={m.userId}>
                                                        {m.name || m.email || m.userId}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Tags */}
                                    <div>
                                        <label className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1.5">Tags {savingTags && <span className="text-slate-600">(saving…)</span>}</label>
                                        <TagsInput tags={tagInput} onChange={handleSaveTags} disabled={!canUpdate} />
                                    </div>

                                    <div className="divider" />

                                    {bug.description && (
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Description</p>
                                            <p className="text-sm text-slate-300 leading-relaxed">{bug.description}</p>
                                        </div>
                                    )}

                                    {/* Steps */}
                                    {bug.steps && bug.steps.length > 0 && (
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Steps to Reproduce</p>
                                            <ol className="list-decimal list-inside space-y-1">
                                                {bug.steps.map((step: string, i: number) => (
                                                    <li key={i} className="text-xs text-slate-300">{step}</li>
                                                ))}
                                            </ol>
                                        </div>
                                    )}

                                    {/* Metadata */}
                                    <div className="space-y-2">
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">Details</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                            {[
                                                { label: "Source", value: bug.reporterName ? "User" : "Widget", icon: <Zap className="w-3 h-3" /> },
                                                { label: "Reporter", value: bug.reporterEmail || bug.reporterName, icon: <Mail className="w-3 h-3" /> },
                                                { label: "Browser", value: bug.browser?.split(" ").slice(0, 3).join(" "), icon: <Monitor className="w-3 h-3" /> },
                                                { label: "OS", value: bug.os, icon: <Monitor className="w-3 h-3" /> },
                                                { label: "Screen", value: bug.screenWidth ? `${bug.screenWidth}×${bug.screenHeight}` : null, icon: <Monitor className="w-3 h-3" /> },
                                                { label: "DPI", value: null, icon: null },
                                            ].filter(r => r.value && r.icon).map((row) => (
                                                <div key={row.label} className="flex items-start gap-2 text-xs">
                                                    <span className="text-slate-600 shrink-0 mt-0.5">{row.icon}</span>
                                                    <span className="text-slate-500 w-16 shrink-0">{row.label}</span>
                                                    <span className="text-slate-300 truncate flex-1" title={row.value ?? undefined}>{row.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                        {bug.url && bug.url !== "Unknown" && (
                                            <div className="flex items-start gap-2 text-xs">
                                                <Globe className="w-3 h-3 text-slate-600 mt-0.5 shrink-0" />
                                                <span className="text-slate-500 w-16 shrink-0">Page</span>
                                                <a href={bug.scrollX !== undefined && bug.scrollY !== undefined ? `${bug.url}${bug.url.includes('#') ? '&' : '#'}bugscribe-highlight=${bug.scrollX},${bug.scrollY}` : bug.url} target="_blank" rel="noopener noreferrer"
                                                    className="text-brand-400 hover:underline truncate flex-1" title={bug.url}>
                                                    {bug.url.replace(/^https?:\/\//, "").substring(0, 50)}
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    {/* Console Errors */}
                                    {bug.consoleErrors && bug.consoleErrors.length > 0 && (
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Console Errors</p>
                                            <div className="bg-red-950/30 border border-red-900/50 rounded-lg p-3 space-y-1 max-h-32 overflow-y-auto">
                                                {bug.consoleErrors.map((e: string, i: number) => (
                                                    <p key={i} className="text-xs text-red-300 font-mono leading-relaxed">{e}</p>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Comments */}
                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">
                                            Comments ({bug.comments?.length ?? 0})
                                        </p>
                                        {bug.comments && bug.comments.length > 0 && (
                                            <div className="space-y-2 mb-3">
                                                {bug.comments.map((c: any) => (
                                                    <div key={c._id} className="bg-surface-elevated rounded-lg p-3 border border-surface-border">
                                                        <div className="flex items-center gap-1.5 mb-1">
                                                            <div className="w-5 h-5 rounded-full bg-brand-500/20 flex items-center justify-center shrink-0">
                                                                <User className="w-2.5 h-2.5 text-brand-400" />
                                                            </div>
                                                            <span className="text-xs font-medium text-white">{c.author}</span>
                                                            <span className="text-[10px] text-slate-600">
                                                                {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-slate-300 pl-6.5">{c.body}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <form onSubmit={handleComment} className="flex gap-2">
                                            <input
                                                value={comment}
                                                onChange={(e) => setComment(e.target.value)}
                                                placeholder="Add a comment…"
                                                className="input flex-1 text-xs h-8"
                                            />
                                            <button type="submit" disabled={posting || !comment.trim()} className="btn-primary text-xs h-8 px-3">
                                                <Send className="w-3 h-3" />
                                            </button>
                                        </form>
                                    </div>
                                </>
                            )}

                            {activeTab === "screenshot" && (
                                <div>
                                    {bug.screenshotUrl ? (
                                        <>
                                            <div className="flex items-center gap-2 mb-3">
                                                {bug.mediaType === "video" ? (
                                                    <Video className="w-4 h-4 text-brand-400" />
                                                ) : (
                                                    <ImageIcon className="w-4 h-4 text-brand-400" />
                                                )}
                                                <span className="text-xs text-slate-400 capitalize">{bug.mediaType ?? "Image"}</span>
                                                <a href={bug.screenshotUrl} target="_blank" rel="noopener noreferrer"
                                                    className="ml-auto btn-ghost text-xs flex items-center gap-1">
                                                    <ExternalLink className="w-3 h-3" /> Open
                                                </a>
                                            </div>
                                            {bug.mediaType === "video" ? (
                                                <video
                                                    src={bug.screenshotUrl}
                                                    controls
                                                    className="w-full rounded-lg border border-surface-border"
                                                />
                                            ) : (
                                                <img
                                                    src={bug.screenshotUrl}
                                                    alt="Bug screenshot"
                                                    className="w-full rounded-lg border border-surface-border"
                                                />
                                            )}
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-slate-600">
                                            <ImageIcon className="w-10 h-10 mb-3" />
                                            <p className="text-sm">No screenshot attached</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === "env" && (
                                <div className="space-y-4">
                                    {bug.environmentData ? (
                                        <>
                                            {bug.environmentData.windowSize && (
                                                <div>
                                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Window Size</p>
                                                    <p className="text-xs text-slate-300 font-mono">
                                                        {bug.environmentData.windowSize.width}×{bug.environmentData.windowSize.height}
                                                    </p>
                                                </div>
                                            )}
                                            {bug.environmentData.cookies && (
                                                <div>
                                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Cookies</p>
                                                    <pre className="text-xs text-slate-400 bg-surface-elevated rounded p-3 border border-surface-border overflow-x-auto max-h-32 font-mono leading-relaxed">
                                                        {typeof bug.environmentData.cookies === "string"
                                                            ? bug.environmentData.cookies.substring(0, 500)
                                                            : JSON.stringify(bug.environmentData.cookies, null, 2)}
                                                    </pre>
                                                </div>
                                            )}
                                            {bug.environmentData.localStorage && (
                                                <div>
                                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">localStorage</p>
                                                    <pre className="text-xs text-slate-400 bg-surface-elevated rounded p-3 border border-surface-border overflow-x-auto max-h-48 font-mono leading-relaxed">
                                                        {bug.environmentData.localStorage.substring(0, 1000)}
                                                    </pre>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-slate-600">
                                            <Monitor className="w-10 h-10 mb-3" />
                                            <p className="text-sm">No environment data captured</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === "activity" && (
                                <div className="space-y-2">
                                    {!activities || activities.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12 text-slate-600">
                                            <Activity className="w-10 h-10 mb-3" />
                                            <p className="text-sm">No activity yet</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-0">
                                            {activities.map((act: any, idx: number) => (
                                                <div key={act._id} className="flex items-start gap-3 py-3 border-b border-surface-border/50 last:border-0">
                                                    <div className="w-6 h-6 rounded-full bg-surface-elevated border border-surface-border flex items-center justify-center shrink-0 mt-0.5">
                                                        {ACTIVITY_ICONS[act.type] ?? <Activity className="w-3 h-3 text-slate-500" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <span className="text-xs font-medium text-white">{act.actorName}</span>
                                                            <span className="text-xs text-slate-500">
                                                                {act.type === "created" && "created this bug"}
                                                                {act.type === "asset_added" && "attached an asset"}
                                                                {act.type === "status_changed" && `updated status`}
                                                                {act.type === "priority_changed" && `changed priority`}
                                                                {act.type === "comment_added" && "added a comment"}
                                                                {act.type === "assignee_changed" && "changed assignee"}
                                                                {act.type === "tags_changed" && "updated tags"}
                                                                {act.type === "type_changed" && "changed type"}
                                                                {act.type === "category_changed" && "changed category"}
                                                            </span>
                                                        </div>
                                                        {act.detail && (
                                                            <p className="text-[11px] text-slate-400 mt-0.5 bg-surface-elevated rounded px-2 py-0.5 inline-block font-mono">{act.detail}</p>
                                                        )}
                                                        <p className="text-[10px] text-slate-600 mt-1">
                                                            {formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="border-t border-surface-border px-5 py-3 flex justify-between items-center">
                            {canDelete ? (
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="btn-ghost text-xs text-red-400 hover:text-red-300 flex items-center gap-1.5"
                                >
                                    <Trash className="w-3.5 h-3.5" />
                                    {deleting ? "Deleting…" : "Delete Bug"}
                                </button>
                            ) : (
                                <div></div>
                            )}
                            <button onClick={onClose} className="btn-ghost text-xs">
                                Close
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
        {showQuickAddType && (
            <QuickAddModuleModal
                devToken={devToken}
                onClose={() => setShowQuickAddType(false)}
                onCreated={(slug) => {
                    handleTypeChange(slug);
                    setShowQuickAddType(false);
                }}
            />
        )}
    </>);
}

// ─── Quick Add Module Modal ───────────────────────────────────────────────────

function QuickAddModuleModal({ devToken, onClose, onCreated }: {
    devToken: string | null; onClose: () => void; onCreated: (slug: string) => void;
}) {
    const addModule = useMutation(api.modules.addModule);
    const modules = useQuery(api.modules.listModules, { devToken: devToken || undefined });
    const [name, setName] = useState("");
    const [saving, setSaving] = useState(false);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        const slug = name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
        setSaving(true);
        try {
            await addModule({
                name: name.trim(),
                slug,
                icon: "LayoutList",
                order: (modules?.length ?? 0),
                devToken: devToken || undefined,
            });
            onCreated(slug);
        } catch (err: any) {
            alert(err.message || "Failed to create module");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-sm bg-surface-card border border-surface-border rounded-xl shadow-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Plus className="w-4 h-4 text-brand-400" />
                    <h3 className="text-sm font-semibold text-white">New Module Type</h3>
                    <button onClick={onClose} className="ml-auto btn-ghost p-1 text-slate-500">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <form onSubmit={handleCreate} className="space-y-3">
                    <div>
                        <label className="block text-xs text-slate-400 mb-1.5 font-medium">Module Name</label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="input w-full text-sm h-9"
                            placeholder="e.g. Suggestions, Client Requests..."
                            autoFocus
                            required
                        />
                        {name && (
                            <p className="text-[10px] text-slate-500 mt-1 font-mono">
                                slug: {name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}
                            </p>
                        )}
                    </div>
                    <p className="text-[11px] text-slate-500 bg-surface-elevated rounded-lg px-3 py-2 border border-surface-border">
                        💡 You can customize the icon and description later in <strong className="text-slate-300">Admin → Dashboard Modules</strong>.
                    </p>
                    <div className="flex gap-2 pt-1">
                        <button type="button" onClick={onClose} className="btn-ghost flex-1 text-sm h-9">Cancel</button>
                        <button type="submit" disabled={saving || !name.trim()} className="btn-primary flex-1 text-sm h-9">
                            {saving ? "Creating..." : "Create & Select"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Create Bug Modal ─────────────────────────────────────────────────────────


function CreateBugModal({ projectId, devToken, onClose, initialType }: {
    projectId: Id<"projects">; devToken: string | null; onClose: () => void; initialType?: string;
}) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState<Priority>("medium");
    const [type, setType] = useState(initialType || "general");
    const [category, setCategory] = useState("");
    const [loading, setLoading] = useState(false);
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const createBug = useMutation(api.bugs.dashboardManualCreateBug);
    const customModules = useQuery(api.modules.listModules, { devToken: devToken || undefined });
    const currentUser = useQuery(api.users.currentUser, { devToken: devToken || undefined });
    const isSuperAdmin = currentUser?.role === "super_admin";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !devToken) return;
        setLoading(true);
        try {
            await createBug({
                projectId,
                title: title.trim(),
                description: description.trim(),
                priority,
                type: type === "general" ? undefined : type,
                category: category.trim() || undefined,
                devToken
            });
            onClose();
        } catch (err: any) {
            alert(err.message || "Failed to create bug");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
                <div className="relative w-full max-w-md bg-surface-card border border-surface-border rounded-xl shadow-2xl p-6">
                    <div className="flex items-center gap-2 mb-5">
                        <Plus className="w-4 h-4 text-brand-400" />
                        <h3 className="text-sm font-semibold text-white">New Issue</h3>
                        <button onClick={onClose} className="ml-auto btn-ghost p-1.5 text-slate-500">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Title *</label>
                            <input value={title} onChange={(e) => setTitle(e.target.value)} className="input w-full text-sm h-9" placeholder="Short, clear bug title" required />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Description</label>
                            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="input w-full text-sm resize-none pt-2" placeholder="Steps to reproduce, expected vs. actual…" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Priority</label>
                                <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="input w-full text-sm h-9">
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs text-slate-400 font-medium">Type / Module</label>
                                    {isSuperAdmin && (
                                        <button
                                            type="button"
                                            onClick={() => setShowQuickAdd(true)}
                                            className="inline-flex items-center gap-1 text-[10px] text-brand-400 hover:text-brand-300 transition-colors font-medium"
                                            title="Add new module type"
                                        >
                                            <Plus className="w-3 h-3" /> New Type
                                        </button>
                                    )}
                                </div>
                                <select value={type} onChange={(e) => setType(e.target.value)} className="input w-full text-sm h-9">
                                    <option value="general">🐛 General Bug</option>
                                    {(customModules || []).map((mod: any) => (
                                        <option key={mod.slug} value={mod.slug}>{mod.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Category (Optional)</label>
                            <input value={category} onChange={(e) => setCategory(e.target.value)} className="input w-full text-sm h-9" placeholder="e.g. Header, Billing, API..." />
                        </div>
                        <div className="flex gap-2 justify-end pt-1">
                            <button type="button" onClick={onClose} className="btn-ghost text-sm h-9 px-4">Cancel</button>
                            <button type="submit" disabled={loading || !title.trim()} className="btn-primary text-sm h-9 px-5">
                                {loading ? "Creating…" : "Create Issue"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            {showQuickAdd && (
                <QuickAddModuleModal
                    devToken={devToken}
                    onClose={() => setShowQuickAdd(false)}
                    onCreated={(slug) => {
                        setType(slug);
                        setShowQuickAdd(false);
                    }}
                />
            )}
        </>
    );
}


// ─── DashboardContent ─────────────────────────────────────────────────────────

function DashboardContent({ rawProjectId }: { rawProjectId: string }) {
    const [devToken, setDevToken] = useState<string | null>(null);
    const searchParams = useSearchParams();

    useEffect(() => {
        const stored = localStorage.getItem("bugscribe_dev_token");
        if (stored) setDevToken(stored);
    }, []);

    const isValidId = rawProjectId.length >= 10;
    const projectId = (isValidId ? rawProjectId : undefined) as Id<"projects"> | undefined;

    const project = useQuery(api.projects.getProject, projectId ? { projectId, devToken: devToken || undefined } : "skip");
    const bugs = useQuery(api.bugs.getBugs, projectId ? { projectId, devToken: devToken || undefined } : "skip");
    const stats = useQuery(api.bugs.getBugStats, projectId ? { projectId, devToken: devToken || undefined } : "skip");
    const updateStatus = useMutation(api.bugs.updateStatus);

    const [selectedBugId, setSelectedBugId] = useState<Id<"bugs"> | null>(null);
    const [showCreateBugModal, setShowCreateBugModal] = useState(false);
    const [view, setView] = useState<string>("kanban");
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState<string>("all");

    const customModules = useQuery(api.modules.listModules, { devToken: devToken || undefined });

    useEffect(() => {
        const param = searchParams?.get("bugId");
        if (param) {
            setSelectedBugId(param as Id<"bugs">);
        }
    }, [searchParams]);

    const currentUser = useQuery(api.users.currentUser, { devToken: devToken || undefined });
    const members = useQuery(api.projects.listMembers, projectId ? { projectId, devToken: devToken || undefined } : "skip");
    const myPermissions = useQuery(api.permissions.getMyPermissions, projectId ? { projectId, devToken: devToken || undefined } : "skip");

    const isProjectAdmin = project?.userId === currentUser?.tokenIdentifier ||
        members?.find((m: any) => m.userId === currentUser?.tokenIdentifier && (m.role === "owner" || m.role === "admin")) ||
        currentUser?.role === "super_admin";

    const canViewApi = myPermissions?.includes("view_api") || false;
    const canViewSettings = myPermissions?.includes("view_settings") || false;
    const canManageUsers = myPermissions?.includes("manage_users") || false;
    const canDeleteBugs = myPermissions?.includes("delete_bugs") || false;
    const canUpdateBugs = myPermissions?.includes("update_bugs") || false;

    if (project === undefined || bugs === undefined) return <LoadingSkeleton />;
    if (project === null) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center">
                <p className="text-slate-400">Project not found.</p>
                <Link href="/" className="btn-ghost mt-4">← Back to projects</Link>
            </div>
        );
    }

    const filteredBugs = (bugs ?? []).filter((bug: any) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch = bug.title.toLowerCase().includes(q) || bug.url?.toLowerCase().includes(q);
        const matchesType = typeFilter === "all" ||
            (typeFilter === "general" ? (!bug.type || bug.type === "general") : bug.type === typeFilter);
        return matchesSearch && matchesType;
    });

    const bugsByStatus = (status: Status) => filteredBugs.filter((b: any) => b.status === status);

    // Build type filter pills from default types + custom modules
    const defaultTypeFilters = [
        { value: "all", label: "All Types", icon: null, count: (bugs ?? []).length },
        { value: "general", label: "General Bug", icon: null, count: (bugs ?? []).filter((b: any) => !b.type || b.type === "general").length },
    ];
    const moduleTypeFilters = (customModules || []).map((mod: any) => ({
        value: mod.slug,
        label: mod.name,
        icon: ICON_OPTIONS_MAP[mod.icon] || null,
        count: (bugs ?? []).filter((b: any) => b.type === mod.slug).length,
    }));
    const allTypeFilters = [...defaultTypeFilters, ...moduleTypeFilters];

    const handleDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;
        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;
        const newStatus = destination.droppableId as Status;
        if (!canUpdateBugs) {
            alert("You don't have permission to move bugs.");
            return;
        }

        const token = devToken || localStorage.getItem("bugscribe_dev_token") || undefined;
        try {
            await updateStatus({ bugId: draggableId as Id<"bugs">, status: newStatus as any, devToken: token });
        } catch (error: any) {
            alert(error.message || "Failed to update status.");
        }
    };

    const handleExport = () => {
        if (!bugs || bugs.length === 0) {
            alert("No issues to export.");
            return;
        }

        // Header row
        const headers = [
            "ID", "Title", "Status", "Priority", "Type", "Category",
            "Assignee", "Reporter Name", "Reporter Email", "Created At",
            "URL", "Browser", "OS", "Screen Size", "Description", "Console Errors"
        ];

        // Map members for assignee lookup
        const memberMap: Record<string, string> = {};
        members?.forEach((m: any) => {
            memberMap[m.userId] = m.name || m.email || m.userId;
        });

        // Rows
        const rows = bugs.map((bug: any) => [
            bug._id,
            bug.title,
            bug.status,
            bug.priority,
            bug.type || "general",
            bug.category || "None",
            bug.assigneeId ? (memberMap[bug.assigneeId] || bug.assigneeId) : "Unassigned",
            bug.reporterName || "Widget",
            bug.reporterEmail || "N/A",
            new Date(bug.createdAt).toLocaleString(),
            bug.url,
            bug.browser,
            bug.os || "N/A",
            bug.screenWidth ? `${bug.screenWidth}x${bug.screenHeight}` : "N/A",
            (bug.description || "").replace(/\n/g, " "),
            (bug.consoleErrors || []).join(" | ")
        ]);

        // Build CSV string
        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.map(val => {
                const escaped = String(val).replace(/"/g, '""');
                return `"${escaped}"`;
            }).join(","))
        ].join("\n");

        // Download
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `bugscribe-export-${project?.name.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const TAB_LABELS: Record<string, string> = {
        kanban: "Kanban", list: "List", team: "Users", integrations: "API", settings: "Settings"
    };

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <div className="flex-1 flex flex-col max-w-[1600px] mx-auto w-full px-4 py-6">
                {/* Breadcrumb */}
                <div className="flex items-center gap-3 mb-6">
                    <Link href="/" className="btn-ghost text-xs px-2">
                        <ArrowLeft className="w-3.5 h-3.5" /> Projects
                    </Link>
                    <span className="text-slate-600">/</span>
                    <span className="text-sm font-medium text-white">{project.name}</span>
                </div>

                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
                        {[
                            { label: "Total", value: stats.total, color: "text-white" },
                            { label: "Open", value: stats.open, color: "text-blue-400" },
                            { label: "In-Progress", value: stats.in_progress, color: "text-amber-400" },
                            { label: "Resolved", value: stats.resolved, color: "text-green-400" },
                            { label: "Closed", value: stats.closed, color: "text-slate-400" },
                            { label: "Critical", value: stats.critical, color: "text-red-400" },
                        ].map((s) => (
                            <div key={s.label} className="card p-3 text-center">
                                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">{s.label}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Sticky Header Section */}
                <div className="sticky top-0 z-40 bg-[#09090E]/95 backdrop-blur-2xl border-b border-surface-border/50 -mx-4 px-4 pt-2 lg:-mx-8 lg:px-8 mb-4 shadow-xl shadow-black/20">
                    {/* Toolbar */}
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <h2 className="font-semibold text-white w-full sm:w-auto">Issue Tracking</h2>
                    <div className="flex gap-1 p-1 bg-surface-card border border-surface-border rounded-lg overflow-x-auto w-full sm:w-auto" style={{ scrollbarWidth: 'none' }}>
                        {(["kanban", "list"] as const).map((v) => (
                            <button
                                key={v}
                                onClick={() => setView(v)}
                                className={`px-3 py-1.5 text-[10px] sm:text-xs font-medium rounded-md whitespace-nowrap transition-all ${view === v ? "bg-brand-500 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}
                            >
                                {TAB_LABELS[v]}
                            </button>
                        ))}

                        {/* Admin Sections */}
                        {(["team", "integrations", "settings"] as const).map((v) => {
                            if (v === "team" && !canManageUsers) return null;
                            if (v === "integrations" && !canViewApi) return null;
                            if (v === "settings" && !canViewSettings) return null;
                            return (
                                <button
                                    key={v}
                                    onClick={() => setView(v)}
                                    className={`px-3 py-1.5 text-[10px] sm:text-xs font-medium rounded-md whitespace-nowrap transition-all ${view === v ? "bg-brand-500 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}
                                >
                                    {TAB_LABELS[v]}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Search / New Issue bar for list/kanban */}
                {(view === "kanban" || view === "list") && (
                    <div className="flex flex-col gap-3 mb-4">
                        {/* Action Bar */}
                        <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
                            <div className="flex items-center gap-2">
                                <button onClick={() => setShowCreateBugModal(true)} className="btn-primary text-xs flex items-center gap-1.5 self-start">
                                    <Plus className="w-3.5 h-3.5" /> New Issue
                                </button>
                                {isProjectAdmin && (
                                    <button
                                        onClick={handleExport}
                                        className="btn-ghost border border-surface-border text-xs flex items-center gap-1.5 self-start px-3 h-8 hover:bg-surface-elevated transition-colors"
                                        title="Export all issues to CSV"
                                    >
                                        <Download className="w-3.5 h-3.5" /> Export CSV
                                    </button>
                                )}
                            </div>
                            <div className="relative w-full md:w-auto mt-2 md:mt-0">
                                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    className="input pl-9 h-9 text-xs w-full md:w-[220px]"
                                    placeholder="Search issues…"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Type Filter Pills */}
                        {allTypeFilters.length > 2 && (
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium shrink-0">Filter by type:</span>
                                <div className="flex gap-1.5 flex-wrap">
                                    {allTypeFilters.map((tf) => (
                                        <button
                                            key={tf.value}
                                            onClick={() => setTypeFilter(tf.value)}
                                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium border transition-all ${typeFilter === tf.value
                                                    ? "bg-brand-500 border-brand-400 text-white shadow-sm shadow-brand-500/30"
                                                    : "bg-surface-card border-surface-border text-slate-400 hover:text-white hover:border-slate-600"
                                                }`}
                                        >
                                            {tf.icon && <span className="w-3 h-3">{tf.icon}</span>}
                                            {tf.label}
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${typeFilter === tf.value ? "bg-white/20 text-white" : "bg-surface-elevated text-slate-500"
                                                }`}>{tf.count}</span>
                                        </button>
                                    ))}
                                </div>
                                {typeFilter !== "all" && (
                                    <button
                                        onClick={() => setTypeFilter("all")}
                                        className="text-[10px] text-slate-500 hover:text-white flex items-center gap-1 transition-colors"
                                    >
                                        <X className="w-3 h-3" /> Clear
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Active filter indicator */}
                        {typeFilter !== "all" && (
                            <div className="flex items-center gap-2 text-xs text-slate-400 bg-brand-900/20 border border-brand-800/40 rounded-lg px-3 py-2">
                                <Tag className="w-3.5 h-3.5 text-brand-400" />
                                Showing <span className="font-semibold text-brand-300 capitalize">{typeFilter.replace(/-/g, ' ')}</span> issues only
                                <span className="ml-auto text-[10px] bg-brand-800/40 px-2 py-0.5 rounded-full">{filteredBugs.length} issue{filteredBugs.length !== 1 ? 's' : ''}</span>
                            </div>
                        )}
                    </div>
                )}
                </div>

                {/* Views */}
                {view === "kanban" && (
                    <DragDropContext onDragEnd={handleDragEnd}>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 flex-1 items-start">
                            {DEFAULT_COLUMNS.map((col: { status: string; label: string; icon: React.ReactNode; color: string }) => (
                                <KanbanColumn
                                    key={col.status}
                                    {...col}
                                    bugs={bugsByStatus(col.status)}
                                    onSelect={setSelectedBugId}
                                />
                            ))}
                        </div>
                    </DragDropContext>
                )}
                {view === "list" && <ListView bugs={filteredBugs} onSelect={setSelectedBugId} />}
                {view === "team" && (
                    <TeamManagement
                        members={members || []}
                        project={project}
                        isAdmin={isProjectAdmin}
                        devToken={devToken}
                    />
                )}
                {view === "integrations" && <IntegrationsView project={project} devToken={devToken} />}
                {view === "settings" && <SettingsView project={project} devToken={devToken} isAdmin={isProjectAdmin} />}

                {/* Dynamic Module Content */}
                {customModules?.find((m: any) => m.slug === view) && (
                    <ModuleView
                        moduleId={customModules.find((m: any) => m.slug === view)!._id}
                        projectId={project._id}
                        devToken={devToken}
                        module={customModules.find((m: any) => m.slug === view)!}
                    />
                )}
            </div>

            {/* Modals */}
            {selectedBugId && (
                <BugDetailDrawer
                    bugId={selectedBugId}
                    onClose={() => setSelectedBugId(null)}
                    onStatusChange={async (s: string) => {
                        await updateStatus({ bugId: selectedBugId, status: s, devToken: devToken || undefined });
                    }}
                    devToken={devToken}
                    canDelete={canDeleteBugs}
                    canUpdate={canUpdateBugs}
                    projectMembers={members ?? []}
                />
            )}
            {showCreateBugModal && projectId && (
                <CreateBugModal
                    projectId={projectId}
                    devToken={devToken}
                    initialType={
                        // If viewing a module tab, pre-select that module
                        (view !== "kanban" && view !== "list" && view !== "team" && view !== "settings" && view !== "integrations")
                            ? view
                            // If a type filter is active on kanban/list, pre-select that type
                            : (typeFilter !== "all" ? typeFilter : undefined)
                    }
                    onClose={() => setShowCreateBugModal(false)}
                />
            )}
        </div>
    );
}

// ── ModuleView ──────────────────────────────────────────────────────────────

function ModuleView({ moduleId, projectId, devToken, module }: {
    moduleId: Id<"dashboardModules">;
    projectId: Id<"projects">;
    devToken: string | null;
    module: any;
}) {
    const entries = useQuery(api.modules.listEntries, { moduleId, projectId, devToken: devToken || undefined });
    const addEntry = useMutation(api.modules.addEntry);
    const updateEntry = useMutation(api.modules.updateEntry);
    const deleteEntry = useMutation(api.modules.deleteEntry);

    const [isAdding, setIsAdding] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState<any>(null);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);

    const filteredEntries = (entries || []).filter(e =>
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        setLoading(true);
        try {
            if (selectedEntry) {
                await updateEntry({ entryId: selectedEntry._id, title, content, devToken: devToken || undefined });
            } else {
                await addEntry({ moduleId, projectId, title, content, devToken: devToken || undefined });
            }
            setIsAdding(false);
            setSelectedEntry(null);
            setTitle("");
            setContent("");
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (entry: any) => {
        setSelectedEntry(entry);
        setTitle(entry.title);
        setContent(entry.content);
        setIsAdding(true);
    };

    const handleDelete = async (id: Id<"moduleEntries">) => {
        if (!confirm("Are you sure?")) return;
        await deleteEntry({ entryId: id, devToken: devToken || undefined });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        {ICON_OPTIONS_MAP[module.icon] || <LayoutList className="w-5 h-5" />}
                        {module.name}
                    </h2>
                    {module.description && <p className="text-sm text-slate-500 mt-1">{module.description}</p>}
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder={`Search ${module.name.toLowerCase()}...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input h-9 text-xs pl-9 w-48 md:w-64"
                        />
                    </div>
                    <button
                        onClick={() => { setIsAdding(true); setSelectedEntry(null); setTitle(""); setContent(""); }}
                        className="btn-primary text-xs h-9 px-4 flex items-center gap-1.5"
                    >
                        <Plus className="w-3.5 h-3.5" /> Add {module.name.replace(/s$/, '')}
                    </button>
                </div>
            </div>

            {filteredEntries.length === 0 ? (
                <div className="card p-12 text-center flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-600">
                        {ICON_OPTIONS_MAP[module.icon] || <LayoutList className="w-6 h-6" />}
                    </div>
                    <p className="text-slate-400 text-sm">{searchTerm ? "No matches found" : "No entries yet"}</p>
                    <p className="text-slate-500 text-xs mt-1">
                        {searchTerm ? "Try a different search term" : `Be the first to add a ${module.name.toLowerCase()} entry!`}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredEntries.map((entry: any) => (
                        <div key={entry._id} className="card p-5 group flex flex-col hover:border-brand-500/30 transition-all">
                            <div className="flex items-start justify-between mb-3">
                                <h3 className="font-semibold text-white group-hover:text-brand-400 transition-colors line-clamp-1">{entry.title}</h3>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(entry)} className="p-1.5 hover:bg-slate-800 rounded">
                                        <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                                    </button>
                                    <button onClick={() => handleDelete(entry._id)} className="p-1.5 hover:bg-red-500/10 rounded">
                                        <Trash className="w-3.5 h-3.5 text-red-400" />
                                    </button>
                                </div>
                            </div>
                            <p className="text-sm text-slate-400 line-clamp-3 leading-relaxed mb-4 flex-1">
                                {entry.content}
                            </p>
                            <div className="mt-auto flex items-center justify-between text-[10px] text-slate-600 font-medium pt-3 border-t border-surface-border/50">
                                <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatDistanceToNow(entry.createdAt, { addSuffix: true })}
                                </div>
                                {entry.updatedAt !== entry.createdAt && <span className="bg-surface-border px-1.5 py-0.5 rounded">Edited</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isAdding && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="relative w-full max-w-lg bg-surface-card border border-surface-border rounded-xl shadow-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-white">
                                {selectedEntry ? `Edit ${module.name.replace(/s$/, '')}` : `New ${module.name.replace(/s$/, '')}`}
                            </h3>
                            <button onClick={() => setIsAdding(false)} className="text-slate-500 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs text-slate-400 mb-1.5 font-medium uppercase tracking-wider">Title</label>
                                <input
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    className="input w-full"
                                    placeholder="Give it a clear title"
                                    required
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1.5 font-medium uppercase tracking-wider">Content</label>
                                <textarea
                                    value={content}
                                    onChange={e => setContent(e.target.value)}
                                    className="input w-full min-h-[200px] resize-none py-3"
                                    placeholder="Write your details here..."
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setIsAdding(false)} className="btn-ghost flex-1">Cancel</button>
                                <button type="submit" disabled={loading || !title.trim()} className="btn-primary flex-1">
                                    {loading ? "Saving..." : "Save Entry"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <div className="max-w-[1600px] mx-auto w-full px-4 py-12 flex flex-col items-center">
                <div className="skeleton w-32 h-6 mb-4" />
                <div className="grid grid-cols-3 gap-6 w-full max-w-4xl">
                    <div className="skeleton h-40" /><div className="skeleton h-40" /><div className="skeleton h-40" />
                </div>
            </div>
        </div>
    );
}

// ─── Page Entry ───────────────────────────────────────────────────────────────

export default function DashboardPage({ params }: { params: Promise<{ projectId: string }> }) {
    const resolvedParams = use(params);
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted) return <LoadingSkeleton />;
    return <DashboardContent rawProjectId={resolvedParams.projectId} />;
}
