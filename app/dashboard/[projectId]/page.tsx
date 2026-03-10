"use client";

export const dynamic = 'force-dynamic';

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { useState, use, useEffect } from "react";
import {
    ArrowLeft, Clock, ExternalLink, User, Mail,
    Monitor, AlertTriangle, CheckCircle2, CircleDot, XCircle, GripVertical, Users, UserPlus, Trash, Plus, Search, Filter, Calendar, Tag
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { formatDistanceToNow } from "date-fns";
import { DragDropContext, Droppable, Draggable, DropResult, DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";

type Status = "open" | "in_progress" | "resolved" | "closed";
type Priority = "low" | "medium" | "high" | "critical";

const COLUMNS: { status: Status; label: string; icon: React.ReactNode }[] = [
    { status: "open", label: "New Issues", icon: <CircleDot className="w-4 h-4 text-blue-400" /> },
    { status: "in_progress", label: "In Progress", icon: <AlertTriangle className="w-4 h-4 text-amber-400" /> },
    { status: "resolved", label: "Resolved", icon: <CheckCircle2 className="w-4 h-4 text-green-400" /> },
    { status: "closed", label: "Closed", icon: <XCircle className="w-4 h-4 text-slate-500" /> },
];

export default function DashboardPage({ params }: { params: Promise<{ projectId: string }> }) {
    const resolvedParams = use(params);
    const rawProjectId = resolvedParams.projectId;
    const [mounted, setMounted] = useState(false);
    const [devToken, setDevToken] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
        const stored = localStorage.getItem("bugscribe_dev_token");
        if (stored) setDevToken(stored);
    }, []);
    const isValidId = rawProjectId.length >= 10; // Convex IDs are typically ~20+ chars

    const projectId = (isValidId ? rawProjectId : undefined) as Id<"projects"> | undefined;

    const project = useQuery(api.projects.getProject, projectId ? { projectId, devToken: devToken || undefined } : "skip");
    const bugs = useQuery(api.bugs.getBugs, projectId ? { projectId, devToken: devToken || undefined } : "skip");
    const stats = useQuery(api.bugs.getBugStats, projectId ? { projectId, devToken: devToken || undefined } : "skip");
    const updateStatus = useMutation(api.bugs.updateStatus);
    const createManualBug = useMutation(api.bugs.dashboardManualCreateBug);

    const [selectedBugId, setSelectedBugId] = useState<Id<"bugs"> | null>(null);
    const [showCreateBugModal, setShowCreateBugModal] = useState(false);
    const [view, setView] = useState<"kanban" | "list" | "team" | "settings" | "integrations">("kanban");

    // Advanced Filtering States
    const [searchQuery, setSearchQuery] = useState("");
    const [priorityFilter, setPriorityFilter] = useState<"all" | Priority>("all");

    const currentUser = useQuery(api.users.currentUser, { devToken: devToken || undefined });
    const members = useQuery(api.projects.listMembers, projectId ? { projectId, devToken: devToken || undefined } : "skip");
    const inviteMember = useMutation(api.projects.inviteMember);
    const removeMember = useMutation(api.projects.removeMember);

    const isProjectAdmin = project?.userId === currentUser?.tokenIdentifier ||
        members?.find(m => m.userId === currentUser?.tokenIdentifier && (m.role === "owner" || m.role === "admin")) ||
        currentUser?.role === "super_admin";

    if (!mounted || project === undefined || bugs === undefined) {
        return <LoadingSkeleton />;
    }

    if (project === null) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center">
                <p className="text-slate-400">Project not found.</p>
                <Link href="/" className="btn-ghost mt-4">← Back to projects</Link>
            </div>
        );
    }

    // Advanced Filtering Logic
    const filteredBugs = (bugs ?? []).filter((bug: any) => {
        const matchesSearch =
            bug.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            bug.url.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPriority = priorityFilter === "all" || bug.priority === priorityFilter;
        return matchesSearch && matchesPriority;
    });

    const bugsByStatus = (status: Status) =>
        filteredBugs.filter((b: any) => b.status === status);

    const handleDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const newStatus = destination.droppableId as Status;

        // Use devToken from state, fallback to localStorage
        const token = devToken || localStorage.getItem("bugscribe_dev_token") || undefined;

        try {
            // Optimistically update Convex immediately
            await updateStatus({ bugId: draggableId as Id<"bugs">, status: newStatus, devToken: token });
        } catch (error: unknown) {
            console.error(error);
            alert(error instanceof Error ? error.message : "Failed to update status. Please sign in again.");
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />

            <div className="flex-1 flex flex-col max-w-[1600px] mx-auto w-full px-4 py-6">
                {/* Breadcrumb + Header */}
                <div className="flex items-center gap-3 mb-6">
                    <Link href="/" className="btn-ghost text-xs px-2">
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Projects
                    </Link>
                    <span className="text-slate-600">/</span>
                    <span className="text-sm font-medium text-white">{project.name}</span>
                </div>

                {/* Stats Bar */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
                        {[
                            { label: "Total", value: stats.total, color: "text-white" },
                            { label: "Open", value: stats.open, color: "text-blue-400" },
                            { label: "In Progress", value: stats.in_progress, color: "text-amber-400" },
                            { label: "Resolved", value: stats.resolved, color: "text-green-400" },
                            { label: "Closed", value: stats.closed, color: "text-slate-400" },
                            { label: "Critical", value: stats.critical, color: "text-red-400" },
                        ].map((s) => (
                            <div key={s.label} className="card p-3 text-center">
                                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* View Toggle */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-white">Bug Reports</h2>
                    <div className="flex gap-1 p-1 bg-surface-card border border-surface-border rounded-lg">
                        {(["kanban", "list", "team", "integrations", "settings"] as const).map((v) => (
                            <button
                                key={v}
                                onClick={() => setView(v)}
                                className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-all ${view === v
                                    ? "bg-brand-500 text-white"
                                    : "text-slate-400 hover:text-white"
                                    }`}
                            >
                                {v === "team" ? <div className="flex items-center gap-1.5"><Users className="w-3 h-3" /> Team</div> :
                                    v === "integrations" ? <div className="flex items-center gap-1.5"><Monitor className="w-3 h-3" /> Integrations</div> : v}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Toolbar */}
                {(view === "kanban" || view === "list") && (
                    <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between mb-6">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowCreateBugModal(true)}
                                className="btn-primary text-xs flex items-center gap-1.5"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Add New Issue
                            </button>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    className="input pl-9 h-9 text-xs w-[200px]"
                                    placeholder="Search bugs..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="relative">
                                <Filter className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <select
                                    className="input pl-8 h-9 text-xs appearance-none pr-8 cursor-pointer"
                                    value={priorityFilter}
                                    onChange={(e) => setPriorityFilter(e.target.value as "all" | Priority)}
                                >
                                    <option value="all">All Priorities</option>
                                    <option value="critical">Critical Only</option>
                                    <option value="high">High Info</option>
                                    <option value="medium">Medium Only</option>
                                    <option value="low">Low Only</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Team Management */}
                {view === "team" && (
                    <div className="animate-fade-in flex-1">
                        <TeamManagement
                            members={members ?? []}
                            isEditable={isProjectAdmin as boolean}
                            onInvite={async (email, role) => {
                                const token = localStorage.getItem("bugscribe_dev_token") || undefined;
                                await inviteMember({ projectId: projectId!, email, role: role as "admin" | "editor" | "viewer", devToken: token });
                            }}
                            onRemove={async (membershipId) => {
                                const token = localStorage.getItem("bugscribe_dev_token") || undefined;
                                await removeMember({ membershipId, devToken: token });
                            }}
                        />
                    </div>
                )}

                {/* Integrations View */}
                {view === "integrations" && (
                    <div className="animate-fade-in flex-1">
                        <IntegrationsView project={project} />
                    </div>
                )}

                {/* Settings View */}
                {view === "settings" && (
                    <div className="animate-fade-in flex-1">
                        <div className="max-w-2xl">
                            <h3 className="text-white font-semibold mb-4">Project Settings</h3>
                            <div className="card p-6 space-y-6">
                                <ProjectSettingsForm project={project} />

                                <div className="divider" />
                                <div>
                                    <div className="bg-surface-card border border-surface-border rounded-lg p-4 flex items-center justify-between">
                                        <code className="text-brand-300 text-xs font-mono">
                                            {project.apiKey}
                                        </code>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(project.apiKey);
                                                alert("API Key copied!");
                                            }}
                                            className="text-slate-400 hover:text-white transition-colors"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-2">Use this key in your widget configuration.</p>
                                </div>
                                <div className="divider" />
                                <div>
                                    <h4 className="text-sm font-medium text-white mb-2 text-red-500">Danger Zone</h4>
                                    <p className="text-xs text-slate-400 mb-4">Deleting a project will remove all bugs and comments associated with it.</p>
                                    <DeleteProjectButton projectId={project._id} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Kanban Board */}
                {view === "kanban" && (
                    <DragDropContext onDragEnd={handleDragEnd}>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 flex-1 items-start">
                            {COLUMNS.map((col) => (
                                <KanbanColumn
                                    key={col.status}
                                    status={col.status}
                                    label={col.label}
                                    icon={col.icon}
                                    bugs={bugsByStatus(col.status)}
                                    onSelect={setSelectedBugId}
                                />
                            ))}
                        </div>
                    </DragDropContext>
                )}

                {/* List View */}
                {view === "list" && (
                    <div className="card overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-surface-border">
                                    {["Title", "URL", "Status", "Priority", "Browser", "Reported"].map((h) => (
                                        <th key={h} className="text-left px-4 py-3 text-xs text-slate-500 font-medium">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-border">
                                {filteredBugs.map((bug: any) => (
                                    <tr key={bug._id} className="hover:bg-surface-hover transition-colors cursor-pointer"
                                        onClick={() => setSelectedBugId(bug._id as Id<"bugs">)}>
                                        <td className="px-4 py-3 font-medium text-white">{bug.title}</td>
                                        <td className="px-4 py-3 text-slate-500 max-w-[160px] truncate">{bug.url}</td>
                                        <td className="px-4 py-3">
                                            <span className={`status-${bug.status}`}>{bug.status.replace("_", " ")}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`priority-${bug.priority}`}>{bug.priority}</span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-500 text-xs truncate max-w-[160px]">{bug.browser}</td>
                                        <td className="px-4 py-3 text-slate-600 text-xs">
                                            {formatDistanceToNow(bug.createdAt, { addSuffix: true })}
                                        </td>
                                    </tr>
                                ))}
                                {filteredBugs.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-12 text-center text-slate-500">No bugs reported yet</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Bug Detail Drawer */}
            {selectedBugId && (
                <BugDetailDrawer
                    bugId={selectedBugId}
                    onClose={() => setSelectedBugId(null)}
                    onStatusChange={async (status) => {
                        const token = localStorage.getItem("bugscribe_dev_token") || undefined;
                        await updateStatus({ bugId: selectedBugId, status, devToken: token });
                    }}
                />
            )}

            {/* Create Bug Modal */}
            {showCreateBugModal && (
                <CreateBugModal
                    projectId={projectId as Id<"projects">}
                    onClose={() => setShowCreateBugModal(false)}
                    onCreate={async (title, description, priority) => {
                        await createManualBug({
                            projectId: projectId as Id<"projects">,
                            title,
                            description,
                            priority,
                            devToken: devToken!
                        });
                        setShowCreateBugModal(false);
                    }}
                />
            )}
        </div>
    );
}

// ── Create Bug Modal ──────────────────────────────────────────────────────────
function CreateBugModal({
    projectId,
    onClose,
    onCreate,
}: {
    projectId: Id<"projects">;
    onClose: () => void;
    onCreate: (title: string, description: string, priority: Priority) => Promise<void>;
}) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState<Priority>("medium");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        setSubmitting(true);
        try {
            await onCreate(title.trim(), description.trim(), priority);
        } catch (error) {
            console.error(error);
            alert("Failed to create issue.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="relative z-[100]">
            <div className="fixed inset-0 bg-black/60 z-[100] animate-fade-in" onClick={onClose} />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] max-w-[95vw] bg-[#1a1d27] border border-[#2a2d3e] rounded-xl z-[101] animate-slide-up shadow-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-white text-lg">Create New Issue</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                        <XCircle className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs text-slate-400 font-medium block mb-1.5">Title *</label>
                        <input
                            className="input w-full text-sm placeholder:text-slate-500"
                            placeholder="e.g. Broken button on homepage"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 font-medium block mb-1.5">Steps to Reproduce / Description</label>
                        <textarea
                            className="input w-full h-32 resize-none text-sm placeholder:text-slate-500"
                            placeholder="1. Go to homepage&#10;2. Click on the big button&#10;3. See error"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 font-medium block mb-1.5">Priority</label>
                        <select
                            className="input w-full text-sm"
                            value={priority}
                            onChange={(e) => setPriority(e.target.value as Priority)}
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                        </select>
                    </div>
                    <div className="flex gap-3 justify-end pt-4 mt-2">
                        <button type="button" onClick={onClose} className="btn-ghost">
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={submitting}>
                            {submitting ? "Creating..." : "Create Issue"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Kanban Column ──────────────────────────────────────────────────────────────
function KanbanColumn({
    status, label, icon, bugs, onSelect,
}: {
    status: Status;
    label: string;
    icon: React.ReactNode;
    bugs: Array<{ _id: string; title: string; url: string; priority: Priority; browser: string; screenshotUrl?: string | null; createdAt: number; tags?: string[]; assigneeId?: string | null; dueDate?: number | null; }>;
    onSelect: (id: Id<"bugs">) => void;
}) {
    return (
        <div className="card flex flex-col min-h-[500px] h-full">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-surface-border bg-surface-card relative z-10">
                {icon}
                <span className="text-sm font-medium text-white">{label}</span>
                <span className="ml-auto text-xs font-medium bg-surface px-2 py-0.5 rounded-full text-slate-400 border border-surface-border">
                    {bugs.length}
                </span>
            </div>

            <Droppable droppableId={status}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 p-3 space-y-3 overflow-y-auto transition-colors ${snapshot.isDraggingOver ? "bg-brand-500/5 ring-1 ring-inset ring-brand-500/20" : ""
                            }`}
                    >
                        {bugs.length === 0 && !snapshot.isDraggingOver && (
                            <div className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-surface-border rounded-lg">
                                <p className="text-slate-600 text-xs">Drop here</p>
                            </div>
                        )}
                        {bugs.map((bug, index) => (
                            <Draggable key={bug._id} draggableId={bug._id} index={index}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        style={provided.draggableProps.style}
                                        className={`${snapshot.isDragging ? "z-50 opacity-90 scale-105" : ""}`}
                                    >
                                        <BugCard
                                            bug={bug}
                                            dragHandleProps={provided.dragHandleProps}
                                            onClick={() => onSelect(bug._id as Id<"bugs">)}
                                        />
                                    </div>
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
}

// ── Bug Card ──────────────────────────────────────────────────────────────────
function BugCard({
    bug, onClick, dragHandleProps
}: {
    bug: { _id: string; title: string; url: string; priority: Priority; browser: string; screenshotUrl?: string | null; createdAt: number; tags?: string[]; assigneeId?: string | null; dueDate?: number | null; };
    onClick: () => void;
    dragHandleProps: DraggableProvidedDragHandleProps | null;
}) {
    return (
        <div className="bg-surface rounded-lg border border-surface-border hover:border-brand-500/30 overflow-hidden cursor-pointer shadow-sm group hover:shadow-md transition-all">
            {bug.screenshotUrl && (
                <div onClick={onClick} className="w-full h-28 relative border-b border-surface-border bg-black/20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={bug.screenshotUrl}
                        alt="Screenshot"
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                </div>
            )}

            <div className="p-3">
                <div className="flex items-start gap-2">
                    <div {...dragHandleProps} className="text-slate-600 hover:text-white cursor-grab active:cursor-grabbing mt-0.5">
                        <GripVertical className="w-3.5 h-3.5" />
                    </div>
                    <div onClick={onClick} className="flex-1 min-w-0">
                        <p className="text-white text-xs font-medium leading-snug mb-2 mb-2 break-words line-clamp-2">{bug.title}</p>
                        {bug.tags && bug.tags.length > 0 && (
                            <div className="flex gap-1 flex-wrap mb-2">
                                {bug.tags.map((t: string) => <span key={t} className="px-1.5 py-0.5 bg-surface-border/50 text-slate-300 rounded text-[9px]">{t}</span>)}
                            </div>
                        )}
                        <div className="flex items-center justify-between mt-2">
                            <span className={`priority-${bug.priority}`}>{bug.priority}</span>
                            <div className="flex items-center gap-2 text-slate-500 text-[10px]">
                                {bug.assigneeId && <span title="Assigned"><User className="w-3 h-3 text-brand-400" /></span>}
                                {bug.dueDate && <span title="Has Due Date"><Calendar className="w-3 h-3 text-amber-500" /></span>}
                                <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatDistanceToNow(bug.createdAt, { addSuffix: true })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Bug Detail Drawer ─────────────────────────────────────────────────────────
function BugDetailDrawer({
    bugId, onClose, onStatusChange,
}: {
    bugId: Id<"bugs">;
    onClose: () => void;
    onStatusChange: (status: Status) => Promise<void>;
}) {
    const [devToken, setDevToken] = useState<string | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem("bugscribe_dev_token");
        if (stored) setDevToken(stored);
    }, []);

    const bug = useQuery(api.bugs.getBug, { bugId, devToken: devToken || undefined });
    const members = useQuery(api.projects.listMembers, bug ? { projectId: bug.projectId, devToken: devToken || undefined } : "skip");
    const addComment = useMutation(api.comments.addComment);
    const [comment, setComment] = useState("");
    const [author, setAuthor] = useState("Team");
    const [submitting, setSubmitting] = useState(false);

    const handleComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!comment.trim()) return;
        setSubmitting(true);
        try {
            await addComment({ bugId, author, body: comment.trim() });
            setComment("");
        } catch (error: unknown) {
            console.error(error);
            alert("Failed to add comment.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/60 z-40 animate-fade-in"
                onClick={onClose}
            />
            {/* Drawer */}
            <aside className="fixed right-0 top-0 h-full w-full max-w-xl bg-surface-card border-l border-surface-border z-50
                        flex flex-col overflow-hidden animate-slide-up">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border shrink-0">
                    <h3 className="font-semibold text-white">Bug Details</h3>
                    <button onClick={onClose} className="btn-ghost px-2 py-1 text-lg leading-none">×</button>
                </div>

                {!bug ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="skeleton w-32 h-4" />
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto">
                        {/* Media (Screenshot or Video) */}
                        {bug.screenshotUrl && (
                            <div className="px-6 py-4 border-b border-surface-border">
                                {bug.mediaType === "video" ? (
                                    <video
                                        src={bug.screenshotUrl}
                                        controls
                                        autoPlay
                                        muted
                                        loop
                                        className="w-full rounded-lg border border-surface-border bg-black"
                                    />
                                ) : (
                                    <ZoomableImage src={bug.screenshotUrl} alt="Bug screenshot" />
                                )}
                            </div>
                        )}

                        <div className="px-6 py-4 space-y-4">
                            <div>
                                <BugTitleEdit bug={bug} />
                                <BugDescriptionEdit bug={bug} />

                                {bug.steps && bug.steps.length > 0 && (
                                    <div className="space-y-2 mt-4 bg-surface rounded-lg border border-surface-border p-4">
                                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Dynamic Steps (Auto-Tracked)</h4>
                                        <ol className="list-decimal list-inside text-sm text-slate-300 space-y-1">
                                            {bug.steps.map((step: string, i: number) => (
                                                <li key={i}>{step}</li>
                                            ))}
                                        </ol>
                                    </div>
                                )}

                                {bug.environmentData && (
                                    <div className="space-y-2 mt-4 bg-surface rounded-lg border border-surface-border p-4">
                                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Environment Snapshot</h4>
                                        <pre className="text-[10px] text-slate-300 font-mono whitespace-pre-wrap overflow-y-auto max-h-40">
                                            {JSON.stringify(bug.environmentData, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2 flex-wrap items-center">
                                <span className={`status-${bug.status}`}>{bug.status.replace("_", " ")}</span>
                                <span className={`priority-${bug.priority}`}>{bug.priority}</span>
                                <DeleteBugButton bugId={bug._id} onDone={onClose} />
                            </div>

                            {/* Status Actions */}
                            <div className="flex gap-2 flex-wrap">
                                {(["open", "in_progress", "resolved", "closed"] as Status[]).map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => onStatusChange(s)}
                                        disabled={bug.status === s}
                                        className={`text-xs px-3 py-1.5 rounded-lg border transition-all
                      ${bug.status === s
                                                ? "bg-brand-500/20 border-brand-500/40 text-brand-300"
                                                : "border-surface-border text-slate-400 hover:border-brand-500/30 hover:text-white"
                                            }`}
                                    >
                                        {s.replace("_", " ")}
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400 font-medium">Assignee</label>
                                    <BugAssigneeSelect bug={bug} members={members || []} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400 font-medium">Due Date</label>
                                    <BugDueDateEdit bug={bug} />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs text-slate-400 font-medium flex items-center gap-1"><Tag className="w-3 h-3" /> Tags</label>
                                <BugTagsEdit bug={bug} />
                            </div>

                            <div className="divider" />

                            {/* Metadata */}
                            <div className="space-y-2">
                                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Environment</h4>
                                <MetaRow icon={<ExternalLink className="w-3.5 h-3.5" />} label="URL" value={bug.url} />
                                <MetaRow icon={<Monitor className="w-3.5 h-3.5" />} label="Browser" value={bug.browser} />
                                {bug.os && <MetaRow icon={<Monitor className="w-3.5 h-3.5" />} label="OS" value={bug.os} />}
                                {bug.screenWidth && bug.screenHeight && (
                                    <MetaRow icon={<Monitor className="w-3.5 h-3.5" />} label="Screen" value={`${bug.screenWidth}×${bug.screenHeight}`} />
                                )}

                                <div className="pt-2">
                                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Reporter</h4>
                                    <MetaRow icon={<User className="w-3.5 h-3.5" />} label="Name" value={bug.reporterName || "Anonymous"} />
                                    {bug.reporterEmail && <MetaRow icon={<Mail className="w-3.5 h-3.5" />} label="Email" value={bug.reporterEmail} />}
                                </div>
                            </div>

                            {/* Console Errors */}
                            {bug.consoleErrors && bug.consoleErrors.length > 0 && (
                                <>
                                    <div className="divider" />
                                    <div>
                                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Console Errors</h4>
                                        <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3 space-y-1">
                                            {bug.consoleErrors.map((err: string, i: number) => (
                                                <p key={i} className="text-red-400 text-xs font-mono">{err}</p>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="divider" />

                            {/* Comments */}
                            <div>
                                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                                    Comments ({bug.comments?.length ?? 0})
                                </h4>
                                <div className="space-y-3 mb-4">
                                    {(bug.comments ?? []).map((c: any) => (
                                        <div key={c._id} className="bg-surface rounded-lg p-3 border border-surface-border">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-semibold text-white">{c.author}</span>
                                                <span className="text-xs text-slate-600">
                                                    {formatDistanceToNow(c.createdAt, { addSuffix: true })}
                                                </span>
                                            </div>
                                            <p className="text-slate-300 text-sm">{c.body}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Add Comment */}
                                <form onSubmit={handleComment} className="space-y-2">
                                    <input
                                        className="input text-xs"
                                        placeholder="Your name"
                                        value={author}
                                        onChange={(e) => setAuthor(e.target.value)}
                                    />
                                    <textarea
                                        className="input text-xs resize-none"
                                        rows={3}
                                        placeholder="Leave a comment..."
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                    />
                                    <button type="submit" className="btn-primary w-full justify-center" disabled={submitting}>
                                        {submitting ? "Posting..." : "Post Comment"}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </aside>
        </>
    );
}

// ── Zoomable Image ────────────────────────────────────────────────────────────
function ZoomableImage({ src, alt }: { src: string; alt: string }) {
    const [zoom, setZoom] = useState(1);
    const [showLightbox, setShowLightbox] = useState(false);
    const [lbZoom, setLbZoom] = useState(1);
    const [lbPos, setLbPos] = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        setZoom(prev => Math.min(5, Math.max(0.5, prev - e.deltaY * 0.002)));
    };

    const handleLbWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        setLbZoom(prev => Math.min(8, Math.max(0.25, prev - e.deltaY * 0.002)));
    };

    return (
        <>
            {/* Inline Preview with Zoom */}
            <div className="relative group">
                <div
                    className="w-full rounded-lg border border-surface-border overflow-hidden bg-black cursor-zoom-in"
                    style={{ maxHeight: '300px' }}
                    onWheel={handleWheel}
                    onClick={() => { setShowLightbox(true); setLbZoom(1); setLbPos({ x: 0, y: 0 }); }}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={src}
                        alt={alt}
                        className="w-full h-full object-contain transition-transform duration-200"
                        style={{ transform: `scale(${zoom})` }}
                        draggable={false}
                    />
                </div>
                {/* Zoom Controls */}
                <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-lg border border-white/10 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); setZoom(prev => Math.max(0.5, prev - 0.25)); }} className="text-white text-xs w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded">−</button>
                    <span className="text-[10px] text-white/70 w-8 text-center">{Math.round(zoom * 100)}%</span>
                    <button onClick={(e) => { e.stopPropagation(); setZoom(prev => Math.min(5, prev + 0.25)); }} className="text-white text-xs w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded">+</button>
                    <button onClick={(e) => { e.stopPropagation(); setZoom(1); }} className="text-white/50 text-[10px] px-1.5 h-6 flex items-center hover:bg-white/10 rounded hover:text-white">Reset</button>
                </div>
            </div>

            {/* Fullscreen Lightbox */}
            {showLightbox && (
                <div
                    className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center animate-fade-in cursor-grab active:cursor-grabbing"
                    onClick={() => setShowLightbox(false)}
                    onWheel={handleLbWheel}
                    onMouseDown={(e) => { e.preventDefault(); setDragging(true); setDragStart({ x: e.clientX - lbPos.x, y: e.clientY - lbPos.y }); }}
                    onMouseMove={(e) => { if (dragging) setLbPos({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }); }}
                    onMouseUp={() => setDragging(false)}
                    onMouseLeave={() => setDragging(false)}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={src}
                        alt={alt}
                        className="max-w-none transition-transform duration-100 select-none pointer-events-none"
                        style={{ transform: `translate(${lbPos.x}px, ${lbPos.y}px) scale(${lbZoom})` }}
                        draggable={false}
                    />
                    {/* Lightbox Controls */}
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/80 backdrop-blur-sm rounded-full border border-white/10 px-4 py-2"
                        onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setLbZoom(prev => Math.max(0.25, prev - 0.25))} className="text-white text-sm w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full">−</button>
                        <span className="text-xs text-white/60 w-12 text-center">{Math.round(lbZoom * 100)}%</span>
                        <button onClick={() => setLbZoom(prev => Math.min(8, prev + 0.25))} className="text-white text-sm w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full">+</button>
                        <div className="w-px h-5 bg-white/20" />
                        <button onClick={() => { setLbZoom(1); setLbPos({ x: 0, y: 0 }); }} className="text-white/50 text-xs px-3 h-8 flex items-center hover:bg-white/10 rounded-full hover:text-white">Fit</button>
                        <button onClick={() => setShowLightbox(false)} className="text-white/50 text-xs px-3 h-8 flex items-center hover:bg-white/10 rounded-full hover:text-white">✕ Close</button>
                    </div>
                </div>
            )}
        </>
    );
}

function MetaRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-start gap-2 text-xs">
            <span className="text-slate-600 shrink-0 mt-0.5">{icon}</span>
            <span className="text-slate-500 shrink-0 w-16">{label}</span>
            <span className="text-slate-300 break-all">{value}</span>
        </div>
    );
}

function TeamManagement({
    members, isEditable, onInvite, onRemove
}: {
    members: Array<{ _id: Id<"projectMembers">; userId: string; email?: string; name?: string; role: string; }>,
    isEditable: boolean,
    onInvite: (email: string, role: string) => Promise<void>,
    onRemove: (id: Id<"projectMembers">) => Promise<void>
}) {
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("viewer");
    const [inviting, setInviting] = useState(false);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setInviting(true);
        try {
            await onInvite(inviteEmail, inviteRole);
            setInviteEmail("");
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "Failed to invite user");
        } finally {
            setInviting(false);
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
                <h3 className="text-white font-semibold">Team Members</h3>
                <div className="card overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-surface-border text-slate-500 text-xs">
                                <th className="text-left px-4 py-3 font-medium">User</th>
                                <th className="text-left px-4 py-3 font-medium">Role</th>
                                <th className="text-right px-4 py-3 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-border">
                            {members.map((member) => (
                                <tr key={member._id} className="text-white">
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col">
                                            <span className="font-medium">{member.name || "Unknown User"}</span>
                                            <span className="text-xs text-slate-500">{member.email}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border border-surface-border 
                                            ${member.role === 'owner' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                member.role === 'admin' ? 'bg-brand-500/10 text-brand-500 border-brand-500/20' :
                                                    'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
                                            {member.role.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {isEditable && member.role !== 'owner' && (
                                            <button
                                                onClick={() => onRemove(member._id)}
                                                className="text-slate-500 hover:text-red-400 transition-colors"
                                            >
                                                <Trash className="w-4 h-4" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isEditable && (
                <div className="space-y-4">
                    <h3 className="text-white font-semibold">Invite Member</h3>
                    <div className="card p-5">
                        <form onSubmit={handleInvite} className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-400 block mb-1.5">Email Address</label>
                                <input
                                    className="input text-xs"
                                    placeholder="user@example.com"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 block mb-1.5">Role</label>
                                <select
                                    className="input text-xs"
                                    value={inviteRole}
                                    onChange={(e) => setInviteRole(e.target.value)}
                                >
                                    <option value="viewer">Viewer (Read-only)</option>
                                    <option value="editor">Editor (Can edit bugs)</option>
                                    <option value="admin">Admin (Can manage team)</option>
                                </select>
                            </div>
                            <button type="submit" className="btn-primary w-full justify-center" disabled={inviting}>
                                <UserPlus className="w-4 h-4" />
                                {inviting ? "Inviting..." : "Send Invitation"}
                            </button>
                            <p className="text-[10px] text-slate-500 text-center">
                                User must have a BugScribe account to be invited.
                            </p>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Helper Components ─────────────────────────────────────────────────────────

function ProjectSettingsForm({ project }: { project: { _id: Id<"projects">; name: string; domain?: string; description?: string; apiKey: string; } }) {
    const updateProject = useMutation(api.projects.updateProject);
    const [name, setName] = useState(project.name);
    const [domain, setDomain] = useState(project.domain || "");
    const [description, setDescription] = useState(project.description || "");
    const [saving, setSaving] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const token = localStorage.getItem("bugscribe_dev_token") || undefined;
            await updateProject({
                projectId: project._id,
                name,
                domain: domain || undefined,
                description: description || undefined,
                devToken: token,
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSave} className="space-y-4">
            <div>
                <label className="text-xs text-slate-400 font-medium block mb-1.5">Project Name</label>
                <input className="input" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div>
                <label className="text-xs text-slate-400 font-medium block mb-1.5">Domain</label>
                <input className="input" value={domain} onChange={e => setDomain(e.target.value)} placeholder="app.example.com" />
            </div>
            <div>
                <label className="text-xs text-slate-400 font-medium block mb-1.5">Description</label>
                <textarea className="input resize-none" rows={2} value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <button type="submit" className="btn-primary" disabled={saving || (name === project.name && domain === (project.domain || "") && description === (project.description || ""))}>
                {saving ? "Saving..." : "Save Changes"}
            </button>
        </form>
    );
}

function DeleteProjectButton({ projectId }: { projectId: Id<"projects"> }) {
    const deleteProject = useMutation(api.projects.deleteProject);

    const handleDelete = async () => {
        if (confirm("Are you sure? This will delete ALL bugs and comments. This cannot be undone.")) {
            const token = localStorage.getItem("bugscribe_dev_token") || undefined;
            await deleteProject({ projectId, devToken: token });
            window.location.href = "/";
        }
    };

    return (
        <button
            className="btn-ghost text-red-400 border border-red-500/20 hover:bg-red-500/10 text-xs"
            onClick={handleDelete}
        >
            <Trash className="w-4 h-4" />
            Delete Project
        </button>
    );
}

function BugTitleEdit({ bug }: { bug: { _id: Id<"bugs">; title: string; } }) {
    const updateBug = useMutation(api.bugs.updateBug);
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(bug.title);

    if (!isEditing) {
        return <h2 className="text-lg font-semibold text-white cursor-pointer hover:text-brand-400 transition-colors" onClick={() => setIsEditing(true)}>{bug.title}</h2>;
    }

    return (
        <div className="flex gap-2">
            <input className="input text-lg font-semibold py-1 flex-1" value={title} onChange={e => setTitle(e.target.value)} autoFocus onBlur={async () => {
                const token = localStorage.getItem("bugscribe_dev_token") || undefined;
                if (title !== bug.title) await updateBug({ bugId: bug._id, title, devToken: token });
                setIsEditing(false);
            }} />
        </div>
    );
}

function BugDescriptionEdit({ bug }: { bug: { _id: Id<"bugs">; description?: string; } }) {
    const updateBug = useMutation(api.bugs.updateBug);
    const [isEditing, setIsEditing] = useState(false);
    const [description, setDescription] = useState(bug.description || "");

    if (!isEditing) {
        return (
            <p className="text-slate-400 text-sm mt-1 cursor-pointer hover:bg-surface-hover p-1 rounded transition-colors" onClick={() => setIsEditing(true)}>
                {bug.description || <span className="italic opacity-50">No description...</span>}
            </p>
        );
    }

    return (
        <textarea
            className="input text-sm mt-1 resize-none min-h-[100px]"
            value={description}
            onChange={e => setDescription(e.target.value)}
            autoFocus
            onBlur={async () => {
                const token = localStorage.getItem("bugscribe_dev_token") || undefined;
                if (description !== (bug.description || "")) await updateBug({ bugId: bug._id, description, devToken: token });
                setIsEditing(false);
            }}
        />
    );
}

function BugAssigneeSelect({ bug, members }: { bug: any, members: any[] }) {
    const updateBug = useMutation(api.bugs.updateBug);
    return (
        <select
            className="input text-xs py-1.5 px-2 bg-surface-card border-surface-border text-slate-300 h-8 w-full max-w-[150px]"
            value={bug.assigneeId || ""}
            onChange={async (e) => {
                const token = localStorage.getItem("bugscribe_dev_token") || undefined;
                await updateBug({ bugId: bug._id, assigneeId: e.target.value || null, devToken: token });
            }}
        >
            <option value="">Unassigned</option>
            {members.map(m => (
                <option key={m.userId} value={m.userId}>{m.name || m.email || m.userId}</option>
            ))}
        </select>
    );
}

function BugTagsEdit({ bug }: { bug: any }) {
    const updateBug = useMutation(api.bugs.updateBug);
    const [tagInput, setTagInput] = useState("");
    const tags = bug.tags || [];

    const handleAdd = async (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && tagInput.trim()) {
            e.preventDefault();
            if (tags.includes(tagInput.trim())) return;
            const newTags = [...tags, tagInput.trim()];
            const token = localStorage.getItem("bugscribe_dev_token") || undefined;
            await updateBug({ bugId: bug._id, tags: newTags, devToken: token });
            setTagInput("");
        }
    };

    const handleRemove = async (tagToRemove: string) => {
        const newTags = tags.filter((t: string) => t !== tagToRemove);
        const token = localStorage.getItem("bugscribe_dev_token") || undefined;
        await updateBug({ bugId: bug._id, tags: newTags, devToken: token });
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="flex gap-2 flex-wrap">
                {tags.map((t: string) => (
                    <span key={t} className="px-2 py-1 bg-surface-border/50 border border-surface-border rounded text-[10px] flex items-center gap-1 text-slate-300">
                        {t}
                        <button onClick={() => handleRemove(t)} className="hover:text-red-400 font-bold ml-1">×</button>
                    </span>
                ))}
            </div>
            <input
                className="input text-xs py-1.5 px-2 bg-surface-card border-surface-border h-8"
                placeholder="Add tag and press Enter"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleAdd}
            />
        </div>
    );
}

function BugDueDateEdit({ bug }: { bug: any }) {
    const updateBug = useMutation(api.bugs.updateBug);
    const dateStr = bug.dueDate ? new Date(bug.dueDate).toISOString().split('T')[0] : "";

    return (
        <input
            type="date"
            className="input text-xs py-1.5 px-2 bg-surface-card border-surface-border text-slate-300 h-8 max-w-[130px]"
            value={dateStr}
            onChange={async (e) => {
                const val = e.target.value;
                const token = localStorage.getItem("bugscribe_dev_token") || undefined;
                await updateBug({ bugId: bug._id, dueDate: val ? new Date(val).getTime() : null, devToken: token });
            }}
        />
    );
}

function DeleteBugButton({ bugId, onDone }: { bugId: Id<"bugs">, onDone: () => void }) {
    const deleteBug = useMutation(api.bugs.deleteBug);

    const handleDelete = async () => {
        if (confirm("Delete this bug report?")) {
            const token = localStorage.getItem("bugscribe_dev_token") || undefined;
            await deleteBug({ bugId, devToken: token });
            onDone();
        }
    };

    return (
        <button onClick={handleDelete} className="text-[10px] text-red-500 hover:text-red-400 font-medium px-2 py-0.5 rounded bg-red-500/5 border border-red-500/10">
            Delete
        </button>
    );
}

function IntegrationsView({ project }: { project: { _id: string, apiKey: string } }) {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const snippet = `<!-- BugScribe Widget -->
<script 
  src="${origin}/widget/bugscribe-widget.js" 
  data-project-id="${project._id}" 
  data-api-key="${project.apiKey}" 
  data-convex-url="${convexUrl}" 
  async
></script>`;

    // Single connection key for the Chrome Extension: base64(projectId|apiKey|convexUrl)
    const connectionKey = typeof window !== "undefined"
        ? btoa(`${project._id}|${project.apiKey}|${convexUrl}`)
        : "";

    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const copyToClipboard = async (text: string, label: string) => {
        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
            } else {
                throw new Error("Clipboard API not available");
            }
        } catch (err) {
            // Fallback for older browsers or insecure contexts where clipboard API fails
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.left = "-999999px";
            textArea.style.top = "-999999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try { document.execCommand('copy'); } catch (e) { }
            textArea.remove();
        }

        setCopiedKey(label);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
                <div>
                    <h3 className="text-white font-semibold mb-1">Web Widget</h3>
                    <p className="text-xs text-slate-400 mb-4">Add this snippet to your website&apos;s &lt;head&gt; to enable the bug reporting widget.</p>
                    <div className="card p-4 bg-black/40">
                        <pre className="text-[11px] text-brand-300 font-mono overflow-x-auto">
                            {snippet}
                        </pre>
                        <button
                            onClick={() => copyToClipboard(snippet, "snippet")}
                            className="btn-ghost w-full mt-3 justify-center text-xs"
                        >
                            {copiedKey === "snippet" ? "✅ Copied!" : "Copy Snippet"}
                        </button>
                    </div>
                </div>

                {/* Chrome Extension Card */}
                <div className="card p-5 bg-surface-card border-brand-500/20 space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center shrink-0">
                            <Monitor className="w-5 h-5 text-brand-500" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-white font-medium text-sm">Chrome Extension</h4>
                            <p className="text-xs text-slate-400 mt-1 mb-3">
                                Report bugs on any website without installing the widget. Perfect for testing staging or client sites.
                            </p>
                            <a href="/extension.zip" download className="btn-primary py-1.5 text-xs text-center inline-block w-full mt-2">
                                Download Extension (.zip)
                            </a>
                        </div>
                    </div>

                    {/* Connection Key */}
                    <div className="border-t border-surface-border pt-4">
                        <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block"></span>
                            Extension Connection Key
                        </label>
                        <p className="text-[11px] text-slate-500 mb-2">
                            Paste this single key into the extension popup to connect it to this project instantly.
                        </p>
                        <div className="bg-surface px-3 py-2 rounded border border-surface-border text-brand-300 text-[11px] font-mono flex justify-between items-center gap-2 break-all">
                            <span className="truncate">{connectionKey.slice(0, 28)}…</span>
                            <button
                                onClick={() => copyToClipboard(connectionKey, "connKey")}
                                className={`shrink-0 text-[10px] font-semibold px-2 py-1 rounded transition-all ${copiedKey === "connKey"
                                    ? "bg-green-500/20 text-green-400"
                                    : "text-brand-500 hover:bg-brand-500/10"
                                    }`}
                            >
                                {copiedKey === "connKey" ? "✅ COPIED" : "COPY"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div>
                    <h3 className="text-white font-semibold mb-1">Project Credentials</h3>
                    <p className="text-xs text-slate-400 mb-4">Your identification keys for this project.</p>
                    <div className="card p-5 space-y-4">
                        <div>
                            <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Project ID</label>
                            <div className="bg-surface px-3 py-2 rounded border border-surface-border text-slate-300 text-sm font-mono flex justify-between items-center">
                                <span className="truncate mr-2">{project._id}</span>
                                <button
                                    onClick={() => copyToClipboard(project._id, "projId")}
                                    className={`shrink-0 text-[10px] font-semibold transition-colors ${copiedKey === "projId" ? "text-green-400" : "text-brand-500"}`}
                                >
                                    {copiedKey === "projId" ? "✅" : "COPY"}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">API Key</label>
                            <div className="bg-surface px-3 py-2 rounded border border-surface-border text-brand-400 text-sm font-mono flex justify-between items-center">
                                <span className="truncate mr-2">{project.apiKey}</span>
                                <button
                                    onClick={() => copyToClipboard(project.apiKey, "apiKey")}
                                    className={`shrink-0 text-[10px] font-semibold transition-colors ${copiedKey === "apiKey" ? "text-green-400" : "text-brand-500"}`}
                                >
                                    {copiedKey === "apiKey" ? "✅" : "COPY"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function LoadingSkeleton() {
    return (
        <div className="min-h-screen">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
                <div className="skeleton h-6 w-48" />
                <div className="grid grid-cols-6 gap-3">
                    {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
                </div>
                <div className="grid grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-96 rounded-xl" />)}
                </div>
            </div>
        </div>
    );
}
