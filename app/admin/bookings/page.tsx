"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import {
    ArrowLeft, Calendar, Clock, User, Mail, Phone, Building,
    MessageSquare, Globe, Check, X, Loader2, ShieldAlert,
    Filter, Search, ChevronDown, RefreshCw, CalendarDays,
    CheckCircle2, XCircle, AlertCircle, Inbox, Eye,
} from "lucide-react";

export const dynamic = "force-dynamic";

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
    const config = {
        pending:   { label: "Pending",   icon: <AlertCircle className="w-3 h-3" />, class: "bg-amber-500/15 text-amber-400 border-amber-500/25" },
        confirmed: { label: "Confirmed", icon: <CheckCircle2 className="w-3 h-3" />, class: "bg-green-500/15 text-green-400 border-green-500/25" },
        cancelled: { label: "Cancelled", icon: <XCircle className="w-3 h-3" />, class: "bg-red-500/15 text-red-400 border-red-500/25" },
    };
    const c = config[status as keyof typeof config] || config.pending;
    return (
        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${c.class}`}>
            {c.icon} {c.label}
        </span>
    );
}

// ─── Booking Detail Drawer ────────────────────────────────────────────────────

function BookingDetailDrawer({
    booking, devToken, onClose,
}: { booking: any; devToken: string; onClose: () => void }) {
    const updateStatus = useMutation(api.bookings.updateStatus);
    const [loading, setLoading] = useState<string | null>(null);

    const handleStatus = async (status: string) => {
        setLoading(status);
        try { await updateStatus({ devToken, id: booking._id, status }); }
        catch (e) { console.error(e); }
        finally { setLoading(null); }
    };

    const fmtDate = (d: string) => {
        const parts = d.split("-");
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
            .toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    };

    return (
        <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            {/* Drawer */}
            <div className="w-full max-w-md bg-[#0D0D14] border-l border-surface-border flex flex-col animate-slide-in-right overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-3 px-6 py-4 border-b border-surface-border bg-[#111118]">
                    <div className="flex-1">
                        <p className="text-slate-500 text-xs font-medium">Booking Request</p>
                        <h2 className="text-white font-bold text-lg">{booking.service}</h2>
                    </div>
                    <StatusBadge status={booking.status} />
                    <button onClick={onClose} className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-surface-hover transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* Date & Time */}
                    <div className="card p-4 space-y-3">
                        <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">Schedule</p>
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                                <Calendar className="w-4 h-4 text-brand-400" />
                            </div>
                            <div>
                                <p className="text-white font-semibold text-sm">{fmtDate(booking.date)}</p>
                                <p className="text-slate-500 text-xs">Date</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                                <Clock className="w-4 h-4 text-brand-400" />
                            </div>
                            <div>
                                <p className="text-white font-semibold text-sm">{booking.time}</p>
                                <p className="text-slate-500 text-xs">{booking.timezone}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                                <Globe className="w-4 h-4 text-brand-400" />
                            </div>
                            <div>
                                <p className="text-white font-semibold text-sm">{booking.pageSlug}</p>
                                <p className="text-slate-500 text-xs">Source page</p>
                            </div>
                        </div>
                    </div>

                    {/* Contact info */}
                    <div className="card p-4 space-y-3">
                        <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">Contact Details</p>
                        <InfoRow icon={<User className="w-4 h-4 text-slate-400" />} label="Name" value={booking.name} />
                        <InfoRow icon={<Mail className="w-4 h-4 text-slate-400" />} label="Email" value={booking.email} copyable />
                        {booking.phone && <InfoRow icon={<Phone className="w-4 h-4 text-slate-400" />} label="Phone" value={booking.phone} />}
                        {booking.company && <InfoRow icon={<Building className="w-4 h-4 text-slate-400" />} label="Company" value={booking.company} />}
                    </div>

                    {/* Message */}
                    {booking.message && (
                        <div className="card p-4">
                            <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">Notes</p>
                            <div className="flex gap-2">
                                <MessageSquare className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                                <p className="text-slate-300 text-sm leading-relaxed">{booking.message}</p>
                            </div>
                        </div>
                    )}

                    {/* Submitted at */}
                    <p className="text-slate-600 text-xs text-center">
                        Submitted {new Date(booking.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                </div>

                {/* Action buttons */}
                <div className="p-4 border-t border-surface-border bg-[#111118] space-y-2">
                    {booking.status !== "confirmed" && (
                        <button
                            onClick={() => handleStatus("confirmed")}
                            disabled={!!loading}
                            className="w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60"
                            style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", boxShadow: "0 4px 16px rgba(16,185,129,0.3)" }}
                        >
                            {loading === "confirmed" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            Confirm Appointment
                        </button>
                    )}
                    {booking.status !== "cancelled" && (
                        <button
                            onClick={() => handleStatus("cancelled")}
                            disabled={!!loading}
                            className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:bg-red-500/20 disabled:opacity-60 text-red-400 border border-red-500/20 hover:border-red-500/40"
                        >
                            {loading === "cancelled" ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                            Cancel Booking
                        </button>
                    )}
                    {booking.status !== "pending" && (
                        <button
                            onClick={() => handleStatus("pending")}
                            disabled={!!loading}
                            className="w-full py-2 rounded-xl text-xs text-slate-500 hover:text-white transition-colors"
                        >
                            Reset to Pending
                        </button>
                    )}
                    {/* Quick reply mailto */}
                    <a
                        href={`mailto:${booking.email}?subject=Your Appointment: ${booking.service}&body=Hi ${booking.name},%0A%0AYour appointment on ${fmtDate(booking.date)} at ${booking.time} has been noted.%0A%0ABest regards`}
                        className="w-full py-3 rounded-xl text-slate-400 hover:text-white border border-surface-border hover:border-slate-500 text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                    >
                        <Mail className="w-4 h-4" /> Reply via Email
                    </a>
                </div>
            </div>
            <style>{`
                @keyframes slide-in-right {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .animate-slide-in-right { animation: slide-in-right 0.25s ease-out; }
            `}</style>
        </div>
    );
}

function InfoRow({ icon, label, value, copyable = false }: { icon: React.ReactNode; label: string; value: string; copyable?: boolean }) {
    const [copied, setCopied] = useState(false);
    return (
        <div className="flex items-center gap-3">
            <div className="shrink-0 w-8">{icon}</div>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">{label}</p>
                <p className="text-white text-sm font-medium truncate">{value}</p>
            </div>
            {copyable && (
                <button
                    onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                    className="shrink-0 text-xs text-slate-500 hover:text-brand-400 transition-colors px-2 py-1 rounded-md hover:bg-brand-500/10"
                >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : "Copy"}
                </button>
            )}
        </div>
    );
}

// ─── Bookings Table ───────────────────────────────────────────────────────────

function BookingsTable({ devToken }: { devToken: string }) {
    const allBookings = useQuery(api.bookings.list, { devToken }) ?? [];
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "confirmed" | "cancelled">("all");
    const [selected, setSelected] = useState<any | null>(null);

    const fmtDate = (d: string) => {
        const parts = d.split("-");
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
            .toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

    const filtered = allBookings.filter((b: any) => {
        const matchStatus = statusFilter === "all" || b.status === statusFilter;
        const q = search.toLowerCase();
        const matchSearch = !q || b.name.toLowerCase().includes(q) || b.email.toLowerCase().includes(q) || b.service.toLowerCase().includes(q);
        return matchStatus && matchSearch;
    });

    // Stats
    const pending   = allBookings.filter((b: any) => b.status === "pending").length;
    const confirmed = allBookings.filter((b: any) => b.status === "confirmed").length;
    const cancelled = allBookings.filter((b: any) => b.status === "cancelled").length;

    return (
        <>
            {/* Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 animate-fade-in">
                {[
                    { label: "Total",     value: allBookings.length, color: "text-white",       bg: "border-surface-border" },
                    { label: "Pending",   value: pending,            color: "text-amber-400",   bg: "border-amber-500/20 bg-amber-500/5" },
                    { label: "Confirmed", value: confirmed,          color: "text-green-400",   bg: "border-green-500/20 bg-green-500/5" },
                    { label: "Cancelled", value: cancelled,          color: "text-red-400",     bg: "border-red-500/20 bg-red-500/5" },
                ].map((s, i) => (
                    <div key={i} className={`card p-4 border ${s.bg}`}>
                        <p className="text-slate-500 text-xs font-medium">{s.label}</p>
                        <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4 animate-fade-in">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        className="input pl-9"
                        placeholder="Search by name, email, or service…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    {(["all", "pending", "confirmed", "cancelled"] as const).map(s => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`px-3 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                                statusFilter === s
                                    ? "bg-brand-500/15 text-brand-400 border border-brand-500/30"
                                    : "text-slate-500 border border-surface-border hover:text-white hover:border-slate-500"
                            }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            {filtered.length === 0 ? (
                <div className="card border-dashed border-2 bg-transparent py-20 flex flex-col items-center gap-3 animate-fade-in">
                    <Inbox className="w-12 h-12 text-slate-700" />
                    <p className="text-white font-semibold">No bookings found</p>
                    <p className="text-slate-500 text-sm">
                        {allBookings.length === 0
                            ? "No appointments have been submitted yet."
                            : "Try adjusting your search or filter."}
                    </p>
                </div>
            ) : (
                <div className="rounded-2xl border border-surface-border overflow-hidden animate-slide-up">
                    {/* Table header */}
                    <div className="hidden md:grid grid-cols-[1fr_1fr_140px_120px_80px] gap-4 px-5 py-3 bg-[#0D0D14] border-b border-surface-border">
                        {["Client", "Date & Time", "Service", "Status", ""].map((h, i) => (
                            <p key={i} className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{h}</p>
                        ))}
                    </div>

                    {/* Rows */}
                    <div className="divide-y divide-surface-border">
                        {filtered.map((booking: any) => (
                            <div
                                key={booking._id}
                                className="grid grid-cols-1 md:grid-cols-[1fr_1fr_140px_120px_80px] gap-3 md:gap-4 px-5 py-4 hover:bg-surface-hover/40 transition-all group"
                            >
                                {/* Client */}
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 font-bold text-sm shrink-0">
                                        {booking.name[0]?.toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-white font-semibold text-sm truncate">{booking.name}</p>
                                        <p className="text-slate-500 text-xs truncate">{booking.email}</p>
                                    </div>
                                </div>

                                {/* Date & Time */}
                                <div className="flex items-center gap-2 md:block">
                                    <p className="text-white text-sm font-medium">{fmtDate(booking.date)}</p>
                                    <p className="text-slate-400 text-xs mt-0.5 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {booking.time}
                                    </p>
                                </div>

                                {/* Service */}
                                <div className="flex items-center">
                                    <span className="text-sm text-slate-300 truncate">{booking.service}</span>
                                </div>

                                {/* Status */}
                                <div className="flex items-center">
                                    <StatusBadge status={booking.status} />
                                </div>

                                {/* Action */}
                                <div className="flex items-center">
                                    <button
                                        onClick={() => setSelected(booking)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-surface-hover border border-surface-border hover:border-slate-500 transition-all"
                                    >
                                        <Eye className="w-3.5 h-3.5" /> Review
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Detail Drawer */}
            {selected && (
                <BookingDetailDrawer
                    booking={selected}
                    devToken={devToken}
                    onClose={() => setSelected(null)}
                />
            )}
        </>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function BookingsContent() {
    const [devToken, setDevToken] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const stored = localStorage.getItem("bugscribe_dev_token");
        if (stored) setDevToken(stored);
    }, []);

    const currentUser = useQuery(api.users.currentUser, { devToken: devToken || undefined });
    const isSuperAdmin = currentUser?.role === "super_admin";

    if (!mounted || currentUser === undefined) {
        return (
            <div className="min-h-screen"><Navbar />
                <div className="max-w-6xl mx-auto px-4 py-24 flex flex-col items-center gap-4">
                    <div className="skeleton w-16 h-16 rounded-full" />
                    <p className="text-slate-500 animate-pulse">Loading bookings...</p>
                </div>
            </div>
        );
    }

    if (!devToken || !isSuperAdmin) {
        return (
            <div className="min-h-screen"><Navbar />
                <div className="max-w-5xl mx-auto px-4 py-24 text-center">
                    <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
                    <p className="text-slate-400 mb-8">Only Super Admins can view booking requests.</p>
                    <Link href="/" className="btn-primary inline-flex">Return Home</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen"><Navbar />
            <main className="max-w-6xl mx-auto px-4 py-10">
                {/* Page header */}
                <div className="flex items-center justify-between mb-8 animate-slide-up">
                    <div>
                        <div className="flex items-center gap-2 text-brand-400 text-xs font-bold uppercase tracking-widest mb-2">
                            <CalendarDays className="w-3.5 h-3.5" /> Admin · Bookings
                        </div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Appointment Requests</h1>
                        <p className="text-slate-400 mt-1 text-sm">Review, confirm, or cancel submitted booking requests.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/admin/pages" className="btn-ghost flex items-center gap-2 text-sm">
                            <CalendarDays className="w-4 h-4" /> Page Builder
                        </Link>
                        <Link href="/admin" className="btn-ghost flex items-center gap-2 text-sm">
                            <ArrowLeft className="w-4 h-4" /> Admin
                        </Link>
                    </div>
                </div>

                {/* Pending alert banner */}
                <PendingAlert devToken={devToken} />

                <BookingsTable devToken={devToken} />
            </main>
        </div>
    );
}

function PendingAlert({ devToken }: { devToken: string }) {
    const bookings = useQuery(api.bookings.list, { devToken }) ?? [];
    const pending = bookings.filter((b: any) => b.status === "pending").length;
    if (!pending) return null;
    return (
        <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-500/25 bg-amber-500/8 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="text-amber-300 text-sm font-medium">
                <span className="font-bold">{pending} pending</span> appointment{pending !== 1 ? "s" : ""} awaiting your review.
            </p>
        </div>
    );
}

export default function AdminBookingsPage() {
    return <BookingsContent />;
}
