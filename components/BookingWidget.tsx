"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
    ChevronLeft, ChevronRight, Clock, Calendar, Globe, User, Mail,
    Phone, Building, MessageSquare, Check, ArrowRight, ArrowLeft,
    Loader2, Star, Shield, Zap,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BookingData {
    eventName: string;
    duration: string;
    description: string;
    hostName: string;
    hostAvatar: string;
    accentColor: string;
    timeSlots: string;  // comma-separated e.g. "09:00 AM,10:30 AM,12:00 PM"
    bufferMinutes: string;
    showCompany: boolean;
    showPhone: boolean;
    requireMessage: boolean;
    pageSlug: string;
}

interface FormState {
    name: string;
    email: string;
    phone: string;
    company: string;
    message: string;
}

const TIMEZONES = [
    { label: "Eastern Time (US & Canada)", value: "America/New_York", offset: "UTC-5" },
    { label: "Central Time (US & Canada)", value: "America/Chicago", offset: "UTC-6" },
    { label: "Mountain Time (US & Canada)", value: "America/Denver", offset: "UTC-7" },
    { label: "Pacific Time (US & Canada)", value: "America/Los_Angeles", offset: "UTC-8" },
    { label: "London (GMT)", value: "Europe/London", offset: "UTC+0" },
    { label: "Paris / Berlin (CET)", value: "Europe/Paris", offset: "UTC+1" },
    { label: "Mumbai (IST)", value: "Asia/Kolkata", offset: "UTC+5:30" },
    { label: "Singapore / KL", value: "Asia/Singapore", offset: "UTC+8" },
    { label: "Tokyo (JST)", value: "Asia/Tokyo", offset: "UTC+9" },
    { label: "Sydney (AEDT)", value: "Australia/Sydney", offset: "UTC+11" },
];

const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

// ─── Calendar ─────────────────────────────────────────────────────────────────

function BookingCalendar({
    selectedDate, onSelect, accentColor,
}: {
    selectedDate: Date | null;
    onSelect: (d: Date) => void;
    accentColor: string;
}) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());

    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
    const maxDate = new Date(today);
    maxDate.setMonth(maxDate.getMonth() + 3);

    const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
    const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };
    const canGoPrev = new Date(viewYear, viewMonth, 1) > new Date(today.getFullYear(), today.getMonth(), 1);

    const cells = useMemo(() => {
        const arr: (number | null)[] = Array(firstDayOfWeek).fill(null);
        for (let d = 1; d <= daysInMonth; d++) arr.push(d);
        while (arr.length % 7 !== 0) arr.push(null);
        return arr;
    }, [viewYear, viewMonth, firstDayOfWeek, daysInMonth]);

    const isSelected = (d: number) =>
        selectedDate?.getFullYear() === viewYear &&
        selectedDate?.getMonth() === viewMonth &&
        selectedDate?.getDate() === d;

    const isToday = (d: number) =>
        today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === d;

    const isPast = (d: number) => new Date(viewYear, viewMonth, d) < today;
    const isFutureForbidden = (d: number) => new Date(viewYear, viewMonth, d) > maxDate;
    const isWeekend = (d: number) => { const day = new Date(viewYear, viewMonth, d).getDay(); return day === 0 || day === 6; };

    return (
        <div className="select-none">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-5">
                <button onClick={prevMonth} disabled={!canGoPrev}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-hover transition-colors disabled:opacity-30 text-slate-400">
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <h3 className="text-white font-bold text-base">{MONTH_NAMES[viewMonth]} {viewYear}</h3>
                <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-hover transition-colors text-slate-400">
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
                {DAY_NAMES.map(d => (
                    <div key={d} className="text-center text-[10px] font-bold text-slate-600 py-1 tracking-widest">{d}</div>
                ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-y-1">
                {cells.map((day, idx) => {
                    if (!day) return <div key={idx} />;
                    const disabled = isPast(day) || isFutureForbidden(day);
                    const weekend = isWeekend(day);
                    const selected = isSelected(day);
                    const todayCell = isToday(day);

                    return (
                        <button
                            key={idx}
                            disabled={disabled || weekend}
                            onClick={() => onSelect(new Date(viewYear, viewMonth, day))}
                            className={`
                                relative mx-auto w-9 h-9 rounded-full text-sm font-medium transition-all
                                ${selected
                                    ? "text-white font-bold"
                                    : todayCell
                                        ? "text-brand-400 border border-brand-500/50 hover:scale-110"
                                        : disabled || weekend
                                            ? "text-slate-700 cursor-not-allowed"
                                            : "text-slate-300 hover:bg-surface-hover hover:text-white hover:scale-110"
                                }
                            `}
                            style={selected ? { background: accentColor, outline: `2px solid ${accentColor}`, outlineOffset: "2px" } : undefined}
                        >
                            {day}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Time Slot Picker ─────────────────────────────────────────────────────────

function TimeSlotPicker({
    slots, bookedSlots, selected, onSelect, accentColor,
}: {
    slots: string[]; bookedSlots: string[]; selected: string; onSelect: (t: string) => void; accentColor: string;
}) {
    return (
        <div className="space-y-2 overflow-y-auto max-h-80 pr-1 scrollbar-thin">
            {slots.map(slot => {
                const isBooked = bookedSlots.includes(slot);
                const isSelected = selected === slot;
                return (
                    <button
                        key={slot}
                        disabled={isBooked}
                        onClick={() => onSelect(slot)}
                        className={`
                            w-full px-4 py-3 rounded-xl text-sm font-semibold text-center transition-all
                            ${isBooked
                                ? "opacity-30 cursor-not-allowed bg-surface text-slate-600 border border-surface-border"
                                : isSelected
                                    ? "text-white shadow-lg scale-[1.02]"
                                    : "border border-surface-border text-slate-300 hover:border-brand-500/40 hover:text-white hover:bg-surface-hover"
                            }
                        `}
                        style={isSelected ? { background: accentColor, borderColor: "transparent" } : undefined}
                    >
                        {slot}
                        {isBooked && <span className="ml-2 text-[10px] text-slate-600">Unavailable</span>}
                    </button>
                );
            })}
        </div>
    );
}

// ─── Main Booking Widget ──────────────────────────────────────────────────────

export function BookingWidget({ data, pageSlug }: { data: BookingData; pageSlug: string }) {
    const createBooking = useMutation(api.bookings.create);

    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState("");
    const [selectedTz, setSelectedTz] = useState("Asia/Kolkata");
    const [showTzPicker, setShowTzPicker] = useState(false);
    const [form, setForm] = useState<FormState>({ name: "", email: "", phone: "", company: "", message: "" });
    const [errors, setErrors] = useState<Partial<FormState>>({});
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");

    const accent = data.accentColor || "#00D4FF";
    const slots = (data.timeSlots || "09:00 AM,10:30 AM,12:00 PM,02:00 PM,03:30 PM,05:00 PM")
        .split(",").map(s => s.trim()).filter(Boolean);

    const dateStr = selectedDate
        ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`
        : "";

    const bookedSlots = useQuery(
        api.bookings.getBookedSlots,
        dateStr ? { pageSlug, date: dateStr } : "skip"
    ) ?? [];

    const tzObj = TIMEZONES.find(t => t.value === selectedTz) || TIMEZONES[6];

    const formatDate = (d: Date) => d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

    const validate = () => {
        const e: Partial<FormState> = {};
        if (!form.name.trim()) e.name = "Name is required";
        if (!form.email.trim() || !form.email.includes("@")) e.email = "Valid email is required";
        if (data.showPhone && !form.phone.trim()) e.phone = "Phone is required";
        if (data.requireMessage && !form.message.trim()) e.message = "Message is required";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setSubmitting(true);
        setSubmitError("");
        try {
            await createBooking({
                pageSlug, service: data.eventName || "Appointment",
                date: dateStr, time: selectedTime, timezone: selectedTz,
                name: form.name, email: form.email,
                phone: form.phone || undefined, company: form.company || undefined, message: form.message || undefined,
            });
            setStep(3);
        } catch (e: any) {
            setSubmitError(e.message || "Booking failed. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="w-full">
            {/* ── Step 1: Calendar + Time ─────────────────────────────────── */}
            {step === 1 && (
                <div className="grid md:grid-cols-[1fr_1px_220px] gap-0 overflow-hidden rounded-2xl border border-surface-border bg-[#111118]"
                    style={{ boxShadow: "0 0 40px rgba(0,0,0,0.4)" }}>

                    {/* Left: Event info + Calendar */}
                    <div className="p-4 md:p-5">
                        {/* Host info */}
                        <div className="flex items-center gap-2.5 mb-4 pb-4 border-b border-surface-border">
                            {data.hostAvatar ? (
                                <img src={data.hostAvatar} alt={data.hostName} className="w-9 h-9 rounded-full object-cover border-2" style={{ borderColor: accent }} />
                            ) : (
                                <div className="w-9 h-9 rounded-full flex items-center justify-center text-base font-bold text-white" style={{ background: accent + "22", border: `2px solid ${accent}` }}>
                                    {data.hostName?.[0] || "B"}
                                </div>
                            )}
                            <div>
                                <p className="text-slate-400 text-xs font-medium">{data.hostName || "BugScribe Team"}</p>
                                <h3 className="text-white font-bold text-base leading-tight">{data.eventName || "Book a Meeting"}</h3>
                            </div>
                        </div>

                        {/* Meta badges */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            <div className="flex items-center gap-1 text-xs text-slate-400 bg-surface-hover px-2.5 py-1 rounded-full">
                                <Clock className="w-3 h-3" style={{ color: accent }} />
                                {data.duration || "30"} min
                            </div>
                            <div className="flex items-center gap-1 text-xs text-slate-400 bg-surface-hover px-2.5 py-1 rounded-full">
                                <Zap className="w-3 h-3 text-amber-400" />
                                Video / Phone
                            </div>
                            <div className="flex items-center gap-1 text-xs text-slate-400 bg-surface-hover px-2.5 py-1 rounded-full">
                                <Shield className="w-3 h-3 text-green-400" />
                                Free
                            </div>
                        </div>

                        {data.description && (
                            <p className="text-slate-400 text-sm leading-relaxed mb-4 border-l-2 pl-3" style={{ borderColor: accent }}>
                                {data.description}
                            </p>
                        )}

                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Select a Date</p>
                        <BookingCalendar selectedDate={selectedDate} onSelect={setSelectedDate} accentColor={accent} />

                        {/* Timezone selector */}
                        <div className="mt-5 pt-4 border-t border-surface-border">
                            <button onClick={() => setShowTzPicker(p => !p)}
                                className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors group w-full">
                                <Globe className="w-3.5 h-3.5 group-hover:text-brand-400" />
                                <span>{tzObj.label}</span>
                                <span className="text-slate-600 ml-auto">{tzObj.offset}</span>
                                <ChevronRight className={`w-3 h-3 transition-transform ${showTzPicker ? "rotate-90" : ""}`} />
                            </button>
                            {showTzPicker && (
                                <div className="mt-2 rounded-xl border border-surface-border bg-[#0D0D14] overflow-hidden max-h-48 overflow-y-auto">
                                    {TIMEZONES.map(tz => (
                                        <button key={tz.value} onClick={() => { setSelectedTz(tz.value); setShowTzPicker(false); }}
                                            className={`w-full flex items-center justify-between px-3 py-2.5 text-xs transition-all hover:bg-surface-hover ${selectedTz === tz.value ? "text-white font-semibold" : "text-slate-400"}`}>
                                            <span>{tz.label}</span>
                                            <span className="text-slate-600">{tz.offset}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="hidden md:block bg-surface-border" />

                    {/* Right: Time slots */}
                    <div className="p-4 border-t md:border-t-0 border-surface-border">
                        {selectedDate ? (
                            <>
                                <div className="mb-4">
                                    <p className="text-white font-bold text-sm">{formatDate(selectedDate)}</p>
                                    <p className="text-slate-500 text-xs mt-0.5">{tzObj.label}</p>
                                </div>
                                <TimeSlotPicker
                                    slots={slots} bookedSlots={bookedSlots}
                                    selected={selectedTime} onSelect={setSelectedTime}
                                    accentColor={accent}
                                />
                                {selectedTime && (
                                    <button
                                        onClick={() => setStep(2)}
                                        className="mt-4 w-full py-3 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 hover:scale-[1.01] active:scale-[0.99]"
                                        style={{ background: `linear-gradient(135deg, ${accent} 0%, ${accent}cc 100%)`, boxShadow: `0 4px 20px ${accent}40` }}
                                    >
                                        Next <ArrowRight className="w-4 h-4" />
                                    </button>
                                )}
                            </>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center gap-3 py-10 text-center">
                                <Calendar className="w-10 h-10 text-slate-700" />
                                <p className="text-slate-600 text-sm">Select a date to see<br />available times</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Step 2: Contact Form ─────────────────────────────────────── */}
            {step === 2 && (
                <div className="rounded-2xl border border-surface-border bg-[#111118] overflow-hidden"
                    style={{ boxShadow: "0 0 60px rgba(0,0,0,0.5)" }}>

                    {/* Booking summary bar */}
                    <div className="flex items-center gap-4 px-6 py-4 border-b border-surface-border bg-[#0D0D14]">
                        <button onClick={() => setStep(1)} className="text-slate-400 hover:text-white transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <div className="flex-1">
                            <p className="text-white font-bold text-sm">{data.eventName || "Book a Meeting"}</p>
                            <div className="flex items-center gap-3 mt-0.5">
                                <span className="flex items-center gap-1 text-xs text-slate-400">
                                    <Calendar className="w-3 h-3" style={{ color: accent }} />
                                    {selectedDate && formatDate(selectedDate)}
                                </span>
                                <span className="text-slate-700">·</span>
                                <span className="flex items-center gap-1 text-xs text-slate-400">
                                    <Clock className="w-3 h-3" style={{ color: accent }} />
                                    {selectedTime}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full" style={{ color: accent, background: accent + "18" }}>
                            <Clock className="w-3 h-3" />
                            {data.duration || "30"} min
                        </div>
                    </div>

                    <div className="p-6 md:p-8">
                        <h3 className="text-white font-bold text-xl mb-6">Enter your details</h3>

                        <div className="space-y-4">
                            {/* Name */}
                            <div>
                                <label className="text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
                                    <User className="w-3 h-3" /> Full Name *
                                </label>
                                <input
                                    className="input"
                                    placeholder="John Doe"
                                    value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    style={errors.name ? { borderColor: "#f87171" } : {}}
                                />
                                {errors.name && <p className="text-red-400 text-[11px] mt-1">{errors.name}</p>}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
                                    <Mail className="w-3 h-3" /> Email Address *
                                </label>
                                <input
                                    className="input" type="email"
                                    placeholder="john@company.com"
                                    value={form.email}
                                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                    style={errors.email ? { borderColor: "#f87171" } : {}}
                                />
                                {errors.email && <p className="text-red-400 text-[11px] mt-1">{errors.email}</p>}
                            </div>

                            {/* Phone + Company row */}
                            <div className="grid grid-cols-2 gap-4">
                                {data.showPhone !== false && (
                                    <div>
                                        <label className="text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
                                            <Phone className="w-3 h-3" /> Phone
                                        </label>
                                        <input
                                            className="input" type="tel"
                                            placeholder="+1 234 567 8900"
                                            value={form.phone}
                                            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                                            style={errors.phone ? { borderColor: "#f87171" } : {}}
                                        />
                                        {errors.phone && <p className="text-red-400 text-[11px] mt-1">{errors.phone}</p>}
                                    </div>
                                )}
                                {data.showCompany !== false && (
                                    <div>
                                        <label className="text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
                                            <Building className="w-3 h-3" /> Company
                                        </label>
                                        <input
                                            className="input"
                                            placeholder="Acme Inc."
                                            value={form.company}
                                            onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Message */}
                            <div>
                                <label className="text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
                                    <MessageSquare className="w-3 h-3" />
                                    Additional Notes {data.requireMessage ? "*" : "(optional)"}
                                </label>
                                <textarea
                                    className="input resize-none"
                                    rows={3}
                                    placeholder="Tell us what you'd like to discuss..."
                                    value={form.message}
                                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                                    style={errors.message ? { borderColor: "#f87171" } : {}}
                                />
                                {errors.message && <p className="text-red-400 text-[11px] mt-1">{errors.message}</p>}
                            </div>

                            {submitError && (
                                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                    {submitError}
                                </div>
                            )}

                            {/* Submit */}
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="w-full py-3.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:scale-100"
                                style={{ background: `linear-gradient(135deg, ${accent} 0%, ${accent}cc 100%)`, boxShadow: `0 4px 24px ${accent}40` }}
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                {submitting ? "Confirming…" : "Confirm Appointment"}
                            </button>

                            <p className="text-center text-xs text-slate-600">
                                By confirming, you agree to receive a confirmation email at the address provided.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Step 3: Confirmation ─────────────────────────────────────── */}
            {step === 3 && (
                <div className="rounded-2xl border border-surface-border bg-[#111118] overflow-hidden text-center"
                    style={{ boxShadow: "0 0 60px rgba(0,0,0,0.5)" }}>
                    <div className="p-10 md:p-14">
                        {/* Animated check */}
                        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 relative"
                            style={{ background: accent + "18", border: `2px solid ${accent}55` }}>
                            <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: accent }} />
                            <Check className="w-9 h-9" style={{ color: accent }} />
                        </div>

                        <h2 className="text-3xl font-bold text-white mb-2">Booking Confirmed!</h2>
                        <p className="text-slate-400 text-base mb-8 max-w-sm mx-auto">
                            Your appointment has been successfully scheduled. A confirmation will be sent to <span className="text-white font-semibold">{form.email}</span>.
                        </p>

                        {/* Booking details card */}
                        <div className="rounded-xl border border-surface-border bg-[#0D0D14] p-5 text-left max-w-sm mx-auto mb-8 space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: accent + "20" }}>
                                    <Calendar className="w-4 h-4" style={{ color: accent }} />
                                </div>
                                <div>
                                    <p className="text-slate-500 text-xs">Date</p>
                                    <p className="text-white text-sm font-semibold">{selectedDate && formatDate(selectedDate)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: accent + "20" }}>
                                    <Clock className="w-4 h-4" style={{ color: accent }} />
                                </div>
                                <div>
                                    <p className="text-slate-500 text-xs">Time</p>
                                    <p className="text-white text-sm font-semibold">{selectedTime} · {tzObj.label}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: accent + "20" }}>
                                    <User className="w-4 h-4" style={{ color: accent }} />
                                </div>
                                <div>
                                    <p className="text-slate-500 text-xs">Booked for</p>
                                    <p className="text-white text-sm font-semibold">{form.name}</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => { setStep(1); setSelectedDate(null); setSelectedTime(""); setForm({ name: "", email: "", phone: "", company: "", message: "" }); }}
                            className="text-sm font-semibold px-6 py-2.5 rounded-xl text-slate-300 hover:text-white border border-surface-border hover:border-slate-500 transition-all"
                        >
                            Book Another Appointment
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Public Block Wrapper ─────────────────────────────────────────────────────

export default function BookingBlock({ data, pageSlug }: { data: any; pageSlug: string }) {
    return (
        <section className="py-10">
            {/* Section header */}
            {(data.sectionHeading || data.sectionSubheading) && (
                <div className="text-center mb-6">
                    {data.sectionHeading && (
                        <h2 className="text-2xl font-bold text-white tracking-tight mb-2">{data.sectionHeading}</h2>
                    )}
                    {data.sectionSubheading && (
                        <p className="text-slate-400 text-sm max-w-xl mx-auto">{data.sectionSubheading}</p>
                    )}
                </div>
            )}

            {/* Trust badges */}
            <div className="flex flex-wrap justify-center gap-3 mb-5">
                {[
                    { icon: <Shield className="w-3 h-3 text-green-400" />, text: "No spam, ever" },
                    { icon: <Clock className="w-3 h-3 text-brand-400" />, text: "Cancel anytime" },
                    { icon: <Star className="w-3 h-3 text-amber-400" />, text: "4.9/5 rated" },
                ].map((b, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-slate-400 bg-surface-hover px-2.5 py-1 rounded-full border border-surface-border">
                        {b.icon} {b.text}
                    </div>
                ))}
            </div>

            <BookingWidget data={data} pageSlug={pageSlug} />
        </section>
    );
}
