/* eslint-disable react-hooks/rules-of-hooks */
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
    Book, Info, HelpCircle, AlertCircle, Edit2, Target, ChevronLeft, ChevronRight, Trash2, Upload
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { formatDistanceToNow } from "date-fns";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { GrammarChecker } from "@/components/GrammarChecker";
import { ImportBugsModal } from "@/components/ImportBugsModal";
import { ExportDropdown } from "@/components/ExportDropdown";
import { exportBugsWithImages } from "@/lib/exportWithImages";

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
        <div className={`relative overflow-hidden bg-surface-border/50 rounded ${className}`} suppressHydrationWarning>
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" suppressHydrationWarning />
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

function KanbanColumn({ status, label, icon, color, bugs, onSelect, onNavigateToLocation, canReorder, isFirst, isLast, onMoveLeft, onMoveRight, isReordering, onDeleteBucket, isSuperAdmin, onAddIssue, showScreenshot, members }: {
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
    onAddIssue?: (status: string) => void;
    showScreenshot?: boolean;
    members?: any[];
}) {
    return (
        <Droppable droppableId={status}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex flex-col rounded-2xl transition-all duration-200 min-h-[600px] border-2 ${snapshot.isDraggingOver
                        ? "bg-blue-50 border-blue-300 shadow-lg shadow-blue-200/50"
                        : "bg-white border-slate-200 shadow-sm hover:shadow-md"
                        }`}
                >
                    {/* Column Header - Cleaner Design */}
                    <div className={`flex items-center justify-between px-5 py-4 border-b-2 border-slate-200/80 bg-gradient-to-r from-white via-slate-50/50 to-white rounded-t-2xl group`}>
                        <div className="flex items-center gap-3">
                            <div className={`flex items-center gap-2.5 ${color}`}>
                                {icon || <CircleDot className="w-5 h-5" />}
                                <span className="text-sm font-bold text-slate-800">{label}</span>
                            </div>
                            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                                {bugs.length}
                            </span>
                        </div>
                        {(canReorder || isSuperAdmin) && (
                            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                {canReorder && (
                                    <>
                                        <button
                                            onClick={onMoveLeft}
                                            disabled={!!isFirst || isReordering}
                                            className="w-7 h-7 rounded-lg border border-slate-300 bg-white text-slate-600 hover:text-slate-800 hover:bg-slate-50 disabled:opacity-30 flex items-center justify-center transition-all shadow-sm hover:shadow"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={onMoveRight}
                                            disabled={!!isLast || isReordering}
                                            className="w-7 h-7 rounded-lg border border-slate-300 bg-white text-slate-600 hover:text-slate-800 hover:bg-slate-50 disabled:opacity-30 flex items-center justify-center transition-all shadow-sm hover:shadow"
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
                                        className="w-7 h-7 rounded-lg border border-red-300 bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-all shadow-sm hover:shadow"
                                        title="Delete bucket (Super Admin)"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Cards */}
                    <div className="flex-1 flex flex-col gap-2.5 p-3 overflow-y-auto min-h-0 custom-scrollbar">
                        {bugs.map((bug, index) => (
                            <Draggable key={bug._id} draggableId={bug._id} index={index}>
                                {(provided, snapshot) => {
                                    const priorityConfig: Record<string, { bg: string; border: string; text: string; dot: string }> = {
                                        critical: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", dot: "bg-red-500" },
                                        high:     { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", dot: "bg-amber-500" },
                                        medium:   { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", dot: "bg-blue-500" },
                                        low:      { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-600", dot: "bg-slate-400" },
                                    };
                                    const priorityCfg = priorityConfig[bug.priority] ?? priorityConfig.medium;

                                    return (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            onClick={() => onSelect(bug._id)}
                                            className={`group relative rounded-2xl bg-white border-2 flex flex-col overflow-hidden cursor-pointer transition-all duration-200 ${
                                                snapshot.isDragging
                                                    ? "shadow-2xl shadow-blue-500/30 scale-105 z-50 border-blue-400"
                                                    : "border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-slate-300"
                                            }`}
                                        >
                                            {/* Card Content */}
                                            <div className="p-4 flex flex-col">
                                                {/* Header: Issue Number + Category */}
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                        {/* Issue Number */}
                                                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 border border-slate-200">
                                                            <Hash className="w-3 h-3 text-slate-400" />
                                                            <span className="text-[10px] font-bold text-slate-600">
                                                                {bug.issueNumber ?? (index + 1)}
                                                            </span>
                                                        </div>
                                                        {/* Category */}
                                                        {bug.type && bug.type !== "general" && (
                                                            <span className="px-2 py-1 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 capitalize">
                                                                {bug.type.replace(/_/g, ' ')}
                                                            </span>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Action Buttons */}
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {bug.url && bug.url !== "Unknown" && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); onNavigateToLocation(bug); }}
                                                                className="w-7 h-7 rounded-md bg-slate-50 border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 flex items-center justify-center transition-all"
                                                                title="Locate on page"
                                                            >
                                                                <Target className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                        <div
                                                            {...provided.dragHandleProps}
                                                            className="w-7 h-7 rounded-md bg-slate-50 border border-slate-200 text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing flex items-center justify-center transition-all"
                                                            title="Drag to move"
                                                        >
                                                            <GripVertical className="w-3.5 h-3.5" />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Title */}
                                                <h4 className="text-sm font-bold text-slate-800 leading-snug line-clamp-2 mb-2">
                                                    {bug.title}
                                                </h4>

                                                {/* Description */}
                                                {bug.description && bug.description !== "No description provided" && (
                                                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-3">
                                                        {bug.description}
                                                    </p>
                                                )}

                                                {/* Tags + Assignee Row */}
                                                {(bug.tags?.length > 0 || bug.assigneeId) && (
                                                    <div className="flex items-center gap-1.5 flex-wrap mb-3">
                                                        {(bug.tags as string[])?.slice(0, 3).map((tag: string) => (
                                                            <span key={tag} className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                                                                #{tag}
                                                            </span>
                                                        ))}
                                                        {bug.assigneeId && members?.find((m: any) => m.userId === bug.assigneeId) && (
                                                            <span className="ml-auto flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 text-[9px] font-semibold">
                                                                <User className="w-2.5 h-2.5" />
                                                                {members?.find((m: any) => m.userId === bug.assigneeId)?.name?.split(' ')[0] || members?.find((m: any) => m.userId === bug.assigneeId)?.email?.split('@')[0] || 'Assigned'}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Priority Badge */}
                                                <div className="mb-3">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${priorityCfg.bg} ${priorityCfg.border} ${priorityCfg.text} border uppercase tracking-wide`}>
                                                        {bug.priority}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Screenshot Preview */}
                                            {showScreenshot !== false && bug.screenshotUrl && (
                                                <div className="relative aspect-video overflow-hidden border-t border-slate-100 bg-slate-50">
                                                    {bug.mediaType === "video" ? (
                                                        <div className="w-full h-full flex items-center justify-center relative">
                                                            <video src={bug.screenshotUrl} className="w-full h-full object-cover" />
                                                            <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                                                                <div className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-slate-600 border border-white shadow-lg">
                                                                    <Video className="w-5 h-5" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <img
                                                                src={bug.screenshotUrl}
                                                                alt={bug.title}
                                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                            />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        </>
                                                    )}
                                                </div>
                                            )}

                                            {/* Footer */}
                                            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    {/* User Avatar */}
                                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
                                                        {(bug.reporterName || bug.reporterEmail || 'U')[0].toUpperCase()}
                                                    </div>
                                                    <span className="text-[10px] text-slate-500 font-medium">
                                                        {formatDistanceToNow(new Date(bug.createdAt), { addSuffix: true })}
                                                    </span>
                                                </div>
                                                
                                                {/* Domain Badge */}
                                                {bug.url && bug.url !== "Unknown" && (() => {
                                                    try {
                                                        return (
                                                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 shadow-sm">
                                                                <Globe className="w-3 h-3 text-slate-400 shrink-0" />
                                                                <span className="truncate text-[9px] text-slate-500 font-medium max-w-[70px]">
                                                                    {new URL(bug.url).hostname.replace('www.', '')}
                                                                </span>
                                                            </div>
                                                        );
                                                    } catch { return null; }
                                                })()}
                                            </div>
                                        </div>
                                    );
                                }}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                        {bugs.length === 0 && onAddIssue && (
                            <button
                                onClick={() => onAddIssue(status)}
                                className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed border-slate-300 rounded-2xl m-3 group/empty transition-all hover:border-blue-500 hover:bg-blue-50/50 cursor-pointer active:scale-95"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center mb-4 group-hover/empty:from-blue-200 group-hover/empty:to-blue-100 group-hover/empty:scale-110 transition-all duration-300 shadow-sm group-hover/empty:shadow-md">
                                    <Plus className="w-6 h-6 text-blue-500 group-hover/empty:text-blue-600" />
                                </div>
                                <p className="text-slate-600 text-sm font-bold group-hover/empty:text-blue-600 transition-colors">Add issue</p>
                                <p className="text-slate-400 text-xs mt-1">Click to create</p>
                            </button>
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
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 border-2 border-slate-200 flex items-center justify-center mx-auto mb-6">
                    <Bug className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">No issues yet</h3>
                <p className="text-slate-500 max-w-sm mx-auto mb-6">Click &ldquo;+ New Issue&rdquo; to create your first bug report manually.</p>
            </div>
        );
    }

    return (
        <div className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="border-b-2 border-slate-200 text-[11px] text-slate-600 uppercase tracking-wide font-bold bg-slate-50">
                            <th className="px-4 py-4 text-left font-bold w-[60px]">#</th>
                            <th className="px-6 py-4 text-left font-bold">Issue Details</th>
                            <th className="px-6 py-4 text-left font-bold hidden md:table-cell">Status</th>
                            <th className="px-6 py-4 text-left font-bold hidden sm:table-cell">Priority</th>
                            <th className="px-6 py-4 text-left font-bold hidden lg:table-cell">Source URL</th>
                            <th className="px-6 py-4 text-left font-bold hidden md:table-cell">Reported</th>
                            <th className="px-6 py-4 text-right font-bold">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {bugs.map((bug, index) => (
                            <tr
                                key={bug._id}
                                onClick={() => onSelect(bug._id)}
                                className="hover:bg-slate-50 cursor-pointer transition-all duration-200 group"
                            >
                                <td className="px-4 py-4">
                                    <div className="px-2 h-8 rounded-lg bg-slate-100 border border-slate-200 text-[10px] font-black text-slate-700 flex items-center justify-center min-w-[32px]">
                                        {bug.issueNumber ? `#${bug.issueNumber}` : `#${index + 1}`}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-4">
                                        <div className="relative shrink-0">
                                            {bug.screenshotUrl ? (
                                                <img
                                                    src={bug.screenshotUrl}
                                                    alt=""
                                                    className="w-10 h-10 rounded-lg object-cover border-2 border-slate-200 group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-lg bg-slate-50 border-2 border-slate-200 flex items-center justify-center group-hover:bg-slate-100 transition-colors">
                                                    <Bug className="w-4 h-4 text-slate-400" />
                                                </div>
                                            )}
                                            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                                                bug.priority === 'critical' ? 'bg-red-500 animate-pulse' : 
                                                bug.priority === 'high' ? 'bg-amber-500' : 
                                                bug.priority === 'medium' ? 'bg-blue-500' : 'bg-slate-400'
                                            }`} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-slate-800 text-[14px] leading-tight group-hover:text-cyan-600 transition-colors truncate max-w-[300px]">{bug.title}</p>
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
                                            <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                            <span className="text-xs text-slate-600 truncate hover:text-cyan-600 transition-colors" title={bug.url}>
                                                {bug.url.replace(/^https?:\/\//, "")}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">—</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 hidden md:table-cell">
                                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                        <Clock className="w-3.5 h-3.5 text-slate-400" />
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
                                                className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 hover:border-cyan-300 transition-all"
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
                                            className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-all"
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
        owner: "bg-purple-100 text-purple-700 border border-purple-200",
        admin: "bg-amber-100 text-amber-700 border border-amber-200",
        editor: "bg-blue-100 text-blue-700 border border-blue-200",
        viewer: "bg-slate-100 text-slate-600 border border-slate-200",
    };

    return (
        <div className="max-w-2xl space-y-6">
            {/* Member List */}
            <div className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b-2 border-slate-200 flex items-center gap-2 bg-slate-50">
                    <Users className="w-4 h-4 text-cyan-600" />
                    <h3 className="text-sm font-semibold text-slate-800">Team Members</h3>
                    <span className="ml-auto text-xs text-slate-500 font-medium">{members.length} member{members.length !== 1 ? "s" : ""}</span>
                </div>
                {members.length === 0 ? (
                    <div className="px-4 py-8 text-center text-slate-500 text-sm">No team members yet</div>
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {members.map((m) => (
                            <li key={m._id} className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shrink-0 shadow-sm">
                                    <User className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-800 truncate">{m.name || m.email || m.userId}</p>
                                    {m.name && m.email && (
                                        <p className="text-xs text-slate-500 truncate">{m.email}</p>
                                    )}
                                </div>
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full capitalize ${roleColors[m.role] ?? roleColors.viewer}`}>
                                    {m.role}
                                </span>
                                {isAdmin && m.role !== "owner" && (
                                    <button
                                        onClick={() => handleRemove(m._id)}
                                        className="p-2 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all"
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
                <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <UserPlus className="w-4 h-4 text-cyan-600" />
                        <h3 className="text-sm font-semibold text-slate-800">Invite Member</h3>
                    </div>
                    {error && <p className="text-xs text-red-600 mb-3 p-3 bg-red-50 rounded-lg border border-red-200">{error}</p>}
                    {success && <p className="text-xs text-green-600 mb-3 p-3 bg-green-50 rounded-lg border border-green-200">{success}</p>}
                    <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-2">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="member@company.com"
                            className="input flex-1 text-sm h-10 bg-white border-slate-200 text-slate-800"
                            required
                        />
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value as any)}
                            className="input text-sm h-10 w-full sm:w-auto bg-white border-slate-200 text-slate-800"
                        >
                            <option value="admin">Admin</option>
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>
                        </select>
                        <button type="submit" disabled={loading} className="bg-cyan-500 hover:bg-cyan-600 text-white text-sm h-10 px-5 rounded-lg font-semibold transition-colors whitespace-nowrap disabled:opacity-50">
                            {loading ? "Inviting…" : "Invite"}
                        </button>
                    </form>
                    <p className="text-xs text-slate-500 mt-3">The user must have a BugScribe account before being invited.</p>
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
    const [togglingReporting, setTogglingReporting] = useState(false);
    const updateProject = useMutation(api.projects.updateProject);
    const toggleReportingMutation = useMutation(api.projects.toggleReporting);

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

    const handleToggleReporting = async (enabled: boolean) => {
        setTogglingReporting(true);
        try {
            await toggleReportingMutation({
                projectId: project._id,
                enabled,
                devToken: devToken || undefined
            });
        } catch (err: any) {
            alert(err.message || "Failed to toggle bug reporting");
        } finally {
            setTogglingReporting(false);
        }
    };

    return (
        <div className="max-w-2xl space-y-6">
            {/* Project Details */}
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                    <Settings className="w-5 h-5 text-cyan-600" />
                    <h3 className="text-base font-bold text-slate-800">Project Settings</h3>
                </div>
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="block text-xs text-slate-600 mb-2 font-semibold">Project Name</label>
                        <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-lg text-sm text-slate-800 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 transition-all" required />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-600 mb-2 font-semibold">Domain / URL</label>
                        <input
                            value={domain}
                            onChange={(e) => setDomain(e.target.value)}
                            placeholder="https://yoursite.com"
                            className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-lg text-sm text-slate-800 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-600 mb-2 font-semibold">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            placeholder="What is this project about?"
                            className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-lg text-sm text-slate-800 resize-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 transition-all"
                        />
                    </div>
                    <div className="flex justify-end pt-2">
                        <button type="submit" disabled={saving || !isAdmin} className="bg-cyan-500 hover:bg-cyan-600 text-white text-sm h-10 px-6 rounded-lg font-semibold transition-colors disabled:opacity-50">
                            {saved ? "✓ Saved!" : saving ? "Saving…" : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>

            {/* API Key */}
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <Key className="w-5 h-5 text-cyan-600" />
                    <h3 className="text-base font-bold text-slate-800">API Key</h3>
                </div>
                <p className="text-xs text-slate-600 mb-4">Use this key to authenticate bug reports from the widget or extension.</p>
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border-2 border-slate-200 font-mono text-xs">
                    <span className="flex-1 truncate text-slate-700">
                        {showKey ? project.apiKey : "•".repeat(Math.min(project.apiKey?.length ?? 20, 32))}
                    </span>
                    <button onClick={() => setShowKey(!showKey)} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors">
                        {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <CopyButton text={project.apiKey} />
                </div>
            </div>

            {/* Project ID */}
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-5 h-5 text-slate-500" />
                    <h3 className="text-base font-bold text-slate-800">Project ID</h3>
                </div>
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border-2 border-slate-200 font-mono text-xs">
                    <span className="flex-1 truncate text-slate-600">{project._id}</span>
                    <CopyButton text={project._id} />
                </div>
            </div>

            {/* Bug Reporting Control */}
            {isAdmin && (
                <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Bug className="w-5 h-5 text-purple-600" />
                        <h3 className="text-base font-bold text-slate-800">Bug Reporting</h3>
                    </div>
                    <p className="text-xs text-slate-600 mb-4">
                        Control whether users can submit new bug reports through the extension or widget. When disabled, the extension will show a message that reporting is currently unavailable.
                    </p>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={project.reportingEnabled !== false}
                            onChange={(e) => handleToggleReporting(e.target.checked)}
                            disabled={togglingReporting}
                        />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        <span className="ms-3 text-sm font-medium text-slate-700">
                            {togglingReporting ? "Updating..." : project.reportingEnabled !== false ? "Enabled" : "Disabled"}
                        </span>
                    </label>
                </div>
            )}
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
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-5 h-5 text-cyan-600" />
                    <h3 className="text-base font-bold text-slate-800">Chrome Extension</h3>
                </div>
                <p className="text-xs text-slate-600 mb-4">
                    Copy your connection key and paste it into the BugScribe Chrome Extension to start capturing bugs on any website.
                </p>
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border-2 border-slate-200 font-mono text-xs">
                    <span className="flex-1 truncate text-slate-700">{connectionKey}</span>
                    <CopyButton text={connectionKey} label="Copy Key" />
                </div>
            </div>

            {/* Widget Embed */}
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <Globe className="w-5 h-5 text-cyan-600" />
                    <h3 className="text-base font-bold text-slate-800">Widget Embed</h3>
                </div>
                <p className="text-xs text-slate-600 mb-4">
                    Add this script tag to your website&apos;s <code className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">&lt;body&gt;</code> to enable the floating bug reporter widget.
                </p>
                <div className="relative">
                    <pre className="p-4 bg-slate-50 rounded-lg border-2 border-slate-200 text-xs text-slate-700 overflow-x-auto leading-relaxed">
                        <code>{widgetScript}</code>
                    </pre>
                    <div className="absolute top-2 right-2">
                        <CopyButton text={widgetScript} />
                    </div>
                </div>
            </div>

            {/* Quick-start */}
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-cyan-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-800 mb-4">Quick Reference</h3>
                <div className="space-y-3 text-xs">
                    <div className="flex gap-3">
                        <span className="text-slate-600 w-28 shrink-0 font-semibold">API Endpoint</span>
                        <code className="text-slate-700 bg-white px-2 py-1 rounded border border-slate-200">POST https://bug-higt.vercel.app/api/reports</code>
                    </div>
                    <div className="flex gap-3">
                        <span className="text-slate-600 w-28 shrink-0 font-semibold">Project ID</span>
                        <code className="text-slate-700 bg-white px-2 py-1 rounded border border-slate-200">{project._id}</code>
                    </div>
                    <div className="flex gap-3">
                        <span className="text-slate-600 w-28 shrink-0 font-semibold">API Key</span>
                        <code className="text-slate-700 bg-white px-2 py-1 rounded border border-slate-200">{project.apiKey?.substring(0, 8)}…</code>
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
    const [activeTab, setActiveTab] = useState<"details" | "screenshot" | "env" | "console" | "network" | "activity" | "comments">("details");
    const [showLightbox, setShowLightbox] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);

    const handleZoomIn = (e: React.MouseEvent) => { e.stopPropagation(); setZoomLevel(z => Math.min(+(z + 0.25).toFixed(2), 5)); };
    const handleZoomOut = (e: React.MouseEvent) => { e.stopPropagation(); setZoomLevel(z => Math.max(+(z - 0.25).toFixed(2), 0.25)); };
    const handleZoomReset = (e: React.MouseEvent) => { e.stopPropagation(); setZoomLevel(1); };

    // Autosuggest state
    const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
    const [titleNextWords, setTitleNextWords] = useState<string[]>([]);
    const [suggestLoading, setSuggestLoading] = useState(false);
    const suggestTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    const [bugTitle, setBugTitle] = useState("");
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [savingTitle, setSavingTitle] = useState(false);
    const [showManagementSection, setShowManagementSection] = useState(false);

    // Sync local state when bug loads
    useEffect(() => {
        if (bug) {
            setTagInput(bug.tags ?? []);
            setSelectedAssignee(bug.assigneeId ?? null);
            setBugType(bug.type ?? "general");
            setBugCategory(bug.category ?? "");
            setBugTitle(bug.title ?? "");
            if (bug.dueDate) {
                const d = new Date(bug.dueDate);
                setDueDate(d.toISOString().split("T")[0]);
            } else {
                setDueDate("");
            }
        }
        // Reset zoom whenever a different bug is opened
        setZoomLevel(1);
        setShowLightbox(false);
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

    const handleTitleSave = async () => {
        if (!bugTitle.trim() || bugTitle === bug?.title) {
            setIsEditingTitle(false);
            return;
        }
        setSavingTitle(true);
        try {
            await updateBug({ bugId, title: bugTitle.trim(), devToken: token });
            setIsEditingTitle(false);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSavingTitle(false);
        }
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

        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            {/* Modal - Centered */}
            <div className="relative w-full max-w-[90vw] max-h-[90vh] bg-white rounded-2xl border border-slate-200 flex shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                {!bug ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 border-2 border-slate-200 flex items-center justify-center animate-pulse">
                            <Bug className="w-6 h-6 text-slate-400" />
                        </div>
                        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider animate-pulse">Loading Issue...</p>
                    </div>
                ) : (
                    <>
                        {/* Left Side: Image/Video */}
                        <div className="w-[50%] bg-gradient-to-br from-slate-50 via-white to-slate-50 flex flex-col border-r border-slate-200 relative">
                            {bug.screenshotUrl ? (
                                <>
                                    {/* Zoom Controls */}
                                    <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl shadow-lg p-1">
                                        <button
                                            onClick={handleZoomOut}
                                            disabled={zoomLevel <= 0.25}
                                            title="Zoom Out (−)"
                                            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-base font-bold"
                                        >
                                            −
                                        </button>
                                        <button
                                            onClick={handleZoomReset}
                                            title="Reset to 100%"
                                            className="px-2 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 transition-all text-[11px] font-bold min-w-[44px] tabular-nums"
                                        >
                                            {Math.round(zoomLevel * 100)}%
                                        </button>
                                        <button
                                            onClick={handleZoomIn}
                                            disabled={zoomLevel >= 5}
                                            title="Zoom In (+)"
                                            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-base font-bold"
                                        >
                                            +
                                        </button>
                                        <div className="w-px h-4 bg-slate-200 mx-0.5" />
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setShowLightbox(true); }}
                                            title="Full screen"
                                            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 transition-all"
                                        >
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/>
                                                <path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>
                                            </svg>
                                        </button>
                                    </div>

                                    {/* Scroll-to-zoom hint */}
                                    {zoomLevel === 1 && (
                                        <div className="absolute top-3 right-3 z-10 px-2 py-1 bg-black/40 backdrop-blur-sm rounded-lg text-[10px] text-white/80 font-medium pointer-events-none">
                                            Scroll to zoom
                                        </div>
                                    )}

                                    {/* Image container with scroll+pan */}
                                    <div
                                        className="flex-1 overflow-auto relative"
                                        style={{ cursor: zoomLevel > 1 ? 'grab' : 'zoom-in' }}
                                        onWheel={(e) => {
                                            e.preventDefault();
                                            const delta = e.deltaY > 0 ? -0.15 : 0.15;
                                            setZoomLevel(z => Math.min(Math.max(z + delta, 0.25), 5));
                                        }}
                                        onClick={() => { if (zoomLevel === 1) setShowLightbox(true); }}
                                    >
                                        {bug.mediaType === "video" ? (
                                            <div className="min-w-full min-h-full flex items-center justify-center p-6">
                                                <div className="relative" style={{ transform: `scale(${zoomLevel})`, transformOrigin: "center center", transition: "transform 0.15s ease" }}>
                                                    <video
                                                        src={bug.screenshotUrl}
                                                        className="max-w-full max-h-[calc(90vh-200px)] object-contain rounded-xl shadow-2xl border-2 border-slate-200"
                                                        onClick={e => e.stopPropagation()}
                                                        controls
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div
                                                className="flex items-center justify-center p-6"
                                                style={{
                                                    minWidth: "100%",
                                                    minHeight: "100%",
                                                    width: zoomLevel > 1 ? `${zoomLevel * 100}%` : "100%",
                                                    height: zoomLevel > 1 ? `${zoomLevel * 100}%` : "100%",
                                                }}
                                            >
                                                <img
                                                    src={bug.screenshotUrl}
                                                    alt="Bug Screenshot"
                                                    draggable={false}
                                                    className="rounded-xl shadow-2xl border-2 border-slate-200 select-none"
                                                    style={{
                                                        maxWidth: zoomLevel <= 1 ? "100%" : "none",
                                                        maxHeight: zoomLevel <= 1 ? "calc(90vh - 200px)" : "none",
                                                        width: zoomLevel > 1 ? `${zoomLevel * 100}%` : "auto",
                                                        height: zoomLevel > 1 ? "auto" : "auto",
                                                        objectFit: "contain",
                                                        transition: "width 0.15s ease, height 0.15s ease",
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Bottom hint bar */}
                                    <div className="shrink-0 flex items-center justify-between px-3 py-1.5 border-t border-slate-100 bg-white/80 text-[10px] text-slate-400 font-medium">
                                        <span>Scroll to zoom · Drag to pan when zoomed</span>
                                        <div className="flex items-center gap-2">
                                            {[0.5, 1, 1.5, 2].map(level => (
                                                <button
                                                    key={level}
                                                    onClick={(e) => { e.stopPropagation(); setZoomLevel(level); }}
                                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${zoomLevel === level ? 'bg-slate-800 text-white' : 'hover:bg-slate-100 text-slate-500'}`}
                                                >
                                                    {level * 100}%
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4">
                                    <div className="p-8 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300">
                                        <ImageIcon className="w-20 h-20" />
                                    </div>
                                    <p className="text-sm font-medium text-slate-500">No screenshot attached</p>
                                </div>
                            )}
                        </div>

                        {/* Right Side: Information */}
                        <div className="flex-1 flex flex-col bg-white">
                            {/* Header */}
                            <div className="px-6 py-5 border-b border-slate-200 bg-white shrink-0">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 text-white shadow-md">
                                                <span className="text-sm font-bold tracking-wide">
                                                    #{bug.issueNumber ? bug.issueNumber : bug._id.toString().substring(0, 8).toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <Clock className="w-3.5 h-3.5" />
                                                {formatDistanceToNow(new Date(bug.createdAt), { addSuffix: true })}
                                            </div>
                                        </div>
                                        
                                        {isEditingTitle && isSuperAdmin ? (
                                            <div className="flex flex-col gap-1.5 flex-1">
                                                {/* Next-word chips */}
                                                {titleNextWords.length > 0 && (
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        {titleNextWords.map((word, i) => (
                                                            <button
                                                                key={i}
                                                                type="button"
                                                                onClick={() => {
                                                                    const newTitle = bugTitle.trimEnd() + ' ' + word;
                                                                    setBugTitle(newTitle);
                                                                    // Re-fetch suggestions for new value
                                                                    if (suggestTimerRef.current) clearTimeout(suggestTimerRef.current);
                                                                    suggestTimerRef.current = setTimeout(async () => {
                                                                        const res = await fetch('/api/autosuggest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: newTitle, bugType: bug?.type, pageUrl: bug?.url }) });
                                                                        const data = await res.json();
                                                                        setTitleSuggestions(data.suggestions ?? []);
                                                                        setTitleNextWords(data.nextWords ?? []);
                                                                    }, 100);
                                                                }}
                                                                className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold hover:bg-blue-100 hover:border-blue-400 transition-all"
                                                            >
                                                                {word}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Input row */}
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 relative">
                                                        <input
                                                            type="text"
                                                            value={bugTitle}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                setBugTitle(val);
                                                                setTitleSuggestions([]);
                                                                setTitleNextWords([]);
                                                                if (suggestTimerRef.current) clearTimeout(suggestTimerRef.current);
                                                                if (val.trim().length >= 3) {
                                                                    setSuggestLoading(true);
                                                                    suggestTimerRef.current = setTimeout(async () => {
                                                                        try {
                                                                            const res = await fetch('/api/autosuggest', {
                                                                                method: 'POST',
                                                                                headers: { 'Content-Type': 'application/json' },
                                                                                body: JSON.stringify({ text: val, bugType: bug?.type, pageUrl: bug?.url })
                                                                            });
                                                                            const data = await res.json();
                                                                            setTitleSuggestions(data.suggestions ?? []);
                                                                            setTitleNextWords(data.nextWords ?? []);
                                                                        } catch {}
                                                                        setSuggestLoading(false);
                                                                    }, 300);
                                                                } else {
                                                                    setSuggestLoading(false);
                                                                }
                                                            }}
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter") { handleTitleSave(); setTitleSuggestions([]); setTitleNextWords([]); }
                                                                if (e.key === "Escape") {
                                                                    setBugTitle(bug?.title ?? "");
                                                                    setIsEditingTitle(false);
                                                                    setTitleSuggestions([]);
                                                                    setTitleNextWords([]);
                                                                }
                                                                if (e.key === "Tab" && titleSuggestions.length > 0) {
                                                                    e.preventDefault();
                                                                    setBugTitle(titleSuggestions[0]);
                                                                    setTitleSuggestions([]);
                                                                    setTitleNextWords([]);
                                                                }
                                                            }}
                                                            className="w-full text-xl font-bold text-slate-900 bg-white border-2 border-blue-400 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200 pr-8"
                                                            autoFocus
                                                            disabled={savingTitle}
                                                            placeholder="Describe the bug..."
                                                        />
                                                        {suggestLoading && (
                                                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                                                                <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button onClick={() => { handleTitleSave(); setTitleSuggestions([]); setTitleNextWords([]); }} disabled={savingTitle} className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 transition-all shrink-0">
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => { setBugTitle(bug?.title ?? ""); setIsEditingTitle(false); setTitleSuggestions([]); setTitleNextWords([]); }} className="p-2 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 transition-all shrink-0">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                {/* Full suggestion dropdown */}
                                                {titleSuggestions.length > 0 && (
                                                    <div className="bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
                                                        <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Suggestions</span>
                                                            <span className="text-[10px] text-slate-400">Tab to accept first</span>
                                                        </div>
                                                        {titleSuggestions.map((s, i) => (
                                                            <button
                                                                key={i}
                                                                type="button"
                                                                onClick={() => { setBugTitle(s); setTitleSuggestions([]); setTitleNextWords([]); }}
                                                                className="w-full text-left px-3 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors border-b border-slate-50 last:border-0 flex items-center gap-2"
                                                            >
                                                                <span className="w-4 h-4 rounded bg-blue-100 text-blue-600 text-[9px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                                                                <span className="flex-1 truncate">{s}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex items-start gap-2 group/title">
                                                <h2 className="text-xl font-bold text-slate-900 leading-tight flex-1">{bug.title}</h2>
                                                {isSuperAdmin && (
                                                    <button
                                                        onClick={() => setIsEditingTitle(true)}
                                                        className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-blue-600 hover:border-blue-300 opacity-0 group-hover/title:opacity-100 transition-all"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        {shareUrl && (
                                            <button 
                                                onClick={() => {
                                                    navigator.clipboard.writeText(shareUrl);
                                                    alert("Link copied!");
                                                }}
                                                className="p-2.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-all"
                                                title="Copy link"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button 
                                            onClick={onClose} 
                                            className="p-2.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2 flex-wrap mt-3">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                        {(statusOptions?.find((s: any) => (s.value ?? s.status) === bug.status)?.label) || bug.status}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                        {bug.priority === "low" && "Low"}
                                        {bug.priority === "medium" && "Medium"}
                                        {bug.priority === "high" && "High"}
                                        {bug.priority === "critical" && "Critical"}
                                    </span>
                                </div>
                            </div>

                            {/* Status & Priority Controls */}
                            <div className="grid grid-cols-2 gap-4 border-b border-slate-200 px-6 py-5 shrink-0 bg-gradient-to-br from-slate-50 to-white">
                                <div className="space-y-2.5">
                                    <label className="text-[11px] text-slate-600 font-bold block uppercase tracking-wider flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 shadow-sm" />
                                        STATUS
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={bug.status}
                                            onChange={(e) => onStatusChange(e.target.value as Status)}
                                            className="w-full bg-slate-900 text-white border-2 border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none cursor-pointer hover:bg-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all appearance-none shadow-sm"
                                            disabled={!canUpdate}
                                        >
                                            {(statusOptions && statusOptions.length ? statusOptions : DEFAULT_COLUMNS).map((status: any) => {
                                                const value = status.value ?? status.status;
                                                const label = status.label ?? value;
                                                return (
                                                    <option key={value} value={value}>
                                                        {label}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="space-y-2.5">
                                    <label className="text-[11px] text-slate-600 font-bold block uppercase tracking-wider flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-orange-500 shadow-sm" />
                                        PRIORITY
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={bug.priority}
                                            onChange={(e) => updatePriority({ bugId, priority: e.target.value as Priority, devToken: token })}
                                            className="w-full bg-slate-900 text-white border-2 border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none cursor-pointer hover:bg-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all appearance-none shadow-sm"
                                            disabled={!canUpdate}
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                            <option value="critical">Critical</option>
                                        </select>
                                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="flex gap-1 border-b border-slate-200 px-6 shrink-0 bg-white">
                                {(["details", "comments", "activity"] as const).map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab as any)}
                                        className={`relative px-4 py-3 text-sm font-semibold capitalize transition-all ${
                                            activeTab === tab
                                                ? "text-blue-600 border-b-2 border-blue-600"
                                                : "text-slate-500 hover:text-slate-700"
                                        }`}
                                    >
                                        {tab}
                                        {tab === "comments" && bug.comments?.length > 0 && (
                                            <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                                                {bug.comments.length}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Tab Content */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                                {activeTab === "details" && (
                                    <div className="grid grid-cols-[1fr_280px] min-h-full">
                                        {/* Left: Main Content */}
                                        <div className="px-6 py-6 border-r border-slate-200">
                                            {/* User Description */}
                                            <div className="flex gap-3">
                                                <div className="w-8 h-8 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center shrink-0 text-sm font-bold text-orange-600">
                                                    {(bug.reporterName || 'U')[0].toUpperCase()}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-sm font-semibold text-slate-800">{bug.reporterName || "User"}</span>
                                                        <span className="text-xs text-slate-400">
                                                            {formatDistanceToNow(new Date(bug.createdAt), { addSuffix: true })}
                                                        </span>
                                                    </div>
                                                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-700 leading-relaxed">
                                                        {bug.description || "No description provided."}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: Metadata Sidebar */}
                                        <div className="px-6 py-6 bg-gradient-to-br from-slate-50 to-white space-y-5">
                                            {/* Reporter Info */}
                                            <div className="space-y-2.5">
                                                <label className="text-[10px] text-slate-500 font-bold block uppercase tracking-[0.1em]">Reporter</label>
                                                <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 shadow-sm">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-sm font-bold text-white shadow-md">
                                                        {(bug.reporterName || 'U')[0].toUpperCase()}
                                                    </div>
                                                    <div className="text-sm text-slate-800 font-semibold">{bug.reporterName || "Anonymous"}</div>
                                                </div>
                                            </div>

                                            {/* Type */}
                                            <div className="space-y-2.5">
                                                <label className="text-[10px] text-slate-500 font-bold block uppercase tracking-[0.1em]">Type</label>
                                                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm">
                                                    <div className="text-sm text-slate-800 font-semibold capitalize">
                                                        {bug.type && bug.type !== "general" ? bug.type.replace(/-/g, ' ') : 'General'}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Browser */}
                                            {bug.browser && (
                                                <div className="space-y-2.5">
                                                    <label className="text-[10px] text-slate-500 font-bold block uppercase tracking-[0.1em]">Browser</label>
                                                    <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm">
                                                        <div className="text-sm text-slate-700 font-medium leading-relaxed">{bug.browser}</div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* OS */}
                                            {bug.os && (
                                                <div className="space-y-2.5">
                                                    <label className="text-[10px] text-slate-500 font-bold block uppercase tracking-[0.1em]">Operating System</label>
                                                    <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm">
                                                        <div className="text-sm text-slate-700 font-medium">{bug.os}</div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Page URL */}
                                            {(bug.url && bug.url !== "Unknown") && (
                                                <div className="space-y-2.5">
                                                    <label className="text-[10px] text-slate-500 font-bold block uppercase tracking-[0.1em]">Page URL</label>
                                                    <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm">
                                                        <a 
                                                            href={bug.url} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="text-xs text-blue-600 hover:text-blue-700 hover:underline break-all leading-relaxed font-medium"
                                                        >
                                                            {bug.url}
                                                        </a>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Created Date */}
                                            <div className="space-y-2.5 pt-4 border-t border-slate-200">
                                                <label className="text-[10px] text-slate-500 font-bold block uppercase tracking-[0.1em]">Created</label>
                                                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm">
                                                    <div className="text-sm text-slate-700 font-semibold">
                                                        {new Date(bug.createdAt).toLocaleDateString('en-US', { 
                                                            month: 'short', 
                                                            day: 'numeric', 
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === "comments" && (
                                    <div className="px-6 py-6">
                                        {/* Comments List */}
                                        <div className="space-y-4 mb-6">
                                            {bug.comments && bug.comments.length > 0 ? (
                                                bug.comments.map((c: any) => (
                                                    <div key={c._id} className="flex gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-cyan-100 border border-cyan-200 flex items-center justify-center shrink-0">
                                                            <User className="w-4 h-4 text-cyan-600" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-sm font-semibold text-slate-800">{c.author}</span>
                                                                <span className="text-xs text-slate-400">
                                                                    {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                                                                </span>
                                                            </div>
                                                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-700">
                                                                {c.body}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-12 text-slate-400 text-sm">
                                                    No comments yet
                                                </div>
                                            )}
                                        </div>

                                        {/* Comment Input */}
                                        <form onSubmit={handleComment} className="pt-4 border-t border-slate-200">
                                            <div className="relative">
                                                <input
                                                    value={comment}
                                                    onChange={(e) => setComment(e.target.value)}
                                                    placeholder="Add a comment..."
                                                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 pr-12 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                                                />
                                                <button 
                                                    type="submit" 
                                                    disabled={posting || !comment.trim()} 
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-blue-600 hover:bg-blue-50 disabled:opacity-30 transition-all"
                                                >
                                                    <Send className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                {activeTab === "activity" && (
                                    <div className="px-6 py-6">
                                        <div className="space-y-3">
                                            {activities && activities.length > 0 ? (
                                                activities.map((activity: any) => (
                                                    <div key={activity._id} className="flex gap-3 text-sm">
                                                        <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                                                            {ACTIVITY_ICONS[activity.type] || <Activity className="w-3 h-3 text-slate-400" />}
                                                        </div>
                                                        <div className="flex-1">
                                                            <span className="text-slate-700">{activity.description}</span>
                                                            <span className="text-xs text-slate-400 ml-2">
                                                                {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-12 text-slate-400 text-sm">
                                                    No activity yet
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                        {/* Bottom Actions */}
                        <div className="px-6 py-4 border-t border-slate-200 bg-white shrink-0 flex items-center justify-between">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all text-sm font-semibold"
                            >
                                Close
                            </button>
                            {canDelete && (
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-all text-sm font-semibold"
                                >
                                    {deleting ? "Deleting..." : "Delete Issue"}
                                </button>
                            )}
                        </div>
                        </div>
                    </>
                )}
            </div>
        </div>
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


function CreateBugModal({ projectId, project, devToken, onClose, initialType, initialStatus }: {
    projectId: Id<"projects">; project: any; devToken: string | null; onClose: () => void; initialType?: string; initialStatus?: string;
}) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState<Priority>("medium");
    const [type, setType] = useState(initialType || "general");
    const [status, setStatus] = useState(initialStatus || "open");
    const [category, setCategory] = useState("");
    const [assignee, setAssignee] = useState<string>("");
    const [dueDate, setDueDate] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");
    const [url, setUrl] = useState("");
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const [screenshotPreview, setScreenshotPreview] = useState<string>("");
    const [uploadingImage, setUploadingImage] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const createBug = useMutation(api.bugs.dashboardManualCreateBug);
    const updateBugStatus = useMutation(api.bugs.updateStatus);
    const updateBug = useMutation(api.bugs.updateBug);
    const generateUploadUrl = useMutation(api.bugs.generateUploadUrl);
    const customModules = useQuery(api.modules.listModules, { devToken: devToken || undefined });
    const currentUser = useQuery(api.users.currentUser, { devToken: devToken || undefined });
    const members = useQuery(api.projects.listMembers, projectId ? { projectId, devToken: devToken || undefined } : "skip");
    const isSuperAdmin = currentUser?.role === "super_admin";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !devToken) return;
        setLoading(true);
        try {
            let screenshotUrl: string | undefined = undefined;

            // Upload screenshot if provided
            if (screenshot) {
                setUploadingImage(true);
                try {
                    const uploadUrl = await generateUploadUrl({ 
                        projectId, 
                        apiKey: project.apiKey 
                    });
                    const result = await fetch(uploadUrl, {
                        method: "POST",
                        headers: { "Content-Type": screenshot.type },
                        body: screenshot,
                    });
                    const { storageId } = await result.json();
                    screenshotUrl = storageId;
                } catch (err) {
                    console.error("Failed to upload screenshot:", err);
                    alert("Failed to upload screenshot. Creating issue without it.");
                } finally {
                    setUploadingImage(false);
                }
            }

            const newBugId = await createBug({
                projectId,
                title: title.trim(),
                description: description.trim(),
                priority,
                type: type === "general" ? undefined : type,
                category: category.trim() || undefined,
                devToken
            });
            
            // If initialStatus is provided and different from default, update the status
            if (initialStatus && initialStatus !== "open" && newBugId) {
                await updateBugStatus({ bugId: newBugId, status: initialStatus, devToken });
            }

            // Update additional fields if provided
            if (newBugId) {
                const updateData: any = {};
                if (assignee) updateData.assigneeId = assignee;
                if (dueDate) updateData.dueDate = new Date(dueDate).getTime();
                if (tags.length > 0) updateData.tags = tags;
                if (url) updateData.url = url;
                if (screenshotUrl) updateData.screenshotUrl = screenshotUrl;

                if (Object.keys(updateData).length > 0) {
                    await updateBug({
                        bugId: newBugId,
                        ...updateData,
                        devToken
                    });
                }
            }
            
            onClose();
        } catch (err: any) {
            alert(err.message || "Failed to create bug");
        } finally {
            setLoading(false);
        }
    };

    const handleAddTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
            setTags([...tags, tagInput.trim()]);
            setTagInput("");
        }
    };

    const handleRemoveTag = (tag: string) => {
        setTags(tags.filter(t => t !== tag));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                alert("File size must be less than 10MB");
                return;
            }
            
            // Check file type
            if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
                alert("Please upload an image or video file");
                return;
            }

            setScreenshot(file);
            
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setScreenshotPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveScreenshot = () => {
        setScreenshot(null);
        setScreenshotPreview("");
    };

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
                <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                    {/* Header */}
                    <div className="relative px-6 py-5 border-b border-slate-200 bg-white">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-cyan-500 flex items-center justify-center shadow-sm">
                                <Plus className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900">New Issue</h3>
                                <p className="text-xs text-slate-500">Create a new bug report or issue</p>
                            </div>
                            <button 
                                onClick={onClose} 
                                className="ml-auto w-8 h-8 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-all flex items-center justify-center"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-white max-h-[calc(90vh-120px)] overflow-y-auto">
                        {/* Title Input */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs text-slate-700 font-bold uppercase tracking-wider">
                                <Bug className="w-3.5 h-3.5 text-cyan-500" />
                                Issue Title
                                <span className="text-red-500">*</span>
                            </label>
                            <div className="relative group">
                                <input 
                                    value={title} 
                                    onChange={(e) => setTitle(e.target.value)} 
                                    className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all" 
                                    placeholder="Short, clear bug title" 
                                    required 
                                />
                                {title && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    </div>
                                )}
                            </div>
                            <p className="text-[10px] text-slate-500 flex items-center gap-1.5">
                                <Info className="w-3 h-3" />
                                Be specific and descriptive
                            </p>
                        </div>

                        {/* Description Textarea */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs text-slate-700 font-bold uppercase tracking-wider">
                                <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                                Description
                            </label>
                            <textarea 
                                value={description} 
                                onChange={(e) => setDescription(e.target.value)} 
                                rows={4} 
                                className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all resize-none" 
                                placeholder="Steps to reproduce, expected vs. actual behavior..."
                            />
                            <GrammarChecker
                                text={description}
                                onApplySuggestion={(_, newText) => setDescription(newText)}
                            />
                            <p className="text-[10px] text-slate-500">
                                {description.length} characters
                            </p>
                        </div>

                        {/* Priority & Type Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-xs text-slate-700 font-bold uppercase tracking-wider">
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                    Priority
                                </label>
                                <div className="relative">
                                    <select 
                                        value={priority} 
                                        onChange={(e) => setPriority(e.target.value as Priority)} 
                                        className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="low">🟢 Low</option>
                                        <option value="medium">🔵 Medium</option>
                                        <option value="high">🟠 High</option>
                                        <option value="critical">🔴 Critical</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="flex items-center gap-2 text-xs text-slate-700 font-bold uppercase tracking-wider">
                                        <Tag className="w-3.5 h-3.5 text-indigo-500" />
                                        Type
                                    </label>
                                    {isSuperAdmin && (
                                        <button
                                            type="button"
                                            onClick={() => setShowQuickAdd(true)}
                                            className="inline-flex items-center gap-1 text-[10px] text-cyan-600 hover:text-cyan-700 transition-colors font-semibold"
                                            title="Add new module type"
                                        >
                                            <Plus className="w-3 h-3" /> New
                                        </button>
                                    )}
                                </div>
                                <div className="relative">
                                    <select 
                                        value={type} 
                                        onChange={(e) => setType(e.target.value)} 
                                        className="w-full px-4 py-3 bg-slate-900 border-2 border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="general">🐛 General Bug</option>
                                        {(customModules || []).map((mod: any) => (
                                            <option key={mod.slug} value={mod.slug}>{mod.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* Category Input */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs text-slate-700 font-bold uppercase tracking-wider">
                                <LayoutList className="w-3.5 h-3.5 text-slate-500" />
                                Category
                                <span className="text-[10px] text-slate-500 normal-case font-normal">(Optional)</span>
                            </label>
                            <input 
                                value={category} 
                                onChange={(e) => setCategory(e.target.value)} 
                                className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all" 
                                placeholder="e.g. Header, Billing, API..." 
                            />
                        </div>

                        {/* URL Input */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs text-slate-700 font-bold uppercase tracking-wider">
                                <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                                Page URL
                                <span className="text-[10px] text-slate-500 normal-case font-normal">(Optional)</span>
                            </label>
                            <input 
                                type="url"
                                value={url} 
                                onChange={(e) => setUrl(e.target.value)} 
                                className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all" 
                                placeholder="https://example.com/page-with-bug" 
                            />
                        </div>

                        {/* Screenshot Upload */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs text-slate-700 font-bold uppercase tracking-wider">
                                <ImageIcon className="w-3.5 h-3.5 text-pink-500" />
                                Screenshot / Video
                                <span className="text-[10px] text-slate-500 normal-case font-normal">(Optional, max 10MB)</span>
                            </label>
                            
                            {!screenshotPreview ? (
                                <label className="block">
                                    <input 
                                        type="file"
                                        accept="image/*,video/*"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                    <div className="w-full px-4 py-8 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl text-center cursor-pointer hover:bg-slate-100 hover:border-slate-400 transition-all">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center">
                                                <Upload className="w-6 h-6 text-cyan-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-700">Click to upload</p>
                                                <p className="text-xs text-slate-500">PNG, JPG, GIF, MP4 up to 10MB</p>
                                            </div>
                                        </div>
                                    </div>
                                </label>
                            ) : (
                                <div className="relative group">
                                    {screenshot?.type.startsWith('video/') ? (
                                        <video 
                                            src={screenshotPreview} 
                                            className="w-full h-48 object-cover rounded-xl border-2 border-slate-200"
                                            controls
                                        />
                                    ) : (
                                        <img 
                                            src={screenshotPreview} 
                                            alt="Preview" 
                                            className="w-full h-48 object-cover rounded-xl border-2 border-slate-200"
                                        />
                                    )}
                                    <button
                                        type="button"
                                        onClick={handleRemoveScreenshot}
                                        className="absolute top-2 right-2 p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-all shadow-lg opacity-0 group-hover:opacity-100"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                    <div className="absolute bottom-2 left-2 px-3 py-1 rounded-lg bg-black/70 text-white text-xs font-semibold">
                                        {screenshot?.name}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Assignee & Due Date Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-xs text-slate-700 font-bold uppercase tracking-wider">
                                    <User className="w-3.5 h-3.5 text-purple-500" />
                                    Assignee
                                    <span className="text-[10px] text-slate-500 normal-case font-normal">(Optional)</span>
                                </label>
                                <div className="relative">
                                    <select 
                                        value={assignee} 
                                        onChange={(e) => setAssignee(e.target.value)} 
                                        className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="">Unassigned</option>
                                        {(members || []).map((m: any) => (
                                            <option key={m.userId} value={m.userId}>
                                                {m.name || m.email || m.userId}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-xs text-slate-700 font-bold uppercase tracking-wider">
                                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                                    Due Date
                                    <span className="text-[10px] text-slate-500 normal-case font-normal">(Optional)</span>
                                </label>
                                <input 
                                    type="date"
                                    value={dueDate} 
                                    onChange={(e) => setDueDate(e.target.value)} 
                                    className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all" 
                                />
                            </div>
                        </div>

                        {/* Tags Input */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs text-slate-700 font-bold uppercase tracking-wider">
                                <Hash className="w-3.5 h-3.5 text-green-500" />
                                Tags
                                <span className="text-[10px] text-slate-500 normal-case font-normal">(Optional)</span>
                            </label>
                            <div className="flex gap-2">
                                <input 
                                    value={tagInput} 
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddTag();
                                        }
                                    }}
                                    className="flex-1 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all" 
                                    placeholder="Add tags..." 
                                />
                                <button
                                    type="button"
                                    onClick={handleAddTag}
                                    className="px-4 py-3 bg-slate-100 border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-all"
                                >
                                    Add
                                </button>
                            </div>
                            {tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {tags.map((tag) => (
                                        <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-50 text-cyan-700 rounded-lg text-xs font-semibold border border-cyan-200">
                                            {tag}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveTag(tag)}
                                                className="hover:text-cyan-900 transition-colors"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-2">
                            <button 
                                type="button" 
                                onClick={onClose} 
                                className="flex-1 px-5 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                disabled={loading || uploadingImage || !title.trim()} 
                                className="flex-1 px-5 py-3 bg-cyan-500 rounded-xl text-sm font-bold text-white hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                            >
                                {loading || uploadingImage ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        {uploadingImage ? "Uploading..." : "Creating…"}
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4" />
                                        Create Issue
                                    </>
                                )}
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

    // Validate that the ID is actually from the projects table
    // Convex IDs start with a table identifier prefix
    const isValidProjectId = rawProjectId.length >= 10 && !rawProjectId.startsWith('bookings_') && !rawProjectId.includes('booking');
    const projectId = (isValidProjectId ? rawProjectId : undefined) as Id<"projects"> | undefined;

    // Show error for invalid project IDs
    if (!isValidProjectId) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="bg-white border-2 border-red-200 rounded-2xl p-8 max-w-md text-center shadow-lg">
                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Invalid Project ID</h2>
                    <p className="text-slate-600 mb-6">
                        The URL contains an invalid project identifier. Please check the link and try again.
                    </p>
                    <Link href="/dashboard" className="btn-primary inline-flex items-center gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    const project = useQuery(api.projects.getProject, projectId ? { projectId, devToken: devToken || undefined } : "skip");
    const bugs = useQuery(api.bugs.getBugs, projectId ? { projectId, devToken: devToken || undefined } : "skip");
    const stats = useQuery(api.bugs.getBugStats, projectId ? { projectId, devToken: devToken || undefined } : "skip");
    const updateStatus = useMutation(api.bugs.updateStatus);
    const addStatus = useMutation(api.statuses.addStatus);
    const moveStatus = useMutation(api.statuses.moveStatus);
    const deleteBucket = useMutation(api.projects.deleteBucket);

    const [selectedBugId, setSelectedBugId] = useState<Id<"bugs"> | null>(null);
    const [showCreateBugModal, setShowCreateBugModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [initialStatus, setInitialStatus] = useState<string | undefined>(undefined);
    const [view, setView] = useState<string>("kanban");
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [priorityFilter, setPriorityFilter] = useState<string>("all");
    const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
    const [showAddBucketInput, setShowAddBucketInput] = useState(false);
    const [newBucketLabel, setNewBucketLabel] = useState("");
    const [addingBucket, setAddingBucket] = useState(false);
    const [movingBucketStatus, setMovingBucketStatus] = useState<string | null>(null);
    const [showCustomizeDropdown, setShowCustomizeDropdown] = useState(false);
    const [groupBy, setGroupBy] = useState<"status" | "priority" | "assignee">("status");
    const [sortBy, setSortBy] = useState<"created" | "updated" | "due">("created");
    const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
    const [showScreenshot, setShowScreenshot] = useState(true);
    const [showSentiment, setShowSentiment] = useState(false);
    const [showBoardViewDropdown, setShowBoardViewDropdown] = useState(false);
    const [boardView, setBoardView] = useState<"status" | "priority" | "assignee">("status");
    const kanbanScrollRef = useRef<HTMLDivElement | null>(null);
    const customizeRef = useRef<HTMLDivElement | null>(null);
    const boardViewRef = useRef<HTMLDivElement | null>(null);

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
        members?.find((m) => m.userId === currentUser?.tokenIdentifier && (m.role === "owner" || m.role === "admin")) ||
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

    // Close customize dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (customizeRef.current && !customizeRef.current.contains(event.target as Node)) {
                setShowCustomizeDropdown(false);
            }
            if (boardViewRef.current && !boardViewRef.current.contains(event.target as Node)) {
                setShowBoardViewDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        const matchesAssignee = assigneeFilter === "all" ||
            (assigneeFilter === "unassigned" ? !bug.assigneeId : bug.assigneeId === assigneeFilter) ||
            (assigneeFilter === "recent" ? (new Date(bug._creationTime).getTime() > oneDayAgo || new Date(bug.createdAt).getTime() > oneDayAgo) : bug.assigneeId === assigneeFilter);
        return matchesSearch && matchesType && matchesStatus && matchesPriority && (assigneeFilter === "all" || assigneeFilter === "unassigned" || assigneeFilter === "recent" ? matchesAssignee : bug.assigneeId === assigneeFilter);
    });

    // Sort filtered bugs
    const sortedBugs = [...filteredBugs].sort((a, b) => {
        let comparison = 0;
        if (sortBy === "created") {
            comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        } else if (sortBy === "updated") {
            comparison = new Date(a._creationTime).getTime() - new Date(b._creationTime).getTime();
        } else if (sortBy === "due") {
            const aDate = a.dueDate || 0;
            const bDate = b.dueDate || 0;
            comparison = aDate - bDate;
        }
        return sortOrder === "newest" ? -comparison : comparison;
    });

    const bugsByStatus = (status: Status) => sortedBugs.filter((b: any) => b.status === status);
    const bugsByPriority = (priority: Priority) => sortedBugs.filter((b: any) => b.priority === priority);
    const bugsByAssignee = (assigneeId: string | null) => sortedBugs.filter((b: any) => 
        assigneeId === null ? !b.assigneeId : b.assigneeId === assigneeId
    );
    const kanbanColumns = ((projectStatuses && projectStatuses.length ? projectStatuses : DEFAULT_COLUMNS) as any[])
        .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)) // Sort by order field
        .map((status: any) => {
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

    const handleExportWithImages = async () => {
        if (!bugs || bugs.length === 0) return;

        // Map members for assignee lookup
        const memberMap: Record<string, string> = {};
        members?.forEach((m: any) => {
            memberMap[m.userId] = m.name || m.email || m.userId;
        });

        // Convert bugs to export format
        const exportData = bugs.map((bug: any) => ({
            _id: bug._id,
            title: bug.title,
            status: bug.status,
            priority: bug.priority,
            type: bug.type || "general",
            category: bug.category,
            assigneeId: bug.assigneeId,
            reporterName: bug.reporterName || "Widget",
            reporterEmail: bug.reporterEmail || "N/A",
            createdAt: bug.createdAt,
            url: bug.url,
            browser: bug.browser,
            os: bug.os,
            screenWidth: bug.screenWidth,
            screenHeight: bug.screenHeight,
            description: bug.description,
            consoleErrors: bug.consoleErrors,
            screenshotUrl: bug.screenshotUrl,
            tags: bug.tags
        }));

        try {
            await exportBugsWithImages(
                exportData,
                project?.name || "BugScribe",
                memberMap
            );
        } catch (error) {
            console.error("Export with images failed:", error);
            alert("Failed to export with images. Please try again.");
        }
    };

    const handleAddIssueToColumn = (status: string) => {
        setInitialStatus(status);
        setShowCreateBugModal(true);
    };

    const TAB_LABELS: Record<string, string> = {
        kanban: "Kanban", list: "List", team: "Users", integrations: "API", settings: "Settings"
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-50" suppressHydrationWarning>
            <Navbar />
            <div className="flex-1 flex flex-col max-w-[1700px] mx-auto w-full px-6 sm:px-8 lg:px-10 py-10 gap-8">
                <div className="rounded-[28px] border border-slate-200 bg-white backdrop-blur-2xl p-6 lg:p-8 shadow-sm">
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                                <Link href="/" className="hover:text-brand-400 transition-all flex items-center gap-2 group">
                                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" /> Projects
                                </Link>
                                <span className="text-slate-300">/</span>
                                <span className="text-slate-600 truncate max-w-[240px]">{project.name}</span>
                            </div>
                            <div className="flex items-center gap-4 flex-wrap">
                                <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">
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
                                {/* Total - Always colorized */}
                                <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 shadow-sm hover:shadow transition-all min-w-[100px]">
                                    <span className="p-1.5 rounded-lg bg-slate-100 text-slate-600 shrink-0"><Hash className="w-3.5 h-3.5" /></span>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 leading-none">Total</span>
                                        <p className="text-lg font-black text-slate-800 leading-tight">{stats.total}</p>
                                    </div>
                                </div>

                                {/* Critical - Colorized only if count > 0 */}
                                <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 shadow-sm hover:shadow transition-all min-w-[100px] ${
                                    stats.critical > 0 
                                        ? 'border-red-200 bg-red-50' 
                                        : 'border-slate-200 bg-slate-50'
                                }`}>
                                    <span className={`p-1.5 rounded-lg shrink-0 ${
                                        stats.critical > 0 
                                            ? 'bg-red-100 text-red-500' 
                                            : 'bg-slate-100 text-slate-400'
                                    }`}>
                                        <AlertTriangle className="w-3.5 h-3.5" />
                                    </span>
                                    <div className="flex flex-col">
                                        <span className={`text-[9px] font-bold uppercase tracking-wider leading-none ${
                                            stats.critical > 0 ? 'text-red-600' : 'text-slate-400'
                                        }`}>Critical</span>
                                        <p className={`text-lg font-black leading-tight ${
                                            stats.critical > 0 ? 'text-red-600' : 'text-slate-400'
                                        }`}>{stats.critical}</p>
                                    </div>
                                </div>

                                {/* One card per project status - Colorized only if count > 0 */}
                                {(projectStatuses && projectStatuses.length ? projectStatuses : DEFAULT_COLUMNS).map((ps: any) => {
                                    const statusValue = ps.value ?? ps.status;
                                    const statusLabel = ps.label;
                                    const statusColor = ps.color ?? "text-slate-400";
                                    const count = (bugs ?? []).filter((b: any) => b.status === statusValue).length;
                                    const hasCount = count > 0;

                                    const colorMap: Record<string, { bg: string; border: string; iconBg: string; text: string; icon: React.ReactNode }> = {
                                        "text-blue-400":   { bg: "bg-blue-50",   border: "border-blue-200",   iconBg: "bg-blue-100",   text: "text-blue-600",   icon: <CircleDot className="w-3.5 h-3.5" /> },
                                        "text-amber-400":  { bg: "bg-amber-50",  border: "border-amber-200",  iconBg: "bg-amber-100",  text: "text-amber-600",  icon: <Clock className="w-3.5 h-3.5" /> },
                                        "text-green-400":  { bg: "bg-green-50",  border: "border-green-200",  iconBg: "bg-green-100",  text: "text-green-600",  icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
                                        "text-slate-500":  { bg: "bg-slate-50",  border: "border-slate-200",  iconBg: "bg-slate-100",  text: "text-slate-600",  icon: <XCircle className="w-3.5 h-3.5" /> },
                                        "text-indigo-400": { bg: "bg-indigo-50", border: "border-indigo-200", iconBg: "bg-indigo-100", text: "text-indigo-600", icon: <CircleDot className="w-3.5 h-3.5" /> },
                                        "text-purple-400": { bg: "bg-purple-50", border: "border-purple-200", iconBg: "bg-purple-100", text: "text-purple-600", icon: <CircleDot className="w-3.5 h-3.5" /> },
                                        "text-pink-400":   { bg: "bg-pink-50",   border: "border-pink-200",   iconBg: "bg-pink-100",   text: "text-pink-600",   icon: <CircleDot className="w-3.5 h-3.5" /> },
                                        "text-cyan-400":   { bg: "bg-cyan-50",   border: "border-cyan-200",   iconBg: "bg-cyan-100",   text: "text-cyan-600",   icon: <CircleDot className="w-3.5 h-3.5" /> },
                                        "text-red-400":    { bg: "bg-red-50",    border: "border-red-200",    iconBg: "bg-red-100",    text: "text-red-600",    icon: <AlertCircle className="w-3.5 h-3.5" /> },
                                    };
                                    const cfg = colorMap[statusColor] ?? { bg: "bg-slate-50", border: "border-slate-200", iconBg: "bg-slate-100", text: "text-slate-600", icon: <CircleDot className="w-3.5 h-3.5" /> };

                                    return (
                                        <div key={statusValue} className={`flex items-center gap-2 rounded-xl border px-3 py-2 shadow-sm hover:shadow transition-all min-w-[100px] ${
                                            hasCount ? `${cfg.bg} ${cfg.border}` : 'bg-slate-50 border-slate-200'
                                        }`}>
                                            <span className={`p-1.5 rounded-lg shrink-0 ${
                                                hasCount ? `${cfg.iconBg} ${cfg.text}` : 'bg-slate-100 text-slate-400'
                                            }`}>{cfg.icon}</span>
                                            <div className="flex flex-col min-w-0">
                                                <span className={`text-[9px] font-bold uppercase tracking-wider leading-none truncate ${
                                                    hasCount ? cfg.text : 'text-slate-400'
                                                }`}>{statusLabel}</span>
                                                <p className={`text-lg font-black leading-tight ${
                                                    hasCount ? cfg.text : 'text-slate-400'
                                                }`}>{count}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
                    {/* Toolbar */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 px-4 py-3 border-b border-slate-100">
                        {/* Left: View Tabs */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setView("kanban")}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                    view === "kanban" 
                                        ? "bg-cyan-500 text-white shadow-sm" 
                                        : "text-slate-600 hover:bg-slate-50"
                                }`}
                            >
                                <KanbanIcon className="w-4 h-4" />
                                KANBAN
                            </button>
                            <button
                                onClick={() => setView("list")}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                    view === "list" 
                                        ? "bg-cyan-500 text-white shadow-sm" 
                                        : "text-slate-600 hover:bg-slate-50"
                                }`}
                            >
                                <LayoutList className="w-4 h-4" />
                                LIST
                            </button>
                            
                            {/* Admin Tabs */}
                            {canManageUsers && (
                                <button
                                    onClick={() => setView("team")}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                        view === "team" 
                                            ? "bg-cyan-500 text-white shadow-sm" 
                                            : "text-slate-600 hover:bg-slate-50"
                                    }`}
                                >
                                    <Users className="w-4 h-4" />
                                    TEAM
                                </button>
                            )}
                            {canViewApi && (
                                <button
                                    onClick={() => setView("integrations")}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                        view === "integrations" 
                                            ? "bg-cyan-500 text-white shadow-sm" 
                                            : "text-slate-600 hover:bg-slate-50"
                                    }`}
                                >
                                    <Zap className="w-4 h-4" />
                                    API
                                </button>
                            )}
                            {canViewSettings && (
                                <button
                                    onClick={() => setView("settings")}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                        view === "settings" 
                                            ? "bg-cyan-500 text-white shadow-sm" 
                                            : "text-slate-600 hover:bg-slate-50"
                                    }`}
                                >
                                    <Settings className="w-4 h-4" />
                                    SETTINGS
                                </button>
                            )}
                        </div>

                        {/* Right: Action Buttons */}
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setShowCreateBugModal(true)} 
                                className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg text-sm font-semibold hover:bg-cyan-600 transition-all shadow-sm"
                            >
                                <Plus className="w-4 h-4" />
                                NEW ISSUE
                            </button>
                            {isProjectAdmin && (
                                <>
                                    <button
                                        onClick={() => setShowImportModal(true)}
                                        className="flex items-center gap-2 px-3 py-2 border border-slate-200 bg-white text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all"
                                        title="Import bugs from CSV/JSON"
                                    >
                                        <Upload className="w-4 h-4" />
                                        IMPORT
                                    </button>
                                    <button
                                        onClick={handleExportHTML}
                                        className="flex items-center gap-2 px-3 py-2 border border-slate-200 bg-white text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all"
                                        title="Export to HTML"
                                    >
                                        <Globe className="w-4 h-4" />
                                        HTML
                                    </button>
                                    <ExportDropdown
                                        onExportCSV={handleExport}
                                        onExportWithImages={handleExportWithImages}
                                        disabled={bugs.length === 0}
                                    />
                                </>
                            )}
                        </div>
                    </div>

                    {/* Filter Bar */}
                    {(view === "kanban" || view === "list") && (
                        <div className="sticky top-0 z-30 bg-white px-4 py-3 flex flex-col lg:flex-row gap-3 lg:items-center justify-between shadow-sm">
                            {/* Left: Search + Quick Filters */}
                            <div className="flex items-center gap-3 flex-1">
                                <div className="relative max-w-xs">
                                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        className="w-full pl-9 pr-3 h-9 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-300 transition-all placeholder:text-slate-400"
                                        placeholder="Search bugs..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>

                                {/* Quick Filter Chips */}
                                <div className="hidden md:flex items-center gap-1.5">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Quick:</span>
                                    <button
                                        onClick={() => setAssigneeFilter(currentUser?.tokenIdentifier ? currentUser.tokenIdentifier : "all")}
                                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                                            assigneeFilter !== "all" && assigneeFilter !== "unassigned"
                                                ? 'bg-cyan-500 text-white border-cyan-600 shadow-sm'
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-cyan-300 hover:bg-cyan-50'
                                        }`}
                                    >
                                        My Issues
                                    </button>
                                    <button
                                        onClick={() => {
                                            const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
                                            if (assigneeFilter === "recent") {
                                                setAssigneeFilter("all");
                                            } else {
                                                setAssigneeFilter("recent");
                                            }
                                        }}
                                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                                            assigneeFilter === "recent"
                                                ? 'bg-purple-500 text-white border-purple-600 shadow-sm'
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300 hover:bg-purple-50'
                                        }`}
                                    >
                                        Recent
                                    </button>
                                    <button
                                        onClick={() => setPriorityFilter((stats?.critical ?? 0) > 0 ? "critical" : "all")}
                                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                                            priorityFilter === "critical"
                                                ? 'bg-red-500 text-white border-red-600 shadow-sm animate-pulse'
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-red-300 hover:bg-red-50'
                                        }`}
                                    >
                                        {(stats?.critical ?? 0) > 0 && <span className="mr-1">⚠️</span>}Critical
                                    </button>
                                </div>
                            </div>

                            {/* Right: Filters */}
                            <div className="flex items-center gap-2 flex-wrap">
                                {/* Type Filter */}
                                <div className="relative">
                                    <select
                                        value={typeFilter}
                                        onChange={(e) => setTypeFilter(e.target.value)}
                                        className="h-9 pl-3 pr-8 text-sm rounded-lg cursor-pointer transition-all appearance-none font-semibold bg-white text-slate-900 border border-slate-200 hover:border-slate-300"
                                    >
                                        <option value="all">Type</option>
                                        <option value="general">General</option>
                                        {(customModules || []).map((mod: any) => (
                                            <option key={mod.slug} value={mod.slug}>{mod.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>

                                {/* Status Filter */}
                                <div className="relative">
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="h-9 pl-3 pr-8 text-sm rounded-lg cursor-pointer transition-all appearance-none font-semibold bg-white text-slate-900 border border-slate-200 hover:border-slate-300"
                                    >
                                        <option value="all">Status</option>
                                        {kanbanColumns.map((statusCol) => (
                                            <option key={statusCol.status} value={statusCol.status}>
                                                {statusCol.label}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>

                                {/* Assignee Filter */}
                                <div className="relative">
                                    <select
                                        value={assigneeFilter}
                                        onChange={(e) => setAssigneeFilter(e.target.value)}
                                        className="h-9 pl-3 pr-8 text-sm rounded-lg cursor-pointer transition-all appearance-none font-semibold bg-white text-slate-900 border border-slate-200 hover:border-slate-300"
                                    >
                                        <option value="all">Assignee {members && members.length > 0 ? members.length : ''}</option>
                                        <option value="unassigned">Unassigned</option>
                                        {(members || []).map((m: any) => (
                                            <option key={m.userId} value={m.userId}>
                                                {m.name || m.email || m.userId}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>

                                {/* Priority Filter */}
                                <div className="relative">
                                    <select
                                        value={priorityFilter}
                                        onChange={(e) => setPriorityFilter(e.target.value)}
                                        className="h-9 pl-3 pr-8 text-sm rounded-lg cursor-pointer transition-all appearance-none font-semibold bg-white text-slate-900 border border-slate-200 hover:border-slate-300"
                                    >
                                        <option value="all">Priority</option>
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="critical">Critical</option>
                                    </select>
                                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>

                                {/* Customize - Purple Gradient */}
                                <div className="relative" ref={customizeRef}>
                                    <button
                                        onClick={() => setShowCustomizeDropdown(!showCustomizeDropdown)}
                                        className="h-9 pl-3 pr-8 text-sm bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-lg hover:border-indigo-300 transition-all text-indigo-600 font-semibold shadow-sm hover:shadow relative"
                                    >
                                        Customize
                                        <ChevronDown className="w-4 h-4 text-indigo-400 absolute right-2 top-1/2 -translate-y-1/2" />
                                    </button>
                                    
                                    {showCustomizeDropdown && (
                                            <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 py-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                                {/* Group By Section */}
                                                <div className="px-4 py-2">
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Group By</p>
                                                    <button
                                                        onClick={() => setGroupBy("status")}
                                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                                            groupBy === "status" 
                                                                ? "bg-indigo-50 text-indigo-600" 
                                                                : "text-slate-600 hover:bg-slate-50"
                                                        }`}
                                                    >
                                                        <span>Status</span>
                                                        {groupBy === "status" && <Check className="w-4 h-4 text-indigo-600" />}
                                                    </button>
                                                    <button
                                                        onClick={() => setGroupBy("priority")}
                                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                                            groupBy === "priority" 
                                                                ? "bg-indigo-50 text-indigo-600" 
                                                                : "text-slate-600 hover:bg-slate-50"
                                                        }`}
                                                    >
                                                        <span>Priority</span>
                                                        {groupBy === "priority" && <Check className="w-4 h-4 text-indigo-600" />}
                                                    </button>
                                                    <button
                                                        onClick={() => setGroupBy("assignee")}
                                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                                            groupBy === "assignee" 
                                                                ? "bg-indigo-50 text-indigo-600" 
                                                                : "text-slate-600 hover:bg-slate-50"
                                                        }`}
                                                    >
                                                        <span>Assignee</span>
                                                        {groupBy === "assignee" && <Check className="w-4 h-4 text-indigo-600" />}
                                                    </button>
                                                </div>

                                                <div className="h-px bg-slate-200 my-2" />

                                                {/* Sort By Section */}
                                                <div className="px-4 py-2">
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Sort By</p>
                                                    <button
                                                        onClick={() => setSortBy("created")}
                                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                                            sortBy === "created" 
                                                                ? "bg-indigo-50 text-indigo-600" 
                                                                : "text-slate-600 hover:bg-slate-50"
                                                        }`}
                                                    >
                                                        <span>Date created</span>
                                                        {sortBy === "created" && <Check className="w-4 h-4 text-indigo-600" />}
                                                    </button>
                                                    <button
                                                        onClick={() => setSortBy("updated")}
                                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                                            sortBy === "updated" 
                                                                ? "bg-indigo-50 text-indigo-600" 
                                                                : "text-slate-600 hover:bg-slate-50"
                                                        }`}
                                                    >
                                                        <span>Date updated</span>
                                                        {sortBy === "updated" && <Check className="w-4 h-4 text-indigo-600" />}
                                                    </button>
                                                    <button
                                                        onClick={() => setSortBy("due")}
                                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                                            sortBy === "due" 
                                                                ? "bg-indigo-50 text-indigo-600" 
                                                                : "text-slate-600 hover:bg-slate-50"
                                                        }`}
                                                    >
                                                        <span>Due date</span>
                                                        {sortBy === "due" && <Check className="w-4 h-4 text-indigo-600" />}
                                                    </button>
                                                </div>

                                                <div className="h-px bg-slate-200 my-2" />

                                                {/* Sort Order */}
                                                <div className="px-4 py-2">
                                                    <button
                                                        onClick={() => setSortOrder("newest")}
                                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                                            sortOrder === "newest" 
                                                                ? "bg-indigo-50 text-indigo-600" 
                                                                : "text-slate-600 hover:bg-slate-50"
                                                        }`}
                                                    >
                                                        <span>Newest first</span>
                                                        {sortOrder === "newest" && <Check className="w-4 h-4 text-indigo-600" />}
                                                    </button>
                                                    <button
                                                        onClick={() => setSortOrder("oldest")}
                                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                                            sortOrder === "oldest" 
                                                                ? "bg-indigo-50 text-indigo-600" 
                                                                : "text-slate-600 hover:bg-slate-50"
                                                        }`}
                                                    >
                                                        <span>Oldest first</span>
                                                        {sortOrder === "oldest" && <Check className="w-4 h-4 text-indigo-600" />}
                                                    </button>
                                                </div>

                                                <div className="h-px bg-slate-200 my-2" />

                                                {/* View Settings */}
                                                <div className="px-4 py-2">
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">View Settings</p>
                                                    <button
                                                        onClick={() => setShowScreenshot(!showScreenshot)}
                                                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all"
                                                    >
                                                        <span>Show screenshot</span>
                                                        {showScreenshot && <Check className="w-4 h-4 text-indigo-600" />}
                                                    </button>
                                                    <button
                                                        onClick={() => setShowSentiment(!showSentiment)}
                                                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all"
                                                    >
                                                        <span>Show sentiment</span>
                                                        {showSentiment && <Check className="w-4 h-4 text-indigo-600" />}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                </div>

                                {/* Board View Toggle */}
                                <div className="relative" ref={boardViewRef}>
                                    <button
                                        onClick={() => setShowBoardViewDropdown(!showBoardViewDropdown)}
                                        className="h-9 pl-3 pr-8 text-sm bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-all text-slate-600 font-medium relative"
                                    >
                                        Board View
                                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </button>
                                    
                                    {showBoardViewDropdown && (
                                        <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 py-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="px-4 py-2">
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">View Type</p>
                                                <button
                                                    onClick={() => {
                                                        setBoardView("status");
                                                        setGroupBy("status");
                                                        setShowBoardViewDropdown(false);
                                                    }}
                                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                                        boardView === "status" 
                                                            ? "bg-cyan-50 text-cyan-600" 
                                                            : "text-slate-600 hover:bg-slate-50"
                                                    }`}
                                                >
                                                    <span>Status Board</span>
                                                    {boardView === "status" && <Check className="w-4 h-4 text-cyan-600" />}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setBoardView("priority");
                                                        setGroupBy("priority");
                                                        setShowBoardViewDropdown(false);
                                                    }}
                                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                                        boardView === "priority" 
                                                            ? "bg-cyan-50 text-cyan-600" 
                                                            : "text-slate-600 hover:bg-slate-50"
                                                    }`}
                                                >
                                                    <span>Priority Board</span>
                                                    {boardView === "priority" && <Check className="w-4 h-4 text-cyan-600" />}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setBoardView("assignee");
                                                        setGroupBy("assignee");
                                                        setShowBoardViewDropdown(false);
                                                    }}
                                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                                        boardView === "assignee" 
                                                            ? "bg-cyan-50 text-cyan-600" 
                                                            : "text-slate-600 hover:bg-slate-50"
                                                    }`}
                                                >
                                                    <span>Assignee Board</span>
                                                    {boardView === "assignee" && <Check className="w-4 h-4 text-cyan-600" />}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
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
                                <div className="relative">
                                    {/* Scroll Controls Bar - Only show for status grouping */}
                                    {groupBy === "status" && (
                                        <div className="sticky top-[72px] z-20 flex items-center justify-between gap-4 bg-white border-2 border-slate-200 rounded-2xl px-6 py-3 shadow-sm mb-4">
                                            <button
                                                onClick={() => kanbanScrollRef.current?.scrollBy({ left: -320, behavior: "smooth" })}
                                                className="p-2.5 rounded-full bg-white border-2 border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 hover:border-slate-300 shadow-sm hover:shadow-md transition-all active:scale-95"
                                                title="Scroll left"
                                            >
                                                <ChevronLeft className="w-5 h-5" />
                                            </button>
                                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Scroll to navigate</div>
                                            <button
                                                onClick={() => kanbanScrollRef.current?.scrollBy({ left: 320, behavior: "smooth" })}
                                                className="p-2.5 rounded-full bg-white border-2 border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 hover:border-slate-300 shadow-sm hover:shadow-md transition-all active:scale-95"
                                                title="Scroll right"
                                            >
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                        </div>
                                    )}

                                    {/* Kanban Board - Group by Status */}
                                    {groupBy === "status" && (
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
                                                        onAddIssue={handleAddIssueToColumn}
                                                        showScreenshot={showScreenshot}
                                                        members={members}
                                                    />
                                                </div>
                                            ))}
                                            {isProjectAdmin && (
                                                <div className="w-[320px] shrink-0 rounded-2xl border-2 border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-slate-50/50 min-h-[600px] p-6 flex flex-col group/add transition-all hover:bg-slate-100/50 hover:border-slate-400">
                                                    <button
                                                        onClick={() => setShowAddBucketInput(true)}
                                                        className="text-sm font-bold text-slate-600 flex items-center gap-3 hover:text-slate-800 transition-all uppercase tracking-[0.2em] group-hover/add:text-slate-900"
                                                    >
                                                        <div className="w-12 h-12 rounded-2xl bg-white border-2 border-slate-300 flex items-center justify-center group-hover/add:scale-110 group-hover/add:border-slate-400 group-hover/add:shadow-md transition-all shadow-sm">
                                                            <Plus className="w-6 h-6 text-slate-600 group-hover/add:text-slate-800" />
                                                        </div>
                                                        Add Bucket
                                                    </button>
                                                    {showAddBucketInput && (
                                                        <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                            <input
                                                                type="text"
                                                                className="input w-full text-sm font-semibold h-11 bg-white border-2 border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 rounded-xl"
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
                                                                    className="btn-primary flex-1 h-10 text-xs font-bold uppercase tracking-widest rounded-xl"
                                                                >
                                                                    {addingBucket ? "Adding..." : "Add"}
                                                                </button>
                                                                <button 
                                                                    onClick={() => { setShowAddBucketInput(false); setNewBucketLabel(""); }}
                                                                    className="btn-ghost px-4 h-10 text-xs font-bold uppercase tracking-widest rounded-xl border border-slate-300"
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
                                    )}

                                    {/* Kanban Board - Group by Priority */}
                                    {groupBy === "priority" && (
                                        <div className="overflow-x-auto pb-2">
                                            <div className="flex gap-4 items-start min-w-max">
                                                {(["critical", "high", "medium", "low"] as Priority[]).map((priority) => (
                                                    <div key={priority} className="w-[320px] shrink-0">
                                                        <KanbanColumn
                                                            status={priority}
                                                            label={PRIORITY_CONFIG[priority].label}
                                                            icon={<AlertTriangle className="w-4 h-4" />}
                                                            color={priority === "critical" ? "text-red-400" : priority === "high" ? "text-amber-400" : priority === "medium" ? "text-blue-400" : "text-slate-400"}
                                                            bugs={bugsByPriority(priority)}
                                                            onSelect={setSelectedBugId}
                                                            onNavigateToLocation={navigateToBugLocation}
                                                            onAddIssue={handleAddIssueToColumn}
                                                            showScreenshot={showScreenshot}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Kanban Board - Group by Assignee */}
                                    {groupBy === "assignee" && (
                                        <div className="overflow-x-auto pb-2">
                                            <div className="flex gap-4 items-start min-w-max">
                                                {/* Unassigned Column */}
                                                <div className="w-[320px] shrink-0">
                                                    <KanbanColumn
                                                        status="unassigned"
                                                        label="Unassigned"
                                                        icon={<User className="w-4 h-4" />}
                                                        color="text-slate-400"
                                                        bugs={bugsByAssignee(null)}
                                                        onSelect={setSelectedBugId}
                                                        onNavigateToLocation={navigateToBugLocation}
                                                        onAddIssue={handleAddIssueToColumn}
                                                        showScreenshot={showScreenshot}
                                                    />
                                                </div>
                                                {/* Assignee Columns */}
                                                {(members || []).map((member: any) => (
                                                    <div key={member.userId} className="w-[320px] shrink-0">
                                                        <KanbanColumn
                                                            status={member.userId}
                                                            label={member.name || member.email || member.userId}
                                                            icon={<User className="w-4 h-4" />}
                                                            color="text-indigo-400"
                                                            bugs={bugsByAssignee(member.userId)}
                                                            onSelect={setSelectedBugId}
                                                            onNavigateToLocation={navigateToBugLocation}
                                                            onAddIssue={handleAddIssueToColumn}
                                                            showScreenshot={showScreenshot}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </DragDropContext>
                        )}
                        {view === "list" && <ListView bugs={sortedBugs} onSelect={setSelectedBugId} onNavigateToLocation={navigateToBugLocation} projectStatuses={projectStatuses || []} />}
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
            {showImportModal && projectId && (
                <ImportBugsModal
                    projectId={projectId}
                    devToken={devToken}
                    onClose={() => setShowImportModal(false)}
                    onSuccess={() => {
                        setShowImportModal(false);
                        // Bugs will auto-refresh via Convex reactivity
                    }}
                />
            )}
            {showCreateBugModal && projectId && (
                <CreateBugModal
                    projectId={projectId}
                    project={project}
                    devToken={devToken}
                    initialType={
                        // If viewing a module tab, pre-select that module
                        (view !== "kanban" && view !== "list" && view !== "team" && view !== "settings" && view !== "integrations")
                            ? view
                            // If a type filter is active on kanban/list, pre-select that type
                            : (typeFilter !== "all" ? typeFilter : undefined)
                    }
                    initialStatus={initialStatus}
                    onClose={() => {
                        setShowCreateBugModal(false);
                        setInitialStatus(undefined);
                    }}
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
        <div className="min-h-screen flex flex-col bg-[#09090E]" suppressHydrationWarning>
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
                                <div key={j} className="p-4 rounded-2xl border border-surface-border bg-surface-card/50 space-y-4" suppressHydrationWarning>
                                    <Skeleton className="w-full h-32 rounded-xl" />
                                    <Skeleton className="w-3/4 h-5 rounded-lg" />
                                    <div className="flex gap-2" suppressHydrationWarning>
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
