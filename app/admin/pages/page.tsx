"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import {
    ArrowLeft, Plus, Trash2, Eye, EyeOff, Globe, FileText,
    Image, AlignLeft, Columns, Zap, BarChart2, Minus,
    GripVertical, Settings, X, Check, ExternalLink, ShieldAlert,
    ChevronDown, ChevronUp, Save, Pencil, Copy, Users, Activity, CalendarDays, Clock,
} from "lucide-react";

export const dynamic = "force-dynamic";

// ─── Block Type Definitions ───────────────────────────────────────────────────

type BlockType = "hero" | "text" | "two_col" | "cta" | "stats" | "divider" | "image" | "ribbon" | "team" | "bug_chart" | "booking";

interface Block {
    id: string;
    type: BlockType;
    data: Record<string, any>;
}

const BLOCK_TYPES: { type: BlockType; label: string; icon: React.ReactNode; description: string; defaults: Record<string, any> }[] = [
    {
        type: "hero", label: "Hero Banner", icon: <Zap className="w-4 h-4" />, description: "Full-width headline with subtitle and CTA button",
        defaults: { heading: "Your Headline Here", subheading: "Supporting text that explains your value proposition.", ctaText: "Get Started", ctaUrl: "/", badge: "" },
    },
    {
        type: "ribbon", label: "Sliding Ribbon", icon: <Activity className="w-4 h-4" />, description: "Infinite marquee scrolling text ribbon",
        defaults: {
            text: "Build fast, responsive, and beautiful interfaces with BugScribe · Track bugs automatically · Zero setup required · Trusted by 10,000+ developers ·",
            speed: "35", direction: "left", tilt: "true", colorScheme: "cyan",
        },
    },
    {
        type: "team", label: "Team Section", icon: <Users className="w-4 h-4" />, description: "Grid of team members with photos and roles",
        defaults: {
            heading: "Meet The People Behind BugScribe",
            subheading: "We are a team of builders, designers, and problem-solvers dedicated to helping you work smarter every day.",
            member1Name: "Sophie Tan", member1Role: "Founder & CEO", member1Photo: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=400",
            member2Name: "Liam Johnson", member2Role: "Chief Technology Officer", member2Photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
            member3Name: "Ava Smith", member3Role: "Head of Marketing", member3Photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
            member4Name: "Noah Brown", member4Role: "Product Manager", member4Photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
            member5Name: "Emma Wilson", member5Role: "Lead Designer", member5Photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
            member6Name: "Oliver Lee", member6Role: "Data Analyst", member6Photo: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400",
        },
    },
    {
        type: "booking", label: "Booking Form", icon: <CalendarDays className="w-4 h-4" />, description: "Calendly-style appointment scheduler",
        defaults: {
            sectionHeading: "Book a Free Consultation", sectionSubheading: "Schedule time with our team — no commitment required.",
            eventName: "30-min Strategy Call", duration: "30", description: "A focused session to understand your needs and explore how BugScribe can help your team.",
            hostName: "BugScribe Team", hostAvatar: "",
            timeSlots: "09:00 AM,10:30 AM,12:00 PM,02:00 PM,03:30 PM,05:00 PM",
            accentColor: "#00D4FF", showPhone: true, showCompany: true, requireMessage: false,
        },
    },
    {
        type: "bug_chart", label: "Bug Analytics", icon: <BarChart2 className="w-4 h-4" />, description: "Spider/radar chart showing bug analysis metrics",
        defaults: {
            heading: "Bug Intelligence Dashboard", subheading: "Real-time analysis of your project health across all dimensions.",
            engagement: "85", pagesSession: "72", sessionDuration: "68", conversion: "54", retention: "79",
            label1: "Google Search", val1: "70", label2: "Display Ads", val2: "58", label3: "Newsletter", val3: "71", label4: "Social Media", val4: "58",
        },
    },
    {
        type: "text", label: "Rich Text", icon: <AlignLeft className="w-4 h-4" />, description: "Multi-paragraph text content block",
        defaults: { heading: "", body: "Write your content here..." },
    },
    {
        type: "two_col", label: "Two Columns", icon: <Columns className="w-4 h-4" />, description: "Side-by-side text and content layout",
        defaults: { leftHeading: "Left Column", leftBody: "Left-side content goes here.", rightHeading: "Right Column", rightBody: "Right-side content goes here.", imageLeft: "", imageRight: "" },
    },
    {
        type: "cta", label: "Call to Action", icon: <Zap className="w-4 h-4" />, description: "Prominent CTA section with gradient background",
        defaults: { heading: "Ready to get started?", subtext: "Join thousands of teams already using BugScribe.", primaryBtnText: "Start Free", primaryBtnUrl: "/", secondaryBtnText: "Learn More", secondaryBtnUrl: "/" },
    },
    {
        type: "stats", label: "Stats Grid", icon: <BarChart2 className="w-4 h-4" />, description: "Display 3 key metrics in a card grid",
        defaults: { stat1Value: "10K+", stat1Label: "Users", stat2Value: "99.9%", stat2Label: "Uptime", stat3Value: "500+", stat3Label: "Projects" },
    },
    {
        type: "image", label: "Image Banner", icon: <Image className="w-4 h-4" />, description: "Full-width or contained image with optional caption",
        defaults: { src: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200", alt: "Image", caption: "", fullWidth: true },
    },
    {
        type: "divider", label: "Divider", icon: <Minus className="w-4 h-4" />, description: "Visual separator between sections",
        defaults: { style: "line" },
    },
];

// ─── Animated Delete Modal ────────────────────────────────────────────────────

function DeleteModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [phase, setPhase] = useState<"idle" | "dropping" | "shaking">("idle");

    const handleConfirm = async () => {
        setPhase("dropping");
        setTimeout(() => setPhase("shaking"), 600);
        setTimeout(async () => {
            setIsDeleting(true);
            await onConfirm();
        }, 1200);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative z-10 bg-[#111118] border border-[#1E1E2E] rounded-2xl p-8 w-full max-w-xs text-center shadow-2xl animate-slide-up">
                {/* Trash animation area */}
                <div className="relative h-32 flex items-end justify-center mb-4">
                    {/* Ball dropping */}
                    <div
                        className={`absolute top-0 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full transition-all duration-500 ease-in ${phase === "idle" ? "opacity-100 translate-y-0" : "translate-y-16 opacity-0"}`}
                        style={{ background: "linear-gradient(135deg, #e11d48 0%, #be123c 100%)", boxShadow: "0 0 14px rgba(225,29,72,0.5)" }}
                    />
                    {/* Hand */}
                    <div className={`absolute top-4 left-1/2 -translate-x-[30px] transition-all duration-500 ${phase !== "idle" ? "opacity-0 translate-y-4" : "opacity-100"}`}>
                        <svg width="40" height="28" viewBox="0 0 40 28" fill="none">
                            <path d="M5 20 Q10 8 20 6 Q30 8 35 20" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                            <path d="M12 20 Q14 26 20 26 Q26 26 28 20" stroke="#64748b" strokeWidth="2" strokeLinecap="round" fill="none" />
                        </svg>
                    </div>
                    {/* Trash can */}
                    <div className={`transition-all duration-300 ${phase === "shaking" ? "animate-[wiggle_0.3s_ease-in-out_2]" : ""}`}
                        style={{ animation: phase === "shaking" ? "wiggle 0.3s ease-in-out 2" : undefined }}>
                        <svg width="52" height="58" viewBox="0 0 52 58" fill="none">
                            {/* Lid — tilts when dropping */}
                            <g className={`transition-transform duration-500 origin-right ${phase !== "idle" ? "-rotate-45 translate-y-[-4px] translate-x-[8px]" : ""}`}>
                                <rect x="8" y="8" width="36" height="5" rx="2.5" fill="none" stroke="#94a3b8" strokeWidth="2" />
                                <rect x="18" y="4" width="16" height="6" rx="2" fill="none" stroke="#94a3b8" strokeWidth="2" />
                            </g>
                            {/* Body */}
                            <rect x="10" y="14" width="32" height="38" rx="4" fill="none" stroke="#94a3b8" strokeWidth="2" />
                            <line x1="20" y1="22" x2="20" y2="44" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
                            <line x1="26" y1="22" x2="26" y2="44" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
                            <line x1="32" y1="22" x2="32" y2="44" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    </div>
                </div>

                <p className="text-white font-bold text-lg mb-1">Are you sure?</p>
                <p className="text-slate-500 text-sm mb-6">This page will be permanently deleted and cannot be recovered.</p>

                <div className="flex items-center justify-center gap-4">
                    <button
                        onClick={onCancel}
                        className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#1A1A24] border border-[#2A2A40] text-slate-400 hover:text-white hover:border-slate-500 transition-all"
                    >
                        No, cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isDeleting}
                        className="px-5 py-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg, #e11d48 0%, #be123c 100%)", boxShadow: "0 4px 16px rgba(225,29,72,0.3)" }}
                    >
                        {isDeleting ? "Deleting…" : "Yes, delete"}
                    </button>
                </div>
            </div>
            <style>{`@keyframes wiggle { 0%,100%{transform:rotate(0deg)} 25%{transform:rotate(-8deg)} 75%{transform:rotate(8deg)} }`}</style>
        </div>
    );
}

// ─── Block Editor ─────────────────────────────────────────────────────────────

function BlockEditor({ block, onChange, onDelete, onMoveUp, onMoveDown, index, total }: {
    block: Block; onChange: (data: Record<string, any>) => void;
    onDelete: () => void; onMoveUp: () => void; onMoveDown: () => void;
    index: number; total: number;
}) {
    const [expanded, setExpanded] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const def = BLOCK_TYPES.find(b => b.type === block.type)!;
    const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        onChange({ ...block.data, [key]: e.target.value });
    const setBool = (key: string, val: boolean) => onChange({ ...block.data, [key]: val });

    return (
        <>
            {showDeleteModal && (
                <DeleteModal
                    onConfirm={async () => { onDelete(); setShowDeleteModal(false); }}
                    onCancel={() => setShowDeleteModal(false)}
                />
            )}
            <div className="card border-surface-border ring-1 ring-surface-border/50 overflow-hidden group">
                {/* Block Header */}
                <div className="flex items-center gap-3 px-4 py-3 bg-[#0D0D14] border-b border-surface-border">
                    <GripVertical className="w-4 h-4 text-slate-600 shrink-0" />
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
                        {def.icon}
                        {def.label}
                    </div>
                    <div className="flex-1" />
                    <div className="flex items-center gap-1">
                        <button onClick={onMoveUp} disabled={index === 0} className="p-1.5 rounded text-slate-600 hover:text-white hover:bg-surface-hover transition-colors disabled:opacity-30" title="Move up"><ChevronUp className="w-3.5 h-3.5" /></button>
                        <button onClick={onMoveDown} disabled={index === total - 1} className="p-1.5 rounded text-slate-600 hover:text-white hover:bg-surface-hover transition-colors disabled:opacity-30" title="Move down"><ChevronDown className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setExpanded(e => !e)} className="p-1.5 rounded text-slate-500 hover:text-white hover:bg-surface-hover transition-colors">
                            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <Settings className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => setShowDeleteModal(true)} className="p-1.5 rounded text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Delete block">
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {/* Block Fields */}
                {expanded && (
                    <div className="p-4 space-y-3 animate-fade-in">
                        {block.type === "hero" && (
                            <>
                                <Field label="Badge Text (optional)" value={block.data.badge} onChange={set("badge")} placeholder="e.g. New Feature" />
                                <Field label="Heading *" value={block.data.heading} onChange={set("heading")} placeholder="Your main headline" />
                                <Field label="Subheading" value={block.data.subheading} onChange={set("subheading")} textarea placeholder="Supporting text..." />
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="Button Text" value={block.data.ctaText} onChange={set("ctaText")} placeholder="Get Started" />
                                    <Field label="Button URL" value={block.data.ctaUrl} onChange={set("ctaUrl")} placeholder="/" />
                                </div>
                            </>
                        )}
                        {block.type === "ribbon" && (
                            <>
                                <Field label="Ribbon Text (use · as separator)" value={block.data.text} onChange={set("text")} textarea rows={2} placeholder="Build fast · Ship faster · Zero bugs ·" />
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-xs text-slate-400 font-medium block mb-1">Speed (seconds)</label>
                                        <input type="number" min="10" max="120" className="input" value={block.data.speed || "35"} onChange={set("speed")} />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 font-medium block mb-1">Direction</label>
                                        <select className="input" value={block.data.direction || "left"} onChange={set("direction")}>
                                            <option value="left">← Left</option>
                                            <option value="right">Right →</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 font-medium block mb-1">Color</label>
                                        <select className="input" value={block.data.colorScheme || "cyan"} onChange={set("colorScheme")}>
                                            <option value="cyan">Cyan</option>
                                            <option value="white">White</option>
                                            <option value="dark">Dark</option>
                                        </select>
                                    </div>
                                </div>
                                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                                    <input type="checkbox" checked={block.data.tilt !== "false"} onChange={e => onChange({ ...block.data, tilt: e.target.checked ? "true" : "false" })} className="w-3.5 h-3.5 accent-brand-500" />
                                    Diagonal tilt effect
                                </label>
                            </>
                        )}
                        {block.type === "team" && (
                            <>
                                <Field label="Section Heading" value={block.data.heading} onChange={set("heading")} placeholder="Meet The Team" />
                                <Field label="Subheading" value={block.data.subheading} onChange={set("subheading")} textarea rows={2} placeholder="Team description..." />
                                <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest pt-2">Team Members (up to 6)</p>
                                <div className="grid grid-cols-2 gap-4">
                                    {[1, 2, 3, 4, 5, 6].map(n => (
                                        <div key={n} className="space-y-1.5 p-3 bg-[#0D0D14] rounded-lg border border-surface-border">
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Member {n}</p>
                                            <Field label="Name" value={block.data[`member${n}Name`]} onChange={set(`member${n}Name`)} placeholder="Full Name" />
                                            <Field label="Role" value={block.data[`member${n}Role`]} onChange={set(`member${n}Role`)} placeholder="CEO" />
                                            <Field label="Photo URL" value={block.data[`member${n}Photo`]} onChange={set(`member${n}Photo`)} placeholder="https://..." />
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                        {block.type === "bug_chart" && (
                            <>
                                <Field label="Section Heading" value={block.data.heading} onChange={set("heading")} placeholder="Bug Analytics" />
                                <Field label="Subheading" value={block.data.subheading} onChange={set("subheading")} textarea rows={2} placeholder="Description..." />
                                <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest pt-2">Radar Chart Metrics (0–100)</p>
                                <div className="grid grid-cols-5 gap-2">
                                    {[
                                        { key: "engagement", label: "Engagement" },
                                        { key: "pagesSession", label: "Pages/Session" },
                                        { key: "sessionDuration", label: "Session Dur." },
                                        { key: "conversion", label: "Conversion" },
                                        { key: "retention", label: "Retention" },
                                    ].map(m => (
                                        <div key={m.key}>
                                            <label className="text-xs text-slate-500 block mb-1">{m.label}</label>
                                            <input type="number" min="0" max="100" className="input text-center" value={block.data[m.key] || 0} onChange={set(m.key)} />
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest pt-2">Campaign Legend (up to 4)</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {[1, 2, 3, 4].map(n => (
                                        <div key={n} className="flex gap-2">
                                            <div className="flex-1"><Field label={`Label ${n}`} value={block.data[`label${n}`]} onChange={set(`label${n}`)} placeholder="Source" /></div>
                                            <div className="w-16"><Field label="%" value={block.data[`val${n}`]} onChange={set(`val${n}`)} placeholder="70" /></div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                        {block.type === "booking" && (
                            <>
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="Section Heading" value={block.data.sectionHeading} onChange={set("sectionHeading")} placeholder="Book a Free Consultation" />
                                    <Field label="Section Subheading" value={block.data.sectionSubheading} onChange={set("sectionSubheading")} placeholder="Schedule time with us..." />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="Event Name" value={block.data.eventName} onChange={set("eventName")} placeholder="30-min Strategy Call" />
                                    <div>
                                        <label className="text-xs text-slate-400 font-medium block mb-1">Duration (minutes)</label>
                                        <select className="input" value={block.data.duration || "30"} onChange={set("duration")}>
                                            {["15", "30", "45", "60", "90"].map(d => <option key={d} value={d}>{d} min</option>)}
                                        </select>
                                    </div>
                                </div>
                                <Field label="Description" value={block.data.description} onChange={set("description")} textarea rows={2} placeholder="What will you discuss?" />
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="Host Name" value={block.data.hostName} onChange={set("hostName")} placeholder="John Doe" />
                                    <Field label="Host Avatar URL" value={block.data.hostAvatar} onChange={set("hostAvatar")} placeholder="https://..." />
                                </div>
                                <Field label="Available Time Slots (comma-separated)" value={block.data.timeSlots} onChange={set("timeSlots")} textarea rows={2} placeholder="09:00 AM,10:30 AM,12:00 PM" />
                                <div>
                                    <label className="text-xs text-slate-400 font-medium block mb-1">Accent Color</label>
                                    <div className="flex items-center gap-2">
                                        <input type="color" value={block.data.accentColor || "#00D4FF"} onChange={set("accentColor")} className="w-10 h-9 rounded border border-surface-border cursor-pointer bg-transparent" />
                                        <input className="input flex-1" value={block.data.accentColor || "#00D4FF"} onChange={set("accentColor")} placeholder="#00D4FF" />
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-4 pt-1">
                                    <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                                        <input type="checkbox" checked={block.data.showPhone !== false} onChange={e => setBool("showPhone", e.target.checked)} className="w-3.5 h-3.5 accent-brand-500" />
                                        Show Phone field
                                    </label>
                                    <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                                        <input type="checkbox" checked={block.data.showCompany !== false} onChange={e => setBool("showCompany", e.target.checked)} className="w-3.5 h-3.5 accent-brand-500" />
                                        Show Company field
                                    </label>
                                    <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                                        <input type="checkbox" checked={!!block.data.requireMessage} onChange={e => setBool("requireMessage", e.target.checked)} className="w-3.5 h-3.5 accent-brand-500" />
                                        Require message
                                    </label>
                                </div>
                            </>
                        )}
                        {block.type === "text" && (
                            <>
                                <Field label="Section Heading (optional)" value={block.data.heading} onChange={set("heading")} placeholder="Section title" />
                                <Field label="Body Content *" value={block.data.body} onChange={set("body")} textarea rows={6} placeholder="Your text content here..." />
                            </>
                        )}
                        {block.type === "two_col" && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">Left Column</p>
                                    <Field label="Heading" value={block.data.leftHeading} onChange={set("leftHeading")} placeholder="Left heading" />
                                    <Field label="Body" value={block.data.leftBody} onChange={set("leftBody")} textarea placeholder="Left content..." />
                                    <Field label="Image URL (optional)" value={block.data.imageLeft} onChange={set("imageLeft")} placeholder="https://..." />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">Right Column</p>
                                    <Field label="Heading" value={block.data.rightHeading} onChange={set("rightHeading")} placeholder="Right heading" />
                                    <Field label="Body" value={block.data.rightBody} onChange={set("rightBody")} textarea placeholder="Right content..." />
                                    <Field label="Image URL (optional)" value={block.data.imageRight} onChange={set("imageRight")} placeholder="https://..." />
                                </div>
                            </div>
                        )}
                        {block.type === "cta" && (
                            <>
                                <Field label="Heading *" value={block.data.heading} onChange={set("heading")} placeholder="Ready to get started?" />
                                <Field label="Subtext" value={block.data.subtext} onChange={set("subtext")} placeholder="Short supporting line..." />
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="Primary Button Text" value={block.data.primaryBtnText} onChange={set("primaryBtnText")} placeholder="Get Started" />
                                    <Field label="Primary Button URL" value={block.data.primaryBtnUrl} onChange={set("primaryBtnUrl")} placeholder="/" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="Secondary Button Text" value={block.data.secondaryBtnText} onChange={set("secondaryBtnText")} placeholder="Learn More" />
                                    <Field label="Secondary Button URL" value={block.data.secondaryBtnUrl} onChange={set("secondaryBtnUrl")} placeholder="/" />
                                </div>
                            </>
                        )}
                        {block.type === "stats" && (
                            <div className="grid grid-cols-3 gap-3">
                                {[1, 2, 3].map(n => (
                                    <div key={n} className="space-y-2">
                                        <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">Stat {n}</p>
                                        <Field label="Value" value={block.data[`stat${n}Value`]} onChange={set(`stat${n}Value`)} placeholder="10K+" />
                                        <Field label="Label" value={block.data[`stat${n}Label`]} onChange={set(`stat${n}Label`)} placeholder="Users" />
                                    </div>
                                ))}
                            </div>
                        )}
                        {block.type === "image" && (
                            <>
                                <Field label="Image URL *" value={block.data.src} onChange={set("src")} placeholder="https://..." />
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="Alt Text" value={block.data.alt} onChange={set("alt")} placeholder="Descriptive alt text" />
                                    <Field label="Caption (optional)" value={block.data.caption} onChange={set("caption")} placeholder="Figure 1: ..." />
                                </div>
                                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                                    <input type="checkbox" checked={!!block.data.fullWidth} onChange={e => setBool("fullWidth", e.target.checked)} className="w-3.5 h-3.5 accent-brand-500" />
                                    Full-width image
                                </label>
                            </>
                        )}
                        {block.type === "divider" && (
                            <div>
                                <label className="text-xs text-slate-400 font-medium block mb-1">Style</label>
                                <select className="input w-40" value={block.data.style} onChange={set("style")}>
                                    <option value="line">Line</option>
                                    <option value="dots">Dots</option>
                                    <option value="gradient">Gradient</option>
                                </select>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}

function Field({ label, value, onChange, placeholder = "", textarea = false, rows = 3 }: {
    label: string; value: string; onChange: any; placeholder?: string; textarea?: boolean; rows?: number;
}) {
    return (
        <div>
            <label className="text-xs text-slate-400 font-medium block mb-1">{label}</label>
            {textarea ? (
                <textarea className="input" rows={rows} value={value || ""} onChange={onChange} placeholder={placeholder} />
            ) : (
                <input className="input" value={value || ""} onChange={onChange} placeholder={placeholder} />
            )}
        </div>
    );
}

// ─── Page Manager List View ───────────────────────────────────────────────────

function PageList({ devToken, onEdit, onNew }: { devToken: string; onEdit: (id: string) => void; onNew: () => void }) {
    const rawPages = useQuery(api.pages.list, { devToken });
    const pages = rawPages ?? [];
    const togglePublish = useMutation(api.pages.togglePublish);
    const remove = useMutation(api.pages.remove);
    const createDefaultHome = useMutation(api.pages.createDefaultHome);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [copied, setCopied] = useState<string | null>(null);

    const copyUrl = (slug: string) => {
        navigator.clipboard.writeText(`${window.location.origin}/${slug}`);
        setCopied(slug);
        setTimeout(() => setCopied(null), 2000);
    };

    const hasHome = pages.some((p: any) => p.slug === "home");

    const handleCreateHome = async () => {
        const id = await createDefaultHome({ devToken });
        onEdit(id);
    };

    return (
        <div className="space-y-4 animate-fade-in">
            {deleteTarget && (
                <DeleteModal
                    onConfirm={async () => { await remove({ devToken, id: deleteTarget as any }); setDeleteTarget(null); }}
                    onCancel={() => setDeleteTarget(null)}
                />
            )}
            {pages.length === 0 && !hasHome ? (
                <div className="card border-dashed border-2 bg-transparent py-20 flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                        <FileText className="w-8 h-8 text-brand-400" />
                    </div>
                    <div className="text-center">
                        <p className="text-white font-semibold text-lg">No pages yet</p>
                        <p className="text-slate-500 text-sm mt-1">Create your first custom page with the builder below.</p>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                        <button onClick={handleCreateHome} className="btn-primary">
                            <Plus className="w-4 h-4" /> Initialize Home Page
                        </button>
                        <button onClick={onNew} className="btn-ghost border border-surface-border">
                            <Plus className="w-4 h-4" /> Custom Page
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {/* Show persistent Home Page creation if missing */}
                    {rawPages !== undefined && !hasHome && (
                        <div className="card p-4 flex items-center gap-4 border-dashed border-2 hover:border-brand-500/50 transition-all cursor-pointer bg-brand-500/5" onClick={handleCreateHome}>
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-brand-500/10 border border-brand-500/20">
                                <Globe className="w-5 h-5 text-brand-400 opacity-50" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-white font-semibold text-sm truncate">Home Page</span>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-500 border border-slate-600/30">Not Created</span>
                                </div>
                                <p className="text-slate-500 text-xs mt-0.5 font-mono">/ (home)</p>
                                <p className="text-slate-600 text-xs mt-0.5">Click to initialize your custom landing page.</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <button className="btn-primary py-1 px-3 text-xs">Create Setup</button>
                            </div>
                        </div>
                    )}
                    {pages.map((page: any) => (
                        <div key={page._id} className="card p-4 flex items-center gap-4 hover:border-brand-500/30 transition-all">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${page.isPublished ? "bg-green-500/10 border border-green-500/20" : "bg-slate-700/30 border border-slate-600/30"}`}>
                                {page.isPublished ? <Globe className="w-5 h-5 text-green-400" /> : <EyeOff className="w-5 h-5 text-slate-500" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-white font-semibold text-sm truncate">{page.title}</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${page.isPublished ? "bg-green-500/15 text-green-400 border border-green-500/25" : "bg-slate-700/50 text-slate-500 border border-slate-600/30"}`}>
                                        {page.isPublished ? "Published" : "Draft"}
                                    </span>
                                </div>
                                <p className="text-slate-500 text-xs mt-0.5 font-mono">/{page.slug}</p>
                                <p className="text-slate-600 text-xs mt-0.5">{page.blocks.length} block{page.blocks.length !== 1 ? "s" : ""}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                {page.isPublished && (
                                    <a href={`/${page.slug}`} target="_blank" className="p-2 rounded-lg text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 transition-all" title="View live">
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                )}
                                <button onClick={() => copyUrl(page.slug)} className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-surface-hover transition-all" title="Copy URL">
                                    {copied === page.slug ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={() => togglePublish({ devToken, id: page._id })}
                                    className={`p-2 rounded-lg transition-all ${page.isPublished ? "text-green-400 hover:text-orange-400 hover:bg-orange-500/10" : "text-slate-500 hover:text-green-400 hover:bg-green-500/10"}`}
                                    title={page.isPublished ? "Unpublish" : "Publish"}
                                >
                                    {page.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                </button>
                                <button onClick={() => onEdit(page._id)} className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-surface-hover transition-all" title="Edit">
                                    <Pencil className="w-4 h-4" />
                                </button>
                                {/* Animated delete button */}
                                <button
                                    onClick={() => setDeleteTarget(page._id)}
                                    className="p-2 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all group/del"
                                    title="Delete page"
                                >
                                    <Trash2 className="w-4 h-4 group-hover/del:animate-bounce" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Page Editor (Create / Edit) ──────────────────────────────────────────────

function PageEditor({ devToken, editId, onDone }: { devToken: string; editId: string | null; onDone: () => void }) {
    const existing = useQuery(api.pages.getById, editId ? { id: editId as any, devToken } : "skip");
    const createMut = useMutation(api.pages.create);
    const updateMut = useMutation(api.pages.update);

    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [meta, setMeta] = useState("");
    const [isPublished, setIsPublished] = useState(false);
    const [showInMenu, setShowInMenu] = useState(false);
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [showBlockPicker, setShowBlockPicker] = useState(false);
    const [saved, setSaved] = useState(false);

    const autoSlug = (t: string) => t.toLowerCase().replace(/[^a-z0-9\s\/]/g, "").replace(/\/{2,}/g, "/").trim().replace(/\s+/g, "-");

    useEffect(() => {
        if (existing) {
            setTitle(existing.title);
            setSlug(existing.slug);
            setMeta(existing.metaDescription || "");
            setIsPublished(existing.isPublished);
            setShowInMenu(existing.showInMenu || false);
            setBlocks(existing.blocks as Block[]);
        }
    }, [existing]);

    const addBlock = (type: BlockType) => {
        const def = BLOCK_TYPES.find(b => b.type === type)!;
        setBlocks(prev => [...prev, { id: `${type}-${Date.now()}`, type, data: { ...def.defaults } }]);
        setShowBlockPicker(false);
    };

    const updateBlock = (index: number, data: Record<string, any>) => setBlocks(prev => prev.map((b, i) => i === index ? { ...b, data } : b));
    const deleteBlock = (index: number) => setBlocks(prev => prev.filter((_, i) => i !== index));
    const moveBlock = (from: number, to: number) => {
        if (to < 0 || to >= blocks.length) return;
        setBlocks(prev => { const arr = [...prev]; [arr[from], arr[to]] = [arr[to], arr[from]]; return arr; });
    };

    const handleSave = async (publish?: boolean) => {
        if (!title.trim()) { setError("Title is required."); return; }
        if (!slug.trim()) { setError("Slug is required."); return; }
        setSaving(true); setError("");
        try {
            const finalPublish = publish !== undefined ? publish : isPublished;
            if (editId) {
                await updateMut({ devToken, id: editId as any, title: title.trim(), slug: slug.trim(), metaDescription: meta || undefined, isPublished: finalPublish, showInMenu, blocks });
            } else {
                await createMut({ devToken, title: title.trim(), slug: slug.trim(), metaDescription: meta || undefined, isPublished: finalPublish, showInMenu, blocks });
            }
            setSaved(true);
            setTimeout(() => { setSaved(false); if (!editId) onDone(); }, 800);
            if (publish !== undefined) setIsPublished(finalPublish);
        } catch (e: any) { setError(e.message || "Failed to save."); }
        finally { setSaving(false); }
    };

    return (
        <div className="animate-fade-in">
            <div className="flex items-center gap-3 mb-6 flex-wrap">
                <button onClick={onDone} className="btn-ghost flex items-center gap-2 text-sm">
                    <ArrowLeft className="w-4 h-4" /> All Pages
                </button>
                <div className="flex-1" />
                {error && <p className="text-red-400 text-xs font-medium bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg">{error}</p>}
                <button onClick={() => handleSave(false)} disabled={saving} className="btn-ghost flex items-center gap-2 text-sm">
                    <Save className="w-3.5 h-3.5" /> {saving ? "Saving…" : saved ? "Saved ✓" : "Save Draft"}
                </button>
                <button onClick={() => handleSave(true)} disabled={saving} className="btn-primary flex items-center gap-2 text-sm">
                    <Globe className="w-3.5 h-3.5" /> {isPublished ? "Update & Publish" : "Publish"}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
                <div className="space-y-3">
                    {/* Page settings */}
                    <div className="card p-5 space-y-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Settings className="w-3.5 h-3.5" /> Page Settings
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="text-xs text-slate-400 font-medium block mb-1">Page Title *</label>
                                <input className="input text-base font-semibold" placeholder="About Us" value={title}
                                    onChange={e => { setTitle(e.target.value); if (!editId) setSlug(autoSlug(e.target.value)); }} />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 font-medium block mb-1">Page Slug *</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-mono">/</span>
                                    <input className="input pl-6 font-mono text-sm" placeholder="catalog/about-us" value={slug} onChange={e => setSlug(e.target.value.replace(/^\/+/,''))} />
                                </div>
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <label className="text-xs text-slate-400 font-medium block mb-1">Status</label>
                                <div className={`flex items-center gap-2 h-[37px] px-3 rounded-lg border text-xs font-semibold ${isPublished ? "border-green-500/30 bg-green-500/10 text-green-400" : "border-surface-border bg-surface text-slate-500"}`}>
                                    {isPublished ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                    {isPublished ? "Published" : "Draft"}
                                </div>
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <label className="text-xs text-slate-400 font-medium block mb-1">Navigation Menu</label>
                                <label className="flex items-center gap-2 h-[37px] px-3 rounded-lg border border-surface-border bg-surface cursor-pointer hover:bg-surface-hover transition-colors">
                                    <input type="checkbox" checked={showInMenu} onChange={(e) => setShowInMenu(e.target.checked)} className="w-4 h-4 accent-brand-500" />
                                    <span className="text-xs font-semibold text-slate-300">Show in Top Menu</span>
                                </label>
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs text-slate-400 font-medium block mb-1">Meta Description (SEO)</label>
                                <textarea className="input h-16 resize-none" placeholder="Brief description for search engines (150–160 chars)..." value={meta} onChange={e => setMeta(e.target.value)} />
                            </div>
                        </div>
                    </div>

                    {/* Blocks */}
                    {blocks.map((block, i) => (
                        <BlockEditor
                            key={block.id} block={block} index={i} total={blocks.length}
                            onChange={data => updateBlock(i, data)}
                            onDelete={() => deleteBlock(i)}
                            onMoveUp={() => moveBlock(i, i - 1)}
                            onMoveDown={() => moveBlock(i, i + 1)}
                        />
                    ))}

                    {/* Add Block Picker */}
                    <div className="relative">
                        <button
                            onClick={() => setShowBlockPicker(p => !p)}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-surface-border hover:border-brand-500/40 hover:bg-brand-500/5 text-slate-500 hover:text-brand-400 transition-all text-sm font-semibold"
                        >
                            <Plus className="w-4 h-4" /> Add Block
                        </button>
                        {showBlockPicker && (
                            <div className="absolute left-0 right-0 top-14 z-50 card p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 shadow-2xl ring-1 ring-brand-500/20 animate-slide-down">
                                {BLOCK_TYPES.map(bt => (
                                    <button key={bt.type} onClick={() => addBlock(bt.type)}
                                        className="flex flex-col items-start gap-1.5 p-3 rounded-lg border border-surface-border hover:border-brand-500/40 hover:bg-brand-500/5 transition-all text-left">
                                        <div className="text-brand-400">{bt.icon}</div>
                                        <span className="text-xs font-semibold text-white">{bt.label}</span>
                                        <span className="text-[10px] text-slate-500 leading-tight">{bt.description}</span>
                                    </button>
                                ))}
                                <button onClick={() => setShowBlockPicker(false)} className="col-span-2 sm:col-span-4 flex items-center justify-center gap-1 text-xs text-slate-500 hover:text-white py-1.5 transition-colors">
                                    <X className="w-3 h-3" /> Close
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Structure Sidebar */}
                <div className="space-y-4">
                    <div className="card p-4 sticky top-20">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Eye className="w-3.5 h-3.5" /> Page Structure
                        </h3>
                        {blocks.length === 0 ? (
                            <p className="text-slate-600 text-xs text-center py-6">No blocks yet.</p>
                        ) : (
                            <div className="space-y-1.5">
                                {blocks.map((block, i) => {
                                    const def = BLOCK_TYPES.find(b => b.type === block.type)!;
                                    return (
                                        <div key={block.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-hover text-xs">
                                            <span className="text-brand-400">{def.icon}</span>
                                            <span className="text-slate-300 truncate flex-1">{block.data.heading || block.data.title || def.label}</span>
                                            <span className="text-slate-600">{i + 1}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {title && slug && (
                            <div className="mt-4 pt-4 border-t border-surface-border">
                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2">Live URL</p>
                                <a href={`/${slug.replace(/^\/+/,'')}`} target="_blank" className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 font-mono truncate">
                                    /{slug.replace(/^\/+/,'')} <ExternalLink className="w-3 h-3 shrink-0" />
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page Builder ────────────────────────────────────────────────────────

function PageBuilderContent() {
    const [devToken, setDevToken] = useState<string | null>(null);
    const [view, setView] = useState<"list" | "new" | "edit">("list");
    const [editId, setEditId] = useState<string | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem("bugscribe_dev_token");
        if (stored) setDevToken(stored);
    }, []);

    const currentUser = useQuery(api.users.currentUser, { devToken: devToken || undefined });
    const isSuperAdmin = currentUser?.role === "super_admin";

    if (currentUser === undefined) {
        return (
            <div className="min-h-screen"><Navbar />
                <div className="max-w-5xl mx-auto px-4 py-24 flex flex-col items-center">
                    <div className="skeleton w-16 h-16 rounded-full mb-4" />
                    <p className="text-slate-500 animate-pulse">Loading Page Builder...</p>
                </div>
            </div>
        );
    }

    if (!devToken || !isSuperAdmin) {
        return (
            <div className="min-h-screen"><Navbar />
                <div className="max-w-5xl mx-auto px-4 py-24 text-center">
                    <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">Unauthorized Access</h1>
                    <p className="text-slate-400 mb-8">Only Super Admins can access the Page Builder.</p>
                    <Link href="/" className="btn-primary inline-flex">Return Home</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen"><Navbar />
            <main className="max-w-5xl mx-auto px-4 py-10">
                <div className="flex items-center justify-between mb-8 animate-slide-up">
                    <div>
                        <div className="flex items-center gap-2 text-brand-400 text-xs font-bold uppercase tracking-widest mb-2">
                            <FileText className="w-3.5 h-3.5" /> Admin · Page Builder
                        </div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">
                            {view === "list" ? "Custom Pages" : view === "new" ? "New Page" : "Edit Page"}
                        </h1>
                        <p className="text-slate-400 mt-1 text-sm">
                            {view === "list" ? "Create and manage public pages with your brand theme." : "Use blocks to build the page layout."}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {view === "list" && (
                            <>
                                <Link href="/admin" className="btn-ghost flex items-center gap-2 text-sm"><ArrowLeft className="w-4 h-4" /> Admin</Link>
                                <button onClick={() => { setEditId(null); setView("new"); }} className="btn-primary flex items-center gap-2">
                                    <Plus className="w-4 h-4" /> New Page
                                </button>
                            </>
                        )}
                    </div>
                </div>
                {view === "list" && devToken && (
                    <PageList devToken={devToken} onEdit={id => { setEditId(id); setView("edit"); }} onNew={() => { setEditId(null); setView("new"); }} />
                )}
                {(view === "new" || view === "edit") && devToken && (
                    <PageEditor devToken={devToken} editId={editId} onDone={() => { setView("list"); setEditId(null); }} />
                )}
            </main>
        </div>
    );
}

export default function PageBuilderPage() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    if (!mounted) return (
        <div className="min-h-screen"><Navbar />
            <div className="max-w-5xl mx-auto px-4 py-24 flex flex-col items-center">
                <div className="skeleton w-16 h-16 rounded-full mb-4" />
                <p className="text-slate-500 animate-pulse">Initializing...</p>
            </div>
        </div>
    );
    return <PageBuilderContent />;
}
