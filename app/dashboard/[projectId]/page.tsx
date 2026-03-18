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
    Book, Info, HelpCircle, AlertCircle, Edit2, Target, ChevronLeft, ChevronRight, Trash2
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

function Skeleton({ className }: { className?: string }) {
    return (
        <div className={`relative overflow-hidden bg-surface-border/50 rounded ${className}`}>
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
        </div>
    );
}

function PriorityBadge({ priority }: { priority: Priority }) {
    const cfg = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.medium;
    const icons = {
        low: <ChevronDown className="w-3 h-3" />,
        medium: <CircleDot className="w-3 h-3" />,
        high: <AlertTriangle className="w-3 h-3" />,
        critical: <AlertCircle className="w-3 h-3" />,
    };

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all hover:scale-105 active:scale-95 shadow-sm ${cfg.className}`}>
            {icons[priority]}
            {cfg.label}
        </span>
    );
}

function StatusBadge({ status, projectStatuses }: { status: Status; projectStatuses?: any[] }) {
    const s = projectStatuses?.find(ps => ps.value === status) || DEFAULT_COLUMNS.find(c => c.status === status) || { label: status, color: "text-slate-400" };

    const colorMap: Record<string, string> = {
        "text-blue-400": "bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]",
        "text-amber-400": "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]",
        "text-green-400": "bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]",
        "text-slate-500": "bg-slate-500/10 text-slate-400 border-slate-500/20",
        "text-red-400": "bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]",
        "text-indigo-400": "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.1)]",
        "text-purple-400": "bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.1)]",
        "text-pink-400": "bg-pink-500/10 text-pink-400 border-pink-500/20 shadow-[0_0_10px_rgba(236,72,153,0.1)]",
        "text-cyan-400": "bg-cyan-500/10 text-cyan-400 border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.1)]",
    };

    const badgeClass = colorMap[s.color] || "bg-slate-500/10 text-slate-400 border-slate-500/20";

    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all hover:brightness-110 ${badgeClass}`}>
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

function KanbanColumn({ status, label, icon, color, bugs, onSelect, onNavigateToLocation, canReorder, isFirst, isLast, onMoveLeft, onMoveRight, isReordering, onDeleteBucket, isSuperAdmin }: {
    status: Status; label: string; icon: React.ReactNode; color: string;
    bugs: any[]; onSelect: (id: Id<"bugs">) => void;
    onNavigateToLocation: (bug: any) => void;
    canReorder?: boolean;
    isFirst?: boolean;
    isLast?: boolean;
    onMoveLeft?: () => void;
    onMoveRight?: () => void;
    isReordering?: boolean;
    onDeleteBucket?: (status: string) => void;
    isSuperAdmin?: boolean;
}) {
    return (
        <Droppable droppableId={status}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex flex-col rounded-2xl border transition-all duration-300 min-h-[500px] ${snapshot.isDraggingOver
                        ? "border-brand-500/50 bg-brand-500/5 shadow-2xl shadow-brand-500/10"
                        : "border-surface-border bg-surface-card/30"
                        }`}
                >
                    {/* Column Header */}
                    <div className={`flex items-center gap-3 px-5 py-4 border-b border-surface-border/50 sticky top-0 z-30 bg-[#09090E]/80 backdrop-blur-xl rounded-t-2xl group`}>
                        <div className={`p-1.5 rounded-lg bg-surface-elevated border border-surface-border ${color}`}>
                            {icon || <CircleDot className="w-4 h-4" />}
                        </div>
                        <span className="text-sm font-bold text-white tracking-tight">{label}</span>
                        <span className="ml-auto bg-surface-elevated text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-surface-border">
                            {bugs.length}
                        </span>
                        {(canReorder || isSuperAdmin) && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {canReorder && (
                                    <>
                                        <button
                                            onClick={onMoveLeft}
                                            disabled={!!isFirst || isReordering}
                                            className="w-7 h-7 rounded-lg border border-surface-border bg-surface-elevated text-slate-500 hover:text-white disabled:opacity-30 flex items-center justify-center transition-all hover:border-slate-500"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={onMoveRight}
                                            disabled={!!isLast || isReordering}
                                            className="w-7 h-7 rounded-lg border border-surface-border bg-surface-elevated text-slate-500 hover:text-white disabled:opacity-30 flex items-center justify-center transition-all hover:border-slate-500"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                                {isSuperAdmin && onDeleteBucket && (
                                    <button
                                        onClick={() => {
                                            if (confirm(`Are you sure you want to delete the "${label}" bucket? All issues inside will be moved to "Open".`)) {
                                                onDeleteBucket(status);
                                            }
                                        }}
                                        className="w-7 h-7 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all"
                                        title="Delete bucket (Super Admin)"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Cards */}
                    <div className="flex-1 flex flex-col gap-4 p-4 overflow-y-auto min-h-0 custom-scrollbar">
                        {bugs.map((bug, index) => (
                            <Draggable key={bug._id} draggableId={bug._id} index={index}>
                                {(provided, snapshot) => {
                                    const priorityAccent: Record<string, string> = {
                                        critical: "before:bg-red-500",
                                        high:     "before:bg-amber-500",
                                        medium:   "before:bg-blue-500",
                                        low:      "before:bg-slate-600",
                                    };
                                    const accentClass = priorityAccent[bug.priority] ?? "before:bg-slate-600";

                                    return (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            onClick={() => onSelect(bug._id)}
                                            className={`group relative rounded-2xl border flex flex-col overflow-hidden cursor-pointer transition-all duration-300
                                                before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[3px] before:rounded-full ${accentClass}
                                                ${snapshot.isDragging
                                                    ? "border-brand-500 shadow-2xl shadow-brand-500/40 rotate-[1deg] bg-surface-elevated scale-[1.02] z-50"
                                                    : "border-surface-border/60 bg-surface-elevated/30 hover:border-brand-500/40 hover:bg-surface-elevated/70 hover:shadow-2xl hover:shadow-black/50 hover:-translate-y-1"
                                                }`}
                                        >
                                            {/* Screenshot preview */}
                                            {bug.screenshotUrl && bug.mediaType !== "video" && (
                                                <div className="w-full h-36 relative overflow-hidden shrink-0 border-b border-surface-border/40">
                                                    <img
                                                        src={bug.screenshotUrl}
                                                        alt={bug.title}
                                                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
                                                    />
                                                    {/* Slim fade only at bottom for chip readability */}
                                                    <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#09090E]/80 to-transparent" />
                                                    {/* Issue number chip */}
                                                    <div className="absolute bottom-2 left-3 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-sm text-[10px] font-black text-slate-300 border border-white/10">
                                                        {bug.issueNumber ? `#${bug.issueNumber}` : `#${index + 1}`}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="pl-5 pr-4 pt-3.5 pb-3 flex-1 flex flex-col gap-3">
                                                {/* Top row: issue # + action handle */}
                                                <div className="flex items-center justify-between">
                                                    {!bug.screenshotUrl && (
                                                        <span className="text-[10px] font-black text-slate-600 tracking-widest uppercase">
                                                            #{bug.issueNumber ?? (index + 1)}
                                                        </span>
                                                    )}
                                                    {bug.screenshotUrl && <span />}

                                                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                        {bug.url && bug.url !== "Unknown" && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); onNavigateToLocation(bug); }}
                                                                className="w-7 h-7 rounded-lg bg-surface-card border border-surface-border text-brand-400 hover:text-brand-300 hover:border-brand-500/50 flex items-center justify-center transition-all"
                                                                title="Locate on page"
                                                            >
                                                                <Target className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                        <div
                                                            {...provided.dragHandleProps}
                                                            className="w-7 h-7 rounded-lg bg-surface-card border border-surface-border text-slate-500 hover:text-white cursor-grab active:cursor-grabbing flex items-center justify-center transition-all"
                                                            title="Drag"
                                                        >
                                                            <GripVertical className="w-3.5 h-3.5" />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Title */}
                                                <h4 className="text-[13px] font-bold text-white leading-snug line-clamp-2 group-hover:text-brand-200 transition-colors tracking-tight -mt-1">
                                                    {bug.title}
                                                </h4>

                                                {/* Description */}
                                                {bug.description && (
                                                    <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2 -mt-1">
                                                        {bug.description}
                                                    </p>
                                                )}

                                                {/* Badges */}
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <PriorityBadge priority={bug.priority} />
                                                    {bug.type && bug.type !== "general" && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-brand-500/10 text-brand-400 border border-brand-500/20 capitalize">
                                                            {bug.type.replace(/-/g, ' ')}
                                                        </span>
                                                    )}
                                                    {bug.screenshotUrl && bug.mediaType === "video" && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20">
                                                            <Video className="w-3 h-3" /> Video
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Footer */}
                                                <div className="pt-2.5 mt-auto border-t border-surface-border/20 flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-600 font-medium">
                                                        <Clock className="w-3 h-3 shrink-0" />
                                                        <span className="truncate">{formatDistanceToNow(new Date(bug.createdAt), { addSuffix: true })}</span>
                                                    </div>
                                                    {bug.url && bug.url !== "Unknown" && (() => {
                                                        try {
                                                            return (
                                                                <div className="flex items-center gap-1 max-w-[110px] px-1.5 py-0.5 rounded-md bg-surface-card/60 border border-surface-border/40">
                                                                    <Globe className="w-2.5 h-2.5 text-slate-600 shrink-0" />
                                                                    <span className="truncate text-[9px] text-slate-600 tracking-wide">
                                                                        {new URL(bug.url).hostname.replace('www.', '')}
                                                                    </span>
                                                                </div>
                                                            );
                                                        } catch { return null; }
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                        {bugs.length === 0 && (
                            <div className="flex-1 flex flex-col items-center justify-center py-16 border-2 border-dashed border-surface-border/30 rounded-2xl m-2 group/empty transition-all hover:border-surface-border/60 hover:bg-surface-card/20">
                                <div className="w-12 h-12 rounded-2xl bg-surface-border/10 flex items-center justify-center mb-4 group-hover/empty:scale-110 group-hover/empty:bg-surface-border/20 transition-all duration-500">
                                    <Plus className="w-6 h-6 text-slate-700 group-hover/empty:text-slate-400" />
                                </div>
                                <p className="text-slate-600 text-xs font-bold uppercase tracking-widest group-hover/empty:text-slate-400">Empty</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Droppable>
    );
}

// ─── ListView ─────────────────────────────────────────────────────────────────

function ListView({ bugs, onSelect, onNavigateToLocation, projectStatuses }: { bugs: any[]; onSelect: (id: Id<"bugs">) => void; onNavigateToLocation: (bug: any) => void; projectStatuses: any[] }) {
    if (bugs.length === 0) {
        return (
            <div className="card p-12 text-center border-dashed border-2 bg-surface-card/20 border-surface-border/50 rounded-2xl">
                <div className="w-16 h-16 rounded-2xl bg-surface-card border border-surface-border flex items-center justify-center mx-auto mb-6 shadow-xl">
                    <Bug className="w-8 h-8 text-brand-400 opacity-20" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">No issues yet</h3>
                <p className="text-slate-500 max-w-sm mx-auto mb-6">Click &ldquo;+ New Issue&rdquo; to create your first bug report manually.</p>
            </div>
        );
    }

    return (
        <div className="bg-surface-card/30 border border-surface-border/50 rounded-2xl overflow-hidden backdrop-blur-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="border-b border-surface-border/50 text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold bg-[#09090E]/50">
                            <th className="px-4 py-4 text-left font-bold w-[60px]">#</th>
                            <th className="px-6 py-4 text-left font-bold">Issue Details</th>
                            <th className="px-6 py-4 text-left font-bold hidden md:table-cell">Status</th>
                            <th className="px-6 py-4 text-left font-bold hidden sm:table-cell">Priority</th>
                            <th className="px-6 py-4 text-left font-bold hidden lg:table-cell">Source URL</th>
                            <th className="px-6 py-4 text-left font-bold hidden md:table-cell">Reported</th>
                            <th className="px-6 py-4 text-right font-bold">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border/30">
                        {bugs.map((bug, index) => (
                            <tr
                                key={bug._id}
                                onClick={() => onSelect(bug._id)}
                                className="hover:bg-surface-elevated/40 cursor-pointer transition-all duration-200 group"
                            >
                                <td className="px-4 py-4">
                                    <div className="px-2 h-8 rounded-xl bg-surface-card border border-surface-border text-[10px] font-black text-slate-300 flex items-center justify-center min-w-[32px] shadow-sm">
                                        {bug.issueNumber ? `Bug ${bug.issueNumber}` : (index + 1)}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-4">
                                        <div className="relative shrink-0">
                                            {bug.screenshotUrl ? (
                                                <img
                                                    src={bug.screenshotUrl}
                                                    alt=""
                                                    className="w-10 h-10 rounded-xl object-cover border border-surface-border shadow-lg group-hover:scale-110 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-xl bg-surface-card border border-surface-border flex items-center justify-center shadow-lg group-hover:bg-surface-elevated transition-colors">
                                                    <Bug className="w-4 h-4 text-brand-400/50" />
                                                </div>
                                            )}
                                            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#09090E] ${
                                                bug.priority === 'critical' ? 'bg-red-500 animate-pulse' : 
                                                bug.priority === 'high' ? 'bg-amber-500' : 'bg-slate-500'
                                            }`} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-white text-[14px] leading-tight group-hover:text-brand-300 transition-colors truncate max-w-[300px]">{bug.title}</p>
                                            {bug.description ? (
                                                <p className="text-xs text-slate-500 mt-1 line-clamp-1 max-w-[300px]">{bug.description}</p>
                                            ) : (
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">No description</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 hidden md:table-cell">
                                    <StatusBadge status={bug.status} projectStatuses={projectStatuses} />
                                </td>
                                <td className="px-6 py-4 hidden sm:table-cell">
                                    <PriorityBadge priority={bug.priority} />
                                </td>
                                <td className="px-6 py-4 hidden lg:table-cell">
                                    {bug.url && bug.url !== "Unknown" ? (
                                        <div className="flex items-center gap-2 max-w-[200px]">
                                            <Globe className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                                            <span className="text-xs text-slate-400 truncate hover:text-brand-400 transition-colors" title={bug.url}>
                                                {bug.url.replace(/^https?:\/\//, "")}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">—</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 hidden md:table-cell">
                                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                        <Clock className="w-3.5 h-3.5 text-slate-600" />
                                        {formatDistanceToNow(new Date(bug.createdAt), { addSuffix: true })}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                        {bug.url && bug.url !== "Unknown" && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onNavigateToLocation(bug);
                                                }}
                                                className="p-2 rounded-xl bg-surface-card border border-surface-border text-brand-400 hover:text-brand-300 hover:border-brand-500/50 transition-all shadow-lg"
                                                title="Locate bug on page"
                                            >
                                                <Target className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSelect(bug._id);
                                            }}
                                            className="p-2 rounded-xl bg-surface-card border border-surface-border text-slate-400 hover:text-white transition-all shadow-lg"
                                            title="View issue details"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
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

    const widgetScript = `<script src="https://bug-higt.vercel.app/widget/bugscribe-widget.js"
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
                        <code className="text-slate-300">POST https://bug-higt.vercel.app/api/reports</code>
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
    const statusOptions = useQuery(api.statuses.getProjectStatuses, bug ? { projectId: bug.projectId, devToken: token } : "skip");
    const addComment = useMutation(api.comments.addComment);
    const deleteBug = useMutation(api.bugs.deleteBug);
    const updatePriority = useMutation(api.bugs.updatePriority);
    const updateBug = useMutation(api.bugs.updateBug);

    const isSuperAdmin = currentUser?.role === "super_admin";

    const [comment, setComment] = useState("");
    const [posting, setPosting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [activeTab, setActiveTab] = useState<"details" | "screenshot" | "env" | "console" | "network" | "activity">("details");
    const [showLightbox, setShowLightbox] = useState(false);

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
        {/* Lightbox Modal */}
        {showLightbox && bug?.screenshotUrl && (
            <div 
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-300"
                onClick={() => setShowLightbox(false)}
            >
                <div className="absolute top-6 right-6 flex items-center gap-3">
                    <a 
                        href={bug.screenshotUrl} 
                        download={`bugscribe-${bug._id}`}
                        onClick={e => e.stopPropagation()}
                        className="p-3 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all flex items-center gap-2 text-sm font-bold"
                    >
                        <Download className="w-5 h-5" /> Save
                    </a>
                    <button 
                        onClick={() => setShowLightbox(false)}
                        className="p-3 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-red-500/20 hover:border-red-500/50 transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="relative max-w-[90vw] max-h-[85vh] group/lightbox" onClick={e => e.stopPropagation()}>
                    {bug.mediaType === "video" ? (
                        <video 
                            src={bug.screenshotUrl} 
                            controls 
                            autoPlay 
                            className="w-full h-full object-contain rounded-2xl shadow-2xl border border-white/10" 
                        />
                    ) : (
                        <img 
                            src={bug.screenshotUrl} 
                            alt="Full Preview" 
                            className="w-full h-full object-contain rounded-2xl shadow-2xl border border-white/10 select-none" 
                        />
                    )}
                    
                    <div className="absolute -bottom-12 left-0 right-0 flex items-center justify-center gap-6 opacity-0 group-hover/lightbox:opacity-100 transition-opacity">
                        <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                            {bug.title}
                        </div>
                    </div>
                </div>
            </div>
        )}

        <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Drawer */}
            <div className="relative ml-auto w-full max-w-[580px] h-full bg-[#09090E] border-l border-surface-border flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right-8 duration-500">
                {!bug ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-surface-card border border-surface-border flex items-center justify-center animate-pulse">
                            <Bug className="w-6 h-6 text-brand-400 opacity-20" />
                        </div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest animate-pulse">Loading Issue...</p>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-surface-border/50 bg-[#09090E]/50 backdrop-blur-xl shrink-0">
                            <div className="flex items-start justify-between gap-6 mb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-xl bg-brand-500/10 border border-brand-500/20 shadow-inner group-hover:scale-110 transition-transform">
                                        <Bug className="w-3.5 h-3.5 text-brand-400" />
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em]">
                                            {bug.issueNumber ? `Bug ${bug.issueNumber}` : `Issue: ${bug._id.toString().substring(0, 8)}`}
                                        </span>
                                        <div className="flex items-center gap-1.5 text-[8px] font-bold text-slate-600 uppercase tracking-widest">
                                            <Clock className="w-2.5 h-2.5" />
                                            {formatDistanceToNow(new Date(bug.createdAt), { addSuffix: true })}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {shareUrl && (
                                        <button 
                                            onClick={() => {
                                                navigator.clipboard.writeText(shareUrl);
                                                alert("Link copied to clipboard!");
                                            }}
                                            className="p-2 rounded-xl bg-surface-card border border-surface-border text-slate-500 hover:text-brand-400 hover:border-brand-500/30 transition-all shadow-sm"
                                            title="Copy share link"
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                    <button onClick={onClose} className="p-2 rounded-xl bg-surface-card border border-surface-border text-slate-500 hover:text-red-400 hover:border-red-500/30 transition-all shadow-sm">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                            <h2 className="text-lg font-black text-white leading-[1.2] tracking-tight mb-3">{bug.title}</h2>
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <StatusBadge status={bug.status as Status} projectStatuses={statusOptions || []} />
                                <PriorityBadge priority={bug.priority as Priority} />
                                {bug.type && bug.type !== "general" && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-bold bg-white/5 text-slate-400 border border-white/10 uppercase tracking-widest">
                                        {bug.type.replace(/-/g, ' ')}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Large Image Preview (Cover) */}
                        {bug.screenshotUrl && (
                            <div 
                                className="w-full border-b border-surface-border bg-black/40 shrink-0 relative flex items-center justify-center overflow-hidden group/img cursor-zoom-in" 
                                style={{ maxHeight: '320px' }}
                                onClick={() => setShowLightbox(true)}
                            >
                                {bug.mediaType === "video" ? (
                                    <div className="relative w-full h-full flex items-center justify-center bg-black">
                                        <video
                                            src={bug.screenshotUrl}
                                            className="w-full h-full object-contain backdrop-blur-md opacity-70 group-hover/img:opacity-90 transition-opacity"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="p-5 rounded-full bg-brand-500/20 border border-brand-500/50 backdrop-blur-md text-brand-400 group-hover/img:scale-110 transition-transform">
                                                <Video className="w-8 h-8" />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <img
                                        src={bug.screenshotUrl}
                                        alt="Preview"
                                        className="w-full h-full object-contain backdrop-blur-md transition-transform duration-1000 group-hover/img:scale-110"
                                    />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#09090E] via-transparent to-transparent opacity-80" />
                                
                                <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between opacity-0 group-hover/img:opacity-100 transition-all transform translate-y-2 group-hover/img:translate-y-0">
                                    <span className="px-3 py-1.5 rounded-xl bg-[#09090E]/80 border border-surface-border text-[10px] font-black text-white uppercase tracking-[0.2em] backdrop-blur-md">
                                        Click to enlarge
                                    </span>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowLightbox(true);
                                        }}
                                        className="p-3 rounded-2xl bg-brand-500 text-white shadow-2xl shadow-brand-500/40 hover:scale-110 active:scale-95 transition-all"
                                    >
                                        <Eye className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Status & Priority Controls */}
                        <div className="grid grid-cols-2 gap-px bg-surface-border/30 border-b border-surface-border/30 shrink-0">
                            <div className="bg-[#09090E] p-4 group">
                                <label className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold block mb-2 transition-colors group-hover:text-brand-400">Status</label>
                                <select
                                    value={bug.status}
                                    onChange={(e) => onStatusChange(e.target.value as Status)}
                                    className="w-full bg-transparent text-sm font-bold text-white outline-none cursor-pointer appearance-none"
                                    disabled={!canUpdate}
                                >
                                    {(statusOptions && statusOptions.length ? statusOptions : DEFAULT_COLUMNS).map((status: any) => {
                                        const value = status.value ?? status.status;
                                        const label = status.label ?? value;
                                        return (
                                            <option key={value} value={value} className="bg-[#09090E]">
                                                {label}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                            <div className="bg-[#09090E] p-4 group">
                                <label className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold block mb-2 transition-colors group-hover:text-brand-400">Priority</label>
                                <select
                                    value={bug.priority}
                                    onChange={(e) => updatePriority({ bugId, priority: e.target.value as Priority, devToken: token })}
                                    className="w-full bg-transparent text-sm font-bold text-white outline-none cursor-pointer appearance-none"
                                    disabled={!canUpdate}
                                >
                                    <option value="low" className="bg-[#09090E]">Low</option>
                                    <option value="medium" className="bg-[#09090E]">Medium</option>
                                    <option value="high" className="bg-[#09090E]">High</option>
                                    <option value="critical" className="bg-[#09090E]">Critical</option>
                                </select>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-2 border-b border-surface-border/30 px-6 shrink-0 bg-[#09090E]/50 overflow-x-auto no-scrollbar">
                            {(["details", "screenshot", "env", "console", "network", "activity"] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`relative py-3.5 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === tab
                                        ? "text-brand-400"
                                        : "text-slate-500 hover:text-slate-300"
                                        }`}
                                >
                                    {tab === "env" ? "Environment" : tab === "activity" ? "Activity" : tab}
                                    {activeTab === tab && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 shadow-[0_0_12px_rgba(59,130,246,0.5)]" />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 custom-scrollbar">
0                            {activeTab === "details" && (
                                <div className="space-y-6">
                                    {/* Project Management & Assignment */}
                                    <div className="space-y-2.5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1 h-1 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(0,212,255,0.8)]" />
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Management & Assignment</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-white/[0.02] border border-white/5 rounded-xl p-3.5 shadow-inner">
                                            <div className="space-y-1 group/field">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-[8px] text-slate-500 uppercase tracking-widest font-black group-focus-within/field:text-brand-400 transition-colors">Issue Type</label>
                                                    {isSuperAdmin && canUpdate && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowQuickAddType(true)}
                                                            className="text-[8px] text-brand-400 hover:text-brand-300 transition-colors font-black"
                                                        >
                                                            + NEW
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="relative">
                                                    <select
                                                        value={bugType}
                                                        onChange={(e) => handleTypeChange(e.target.value)}
                                                        className="input w-full text-[10px] font-bold bg-white/5 border-white/5 focus:border-brand-500/50 appearance-none h-8.5 px-3"
                                                        disabled={!canUpdate || savingType}
                                                    >
                                                        <optgroup label="Core Types" className="bg-[#09090E]">
                                                            {BUG_TYPES.map(t => (
                                                                <option key={t.value} value={t.value}>{t.label}</option>
                                                            ))}
                                                        </optgroup>
                                                        {customModules && customModules.length > 0 && (
                                                            <optgroup label="Custom Modules" className="bg-[#09090E]">
                                                                {customModules.map((mod: any) => (
                                                                    <option key={mod.slug} value={mod.slug}>{mod.name}</option>
                                                                ))}
                                                            </optgroup>
                                                        )}
                                                    </select>
                                                    <ChevronDown className="w-3 h-3 text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                </div>
                                            </div>

                                            <div className="space-y-1 group/field">
                                                <label className="text-[8px] text-slate-500 uppercase tracking-widest font-black block group-focus-within/field:text-brand-400 transition-colors">Assignee</label>
                                                <div className="relative">
                                                    <select
                                                        value={selectedAssignee ?? ""}
                                                        onChange={(e) => handleAssigneeChange(e.target.value)}
                                                        className="input w-full text-[10px] font-bold bg-white/5 border-white/5 focus:border-brand-500/50 appearance-none h-8.5 px-3"
                                                        disabled={!canUpdate || savingAssignee}
                                                    >
                                                        <option value="" className="bg-[#09090E]">Unassigned</option>
                                                        {projectMembers.map((m: any) => (
                                                            <option key={m.userId} value={m.userId} className="bg-[#09090E]">
                                                                {m.name || m.email || m.userId}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <User className="w-3 h-3 text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                </div>
                                            </div>

                                            <div className="space-y-1 group/field">
                                                <label className="text-[8px] text-slate-500 uppercase tracking-widest font-black block group-focus-within/field:text-brand-400 transition-colors">Category</label>
                                                <div className="relative">
                                                    <input
                                                        value={bugCategory}
                                                        onChange={(e) => setBugCategory(e.target.value)}
                                                        onBlur={() => handleCategoryChange(bugCategory)}
                                                        placeholder="e.g. Authentication"
                                                        className="input w-full text-[10px] font-bold bg-white/5 border-white/5 focus:border-brand-500/50 h-8.5 px-3"
                                                        disabled={!canUpdate || savingCategory}
                                                    />
                                                    <Tag className="w-3 h-3 text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                </div>
                                            </div>

                                            <div className="space-y-1 group/field">
                                                <label className="text-[8px] text-slate-500 uppercase tracking-widest font-black block group-focus-within/field:text-brand-400 transition-colors">Due Date</label>
                                                <div className="relative">
                                                    <input
                                                        type="date"
                                                        value={dueDate}
                                                        onChange={(e) => handleDueDateChange(e.target.value)}
                                                        className="input w-full text-[10px] font-bold bg-white/5 border-white/5 focus:border-brand-500/50 h-8.5 px-3"
                                                        disabled={!canUpdate || savingDue}
                                                    />
                                                    <Calendar className="w-3 h-3 text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div className="space-y-2.5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1 h-1 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Description</span>
                                        </div>
                                        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3.5 text-[11px] text-slate-300 leading-relaxed shadow-inner relative group min-h-[60px]">
                                            <Edit2 className="w-3 h-3 text-slate-700 absolute top-3.5 right-3.5 group-hover:text-brand-400 transition-colors" />
                                            {bug.description || <span className="text-slate-600 italic">No description provided.</span>}
                                        </div>
                                    </div>

                                    {/* Labels & Tags */}
                                    <div className="space-y-2.5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1 h-1 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Labels & Tags</span>
                                            </div>
                                            {savingTags && <span className="text-[8px] font-black text-brand-400 animate-pulse">SAVING...</span>}
                                        </div>
                                        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-2.5 shadow-inner">
                                            <TagsInput tags={tagInput} onChange={handleSaveTags} disabled={!canUpdate} />
                                        </div>
                                    </div>

                                    {/* Steps to Reproduce */}
                                    {bug.steps && bug.steps.length > 0 && (
                                        <div className="space-y-2.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1 h-1 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(0,212,255,0.8)]" />
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Steps to Reproduce</span>
                                            </div>
                                            <div className="space-y-2 pl-2">
                                                {bug.steps.map((step: string, i: number) => (
                                                    <div key={i} className="flex gap-3 group/step relative before:absolute before:-left-2 before:top-6 before:bottom-0 before:w-px before:bg-slate-800 last:before:hidden">
                                                        <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[9px] font-black text-slate-500 group-hover/step:border-brand-500 group-hover/step:text-brand-400 transition-all shadow-inner group-hover/step:scale-110">
                                                            {i + 1}
                                                        </div>
                                                        <div className="flex-1 bg-white/[0.02] rounded-lg px-3 py-1.5 border border-transparent group-hover/step:border-white/5 transition-all text-[11px] text-slate-300 leading-relaxed shadow-sm">
                                                            {step}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Context Metadata Cards */}
                                    <div className="space-y-2.5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Environment Context</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2.5">
                                            {[
                                                { label: "Reporter", value: bug.reporterName || "Widget", icon: <User className="w-3 h-3" />, color: "text-blue-400" },
                                                { label: "Browser", value: bug.browser?.split(" ").slice(0, 2).join(" "), icon: <Monitor className="w-3 h-3" />, color: "text-purple-400" },
                                                { label: "OS", value: bug.os, icon: <Zap className="w-3 h-3" />, color: "text-amber-400" },
                                                { label: "Resolution", value: bug.screenResolution || (bug.screenWidth ? `${bug.screenWidth}×${bug.screenHeight}` : null), icon: <Monitor className="w-3 h-3" />, color: "text-emerald-400" },
                                            ].filter(r => r.value).map((row) => (
                                                <div key={row.label} className="bg-white/[0.02] border border-white/5 rounded-lg p-2.5 flex flex-col gap-1 group hover:bg-white/[0.04] transition-all">
                                                    <div className="flex items-center gap-1.5 text-slate-500">
                                                        <span className={row.color}>{row.icon}</span>
                                                        <span className="text-[8px] font-black uppercase tracking-widest">{row.label}</span>
                                                    </div>
                                                    <span className="text-[10px] font-black text-white truncate" title={row.value ?? undefined}>{row.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                        {(bug.url && bug.url !== "Unknown") && (
                                            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 flex items-center gap-3 group/url hover:bg-white/[0.04] transition-all shadow-inner">
                                                <div className="p-2 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-400 group-hover/url:scale-110 transition-transform">
                                                    <Globe className="w-3.5 h-3.5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Source URL</p>
                                                    <a href={bug.trackerUrl || bug.url} target="_blank" rel="noopener noreferrer"
                                                        className="text-[10px] font-bold text-brand-400 hover:text-brand-300 hover:underline truncate block transition-colors" title={bug.url}>
                                                        {bug.url}
                                                    </a>
                                                </div>
                                                <CopyButton text={bug.url} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Discussion Feed */}
                                    <div className="space-y-4 pt-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1 h-1 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(0,212,255,0.8)]" />
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Discussion ({bug.comments?.length ?? 0})</span>
                                        </div>
                                        <div className="space-y-4">
                                            {bug.comments?.map((c: any) => (
                                                <div key={c._id} className="flex gap-2.5 group/comment">
                                                    <div className="w-7 h-7 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0 shadow-inner group-hover/comment:scale-105 transition-transform">
                                                        <User className="w-3.5 h-3.5 text-brand-400" />
                                                    </div>
                                                    <div className="flex-1 space-y-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[10px] font-black text-white">{c.author}</span>
                                                            <div className="w-0.5 h-0.5 rounded-full bg-slate-800" />
                                                            <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">
                                                                {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                                                            </span>
                                                        </div>
                                                        <div className="bg-white/[0.03] border border-white/5 rounded-lg rounded-tl-none p-3 text-[11px] text-slate-300 shadow-sm leading-relaxed">
                                                            {c.body}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <form onSubmit={handleComment} className="pt-1">
                                            <div className="relative group">
                                                <input
                                                    value={comment}
                                                    onChange={(e) => setComment(e.target.value)}
                                                    placeholder="Reply to this thread..."
                                                    className="input w-full text-[10px] font-bold h-9.5 pl-4 pr-12 bg-white/5 border-white/5 focus:border-brand-500/50 transition-all rounded-lg shadow-inner placeholder:text-slate-700"
                                                />
                                                <button 
                                                    type="submit" 
                                                    disabled={posting || !comment.trim()} 
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-brand-400 hover:bg-brand-500/10 disabled:opacity-30 transition-all shadow-xl"
                                                >
                                                    <Send className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
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
                                <div className="space-y-8">
                                    {bug.environmentData ? (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">System Metadata</span>
                                            </div>
                                            
                                            {bug.userAgent && (
                                                <div className="space-y-3">
                                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">User Agent</p>
                                                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 font-mono text-[11px] text-slate-400 break-all leading-relaxed shadow-inner">
                                                        {bug.userAgent}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 gap-4">
                                                {bug.environmentData.windowSize && (
                                                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col gap-1.5 shadow-inner">
                                                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Window Size</span>
                                                        <span className="text-xs font-bold text-white font-mono">
                                                            {typeof bug.environmentData.windowSize === 'string' ? bug.environmentData.windowSize : `${bug.environmentData.windowSize.width}×${bug.environmentData.windowSize.height}`}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col gap-1.5 shadow-inner">
                                                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Screen Resolution</span>
                                                    <span className="text-xs font-bold text-white font-mono">{bug.screenResolution || "N/A"}</span>
                                                </div>
                                            </div>

                                            {bug.environmentData.cookies && (
                                                <div className="space-y-3">
                                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Session Cookies</p>
                                                    <div className="relative group">
                                                        <pre className="bg-black/40 border border-white/5 rounded-2xl p-5 text-[11px] text-brand-400 overflow-x-auto max-h-40 font-mono leading-relaxed shadow-inner custom-scrollbar">
                                                            {typeof bug.environmentData.cookies === "string"
                                                                ? bug.environmentData.cookies.substring(0, 1000)
                                                                : JSON.stringify(bug.environmentData.cookies, null, 2)}
                                                        </pre>
                                                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <CopyButton text={typeof bug.environmentData.cookies === "string" ? bug.environmentData.cookies : JSON.stringify(bug.environmentData.cookies)} />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {bug.environmentData.localStorage && (
                                                <div className="space-y-3">
                                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">LocalStorage Snapshot</p>
                                                    <div className="relative group">
                                                        <pre className="bg-black/40 border border-white/5 rounded-2xl p-5 text-[11px] text-emerald-400 overflow-x-auto max-h-60 font-mono leading-relaxed shadow-inner custom-scrollbar">
                                                            {bug.environmentData.localStorage.substring(0, 2000)}
                                                        </pre>
                                                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <CopyButton text={bug.environmentData.localStorage} />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-20 text-slate-700 bg-white/[0.01] border border-dashed border-white/5 rounded-3xl">
                                            <Monitor className="w-12 h-12 mb-4 opacity-20" />
                                            <p className="text-sm font-bold uppercase tracking-widest">No Environment Data</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === "console" && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Runtime Console Logs</span>
                                        </div>
                                        {bug.consoleErrors && bug.consoleErrors.length > 0 && (
                                            <span className="text-[10px] font-black bg-red-500/10 text-red-400 px-2.5 py-1 rounded-full border border-red-500/20">
                                                {bug.consoleErrors.length} ERRORS
                                            </span>
                                        )}
                                    </div>
                                    
                                    {bug.consoleErrors && bug.consoleErrors.length > 0 ? (
                                        <div className="space-y-3">
                                            {bug.consoleErrors.map((e: any, i: number) => (
                                                <div key={i} className="bg-red-500/[0.02] border border-red-500/10 rounded-2xl p-5 font-mono group hover:bg-red-500/[0.04] transition-all">
                                                    <div className="flex items-start gap-4">
                                                        <div className="p-1.5 rounded-lg bg-red-500/10 text-red-500 shrink-0">
                                                            <XCircle className="w-4 h-4" />
                                                        </div>
                                                        <div className="flex-1 min-w-0 space-y-3">
                                                            <div className="text-red-400 font-bold text-xs leading-relaxed break-all">
                                                                {typeof e === 'string' ? e : e.message}
                                                            </div>
                                                            {e.file && (
                                                                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase tracking-widest">
                                                                    <Globe className="w-3 h-3" />
                                                                    {e.file}:{e.line}:{e.column}
                                                                </div>
                                                            )}
                                                            {e.stack && (
                                                                <pre className="mt-3 text-[10px] text-slate-600 overflow-x-auto max-h-40 whitespace-pre-wrap leading-relaxed bg-black/20 p-4 rounded-xl border border-white/5 custom-scrollbar">
                                                                    {e.stack}
                                                                </pre>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-20 text-slate-700 bg-white/[0.01] border border-dashed border-white/5 rounded-3xl">
                                            <LayoutList className="w-12 h-12 mb-4 opacity-20" />
                                            <p className="text-sm font-bold uppercase tracking-widest">Console Clean</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === "network" && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Network Request Monitor</span>
                                        </div>
                                        {bug.networkLogs && bug.networkLogs.length > 0 && (
                                            <span className="text-[10px] font-black bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-full border border-amber-500/20">
                                                {bug.networkLogs.length} FAILED
                                            </span>
                                        )}
                                    </div>

                                    {bug.networkLogs && bug.networkLogs.length > 0 ? (
                                        <div className="space-y-3">
                                            {bug.networkLogs.map((log: any, i: number) => (
                                                <div key={i} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 font-mono group hover:bg-white/[0.04] transition-all shadow-sm">
                                                    <div className="flex items-center gap-4 mb-4">
                                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black ${log.status >= 500 ? 'bg-red-500/20 text-red-400 border border-red-500/20' : 'bg-amber-500/20 text-amber-400 border border-amber-500/20'}`}>
                                                            {log.status || 'FAIL'}
                                                        </span>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{log.method}</span>
                                                        <div className="ml-auto flex items-center gap-1.5 text-slate-600 text-[10px] font-black">
                                                            <Clock className="w-3 h-3" /> {log.responseTime}ms
                                                        </div>
                                                    </div>
                                                    <div className="text-xs font-bold text-white break-all leading-relaxed mb-3">{log.url}</div>
                                                    {log.error && (
                                                        <div className="text-red-400/80 text-[10px] font-medium bg-red-500/5 p-3 rounded-xl border border-red-500/10 italic">
                                                            {log.error}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-20 text-slate-700 bg-white/[0.01] border border-dashed border-white/5 rounded-3xl">
                                            <Globe className="w-12 h-12 mb-4 opacity-20" />
                                            <p className="text-sm font-bold uppercase tracking-widest">No Failed Requests</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === "activity" && (
                                <div className="space-y-8">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(0,212,255,0.8)]" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Activity Timeline</span>
                                        </div>
                                    </div>

                                    {!activities || activities.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-20 text-slate-700 bg-white/[0.01] border border-dashed border-white/5 rounded-3xl">
                                            <Activity className="w-12 h-12 mb-4 opacity-20" />
                                            <p className="text-sm font-bold uppercase tracking-widest">No Activity Yet</p>
                                        </div>
                                    ) : (
                                        <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-gradient-to-b before:from-brand-500/50 before:via-slate-800 before:to-transparent">
                                            {activities.map((act: any, idx: number) => (
                                                <div key={act._id} className="relative group/activity">
                                                    {/* Timeline Node */}
                                                    <div className="absolute -left-8 top-1.5 w-6 h-6 rounded-full bg-[#09090E] border-2 border-slate-800 flex items-center justify-center z-10 group-hover/activity:border-brand-500 group-hover/activity:scale-110 transition-all shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                                                        <div className="p-1 rounded-full text-slate-500 group-hover/activity:text-brand-400 transition-colors">
                                                            {ACTIVITY_ICONS[act.type] ?? <Activity className="w-3 h-3" />}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xs font-black text-white">{act.actorName}</span>
                                                            <div className="w-1 h-1 rounded-full bg-slate-800" />
                                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                                {act.type === "created" && "created this issue"}
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
                                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.02] border border-white/5 text-[10px] font-bold text-brand-400 font-mono shadow-inner">
                                                                <Hash className="w-3 h-3 text-slate-600" />
                                                                {act.detail}
                                                            </div>
                                                        )}

                                                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
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
    const addStatus = useMutation(api.statuses.addStatus);
    const moveStatus = useMutation(api.statuses.moveStatus);
    const deleteBucket = useMutation(api.projects.deleteBucket);

    const [selectedBugId, setSelectedBugId] = useState<Id<"bugs"> | null>(null);
    const [showCreateBugModal, setShowCreateBugModal] = useState(false);
    const [view, setView] = useState<string>("kanban");
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [priorityFilter, setPriorityFilter] = useState<string>("all");
    const [showAddBucketInput, setShowAddBucketInput] = useState(false);
    const [newBucketLabel, setNewBucketLabel] = useState("");
    const [addingBucket, setAddingBucket] = useState(false);
    const [movingBucketStatus, setMovingBucketStatus] = useState<string | null>(null);
    const kanbanScrollRef = useRef<HTMLDivElement | null>(null);

    const customModules = useQuery(api.modules.listModules, { devToken: devToken || undefined });
    const projectStatuses = useQuery(api.statuses.getProjectStatuses, projectId ? { projectId, devToken: devToken || undefined } : "skip");

    useEffect(() => {
        const param = searchParams?.get("bugId");
        if (param) {
            setSelectedBugId(param as Id<"bugs">);
        }
    }, [searchParams]);

    const currentUser = useQuery(api.users.currentUser, { devToken: devToken || undefined });
    const members = useQuery(api.projects.listMembers, projectId ? { projectId, devToken: devToken || undefined } : "skip");
    const myPermissions = useQuery(api.permissions.getMyPermissions, projectId ? { projectId, devToken: devToken || undefined } : "skip");

    const isProjectAdmin = Boolean(
        project?.userId === currentUser?.tokenIdentifier ||
        members?.find((m: any) => m.userId === currentUser?.tokenIdentifier && (m.role === "owner" || m.role === "admin")) ||
        currentUser?.role === "super_admin"
    );

    const canViewApi = myPermissions?.includes("view_api") || false;
    const canViewSettings = myPermissions?.includes("view_settings") || false;
    const canManageUsers = myPermissions?.includes("manage_users") || false;
    const canDeleteBugs = myPermissions?.includes("delete_bugs") || false;
    const canUpdateBugs = myPermissions?.includes("update_bugs") || false;
    const isSuperAdmin = currentUser?.role === "super_admin";
    const statusColumnCount = projectStatuses && projectStatuses.length ? projectStatuses.length : DEFAULT_COLUMNS.length;

    useEffect(() => {
        if (view === "kanban") {
            kanbanScrollRef.current?.scrollTo({ left: 0, behavior: "smooth" });
        }
    }, [statusColumnCount, view]);

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
        const matchesStatus = statusFilter === "all" || bug.status === statusFilter;
        const matchesPriority = priorityFilter === "all" || bug.priority === priorityFilter;
        return matchesSearch && matchesType && matchesStatus && matchesPriority;
    });

    const bugsByStatus = (status: Status) => filteredBugs.filter((b: any) => b.status === status);
    const kanbanColumns = ((projectStatuses && projectStatuses.length ? projectStatuses : DEFAULT_COLUMNS) as any[]).map((status: any) => {
        const normalizedStatus = status.value ?? status.status;
        const fallback = DEFAULT_COLUMNS.find(c => c.status === normalizedStatus);
        return {
            status: normalizedStatus,
            label: status.label ?? fallback?.label ?? normalizedStatus,
            color: status.color ?? fallback?.color ?? "text-slate-400",
            icon: fallback?.icon ?? <CircleDot className="w-4 h-4" />,
        };
    });

    const buildBugLocationUrl = (bug: any) => {
        if (bug?.trackerUrl) return bug.trackerUrl;
        if (!bug?.url || bug.url === "Unknown" || bug.url === "Dashboard") return "";
        return bug.url;
    };

    const navigateToBugLocation = (bug: any) => {
        const targetUrl = buildBugLocationUrl(bug);
        if (targetUrl) {
            window.open(targetUrl, "_blank", "noopener,noreferrer");
            return;
        }
        setSelectedBugId(bug._id);
    };

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

    const handleAddBucket = async () => {
        if (!projectId) return;
        const label = newBucketLabel.trim();
        if (!label) return;

        const token = devToken || localStorage.getItem("bugscribe_dev_token") || undefined;
        const colorPalette = ["text-indigo-400", "text-purple-400", "text-pink-400", "text-cyan-400", "text-red-400"];

        setAddingBucket(true);
        try {
            await addStatus({
                projectId,
                label,
                color: colorPalette[kanbanColumns.length % colorPalette.length],
                devToken: token,
            });
            setNewBucketLabel("");
            setShowAddBucketInput(false);
        } catch (error: any) {
            alert(error.message || "Failed to add bucket.");
        } finally {
            setAddingBucket(false);
        }
    };

    const handleDeleteBucket = async (status: string) => {
        if (!projectId) return;
        const token = devToken || localStorage.getItem("bugscribe_dev_token") || undefined;
        try {
            const result = await deleteBucket({
                projectId,
                status,
                devToken: token
            });
            alert(`Bucket deleted. ${result.movedCount} issues moved to "Open".`);
        } catch (error: any) {
            alert(error.message || "Failed to delete bucket.");
        }
    };

    const handleMoveBucket = async (statusValue: string, direction: "left" | "right") => {
        if (!projectId) return;
        const token = devToken || localStorage.getItem("bugscribe_dev_token") || undefined;
        setMovingBucketStatus(statusValue);
        try {
            await moveStatus({
                projectId,
                statusValue,
                direction,
                devToken: token,
            });
        } catch (error: any) {
            alert(error.message || "Failed to reorder bucket.");
        } finally {
            setMovingBucketStatus(null);
        }
    };

    const handleExportHTML = () => {
        if (!bugs || bugs.length === 0) {
            alert("No issues to export.");
            return;
        }

        const memberMap: Record<string, string> = {};
        members?.forEach((m: any) => {
            memberMap[m.userId] = m.name || m.email || m.userId;
        });

        const stats = {
            total: bugs.length,
            critical: bugs.filter((b: any) => b.priority === 'critical').length,
            high: bugs.filter((b: any) => b.priority === 'high').length,
            open: bugs.filter((b: any) => b.status === 'open').length,
            resolved: bugs.filter((b: any) => b.status === 'resolved').length,
        };

        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BugScribe Premium Report - ${project?.name}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        :root {
            --bg: #09090e;
            --card: #111118;
            --border: rgba(255,255,255,0.08);
            --text: #ffffff;
            --text-muted: #94a3b8;
            --brand: #6366f1;
            --critical: #ef4444;
            --high: #f59e0b;
            --medium: #3b82f6;
            --low: #10b981;
            --shadow: 0 20px 50px -12px rgba(0,0,0,0.5);
        }
        * { box-sizing: border-box; }
        body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background-color: var(--bg);
            color: var(--text);
            margin: 0;
            padding: 60px 20px;
            line-height: 1.6;
            -webkit-font-smoothing: antialiased;
        }
        .container { max-width: 1000px; margin: 0 auto; }
        .header {
            margin-bottom: 60px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 48px;
            font-weight: 800;
            letter-spacing: -0.04em;
            background: linear-gradient(to right, #fff, #94a3b8);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .header p {
            color: var(--text-muted);
            margin: 12px 0 0 0;
            font-size: 16px;
            font-weight: 500;
            letter-spacing: 0.01em;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 80px;
        }
        .stat-card {
            background: var(--card);
            border: 1px solid var(--border);
            padding: 24px;
            border-radius: 24px;
            box-shadow: var(--shadow);
            position: relative;
            overflow: hidden;
        }
        .stat-card::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; height: 2px;
            background: linear-gradient(90deg, transparent, var(--brand), transparent);
            opacity: 0.3;
        }
        .stat-card .label {
            color: var(--text-muted);
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            margin-bottom: 8px;
        }
        .stat-card .value {
            font-size: 32px;
            font-weight: 800;
            letter-spacing: -0.02em;
        }
        .section-title {
            font-size: 14px;
            font-weight: 800;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.2em;
            margin-bottom: 30px;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .section-title::after {
            content: '';
            flex: 1;
            height: 1px;
            background: var(--border);
        }
        .bug-card {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 32px;
            padding: 40px;
            margin-bottom: 40px;
            box-shadow: var(--shadow);
            transition: transform 0.3s ease;
        }
        .bug-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 32px;
        }
        .bug-id-tag {
            font-size: 10px;
            font-weight: 800;
            color: var(--brand);
            background: rgba(99,102,241,0.1);
            padding: 4px 12px;
            border-radius: 100px;
            margin-bottom: 12px;
            display: inline-block;
        }
        .bug-title {
            font-size: 24px;
            font-weight: 700;
            margin: 0;
            letter-spacing: -0.02em;
            line-height: 1.2;
        }
        .badges {
            display: flex;
            gap: 10px;
            margin-top: 16px;
        }
        .badge {
            font-size: 10px;
            font-weight: 700;
            padding: 6px 14px;
            border-radius: 12px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            border: 1px solid rgba(255,255,255,0.05);
        }
        .priority-critical { background: rgba(239, 68, 68, 0.15); color: #ef4444; border-color: rgba(239, 68, 68, 0.2); }
        .priority-high { background: rgba(245, 158, 11, 0.15); color: #f59e0b; border-color: rgba(245, 158, 11, 0.2); }
        .priority-medium { background: rgba(59, 130, 246, 0.15); color: #3b82f6; border-color: rgba(59, 130, 246, 0.2); }
        .priority-low { background: rgba(16, 185, 129, 0.15); color: #10b981; border-color: rgba(16, 185, 129, 0.2); }
        
        .metadata-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 30px;
            margin-top: 40px;
            padding-top: 40px;
            border-top: 1px solid var(--border);
        }
        .meta-item .label {
            font-size: 10px;
            font-weight: 800;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin-bottom: 6px;
        }
        .meta-item .value {
            font-size: 13px;
            font-weight: 600;
            color: #e2e8f0;
        }
        .desc-box {
            grid-column: span 3;
            background: rgba(255,255,255,0.02);
            padding: 24px;
            border-radius: 20px;
            font-size: 14px;
            color: #cbd5e1;
            border: 1px solid var(--border);
        }
        .screenshot-box {
            grid-column: span 3;
            margin-top: 10px;
        }
        .screenshot-box img {
            width: 100%;
            border-radius: 24px;
            border: 1px solid var(--border);
            box-shadow: 0 30px 60px -12px rgba(0,0,0,0.5);
        }
        .logs-box {
            grid-column: span 3;
            background: #000;
            padding: 24px;
            border-radius: 20px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
            color: #ef4444;
            max-height: 300px;
            overflow-y: auto;
            border: 1px solid rgba(239,68,68,0.2);
        }
        .footer {
            text-align: center;
            color: var(--text-muted);
            font-size: 12px;
            margin-top: 100px;
            font-weight: 600;
            letter-spacing: 0.05em;
        }
        @media print {
            body { padding: 0; background: white; color: black; }
            .bug-card, .stat-card { box-shadow: none; border: 1px solid #eee; background: white; }
            :root { --text: black; --text-muted: #666; --bg: white; --card: white; --brand: #000; }
            .header h1 { -webkit-text-fill-color: black; background: none; }
        }
        @media (max-width: 768px) {
            .summary-grid { grid-template-columns: repeat(2, 1fr); }
            .metadata-grid { grid-template-columns: 1fr; }
            .desc-box, .screenshot-box, .logs-box { grid-column: span 1; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${project?.name}</h1>
            <p>Intelligence Report • ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>

        <div class="summary-grid">
            <div class="stat-card">
                <div class="label">Total Scope</div>
                <div class="value">${stats.total}</div>
            </div>
            <div class="stat-card">
                <div class="label">Critical</div>
                <div class="value" style="color: var(--critical)">${stats.critical}</div>
            </div>
            <div class="stat-card">
                <div class="label">In Progress</div>
                <div class="value" style="color: var(--medium)">${bugs.filter((b: any) => b.status === 'in_progress').length}</div>
            </div>
            <div class="stat-card">
                <div class="label">Success Rate</div>
                <div class="value" style="color: var(--low)">${Math.round((stats.resolved / stats.total) * 100) || 0}%</div>
            </div>
        </div>

        <div class="section-title">Issue Manifest</div>

        ${bugs.map((bug: any) => `
            <div class="bug-card">
                <div class="bug-header">
                    <div style="flex: 1; min-w-0;">
                        <div class="bug-id-tag">${bug.issueNumber ? `BUG-${bug.issueNumber}` : `ID: ${bug._id.toString().substring(0, 8)}`}</div>
                        <h2 class="bug-title">${bug.title}</h2>
                        <div class="badges">
                            <span class="badge priority-${bug.priority}">${bug.priority}</span>
                            <span class="badge" style="background: rgba(255,255,255,0.05); color: #fff;">${bug.status.replace(/_/g, ' ')}</span>
                            <span class="badge" style="background: var(--brand); color: #fff; border: none;">${bug.type || 'General'}</span>
                        </div>
                    </div>
                    <div style="text-align: right; padding-left: 20px;">
                        <div style="color: var(--text-muted); font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">Detected</div>
                        <div style="font-size: 14px; font-weight: 800;">${new Date(bug.createdAt).toLocaleDateString()}</div>
                    </div>
                </div>

                <div class="metadata-grid">
                    <div class="meta-item">
                        <div class="label">Assigned Specialist</div>
                        <div class="value">${bug.assigneeId ? (memberMap[bug.assigneeId] || bug.assigneeId) : 'None'}</div>
                    </div>
                    <div class="meta-item">
                        <div class="label">Origin / Source</div>
                        <div class="value">${bug.reporterName || 'Automated'}</div>
                    </div>
                    <div class="meta-item">
                        <div class="label">Environment</div>
                        <div class="value">${bug.os || 'Unknown OS'} • ${bug.browser?.split(' ')[0] || 'Unknown Browser'}</div>
                    </div>
                    
                    ${bug.description ? `
                        <div class="desc-box">
                            <div class="label" style="font-size: 10px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; margin-bottom: 12px;">Context & Observations</div>
                            ${bug.description}
                        </div>
                    ` : ''}

                    ${bug.screenshotUrl ? `
                        <div class="screenshot-box">
                            <div class="label" style="font-size: 10px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; margin-bottom: 12px;">Visual Evidence</div>
                            <img src="${bug.screenshotUrl}" alt="Visual Evidence">
                        </div>
                    ` : ''}

                    ${bug.consoleErrors && bug.consoleErrors.length > 0 ? `
                        <div class="logs-box">
                            <div class="label" style="font-size: 10px; font-weight: 800; color: #ef4444; text-transform: uppercase; margin-bottom: 12px;">Runtime Exceptions</div>
                            ${bug.consoleErrors.map((err: any) => `> ${typeof err === 'string' ? err : err.message}`).join('<br/>')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('')}

        <div class="footer">
            GENERATED BY BUGSCRIBE • THE MODERN QUALITY STACK
        </div>
    </div>
</body>
</html>`;

        const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `bugscribe-premium-report-${project?.name.replace(/\s+/g, "-").toLowerCase()}.html`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
        <div className="min-h-screen flex flex-col bg-[#09090E]">
            <Navbar />
            <div className="flex-1 flex flex-col max-w-[1700px] mx-auto w-full px-6 sm:px-8 lg:px-10 py-10 gap-8">
                <div className="rounded-[28px] border border-surface-border/70 bg-surface-card/25 backdrop-blur-2xl p-6 lg:p-8 shadow-[0_18px_70px_-36px_rgba(0,0,0,0.9)]">
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                                <Link href="/" className="hover:text-brand-400 transition-all flex items-center gap-2 group">
                                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" /> Projects
                                </Link>
                                <span className="text-slate-800">/</span>
                                <span className="text-slate-400 truncate max-w-[240px]">{project.name}</span>
                            </div>
                            <div className="flex items-center gap-4 flex-wrap">
                                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                                    {project.name}
                                </h1>
                                {project.domain && (
                                    <a 
                                        href={project.domain.startsWith('http') ? project.domain : `https://${project.domain}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="p-2.5 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-brand-400 transition-all hover:border-brand-500/30 group shadow-xl"
                                        title="Visit website"
                                    >
                                        <ExternalLink className="w-4.5 h-4.5 group-hover:scale-110 transition-transform" />
                                    </a>
                                )}
                            </div>
                            <p className="text-slate-500 text-sm leading-relaxed max-w-2xl">
                                Real-time quality signals and operational insights for your product delivery.
                            </p>
                        </div>

                        {stats && (
                            <div className="flex flex-wrap gap-2 w-full xl:w-auto">
                                {/* Total */}
                                <div className="flex items-center gap-2 rounded-xl border border-surface-border/70 bg-gradient-to-br from-slate-500/20 to-transparent px-3 py-2 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 min-w-[80px]">
                                    <span className="p-1 rounded-lg bg-black/25 text-white shrink-0"><Hash className="w-3 h-3" /></span>
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black uppercase tracking-[0.15em] text-slate-500 leading-none">Total</span>
                                        <p className="text-base font-black text-white leading-tight">{stats.total}</p>
                                    </div>
                                </div>

                                {/* Critical */}
                                <div className="flex items-center gap-2 rounded-xl border border-surface-border/70 bg-gradient-to-br from-red-500/20 to-transparent px-3 py-2 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 min-w-[80px]">
                                    <span className="p-1 rounded-lg bg-black/25 text-red-400 shrink-0"><AlertTriangle className="w-3 h-3" /></span>
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black uppercase tracking-[0.15em] text-slate-500 leading-none">Critical</span>
                                        <p className="text-base font-black text-red-400 leading-tight">{stats.critical}</p>
                                    </div>
                                </div>

                                {/* One card per project status */}
                                {(projectStatuses && projectStatuses.length ? projectStatuses : DEFAULT_COLUMNS).map((ps: any) => {
                                    const statusValue = ps.value ?? ps.status;
                                    const statusLabel = ps.label;
                                    const statusColor = ps.color ?? "text-slate-400";

                                    const colorMap: Record<string, { gradient: string; text: string; icon: React.ReactNode }> = {
                                        "text-blue-400":   { gradient: "from-blue-500/20 to-transparent",   text: "text-blue-400",   icon: <CircleDot className="w-3 h-3" /> },
                                        "text-amber-400":  { gradient: "from-amber-500/20 to-transparent",  text: "text-amber-400",  icon: <Clock className="w-3 h-3" /> },
                                        "text-green-400":  { gradient: "from-green-500/20 to-transparent",  text: "text-green-400",  icon: <CheckCircle2 className="w-3 h-3" /> },
                                        "text-slate-500":  { gradient: "from-slate-500/20 to-transparent",  text: "text-slate-400",  icon: <XCircle className="w-3 h-3" /> },
                                        "text-indigo-400": { gradient: "from-indigo-500/20 to-transparent", text: "text-indigo-400", icon: <CircleDot className="w-3 h-3" /> },
                                        "text-purple-400": { gradient: "from-purple-500/20 to-transparent", text: "text-purple-400", icon: <CircleDot className="w-3 h-3" /> },
                                        "text-pink-400":   { gradient: "from-pink-500/20 to-transparent",   text: "text-pink-400",   icon: <CircleDot className="w-3 h-3" /> },
                                        "text-cyan-400":   { gradient: "from-cyan-500/20 to-transparent",   text: "text-cyan-400",   icon: <CircleDot className="w-3 h-3" /> },
                                        "text-red-400":    { gradient: "from-red-500/20 to-transparent",    text: "text-red-400",    icon: <AlertCircle className="w-3 h-3" /> },
                                    };
                                    const cfg = colorMap[statusColor] ?? { gradient: "from-slate-500/20 to-transparent", text: "text-slate-400", icon: <CircleDot className="w-3 h-3" /> };
                                    const count = (bugs ?? []).filter((b: any) => b.status === statusValue).length;

                                    return (
                                        <div key={statusValue} className={`flex items-center gap-2 rounded-xl border border-surface-border/70 bg-gradient-to-br ${cfg.gradient} px-3 py-2 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 min-w-[80px]`}>
                                            <span className={`p-1 rounded-lg bg-black/25 ${cfg.text} shrink-0`}>{cfg.icon}</span>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[8px] font-black uppercase tracking-[0.15em] text-slate-500 leading-none truncate">{statusLabel}</span>
                                                <p className={`text-base font-black ${cfg.text} leading-tight`}>{count}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="sticky top-5 z-40 bg-[#0A0A10]/80 backdrop-blur-3xl border border-white/5 rounded-[28px] px-5 lg:px-7 pt-4 pb-5 shadow-[0_28px_56px_-16px_rgba(0,0,0,0.6)]">
                    {/* Toolbar */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                        <div className="flex gap-1.5 p-1.5 bg-surface-card/50 border border-surface-border rounded-2xl w-full md:w-auto shadow-inner">
                            {(["kanban", "list"] as const).map((v) => (
                                <button
                                    key={v}
                                    onClick={() => setView(v)}
                                    className={`flex-1 md:flex-none px-6 py-2.5 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${view === v ? "bg-brand-500 text-white shadow-xl shadow-brand-500/25" : "text-slate-500 hover:text-slate-200 hover:bg-surface-elevated"}`}
                                >
                                    <span className="flex items-center gap-2.5 justify-center">
                                        {v === "kanban" ? <KanbanIcon className="w-4 h-4" /> : <LayoutList className="w-4 h-4" />}
                                        {TAB_LABELS[v]}
                                    </span>
                                </button>
                            ))}

                            <div className="w-px h-5 bg-surface-border my-auto mx-2 hidden md:block" />

                            {/* Admin Sections */}
                            <div className="flex gap-1.5">
                                {(["team", "integrations", "settings"] as const).map((v) => {
                                    if (v === "team" && !canManageUsers) return null;
                                    if (v === "integrations" && !canViewApi) return null;
                                    if (v === "settings" && !canViewSettings) return null;
                                    return (
                                        <button
                                            key={v}
                                            onClick={() => setView(v)}
                                            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${view === v ? "bg-brand-500 text-white shadow-xl shadow-brand-500/25" : "text-slate-500 hover:text-slate-300 hover:bg-surface-elevated"}`}
                                            title={TAB_LABELS[v]}
                                        >
                                            {v === "team" && <Users className="w-4 h-4" />}
                                            {v === "integrations" && <Zap className="w-4 h-4" />}
                                            {v === "settings" && <Settings className="w-4 h-4" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <button onClick={() => setShowCreateBugModal(true)} className="flex-1 md:flex-none btn-primary text-xs font-bold uppercase tracking-widest flex items-center gap-2.5 px-6 h-12 shadow-xl shadow-brand-500/20">
                                <Plus className="w-5 h-5" /> New Issue
                            </button>
                            {isProjectAdmin && (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleExportHTML}
                                        className="p-3 rounded-2xl border border-surface-border bg-surface-card text-brand-400 hover:text-brand-300 hover:border-brand-500/30 transition-all shadow-lg hover:bg-surface-elevated flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                                        title="Export all issues to HTML"
                                    >
                                        <Globe className="w-4 h-4" /> HTML
                                    </button>
                                    <button
                                        onClick={handleExport}
                                        className="p-3 rounded-2xl border border-surface-border bg-surface-card text-slate-400 hover:text-white hover:border-slate-500 transition-all shadow-lg hover:bg-surface-elevated flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                                        title="Export all issues to CSV"
                                    >
                                        <Download className="w-4 h-4" /> CSV
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Search / Filter bar for list/kanban */}
                    {(view === "kanban" || view === "list") && (
                        <div className="flex flex-col gap-6 pb-6">
                            <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
                                <div className="relative flex-1 group">
                                    <Search className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-brand-400 transition-colors" />
                                    <input
                                        type="text"
                                        className="input pl-12 h-12 text-sm w-full bg-surface-card/50 border-surface-border/50 focus:border-brand-500/50 transition-all rounded-2xl shadow-inner"
                                        placeholder="Search by title, URL, or ID..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 px-4 h-12 bg-surface-card/50 border border-surface-border/50 rounded-2xl shadow-inner">
                                        <CircleDot className="w-4 h-4 text-slate-500" />
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className="bg-transparent text-xs font-bold uppercase tracking-widest text-slate-300 outline-none w-[120px] cursor-pointer"
                                        >
                                            <option value="all">All Status</option>
                                            {kanbanColumns.map((statusCol) => (
                                                <option key={statusCol.status} value={statusCol.status}>
                                                    {statusCol.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-2 px-4 h-12 bg-surface-card/50 border border-surface-border/50 rounded-2xl shadow-inner">
                                        <AlertTriangle className="w-4 h-4 text-slate-500" />
                                        <select
                                            value={priorityFilter}
                                            onChange={(e) => setPriorityFilter(e.target.value)}
                                            className="bg-transparent text-xs font-bold uppercase tracking-widest text-slate-300 outline-none w-[120px] cursor-pointer"
                                        >
                                            <option value="all">All Priority</option>
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                            <option value="critical">Critical</option>
                                        </select>
                                    </div>
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
                {bugs?.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="w-20 h-20 rounded-2xl bg-surface-card border border-surface-border flex items-center justify-center mb-6 shadow-2xl">
                            <Bug className="w-10 h-10 text-brand-400 opacity-20" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No bugs reported yet</h3>
                        <p className="text-slate-500 max-w-sm mb-8 leading-relaxed">
                            Start capturing issues by connecting your website with the BugScribe extension or embedding the widget script.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setView("integrations")} className="btn-primary">
                                <Zap className="w-4 h-4" /> Get Connection Key
                            </button>
                            <button onClick={() => setShowCreateBugModal(true)} className="btn-ghost">
                                <Plus className="w-4 h-4" /> Manual Report
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {view === "kanban" && (
                            <DragDropContext onDragEnd={handleDragEnd}>
                                <div ref={kanbanScrollRef} className="overflow-x-auto pb-2">
                                    <div className="flex gap-4 items-start min-w-max">
                                    {kanbanColumns.map((col: { status: string; label: string; icon: React.ReactNode; color: string }) => (
                                        <div key={col.status} className="w-[320px] shrink-0">
                                            <KanbanColumn
                                                {...col}
                                                bugs={bugsByStatus(col.status)}
                                                onSelect={setSelectedBugId}
                                                onNavigateToLocation={navigateToBugLocation}
                                                canReorder={isProjectAdmin}
                                                isFirst={kanbanColumns[0]?.status === col.status}
                                                isLast={kanbanColumns[kanbanColumns.length - 1]?.status === col.status}
                                                onMoveLeft={() => handleMoveBucket(col.status, "left")}
                                                onMoveRight={() => handleMoveBucket(col.status, "right")}
                                                isReordering={movingBucketStatus === col.status}
                                                onDeleteBucket={handleDeleteBucket}
                                                isSuperAdmin={isSuperAdmin}
                                            />
                                        </div>
                                    ))}
                                    {isProjectAdmin && (
                                        <div className="w-[320px] shrink-0 rounded-2xl border border-dashed border-surface-border/50 bg-surface-card/10 min-h-[500px] p-6 flex flex-col group/add transition-all hover:bg-surface-card/20 hover:border-surface-border">
                                            <button
                                                onClick={() => setShowAddBucketInput(true)}
                                                className="text-sm font-bold text-slate-500 flex items-center gap-3 hover:text-brand-400 transition-all uppercase tracking-[0.2em]"
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-surface-card border border-surface-border flex items-center justify-center group-hover/add:scale-110 group-hover/add:border-brand-500/50 transition-all shadow-xl">
                                                    <Plus className="w-5 h-5" />
                                                </div>
                                                Add Bucket
                                            </button>
                                            {showAddBucketInput && (
                                                <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                    <input
                                                        type="text"
                                                        className="input w-full text-sm font-semibold h-11 bg-surface-card/50 border-surface-border/50 focus:border-brand-500/50"
                                                        placeholder="Bucket name..."
                                                        autoFocus
                                                        value={newBucketLabel}
                                                        onChange={(e) => setNewBucketLabel(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter") {
                                                                e.preventDefault();
                                                                handleAddBucket();
                                                            }
                                                            if (e.key === "Escape") {
                                                                setShowAddBucketInput(false);
                                                                setNewBucketLabel("");
                                                            }
                                                        }}
                                                    />
                                                    <div className="flex gap-2">
                                                        <button 
                                                            onClick={handleAddBucket} 
                                                            disabled={addingBucket || !newBucketLabel.trim()}
                                                            className="btn-primary flex-1 h-10 text-xs font-bold uppercase tracking-widest"
                                                        >
                                                            {addingBucket ? "Adding..." : "Add"}
                                                        </button>
                                                        <button 
                                                            onClick={() => { setShowAddBucketInput(false); setNewBucketLabel(""); }}
                                                            className="btn-ghost px-4 h-10 text-xs font-bold uppercase tracking-widest"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    </div>
                                </div>
                            </DragDropContext>
                        )}
                        {view === "list" && <ListView bugs={filteredBugs} onSelect={setSelectedBugId} onNavigateToLocation={navigateToBugLocation} projectStatuses={projectStatuses || []} />}
                    </>
                )}

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
        <div className="min-h-screen flex flex-col bg-[#09090E]">
            <Navbar />
            <div className="flex-1 flex flex-col max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
                {/* Header Skeleton */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Skeleton className="w-20 h-4 rounded" />
                            <div className="w-1 h-1 rounded-full bg-slate-800" />
                            <Skeleton className="w-32 h-4 rounded" />
                        </div>
                        <Skeleton className="w-64 h-10 rounded-xl" />
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                        {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="min-w-[100px] h-20 rounded-2xl" />
                        ))}
                    </div>
                </div>

                {/* Toolbar Skeleton */}
                <div className="bg-surface-card/30 border border-surface-border/50 rounded-2xl p-4 mb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex gap-1 p-1 bg-surface-card/50 border border-surface-border rounded-xl w-full md:w-auto">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="w-24 h-10 rounded-lg" />
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <Skeleton className="w-32 h-10 rounded-xl" />
                            <Skeleton className="w-10 h-10 rounded-xl" />
                        </div>
                    </div>
                </div>

                {/* Kanban Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex flex-col gap-4">
                            <Skeleton className="w-full h-14 rounded-xl" />
                            {[1, 2, 3].map((j) => (
                                <div key={j} className="p-4 rounded-2xl border border-surface-border bg-surface-card/50 space-y-4">
                                    <Skeleton className="w-full h-32 rounded-xl" />
                                    <Skeleton className="w-3/4 h-5 rounded-lg" />
                                    <div className="flex gap-2">
                                        <Skeleton className="w-16 h-5 rounded-full" />
                                        <Skeleton className="w-16 h-5 rounded-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Page Entry ───────────────────────────────────────────────────────────────

export default function DashboardPage({ params }: { params: Promise<{ projectId: string }> }) {
    const resolvedParams = use(params);
    return <DashboardContent rawProjectId={resolvedParams.projectId} />;
}
