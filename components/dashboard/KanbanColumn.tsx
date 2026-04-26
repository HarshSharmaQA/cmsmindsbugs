import React, { memo } from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { Id } from "@/convex/_generated/dataModel";
import {
    Hash, Target, GripVertical, User, Globe, Video,
    ChevronLeft, ChevronRight, Trash2, Plus
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// Move constants outside component to prevent recreation
const PRIORITY_CONFIG = {
    critical: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", dot: "bg-red-500" },
    high: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", dot: "bg-amber-500" },
    medium: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", dot: "bg-blue-500" },
    low: { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-600", dot: "bg-slate-400" },
} as const;

interface KanbanColumnProps {
    status: string;
    label: string;
    icon: React.ReactNode;
    color: string;
    bugs: any[];
    onSelect: (id: Id<"bugs">) => void;
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
}

export const KanbanColumn = memo<KanbanColumnProps>(function KanbanColumn({
    status,
    label,
    icon,
    color,
    bugs,
    onSelect,
    onNavigateToLocation,
    canReorder,
    isFirst,
    isLast,
    onMoveLeft,
    onMoveRight,
    isReordering,
    onDeleteBucket,
    isSuperAdmin,
    onAddIssue,
    showScreenshot,
    members
}) {
    return (
        <Droppable droppableId={status}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex flex-col rounded-2xl transition-all duration-200 min-h-[600px] border-2 ${
                        snapshot.isDraggingOver
                            ? "bg-blue-50 border-blue-300 shadow-lg shadow-blue-200/50"
                            : "bg-white border-slate-200 shadow-sm hover:shadow-md"
                    }`}
                >
                    {/* Column Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b-2 border-slate-200/80 bg-gradient-to-r from-white via-slate-50/50 to-white rounded-t-2xl group">
                        <div className="flex items-center gap-3">
                            <div className={`flex items-center gap-2.5 ${color}`}>
                                {icon}
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
                                    const priorityCfg = PRIORITY_CONFIG[bug.priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG.medium;

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
                                                {/* Header */}
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 border border-slate-200">
                                                            <Hash className="w-3 h-3 text-slate-400" />
                                                            <span className="text-[10px] font-bold text-slate-600">
                                                                {bug.issueNumber ?? (index + 1)}
                                                            </span>
                                                        </div>
                                                        {bug.type && bug.type !== "general" && (
                                                            <span className="px-2 py-1 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 capitalize">
                                                                {bug.type.replace(/_/g, ' ')}
                                                            </span>
                                                        )}
                                                    </div>
                                                    
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

                                                {/* Tags + Assignee */}
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
                                                                {members?.find((m: any) => m.userId === bug.assigneeId)?.name?.split(' ')[0] || 
                                                                 members?.find((m: any) => m.userId === bug.assigneeId)?.email?.split('@')[0] || 'Assigned'}
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
                                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
                                                        {(bug.reporterName || bug.reporterEmail || 'U')[0].toUpperCase()}
                                                    </div>
                                                    <span className="text-[10px] text-slate-500 font-medium">
                                                        {formatDistanceToNow(new Date(bug.createdAt), { addSuffix: true })}
                                                    </span>
                                                </div>
                                                
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
});
