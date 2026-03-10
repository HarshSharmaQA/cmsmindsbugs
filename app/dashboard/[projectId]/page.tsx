"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { useState, use, useEffect, useRef } from "react";
import {
    ArrowLeft, Clock, ExternalLink, User, Mail,
    Monitor, AlertTriangle, CheckCircle2, CircleDot, XCircle,
    GripVertical, Users, UserPlus, Trash, Plus, Search,
    Calendar, Tag, Copy, Check, ChevronDown, Send,
    Globe, Settings, Key, Eye, EyeOff, Shield, Zap,
    MessageSquare, Bug, Image as ImageIcon, Video, LayoutList,
    Kanban as KanbanIcon, X
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { formatDistanceToNow } from "date-fns";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

export const dynamic = 'force-dynamic';

type Status = "open" | "in_progress" | "resolved" | "closed";
type Priority = "low" | "medium" | "high" | "critical";

const COLUMNS: { status: Status; label: string; icon: React.ReactNode; color: string }[] = [
    { status: "open", label: "New Issues", icon: <CircleDot className="w-4 h-4" />, color: "text-blue-400" },
    { status: "in_progress", label: "In Progress", icon: <AlertTriangle className="w-4 h-4" />, color: "text-amber-400" },
    { status: "resolved", label: "Resolved", icon: <CheckCircle2 className="w-4 h-4" />, color: "text-green-400" },
    { status: "closed", label: "Closed", icon: <XCircle className="w-4 h-4" />, color: "text-slate-500" },
];

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

function StatusBadge({ status }: { status: Status }) {
    const map: Record<Status, string> = {
        open: "bg-blue-900/50 text-blue-300 border border-blue-800",
        in_progress: "bg-amber-900/50 text-amber-300 border border-amber-800",
        resolved: "bg-green-900/50 text-green-300 border border-green-800",
        closed: "bg-slate-800 text-slate-400 border border-slate-700",
    };
    const label: Record<Status, string> = {
        open: "Open", in_progress: "In Progress", resolved: "Resolved", closed: "Closed",
    };
    return (
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${map[status]}`}>
            {label[status]}
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
                    <div className={`flex items-center gap-2 px-4 py-3 border-b border-surface-border ${color}`}>
                        {icon}
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
                                            <div className="w-full h-32 border-b border-surface-border bg-slate-900/50 relative overflow-hidden shrink-0">
                                                <img
                                                    src={bug.screenshotUrl}
                                                    alt={bug.title}
                                                    className="w-full h-full object-cover object-top opacity-80 group-hover:opacity-100 transition-opacity group-hover:scale-105 duration-300"
                                                />
                                            </div>
                                        )}
                                        <div className="p-3 relative flex-1 flex flex-col">
                                            <div
                                                {...provided.dragHandleProps}
                                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-white p-1 bg-surface-elevated/80 rounded backdrop-blur-sm"
                                            >
                                                <GripVertical className="w-3.5 h-3.5" />
                                            </div>
                                            <div className="flex items-start gap-2 mb-2 pr-6">
                                                <Bug className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
                                                <p className="text-sm font-medium text-white leading-tight line-clamp-2">{bug.title}</p>
                                            </div>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <PriorityBadge priority={bug.priority} />
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
                <p className="text-slate-600 text-xs mt-1">Click "+ New Issue" to create your first bug report</p>
            </div>
        );
    }

    return (
        <div className="card overflow-hidden">
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
                                <StatusBadge status={bug.status} />
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
                                <ExternalLink className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-colors" />
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
                    Add this script tag to your website's <code className="text-slate-300">&lt;body&gt;</code> to enable the floating bug reporter widget.
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

function BugDetailDrawer({ bugId, onClose, onStatusChange, devToken, canDelete, canUpdate }: {
    bugId: Id<"bugs">; onClose: () => void;
    onStatusChange: (s: Status) => Promise<void>;
    devToken: string | null;
    canDelete: boolean;
    canUpdate: boolean;
}) {
    const storedToken = typeof window !== "undefined" ? localStorage.getItem("bugscribe_dev_token") : null;
    const token = devToken || storedToken || undefined;

    const bug = useQuery(api.bugs.getBug, { bugId, devToken: token });
    const addComment = useMutation(api.comments.addComment);
    const deleteBug = useMutation(api.bugs.deleteBug);
    const updatePriority = useMutation(api.bugs.updatePriority);

    const [comment, setComment] = useState("");
    const [posting, setPosting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [activeTab, setActiveTab] = useState<"details" | "screenshot" | "env">("details");

    const handleComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!comment.trim() || !bug) return;
        setPosting(true);
        try {
            await addComment({ bugId, author: "Team", body: comment.trim() });
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

    return (
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
                                {/* Optional: add a subtle gradient at bottom if you want to bleed nicely into the next section */}
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
                        <div className="flex gap-0 border-b border-surface-border px-5">
                            {(["details", "screenshot", "env"] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-3 py-2.5 text-xs font-medium capitalize border-b-2 transition-colors ${activeTab === tab
                                        ? "border-brand-500 text-brand-400"
                                        : "border-transparent text-slate-500 hover:text-slate-300"
                                        }`}
                                >
                                    {tab === "env" ? "Environment" : tab}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                            {activeTab === "details" && (
                                <>
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

                                    {/* Meta */}
                                    <div className="space-y-2">
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">Details</p>
                                        {[
                                            { label: "URL", value: bug.url, icon: <Globe className="w-3 h-3" />, link: true },
                                            { label: "Browser", value: bug.browser, icon: <Monitor className="w-3 h-3" /> },
                                            { label: "OS", value: bug.os, icon: <Monitor className="w-3 h-3" /> },
                                            { label: "Reporter", value: bug.reporterEmail || bug.reporterName, icon: <Mail className="w-3 h-3" /> },
                                            { label: "Screen", value: bug.screenWidth ? `${bug.screenWidth}×${bug.screenHeight}` : null, icon: <Monitor className="w-3 h-3" /> },
                                        ].filter(r => r.value && r.value !== "Unknown").map((row) => (
                                            <div key={row.label} className="flex items-start gap-2 text-xs">
                                                <span className="text-slate-600 shrink-0">{row.icon}</span>
                                                <span className="text-slate-500 w-16 shrink-0">{row.label}</span>
                                                {row.link ? (
                                                    <a href={row.value} target="_blank" rel="noopener noreferrer"
                                                        className="text-brand-400 hover:underline truncate flex-1" title={row.value}>
                                                        {row.value!.replace(/^https?:\/\//, "").substring(0, 50)}
                                                    </a>
                                                ) : (
                                                    <span className="text-slate-300 truncate flex-1" title={row.value ?? undefined}>{row.value}</span>
                                                )}
                                            </div>
                                        ))}
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
                                                            <span className="text-xs font-medium text-white">{c.author}</span>
                                                            <span className="text-[10px] text-slate-600">
                                                                {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-slate-300">{c.body}</p>
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
    );
}

// ─── Create Bug Modal ─────────────────────────────────────────────────────────

function CreateBugModal({ projectId, devToken, onClose }: {
    projectId: Id<"projects">; devToken: string | null; onClose: () => void;
}) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState<Priority>("medium");
    const [loading, setLoading] = useState(false);
    const createBug = useMutation(api.bugs.dashboardManualCreateBug);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !devToken) return;
        setLoading(true);
        try {
            await createBug({ projectId, title: title.trim(), description: description.trim(), priority, devToken });
            onClose();
        } catch (err: any) {
            alert(err.message || "Failed to create bug");
        } finally {
            setLoading(false);
        }
    };

    return (
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
                    <div>
                        <label className="block text-xs text-slate-400 mb-1.5 font-medium">Priority</label>
                        <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="input w-full text-sm h-9">
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                        </select>
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
    );
}

// ─── DashboardContent ─────────────────────────────────────────────────────────

function DashboardContent({ rawProjectId }: { rawProjectId: string }) {
    const [devToken, setDevToken] = useState<string | null>(null);

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
    const [view, setView] = useState<"kanban" | "list" | "team" | "settings" | "integrations">("kanban");
    const [searchQuery, setSearchQuery] = useState("");

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
        return bug.title.toLowerCase().includes(q) || bug.url?.toLowerCase().includes(q);
    });

    const bugsByStatus = (status: Status) => filteredBugs.filter((b: any) => b.status === status);

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
            await updateStatus({ bugId: draggableId as Id<"bugs">, status: newStatus, devToken: token });
        } catch (error: any) {
            alert(error.message || "Failed to update status.");
        }
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

                {/* Toolbar */}
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <h2 className="font-semibold text-white">Issue Tracking</h2>
                    <div className="flex gap-1 p-1 bg-surface-card border border-surface-border rounded-lg">
                        {(["kanban", "list", "team", "integrations", "settings"] as const).map((v) => {
                            if (v === "team" && !canManageUsers) return null;
                            if (v === "integrations" && !canViewApi) return null;
                            if (v === "settings" && !canViewSettings) return null;
                            return (
                                <button
                                    key={v}
                                    onClick={() => setView(v)}
                                    className={`px-3 py-1 text-[10px] sm:text-xs font-medium rounded-md transition-all ${view === v ? "bg-brand-500 text-white" : "text-slate-400 hover:text-white"}`}
                                >
                                    {TAB_LABELS[v]}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Search / New Issue bar for list/kanban */}
                {(view === "kanban" || view === "list") && (
                    <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between mb-6">
                        <button onClick={() => setShowCreateBugModal(true)} className="btn-primary text-xs flex items-center gap-1.5 self-start">
                            <Plus className="w-3.5 h-3.5" /> New Issue
                        </button>
                        <div className="relative">
                            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                className="input pl-9 h-9 text-xs w-[220px]"
                                placeholder="Search issues…"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                )}

                {/* Views */}
                {view === "kanban" && (
                    <DragDropContext onDragEnd={handleDragEnd}>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 flex-1 items-start">
                            {COLUMNS.map((col) => (
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
            </div>

            {/* Modals */}
            {selectedBugId && (
                <BugDetailDrawer
                    bugId={selectedBugId}
                    onClose={() => setSelectedBugId(null)}
                    onStatusChange={async (s) => {
                        await updateStatus({ bugId: selectedBugId, status: s, devToken: devToken || undefined });
                    }}
                    devToken={devToken}
                    canDelete={canDeleteBugs}
                    canUpdate={canUpdateBugs}
                />
            )}
            {showCreateBugModal && projectId && (
                <CreateBugModal
                    projectId={projectId}
                    devToken={devToken}
                    onClose={() => setShowCreateBugModal(false)}
                />
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
