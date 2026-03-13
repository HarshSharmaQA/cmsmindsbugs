"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import BookingBlock from "@/components/BookingWidget";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { ArrowRight, ExternalLink, Bug, HelpCircle, LayoutGrid, ChevronDown, Check, Star, Quote, User } from "lucide-react";

export const dynamic = "force-dynamic";

// ─── Sliding Ribbon Block ─────────────────────────────────────────────────────

function RibbonBlock({ data }: { data: any }) {
    const speed = parseInt(data.speed || "35");
    const direction = data.direction === "right" ? "reverse" : "normal";
    const tilt = data.tilt !== "false";
    const scheme = data.colorScheme || "cyan";
    const text = data.text || "Build fast · Ship faster · Zero bugs ·";
    // Duplicate text for seamless loop
    const content = `${text} ${text}`;

    const colorMap: Record<string, { bg: string; text: string; border: string }> = {
        cyan: { bg: "rgba(0,212,255,0.06)", text: "#00D4FF", border: "rgba(0,212,255,0.2)" },
        white: { bg: "rgba(255,255,255,0.04)", text: "#e8eaf0", border: "rgba(255,255,255,0.1)" },
        dark: { bg: "#0D0D14", text: "#6b7280", border: "#1E1E2E" },
    };
    const colors = colorMap[scheme] || colorMap.cyan;

    return (
        <section className={`py-2 overflow-hidden relative ${tilt ? "-rotate-2 scale-105 my-6" : "my-4"}`}
            style={{ background: colors.bg, borderTop: `1px solid ${colors.border}`, borderBottom: `1px solid ${colors.border}` }}>
            <div
                className="flex whitespace-nowrap"
                style={{
                    animation: `marquee ${speed}s linear infinite`,
                    animationDirection: direction,
                }}
            >
                <span className="inline-block text-sm font-medium tracking-wide px-4 py-3 select-none" style={{ color: colors.text }}>
                    {content}
                </span>
                <span className="inline-block text-sm font-medium tracking-wide px-4 py-3 select-none" style={{ color: colors.text }}>
                    {content}
                </span>
            </div>
            <style>{`
                @keyframes marquee {
                    from { transform: translateX(0); }
                    to { transform: translateX(-50%); }
                }
            `}</style>
        </section>
    );
}

// ─── Diagonal Marquee Ticker Block ────────────────────────────────────────────

function MarqueeTickerBlock({ data }: { data: any }) {
    const row1 = (data.row1 || "Capture Bugs Instantly, Screenshot & Annotate, Drag & Drop Kanban").split(",").map((s:string) => s.trim()).filter(Boolean);
    const row2 = (data.row2 || "Build Fast Ship Confidently, Visual Bug Reports, Designed for Developers").split(",").map((s:string) => s.trim()).filter(Boolean);

    const row1Items = [...row1, ...row1, ...row1].slice(0, 10);
    const row2Items = [...row2, ...row2, ...row2].slice(0, 10);

    return (
        <div
            className="-mx-4 relative w-[calc(100%+2rem)] overflow-hidden py-6 my-10 select-none"
            style={{ transform: "rotate(-2.5deg)", transformOrigin: "center" }}
        >
            <div className="pointer-events-none absolute inset-y-0 left-0 w-24 z-10"
                style={{ background: "linear-gradient(to right, var(--color-surface, #09090f), transparent)" }} />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-24 z-10"
                style={{ background: "linear-gradient(to left, var(--color-surface, #09090f), transparent)" }} />

            {/* Row 1 — scrolls left */}
            <div className="flex gap-0 mb-3 overflow-hidden">
                <div className="flex gap-6 shrink-0 animate-marquee-left" style={{ animationDuration: "28s" }}>
                    {[...row1Items, ...row1Items].map((item, i) => (
                        <span key={i} className="inline-flex items-center gap-2 whitespace-nowrap text-sm font-semibold px-5 py-2 rounded-full border border-surface-border text-slate-400 bg-surface-card">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
                            {item}
                        </span>
                    ))}
                </div>
                <div className="flex gap-6 shrink-0 animate-marquee-left" aria-hidden style={{ animationDuration: "28s" }}>
                    {[...row1Items, ...row1Items].map((item, i) => (
                        <span key={i} className="inline-flex items-center gap-2 whitespace-nowrap text-sm font-semibold px-5 py-2 rounded-full border border-surface-border text-slate-400 bg-surface-card">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
                            {item}
                        </span>
                    ))}
                </div>
            </div>

            {/* Row 2 — scrolls right */}
            <div className="flex gap-0 overflow-hidden">
                <div className="flex gap-6 shrink-0 animate-marquee-right" style={{ animationDuration: "22s" }}>
                    {[...row2Items, ...row2Items].map((item, i) => (
                        <span key={i} className="inline-flex items-center gap-2 whitespace-nowrap text-sm font-medium px-5 py-2 rounded-full border border-brand-500/20 text-brand-400/70 bg-brand-500/5">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-400/60 shrink-0" />
                            {item}
                        </span>
                    ))}
                </div>
                <div className="flex gap-6 shrink-0 animate-marquee-right" aria-hidden style={{ animationDuration: "22s" }}>
                    {[...row2Items, ...row2Items].map((item, i) => (
                        <span key={i} className="inline-flex items-center gap-2 whitespace-nowrap text-sm font-medium px-5 py-2 rounded-full border border-brand-500/20 text-brand-400/70 bg-brand-500/5">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-400/60 shrink-0" />
                            {item}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Grid Features Block ──────────────────────────────────────────────────────

function GridFeaturesBlock({ data }: { data: any }) {
    const features = [1, 2, 3, 4, 5, 6].map(i => ({
        title: data[`f${i}Title`],
        desc: data[`f${i}Desc`]
    })).filter(f => f.title);

    return (
        <section className="py-20 px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{data.heading}</h2>
                <p className="text-slate-400 text-lg">{data.subheading}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((f, i) => (
                    <div key={i} className="card p-8 group hover:border-brand-500/30 transition-all">
                        <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <LayoutGrid className="w-6 h-6 text-brand-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                        <p className="text-slate-400 leading-relaxed">{f.desc}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}

// ─── FAQ Block ────────────────────────────────────────────────────────────────

function FAQBlock({ data }: { data: any }) {
    const faqs = (data._faqs || [1, 2, 3].map(i => ({
        q: data[`q${i}`],
        a: data[`a${i}`]
    }))).filter((f: any) => f.q);

    return (
        <section className="py-20 px-4 max-w-4xl mx-auto">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{data.heading}</h2>
            </div>
            <div className="space-y-4">
                {faqs.map((f: any, i: number) => (
                    <div key={i} className="card p-6 border-white/5 hover:border-white/10 transition-all">
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center shrink-0">
                                <HelpCircle className="w-5 h-5 text-brand-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white mb-2">{f.q}</h3>
                                <p className="text-slate-400 leading-relaxed">{f.a}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

// ─── Pricing Block ────────────────────────────────────────────────────────────

function PricingBlock({ data }: { data: any }) {
    const plans = [1, 2, 3].map(i => ({
        name: data[`p${i}Name`],
        price: data[`p${i}Price`],
        features: data[`p${i}Features`]?.split(",") || [],
        btn: data[`p${i}Btn`],
        popular: i === 2 && data.p2Popular === "true"
    })).filter(p => p.name);

    return (
        <section className="py-24 px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
                <h2 className="text-4xl font-bold text-white mb-4">{data.heading}</h2>
                <p className="text-slate-400 text-lg">{data.subheading}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {plans.map((p, i) => (
                    <div key={i} className={`card p-8 flex flex-col relative ${p.popular ? 'border-brand-500/50 shadow-[0_0_40px_rgba(0,212,255,0.1)]' : 'border-white/5'}`}>
                        {p.popular && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500 text-[#09090E] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                                Most Popular
                            </div>
                        )}
                        <h3 className="text-xl font-bold text-white mb-2">{p.name}</h3>
                        <div className="flex items-baseline gap-1 mb-6">
                            <span className="text-4xl font-bold text-white">${p.price}</span>
                            <span className="text-slate-500 font-medium">/mo</span>
                        </div>
                        <div className="flex-1 space-y-4 mb-8">
                            {p.features.map((f: string, fi: number) => (
                                <div key={fi} className="flex items-start gap-3 text-sm text-slate-400">
                                    <Check className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                                    <span>{f.trim()}</span>
                                </div>
                            ))}
                        </div>
                        <button className={`w-full py-3 rounded-xl font-bold transition-all ${p.popular ? 'btn-primary' : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'}`}>
                            {p.btn}
                        </button>
                    </div>
                ))}
            </div>
        </section>
    );
}

// ─── Testimonials Block ───────────────────────────────────────────────────────

function TestimonialsBlock({ data }: { data: any }) {
    const items = (data._testimonials || [1, 2, 3].map(i => ({
        quote: data[`t${i}Quote`],
        author: data[`t${i}Author`],
        role: data[`t${i}Role`]
    }))).filter((t: any) => t.quote);

    return (
        <section className="py-24 px-4 bg-brand-500/[0.02]">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-white">{data.heading}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {items.map((t: any, i: number) => (
                    <div key={i} className="card p-8 bg-surface-card/40 backdrop-blur-sm relative">
                        <Quote className="absolute top-4 right-4 w-8 h-8 text-brand-500/10" />
                        <div className="flex gap-1 mb-6 text-brand-400">
                            {[1, 2, 3, 4, 5].map(star => <Star key={star} className="w-4 h-4 fill-current" />)}
                        </div>
                        <p className="text-slate-300 italic mb-8 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 border border-white/5">
                                <User className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-white">{t.author}</h4>
                                <p className="text-[11px] text-slate-500">{t.role}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

// ─── Login Block ──────────────────────────────────────────────────────────────

function LoginBlock({ data }: { data: any }) {
    const handleLogin = () => {
        window.dispatchEvent(new CustomEvent("open-login-modal"));
    };

    return (
        <section className="text-center py-16 animate-fade-in relative px-4">
            <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 mx-auto"
                style={{
                    background: "rgba(0,212,255,0.08)",
                    border: "1px solid rgba(0,212,255,0.2)",
                    boxShadow: "0 0 40px rgba(0,212,255,0.1)",
                }}
            >
                <Bug className="w-10 h-10 text-brand-500" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
                {data.heading || "Welcome to BugScribe"}
            </h2>
            <p className="text-slate-400 text-lg mb-8 max-w-lg mx-auto leading-relaxed">
                {data.subheading || "Sign in to access your projects and track bugs in real-time."}
            </p>
            <button
                onClick={handleLogin}
                className="btn-primary px-8 py-3 text-base mx-auto"
            >
                {data.btnText || "Sign In to Dashboard"}
                <ArrowRight className="w-4 h-4" />
            </button>
        </section>
    );
}

// ─── Team Section Block ───────────────────────────────────────────────────────

function TeamBlock({ data }: { data: any }) {
    const members = (data._members || [1, 2, 3, 4, 5, 6].map(n => ({
        name: data[`member${n}Name`], 
        role: data[`member${n}Role`], 
        photo: data[`member${n}Photo`] 
    }))).filter((m: any) => m.name);

    return (
        <section className="py-16">
            {/* Header */}
            <div className="text-center mb-12">
                <p className="text-brand-400 text-xs font-bold uppercase tracking-widest mb-3">Team</p>
                {data.heading && (
                    <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4 max-w-2xl mx-auto">{data.heading}</h2>
                )}
                {data.subheading && (
                    <p className="text-slate-400 text-lg max-w-xl mx-auto leading-relaxed">{data.subheading}</p>
                )}
            </div>

            {/* Member grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
                {members.map((member: any, i: number) => (
                    <div
                        key={i}
                        className="card p-0 overflow-hidden flex items-center gap-0 hover:border-brand-500/30 hover:shadow-[0_0_20px_rgba(0,212,255,0.08)] transition-all group"
                        style={{ borderRadius: "16px" }}
                    >
                        {/* Photo */}
                        <div className="w-28 h-28 shrink-0 overflow-hidden" style={{ borderRadius: "14px 0 0 14px" }}>
                            {member.photo ? (
                                <img src={member.photo} alt={member.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                            ) : (
                                <div className="w-full h-full bg-brand-500/10 flex items-center justify-center text-brand-400 text-2xl font-bold">
                                    {member.name[0]}
                                </div>
                            )}
                        </div>
                        {/* Info */}
                        <div className="px-4 border-l border-surface-border">
                            <p className="text-white font-bold text-sm">{member.name}</p>
                            <p className="text-slate-500 text-xs mt-0.5">{member.role}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

// ─── Bug Analytics / Radar Chart Block ───────────────────────────────────────

function BugChartBlock({ data }: { data: any }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const metrics = [
        { label: "Engagement", value: parseFloat(data.engagement || 85), angle: -90 },
        { label: "Pages/Session", value: parseFloat(data.pagesSession || 72), angle: -18 },
        { label: "Session Duration", value: parseFloat(data.sessionDuration || 68), angle: 54 },
        { label: "Conversion", value: parseFloat(data.conversion || 54), angle: 126 },
        { label: "Retention", value: parseFloat(data.retention || 79), angle: 198 },
    ];

    const campaigns = [
        { label: data.label1 || "Google Search", value: parseFloat(data.val1 || 70), color: "#818cf8" },
        { label: data.label2 || "Display Ads", value: parseFloat(data.val2 || 58), color: "#fb923c" },
        { label: data.label3 || "Newsletter", value: parseFloat(data.val3 || 71), color: "#34d399" },
        { label: data.label4 || "Social Media", value: parseFloat(data.val4 || 58), color: "#f472b6" },
    ].filter(c => c.label);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const W = canvas.width, H = canvas.height;
        const cx = W / 2, cy = H / 2;
        const maxR = Math.min(cx, cy) - 40;
        const sides = 5;

        ctx.clearRect(0, 0, W, H);

        // Draw grid rings
        for (let ring = 1; ring <= 5; ring++) {
            const r = (ring / 5) * maxR;
            ctx.beginPath();
            for (let s = 0; s < sides; s++) {
                const angle = ((s * 2 * Math.PI) / sides) - Math.PI / 2;
                const x = cx + r * Math.cos(angle), y = cy + r * Math.sin(angle);
                s === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.strokeStyle = "rgba(255,255,255,0.06)";
            ctx.lineWidth = 1;
            ctx.stroke();
            // Ring label
            ctx.fillStyle = "rgba(255,255,255,0.2)";
            ctx.font = "10px Inter, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(String(ring * 20), cx, cy - r + 4);
        }

        // Draw spokes
        for (let s = 0; s < sides; s++) {
            const angle = ((s * 2 * Math.PI) / sides) - Math.PI / 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + maxR * Math.cos(angle), cy + maxR * Math.sin(angle));
            ctx.strokeStyle = "rgba(255,255,255,0.06)";
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Draw axis labels
        for (let s = 0; s < sides; s++) {
            const angle = ((s * 2 * Math.PI) / sides) - Math.PI / 2;
            const x = cx + (maxR + 22) * Math.cos(angle);
            const y = cy + (maxR + 22) * Math.sin(angle);
            ctx.fillStyle = "rgba(148,163,184,0.8)";
            ctx.font = "11px Inter, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(metrics[s].label, x, y + 4);
        }

        // Draw shaded base polygon (gray)
        ctx.beginPath();
        for (let s = 0; s < sides; s++) {
            const angle = ((s * 2 * Math.PI) / sides) - Math.PI / 2;
            const r = (40 / 100) * maxR;
            const x = cx + r * Math.cos(angle), y = cy + r * Math.sin(angle);
            s === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = "rgba(100,116,139,0.15)";
        ctx.fill();

        // Palette for data series
        const palette = ["#818cf8", "#fb923c", "#34d399", "#f472b6"];

        // Draw a data polygon for each metric value set (just the combined metrics as one layer + one per campaign val)
        const drawPolygon = (vals: number[], color: string) => {
            ctx.beginPath();
            for (let s = 0; s < sides; s++) {
                const angle = ((s * 2 * Math.PI) / sides) - Math.PI / 2;
                const r = (vals[s] / 100) * maxR;
                const x = cx + r * Math.cos(angle), y = cy + r * Math.sin(angle);
                s === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = color.replace(")", ",0.1)").replace("rgb", "rgba");
            ctx.fill();
            // Dots
            for (let s = 0; s < sides; s++) {
                const angle = ((s * 2 * Math.PI) / sides) - Math.PI / 2;
                const r = (vals[s] / 100) * maxR;
                ctx.beginPath();
                ctx.arc(cx + r * Math.cos(angle), cy + r * Math.sin(angle), 4, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.fill();
            }
        };

        // Draw main metrics polygon
        drawPolygon(metrics.map(m => m.value), "#00D4FF");

        // Draw campaign polygons (scaled per pentagon axis)
        campaigns.forEach((camp, ci) => {
            const scaledVals = metrics.map(() => camp.value);
            drawPolygon(scaledVals, palette[ci]);
        });

    }, [data]);

    return (
        <section className="py-16">
            <div className="text-center mb-10">
                {data.heading && <h2 className="text-4xl font-bold text-white tracking-tight mb-3">{data.heading}</h2>}
                {data.subheading && <p className="text-slate-400 text-lg max-w-xl mx-auto">{data.subheading}</p>}
            </div>
            <div className="card p-6 max-w-lg mx-auto" style={{ borderColor: "rgba(0,212,255,0.15)" }}>
                <canvas ref={canvasRef} width={400} height={360} className="w-full" />
                {/* Legend */}
                <div className="mt-6 space-y-3 border-t border-surface-border pt-6">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">Campaign Performance</p>
                    {[
                        { label: campaigns[0]?.label || "Google Search", val: campaigns[0]?.value || 70, color: "#818cf8" },
                        { label: campaigns[1]?.label || "Display Ads", val: campaigns[1]?.value || 58, color: "#fb923c" },
                        { label: campaigns[2]?.label || "Newsletter", val: campaigns[2]?.value || 71, color: "#34d399" },
                        { label: campaigns[3]?.label || "Social Media", val: campaigns[3]?.value || 58, color: "#f472b6" },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color, boxShadow: `0 0 8px ${item.color}60` }} />
                            <span className="text-slate-300 text-sm flex-1">{item.label}</span>
                            <span className="text-white font-bold text-sm">{item.val}%</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─── Existing Block Renderers ─────────────────────────────────────────────────

function HeroBlock({ data, isFirst }: { data: any, isFirst?: boolean }) {
    const HeadingTag = isFirst ? 'h1' : 'h2';
    return (
        <section className="relative py-20 md:py-32 text-center overflow-hidden">
            <div className="absolute inset-0 -z-10" style={{ background: "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(0,212,255,0.1) 0%, transparent 70%)" }} />
            {data.badge && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-widest text-brand-400 border border-brand-500/30 bg-brand-500/10 mb-6 animate-fade-in">
                    {data.badge}
                </div>
            )}
            <HeadingTag className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-6 animate-slide-up leading-tight">
                {data.heading?.includes(" ") ? (
                    <>{data.heading.split(" ").slice(0, -1).join(" ")} <span className="text-gradient">{data.heading.split(" ").pop()}</span></>
                ) : (
                    <span className="text-gradient">{data.heading}</span>
                )}
            </HeadingTag>
            {data.subheading && <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in">{data.subheading}</p>}
            {data.ctaText && (
                <div className="flex items-center justify-center gap-4 animate-fade-in">
                    <Link href={data.ctaUrl || "/"} className="btn-primary px-6 py-3 text-sm">
                        {data.ctaText} <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            )}
        </section>
    );
}

function TextBlock({ data }: { data: any }) {
    return (
        <section className="py-12 max-w-3xl mx-auto">
            {data.heading && <h2 className="text-3xl font-bold text-white mb-6 tracking-tight">{data.heading}</h2>}
            <div>
                {data.body?.split("\n").map((line: string, i: number) => (
                    line.trim() ? <p key={i} className="text-slate-300 text-base leading-relaxed mb-4">{line}</p> : <div key={i} className="h-2" />
                ))}
            </div>
        </section>
    );
}

function TwoColBlock({ data }: { data: any }) {
    return (
        <section className="py-12">
            <div className="grid md:grid-cols-2 gap-10 items-start">
                <div>
                    {data.imageLeft && <div className="rounded-2xl overflow-hidden mb-6 border border-surface-border"><img src={data.imageLeft} alt={data.leftHeading || "Feature image"} className="w-full object-cover" /></div>}
                    {data.leftHeading && <h3 className="text-2xl font-bold text-white mb-3">{data.leftHeading}</h3>}
                    {data.leftBody && <p className="text-slate-400 leading-relaxed">{data.leftBody}</p>}
                </div>
                <div>
                    {data.imageRight && <div className="rounded-2xl overflow-hidden mb-6 border border-surface-border"><img src={data.imageRight} alt={data.rightHeading || "Feature image"} className="w-full object-cover" /></div>}
                    {data.rightHeading && <h3 className="text-2xl font-bold text-white mb-3">{data.rightHeading}</h3>}
                    {data.rightBody && <p className="text-slate-400 leading-relaxed">{data.rightBody}</p>}
                </div>
            </div>
        </section>
    );
}

function CtaBlock({ data }: { data: any }) {
    return (
        <section className="py-16">
            <div className="card p-10 md:p-14 text-center relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(0,212,255,0.06) 0%, rgba(0,153,204,0.04) 100%)", borderColor: "rgba(0,212,255,0.15)" }}>
                <div className="absolute inset-0 -z-10" style={{ background: "radial-gradient(ellipse 60% 80% at 50% 100%, rgba(0,212,255,0.06) 0%, transparent 60%)" }} />
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">{data.heading}</h2>
                {data.subtext && <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">{data.subtext}</p>}
                <div className="flex flex-wrap items-center justify-center gap-4">
                    {data.primaryBtnText && <Link href={data.primaryBtnUrl || "/"} className="btn-primary px-8 py-3">{data.primaryBtnText}</Link>}
                    {data.secondaryBtnText && <Link href={data.secondaryBtnUrl || "/"} className="btn-ghost px-8 py-3">{data.secondaryBtnText} <ExternalLink className="w-3.5 h-3.5" /></Link>}
                </div>
            </div>
        </section>
    );
}

function StatsBlock({ data }: { data: any }) {
    const stats = [
        { value: data.stat1Value, label: data.stat1Label },
        { value: data.stat2Value, label: data.stat2Label },
        { value: data.stat3Value, label: data.stat3Label },
    ].filter(s => s.value);
    return (
        <section className="py-12">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {stats.map((s, i) => (
                    <div key={i} className="card p-8 text-center border-l-2 border-l-brand-500 hover:border-brand-500/40 transition-all">
                        <div className="text-5xl font-bold text-gradient mb-2">{s.value}</div>
                        <div className="text-slate-400 font-medium text-sm uppercase tracking-widest">{s.label}</div>
                    </div>
                ))}
            </div>
        </section>
    );
}

function ImageBlock({ data }: { data: any }) {
    return (
        <section className="py-8">
            <figure className={data.fullWidth ? "w-full" : "max-w-3xl mx-auto"}>
                <div className="rounded-2xl overflow-hidden border border-surface-border shadow-[0_0_40px_rgba(0,212,255,0.08)]">
                    <img src={data.src} alt={data.alt || ""} className="w-full object-cover" loading="lazy" />
                </div>
                {data.caption && <figcaption className="text-slate-500 text-xs text-center mt-3 italic">{data.caption}</figcaption>}
            </figure>
        </section>
    );
}

function DividerBlock({ data }: { data: any }) {
    if (data.style === "dots") return <div className="py-8 flex justify-center gap-2">{[0, 1, 2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-700" />)}</div>;
    if (data.style === "gradient") return <div className="py-8"><div className="h-px bg-gradient-to-r from-transparent via-brand-500/40 to-transparent" /></div>;
    return <div className="py-8"><div className="h-px bg-surface-border" /></div>;
}

// ─── Video Hero Block ─────────────────────────────────────────────────────────
function VideoHeroBlock({ data }: { data: any }) {
    const embedUrl = data.videoUrl?.includes('youtube.com/watch')
        ? data.videoUrl.replace('watch?v=', 'embed/') + '?autoplay=1&mute=1&loop=1&controls=0&playlist=' + data.videoUrl.split('v=')[1]
        : data.videoUrl;
    return (
        <section className="relative py-0 overflow-hidden" style={{ minHeight: '520px' }}>
            <div className="absolute inset-0 z-0">
                {data.videoUrl ? (
                    <iframe src={embedUrl} className="w-full h-full absolute inset-0" allow="autoplay; muted" style={{ objectFit: 'cover', border: 0 }} />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#0A0A14] to-[#0E1628]" />
                )}
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(9,9,15,0.55) 0%, rgba(9,9,15,0.8) 100%)' }} />
            </div>
            <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 py-32" style={{ minHeight: '520px' }}>
                {data.badge && <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-widest text-brand-400 border border-brand-500/30 bg-brand-500/10 mb-6">{data.badge}</div>}
                <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-4 max-w-4xl">{data.heading}</h2>
                {data.subheading && <p className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto mb-8 leading-relaxed">{data.subheading}</p>}
                {data.btnText && <Link href={data.btnUrl || '/'} className="btn-primary px-8 py-3 text-base">{data.btnText}</Link>}
            </div>
        </section>
    );
}

// ─── Countdown Block ──────────────────────────────────────────────────────────
function CountdownBlock({ data }: { data: any }) {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    useEffect(() => {
        const target = new Date(data.targetDate || Date.now() + 7 * 86400000).getTime();
        const tick = () => {
            const diff = Math.max(0, target - Date.now());
            setTimeLeft({
                days: Math.floor(diff / 86400000),
                hours: Math.floor((diff % 86400000) / 3600000),
                minutes: Math.floor((diff % 3600000) / 60000),
                seconds: Math.floor((diff % 60000) / 1000),
            });
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [data.targetDate]);
    const units = [{ label: 'Days', value: timeLeft.days }, { label: 'Hours', value: timeLeft.hours }, { label: 'Minutes', value: timeLeft.minutes }, { label: 'Seconds', value: timeLeft.seconds }];
    return (
        <section className="py-20 px-4 text-center">
            {data.heading && <h2 className="text-3xl font-bold text-white mb-2">{data.heading}</h2>}
            {data.subheading && <p className="text-slate-400 mb-10">{data.subheading}</p>}
            <div className="flex items-center justify-center gap-4 md:gap-8 flex-wrap">
                {units.map(u => (
                    <div key={u.label} className="card p-6 min-w-[90px] text-center border-brand-500/20">
                        <div className="text-4xl md:text-5xl font-bold text-white tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>{String(u.value).padStart(2, '0')}</div>
                        <div className="text-xs text-slate-500 uppercase tracking-widest mt-2 font-bold">{u.label}</div>
                    </div>
                ))}
            </div>
            {data.label && <p className="text-slate-500 text-sm mt-8">{data.label}</p>}
        </section>
    );
}

// ─── Newsletter Block ─────────────────────────────────────────────────────────
function NewsletterBlock({ data }: { data: any }) {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    return (
        <section className="py-20 px-4">
            <div className="max-w-xl mx-auto card p-10 text-center" style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.05) 0%, rgba(0,153,204,0.03) 100%)', borderColor: 'rgba(0,212,255,0.15)' }}>
                {data.badge && <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-widest text-brand-400 border border-brand-500/30 bg-brand-500/10 mb-4">{data.badge}</div>}
                <h2 className="text-2xl font-bold text-white mb-2">{data.heading || 'Stay in the loop'}</h2>
                <p className="text-slate-400 mb-6 text-sm">{data.subheading || 'Get notified about new features and updates.'}</p>
                {submitted ? (
                    <div className="py-4 text-brand-400 font-semibold text-sm">{data.successMessage || "You're subscribed! 🎉"}</div>
                ) : (
                    <form onSubmit={e => { e.preventDefault(); setSubmitted(true); }} className="flex gap-2">
                        <input type="email" required placeholder={data.placeholder || 'Enter your email'} value={email} onChange={e => setEmail(e.target.value)} className="input flex-1" />
                        <button type="submit" className="btn-primary px-5 whitespace-nowrap">{data.btnText || 'Subscribe'}</button>
                    </form>
                )}
                {data.disclaimer && <p className="text-slate-600 text-xs mt-4">{data.disclaimer}</p>}
            </div>
        </section>
    );
}

// ─── Comparison Table Block ───────────────────────────────────────────────────
function ComparisonBlock({ data }: { data: any }) {
    const cols = [data.col1 || 'Basic', data.col2 || 'Pro', data.col3 || 'Enterprise'];
    const features = (data.features || 'Feature One,Feature Two,Feature Three').split(',').map((f: string) => f.trim()).filter(Boolean);
    const getVal = (fi: number, ci: number) => data[`f${fi + 1}c${ci + 1}`] || '';
    return (
        <section className="py-20 px-4">
            {data.heading && <div className="text-center mb-12"><h2 className="text-3xl font-bold text-white">{data.heading}</h2></div>}
            <div className="max-w-4xl mx-auto card overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-surface-border">
                            <th className="px-6 py-4 text-left text-slate-400 font-medium">Feature</th>
                            {cols.map((c, i) => <th key={i} className={`px-6 py-4 text-center font-bold ${i === 1 ? 'text-brand-400' : 'text-white'}`}>{c}</th>)}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                        {features.map((feature: string, fi: number) => (
                            <tr key={fi} className="hover:bg-surface-elevated/30 transition-colors">
                                <td className="px-6 py-4 text-slate-300">{feature}</td>
                                {[0, 1, 2].map(ci => {
                                    const val = getVal(fi, ci);
                                    return (
                                        <td key={ci} className="px-6 py-4 text-center">
                                            {val === 'true' || val === '✓' ? <span className="text-green-400 text-lg">✓</span>
                                                : val === 'false' || val === '✗' ? <span className="text-slate-600 text-lg">✗</span>
                                                : <span className="text-slate-300 text-xs">{val || '—'}</span>}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

// ─── Steps Block ──────────────────────────────────────────────────────────────
function StepsBlock({ data }: { data: any }) {
    const steps = (data._steps || [1, 2, 3, 4, 5].map(i => ({ title: data[`step${i}Title`], desc: data[`step${i}Desc`] }))).filter((s: any) => s.title);
    return (
        <section className="py-20 px-4 max-w-4xl mx-auto">
            {data.heading && <div className="text-center mb-12"><h2 className="text-3xl font-bold text-white mb-3">{data.heading}</h2>{data.subheading && <p className="text-slate-400">{data.subheading}</p>}</div>}
            <div className="relative">
                <div className="absolute left-[19px] top-0 bottom-0 w-px bg-gradient-to-b from-brand-500/60 via-brand-500/20 to-transparent md:hidden" />
                <div className="space-y-8">
                    {steps.map((step: any, i: number) => (
                        <div key={i} className="flex items-start gap-6 group">
                            <div className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center font-bold text-sm transition-all" style={{ background: 'rgba(0,212,255,0.12)', border: '2px solid rgba(0,212,255,0.35)', color: '#00D4FF' }}>{i + 1}</div>
                            <div className="card p-5 flex-1 group-hover:border-brand-500/30 transition-all">
                                <h3 className="text-white font-bold mb-1">{step.title}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─── Logo Cloud Block ─────────────────────────────────────────────────────────
function LogoCloudBlock({ data }: { data: any }) {
    const logos = (data._logos || [1, 2, 3, 4, 5, 6, 7, 8].map(i => ({ name: data[`logo${i}Name`], url: data[`logo${i}Url`] }))).filter((l: any) => l.name);
    return (
        <section className="py-16 px-4">
            {data.heading && <p className="text-center text-xs font-bold uppercase tracking-widest text-slate-500 mb-8">{data.heading}</p>}
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
                {logos.map((logo: any, i: number) => (
                    <div key={i} className="flex items-center justify-center opacity-40 hover:opacity-80 transition-opacity">
                        {logo.url ? <img src={logo.url} alt={logo.name} className="h-8 object-contain filter grayscale hover:grayscale-0 transition-all" /> : <span className="text-slate-400 font-bold text-lg tracking-tight">{logo.name}</span>}
                    </div>
                ))}
            </div>
        </section>
    );
}

// ─── Banner / Notification Block ──────────────────────────────────────────────
function BannerBlock({ data }: { data: any }) {
    const [dismissed, setDismissed] = useState(false);
    if (dismissed) return null;
    const colorMap: Record<string, { bg: string; border: string; text: string }> = {
        info: { bg: 'rgba(0,212,255,0.08)', border: 'rgba(0,212,255,0.25)', text: '#00D4FF' },
        warning: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', text: '#F59E0B' },
        success: { bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.25)', text: '#22C55E' },
        error: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', text: '#EF4444' },
    };
    const colors = colorMap[data.variant || 'info'];
    return (
        <section className="py-3 px-4">
            <div className="flex items-center gap-3 px-5 py-3 rounded-xl text-sm" style={{ background: colors.bg, border: `1px solid ${colors.border}` }}>
                {data.emoji && <span className="text-base shrink-0">{data.emoji}</span>}
                <p className="flex-1 text-slate-300">{data.text || 'Announcement text here.'}
                    {data.linkText && <Link href={data.linkUrl || '#'} className="ml-2 font-bold underline" style={{ color: colors.text }}>{data.linkText}</Link>}
                </p>
                {data.dismissible !== 'false' && <button onClick={() => setDismissed(true)} className="shrink-0 text-slate-500 hover:text-white transition-colors text-lg leading-none">×</button>}
            </div>
        </section>
    );
}

// ─── Gallery Block ────────────────────────────────────────────────────────────
function GalleryBlock({ data }: { data: any }) {
    const images = (data._imgs || [1, 2, 3, 4, 5, 6].map(i => ({ src: data[`img${i}Src`], alt: data[`img${i}Alt`] || '' }))).filter((img: any) => img.src);
    const cols = parseInt(data.columns || '3');
    return (
        <section className="py-12 px-4">
            {data.heading && <div className="text-center mb-8"><h2 className="text-2xl font-bold text-white">{data.heading}</h2></div>}
            <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                {images.map((img: any, i: number) => (
                    <div key={i} className="rounded-xl overflow-hidden border border-surface-border aspect-video bg-surface-card group hover:border-brand-500/30 transition-all">
                        <img src={img.src} alt={img.alt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    </div>
                ))}
            </div>
        </section>
    );
}

// ─── Map Embed Block ──────────────────────────────────────────────────────────
function MapEmbedBlock({ data }: { data: any }) {
    const src = data.embedUrl || `https://maps.google.com/maps?q=${encodeURIComponent(data.address || 'New York')}&output=embed`;
    return (
        <section className="py-12 px-4">
            {data.heading && <div className="text-center mb-6"><h2 className="text-2xl font-bold text-white">{data.heading}</h2></div>}
            <div className="rounded-2xl overflow-hidden border border-surface-border" style={{ height: data.height || '400px' }}>
                <iframe src={src} className="w-full h-full" style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)' }} loading="lazy" allowFullScreen />
            </div>
        </section>
    );
}

// ─── Contact Form Block ───────────────────────────────────────────────────────
function ContactFormBlock({ data }: { data: any }) {
    const [form, setForm] = useState<{ name: string; email: string; subject: string; message: string }>({ name: '', email: '', subject: '', message: '' });
    const [sent, setSent] = useState(false);
    return (
        <section className="py-20 px-4 max-w-2xl mx-auto">
            {data.heading && <div className="text-center mb-10"><h2 className="text-3xl font-bold text-white mb-2">{data.heading}</h2>{data.subheading && <p className="text-slate-400">{data.subheading}</p>}</div>}
            {sent ? (
                <div className="card p-10 text-center">
                    <div className="text-4xl mb-4">✅</div>
                    <h3 className="text-white font-bold text-lg">{data.successMessage || "Message sent!"}</h3>
                    <p className="text-slate-400 text-sm mt-2">We&apos;ll get back to you shortly.</p>
                </div>
            ) : (
                <form onSubmit={e => { e.preventDefault(); setSent(true); }} className="card p-8 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className="text-xs text-slate-400 font-medium block mb-1.5">Name</label><input required className="input w-full" placeholder="Jane Doe" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                        <div><label className="text-xs text-slate-400 font-medium block mb-1.5">Email</label><input required type="email" className="input w-full" placeholder="jane@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
                    </div>
                    {data.showSubject !== 'false' && <div><label className="text-xs text-slate-400 font-medium block mb-1.5">Subject</label><input className="input w-full" placeholder={data.subjectPlaceholder || 'How can we help?'} value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} /></div>}
                    <div><label className="text-xs text-slate-400 font-medium block mb-1.5">Message</label><textarea required className="input w-full resize-none" rows={5} placeholder={data.messagePlaceholder || 'Your message...'} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} /></div>
                    <button type="submit" className="btn-primary w-full">{data.btnText || 'Send Message'}</button>
                </form>
            )}
        </section>
    );
}

// ─── Timeline Block ───────────────────────────────────────────────────────────
function TimelineBlock({ data }: { data: any }) {
    const events = (data._events || [1, 2, 3, 4, 5, 6].map(i => ({ year: data[`ev${i}Year`], title: data[`ev${i}Title`], desc: data[`ev${i}Desc`] }))).filter((e: any) => e.title);
    return (
        <section className="py-20 px-4 max-w-4xl mx-auto">
            {data.heading && <div className="text-center mb-14"><h2 className="text-3xl font-bold text-white mb-2">{data.heading}</h2>{data.subheading && <p className="text-slate-400">{data.subheading}</p>}</div>}
            <div className="relative">
                <div className="absolute left-1/2 -translate-x-px top-0 bottom-0 w-px bg-gradient-to-b from-brand-500/60 via-brand-500/20 to-transparent hidden md:block" />
                <div className="space-y-12">
                    {events.map((ev: any, i: number) => (
                        <div key={i} className={`flex items-start gap-8 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                            <div className={`flex-1 card p-5 hover:border-brand-500/30 transition-all ${i % 2 === 0 ? 'md:text-right' : ''}`}>
                                {ev.year && <div className="text-brand-400 text-xs font-bold uppercase tracking-widest mb-1">{ev.year}</div>}
                                <h3 className="text-white font-bold mb-1">{ev.title}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">{ev.desc}</p>
                            </div>
                            <div className="w-4 h-4 rounded-full shrink-0 border-2 border-brand-500 bg-[#09090f] mt-5 hidden md:block" style={{ boxShadow: '0 0 12px rgba(0,212,255,0.4)' }} />
                            <div className="flex-1 hidden md:block" />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─── Code Block ───────────────────────────────────────────────────────────────
function CodeBlockSection({ data }: { data: any }) {
    const [copied, setCopied] = useState(false);
    const copy = () => { navigator.clipboard.writeText(data.code || ''); setCopied(true); setTimeout(() => setCopied(false), 2000); };
    return (
        <section className="py-12 px-4 max-w-4xl mx-auto">
            {data.heading && <h2 className="text-2xl font-bold text-white mb-4">{data.heading}</h2>}
            <div className="rounded-xl overflow-hidden border border-surface-border">
                <div className="flex items-center justify-between px-4 py-2.5 bg-[#0D0D14] border-b border-surface-border">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/70" /><div className="w-3 h-3 rounded-full bg-yellow-500/70" /><div className="w-3 h-3 rounded-full bg-green-500/70" />
                    </div>
                    {data.filename && <span className="text-xs text-slate-500 font-mono">{data.filename}</span>}
                    <button onClick={copy} className="text-xs text-slate-500 hover:text-white transition-colors">{copied ? '✓ Copied' : 'Copy'}</button>
                </div>
                <pre className="p-5 bg-[#09090f] overflow-x-auto text-sm leading-relaxed"><code className="text-slate-300 font-mono">{data.code || '// Your code here'}</code></pre>
            </div>
            {data.caption && <p className="text-slate-500 text-xs mt-3 text-center italic">{data.caption}</p>}
        </section>
    );
}

// ─── Progress Bars Block ──────────────────────────────────────────────────────
function ProgressBarsBlock({ data }: { data: any }) {
    const bars = (data._bars || [1, 2, 3, 4, 5].map(i => ({ label: data[`bar${i}Label`], value: parseInt(data[`bar${i}Value`] || '0') }))).filter((b: any) => b.label);
    return (
        <section className="py-16 px-4 max-w-2xl mx-auto">
            {data.heading && <div className="text-center mb-10"><h2 className="text-2xl font-bold text-white">{data.heading}</h2></div>}
            <div className="space-y-6">
                {bars.map((bar: any, i: number) => (
                    <div key={i}>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-white font-medium">{bar.label}</span>
                            <span className="text-brand-400 font-bold">{bar.value}%</span>
                        </div>
                        <div className="h-2 bg-surface-elevated rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${bar.value}%`, background: 'linear-gradient(90deg, #00D4FF 0%, #0099CC 100%)', boxShadow: '0 0 8px rgba(0,212,255,0.4)' }} />
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

// ─── Icon Cards Block ─────────────────────────────────────────────────────────
function IconCardsBlock({ data }: { data: any }) {
    const cards = (data._cards || [1, 2, 3, 4, 5, 6].map(i => ({ emoji: data[`card${i}Emoji`], title: data[`card${i}Title`], desc: data[`card${i}Desc`] }))).filter((c: any) => c.title);
    return (
        <section className="py-20 px-4">
            {data.heading && <div className="text-center mb-12"><h2 className="text-3xl font-bold text-white mb-3">{data.heading}</h2>{data.subheading && <p className="text-slate-400">{data.subheading}</p>}</div>}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
                {cards.map((card: any, i: number) => (
                    <div key={i} className="card p-7 group hover:border-brand-500/30 hover:shadow-[0_0_30px_rgba(0,212,255,0.06)] transition-all">
                        {card.emoji && <div className="text-3xl mb-4 group-hover:scale-110 transition-transform inline-block">{card.emoji}</div>}
                        <h3 className="text-white font-bold text-lg mb-2">{card.title}</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">{card.desc}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}

// ─── Social Proof / Trust Badges Block ────────────────────────────────────────
function SocialProofBlock({ data }: { data: any }) {
    const badges = (data._badges || [1, 2, 3, 4].map(i => ({ label: data[`badge${i}Label`], value: data[`badge${i}Value`], emoji: data[`badge${i}Emoji`] }))).filter((b: any) => b.label);
    return (
        <section className="py-14 px-4">
            {data.heading && <p className="text-center text-slate-500 text-xs uppercase tracking-widest font-bold mb-8">{data.heading}</p>}
            <div className="flex flex-wrap items-center justify-center gap-6 max-w-4xl mx-auto">
                {badges.map((badge: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 px-5 py-3 rounded-2xl card hover:border-brand-500/25 transition-all">
                        {badge.emoji && <span className="text-2xl">{badge.emoji}</span>}
                        <div>
                            <div className="text-white font-bold text-lg leading-tight">{badge.value}</div>
                            <div className="text-slate-500 text-xs">{badge.label}</div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

// ─── Embed / iFrame Block ─────────────────────────────────────────────────────
function EmbedBlock({ data }: { data: any }) {
    return (
        <section className="py-8 px-4">
            {data.heading && <h2 className="text-xl font-bold text-white mb-4 text-center">{data.heading}</h2>}
            <div className="rounded-xl overflow-hidden border border-surface-border" style={{ height: data.height || '500px' }}>
                <iframe
                    src={data.url}
                    className="w-full h-full"
                    style={{ border: 0 }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                />
            </div>
        </section>
    );
}

// ─── Number Counter Block ─────────────────────────────────────────────────────
function NumberCounterBlock({ data }: { data: any }) {
    const counters = (data._counters || [1, 2, 3, 4].map(i => ({ value: data[`num${i}Value`], label: data[`num${i}Label`], prefix: data[`num${i}Prefix`] || '', suffix: data[`num${i}Suffix`] || '' }))).filter((c: any) => c.value);
    return (
        <section className="py-20 px-4">
            {data.heading && <div className="text-center mb-10"><h2 className="text-3xl font-bold text-white">{data.heading}</h2></div>}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
                {counters.map((c: any, i: number) => (
                    <div key={i} className="text-center card p-8 group hover:border-brand-500/30 transition-all">
                        <div className="text-4xl md:text-5xl font-bold text-gradient mb-2">{c.prefix}{c.value}{c.suffix}</div>
                        <div className="text-slate-400 text-sm font-medium">{c.label}</div>
                    </div>
                ))}
            </div>
        </section>
    );
}

// ─── Data Table Block ─────────────────────────────────────────────────────────
function DataTableBlock({ data }: { data: any }) {
    const headers = (data.headers || 'Column 1,Column 2,Column 3').split(',').map((h: string) => h.trim());
    const rows = (data.rows || '').split('\n').map((r: string) => r.split(',').map((c: string) => c.trim())).filter((r: string[]) => r.some(c => c));
    return (
        <section className="py-12 px-4">
            {data.heading && <div className="text-center mb-8"><h2 className="text-2xl font-bold text-white">{data.heading}</h2></div>}
            <div className="max-w-5xl mx-auto card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead><tr className="bg-surface-elevated border-b border-surface-border">{headers.map((h: string, i: number) => <th key={i} className="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>)}</tr></thead>
                        <tbody className="divide-y divide-surface-border">{rows.map((row: string[], ri: number) => <tr key={ri} className="hover:bg-surface-elevated/30 transition-colors">{headers.map((_: string, ci: number) => <td key={ci} className="px-5 py-3 text-slate-300">{row[ci] || '—'}</td>)}</tr>)}</tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}

// ─── Accordion Block ──────────────────────────────────────────────────────────
function AccordionBlock({ data }: { data: any }) {
    const [open, setOpen] = useState<number | null>(null);
    const items = (data._items || [1, 2, 3, 4, 5].map(i => ({ q: data[`q${i}`], a: data[`a${i}`] }))).filter((item: any) => item.q);
    return (
        <section className="py-16 px-4 max-w-3xl mx-auto">
            {data.heading && <div className="text-center mb-10"><h2 className="text-2xl font-bold text-white">{data.heading}</h2></div>}
            <div className="space-y-2">
                {items.map((item: any, i: number) => (
                    <div key={i} className="card overflow-hidden border-white/5">
                        <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between px-6 py-4 text-left text-white font-medium hover:text-brand-400 transition-colors">
                            <span>{item.q}</span>
                            <span className={`text-slate-500 text-xl transition-transform duration-200 ${open === i ? 'rotate-45' : ''}`}>+</span>
                        </button>
                        {open === i && <div className="px-6 pb-5 text-slate-400 text-sm leading-relaxed animate-fade-in border-t border-surface-border pt-4">{item.a}</div>}
                    </div>
                ))}
            </div>
        </section>
    );
}

// ─── Breadcrumb Block ─────────────────────────────────────────────────────────
function BreadcrumbBlock({ data }: { data: any }) {
    const items = (data.items || 'Home,/;About,/about').split(';').map((seg: string) => { const [label, href] = seg.split(','); return { label: label?.trim(), href: href?.trim() || '#' }; }).filter((item: { label?: string; href: string }) => item.label);
    return (
        <nav className="py-4 px-4 max-w-5xl mx-auto">
            <ol className="flex items-center gap-2 text-sm flex-wrap">
                {items.map((item: { label: string; href: string }, i: number) => (
                    <li key={i} className="flex items-center gap-2">
                        {i > 0 && <span className="text-slate-600">/</span>}
                        {i === items.length - 1 ? (
                            <span className="text-white font-medium">{item.label}</span>
                        ) : (
                            <Link href={item.href} className="text-slate-500 hover:text-brand-400 transition-colors">{item.label}</Link>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
}

// ─── Quote / Pullquote Block ──────────────────────────────────────────────────
function QuoteBlock({ data }: { data: any }) {
    return (
        <section className="py-16 px-4 max-w-3xl mx-auto">
            <blockquote className="card p-10 relative overflow-hidden" style={{ borderColor: 'rgba(0,212,255,0.2)', background: 'rgba(0,212,255,0.03)' }}>
                <div className="absolute top-4 left-6 text-7xl font-serif text-brand-500/10 leading-none select-none">&ldquo;</div>
                <p className="text-xl md:text-2xl text-white font-medium italic leading-relaxed relative z-10 mb-6">{data.quote || 'An inspiring quote goes here.'}</p>
                {(data.author || data.role) && (
                    <footer className="flex items-center gap-3">
                        {data.avatar && <img src={data.avatar} alt={data.author} className="w-10 h-10 rounded-full object-cover border border-surface-border" />}
                        <div>
                            {data.author && <div className="text-white font-semibold text-sm">{data.author}</div>}
                            {data.role && <div className="text-slate-500 text-xs">{data.role}</div>}
                        </div>
                    </footer>
                )}
            </blockquote>
        </section>
    );
}

// ─── Feature Highlight Block ──────────────────────────────────────────────────
function FeatureHighlightBlock({ data }: { data: any }) {
    const features = (data._features || [1, 2, 3].map(i => ({ icon: data[`feat${i}Icon`], title: data[`feat${i}Title`], desc: data[`feat${i}Desc`] }))).filter((f: any) => f.title);
    const reversed = data.reverse === 'true';
    return (
        <section className="py-20 px-4">
            <div className={`max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center ${reversed ? 'lg:[direction:rtl]' : ''}`}>
                <div className={reversed ? '[direction:ltr]' : ''}>
                    {data.badge && <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold text-brand-400 border border-brand-500/30 bg-brand-500/10 mb-5">{data.badge}</div>}
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">{data.heading}</h2>
                    {data.subheading && <p className="text-slate-400 leading-relaxed mb-8">{data.subheading}</p>}
                    <div className="space-y-5">
                        {features.map((f: any, i: number) => (
                            <div key={i} className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-lg" style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>{f.icon || '✦'}</div>
                                <div><h4 className="text-white font-bold mb-1">{f.title}</h4><p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p></div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className={reversed ? '[direction:ltr]' : ''}>
                    {data.image ? (
                        <div className="rounded-2xl overflow-hidden border border-surface-border shadow-[0_0_60px_rgba(0,212,255,0.06)]">
                            <img src={data.image} alt={data.heading} className="w-full object-cover" />
                        </div>
                    ) : (
                        <div className="rounded-2xl aspect-video card flex items-center justify-center text-slate-700 text-sm">Add an image URL in the editor</div>
                    )}
                </div>
            </div>
        </section>
    );
}

// ─── Startup Hero Block ────────────────────────────────────────────────────────
function StartupHeroBlock({ data, isFirst }: { data: any, isFirst?: boolean }) {
    const avatars = (data.avatars || "").split(",").filter(Boolean);
    const HeadingTag = isFirst ? 'h1' : 'h2';
    return (
        <section className="relative py-20 text-center flex flex-col items-center">
            {data.image && (
                <div className="relative z-10 w-full max-w-2xl mx-auto -mb-16 md:-mb-24 flex justify-center">
                    <img src={data.image} alt={data.heading || "Hero"} className="max-w-full h-auto object-contain drop-shadow-2xl" style={{ maxHeight: '400px' }} />
                </div>
            )}
            <div className="relative z-20 w-full max-w-4xl mx-auto bg-white dark:bg-transparent pt-16 md:pt-24 pb-8" style={{ maskImage: 'linear-gradient(to bottom, transparent, black 15%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 25%)' }}>
                <HeadingTag className="text-5xl md:text-7xl font-bold tracking-tight mb-8 text-slate-900 dark:text-white leading-tight">
                    {data.heading}
                </HeadingTag>
                <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
                    {data.primaryBtnText && (
                        <Link href={data.primaryBtnUrl || "/"} className="bg-black text-white hover:bg-slate-800 dark:bg-brand-500 dark:text-[#09090E] dark:hover:bg-brand-400 px-8 py-3 rounded-full font-medium transition-colors">
                            {data.primaryBtnText}
                        </Link>
                    )}
                    {data.secondaryBtnText && (
                        <Link href={data.secondaryBtnUrl || "/"} className="bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 dark:bg-[#09090E] dark:text-white dark:border-white/10 dark:hover:bg-white/5 px-8 py-3 rounded-full font-medium transition-colors">
                            {data.secondaryBtnText}
                        </Link>
                    )}
                </div>
                {data.trustedText && (
                    <div className="flex items-center justify-center gap-3">
                        <div className="flex -space-x-3">
                            {avatars.map((avatar: string, i: number) => (
                                <img key={i} src={avatar.trim()} className="w-8 h-8 rounded-full border-2 border-white dark:border-[#09090E] object-cover" alt="Avatar" />
                            ))}
                        </div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            {data.trustedText}
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}

// ─── Startup Team Block ───────────────────────────────────────────────────────
function StartupTeamBlock({ data }: { data: any }) {
    const members = (data._members || [1, 2, 3, 4, 5, 6, 7, 8].map(i => ({ 
        name: data[`m${i}Name`], 
        role: data[`m${i}Role`], 
        photo: data[`m${i}Photo`] 
    }))).filter((m: any) => m.name);
    return (
        <section className="py-20 px-4">
            {data.subtext && <div className="text-center mb-6"><span className="px-5 py-1.5 rounded-full border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-600 dark:text-slate-400">{data.subtext}</span></div>}
            {data.heading && <h2 className="text-center text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-12">{data.heading}</h2>}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                {members.map((m: any, i: number) => (
                    <div key={i} className="relative rounded-3xl overflow-hidden aspect-[4/5] group w-full border border-slate-200 dark:border-white/5 shadow-sm">
                        {m.photo ? (
                            <img src={m.photo} alt={m.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        ) : (
                            <div className="absolute inset-0 bg-slate-100 dark:bg-surface-elevated" />
                        )}
                        <div className="absolute inset-x-3 bottom-3 bg-white/95 dark:bg-[#0D0D14]/90 backdrop-blur-md rounded-2xl p-4 text-center border border-slate-100 dark:border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-none transition-transform duration-300 group-hover:-translate-y-1">
                            <h4 className="font-bold text-slate-900 dark:text-white text-base leading-tight">{m.name}</h4>
                            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">{m.role}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

// ─── Split FAQ Block ──────────────────────────────────────────────────────────
function SplitFaqBlock({ data }: { data: any }) {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const faqs = (data._faqs || [1, 2, 3, 4, 5].map(i => ({
        q: data[`q${i}`],
        a: data[`a${i}`]
    }))).filter((f: any) => f.q);

    return (
        <section className="py-24 px-4">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-12 lg:gap-20 items-start">
                <div>
                    <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white leading-tight md:sticky md:top-24">
                        {data.heading}
                    </h2>
                </div>
                <div className="space-y-4">
                    {faqs.map((faq: any, i: number) => (
                        <div key={i} className="border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden bg-white dark:bg-surface-card shadow-sm hover:shadow-md transition-shadow">
                            <button 
                                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                className="w-full text-left px-6 py-5 flex items-center justify-between font-semibold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                            >
                                <span className="pr-8 text-lg">{faq.q}</span>
                                <ChevronDown className={`w-5 h-5 shrink-0 text-slate-400 transition-transform duration-300 ${openIndex === i ? "rotate-180" : ""}`} />
                            </button>
                            <div className={`px-6 text-slate-600 dark:text-slate-400 text-base leading-relaxed transition-all duration-300 overflow-hidden ${openIndex === i ? "max-h-96 pb-6 opacity-100" : "max-h-0 opacity-0"}`}>
                                {faq.a}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export function RenderBlock({ block, pageSlug, isFirst }: { block: { id: string; type: string; data: any }; pageSlug: string; isFirst?: boolean }) {
    switch (block.type) {
        case "startup_hero": return <StartupHeroBlock data={block.data} isFirst={isFirst} />;
        case "startup_team": return <StartupTeamBlock data={block.data} />;
        case "split_faq": return <SplitFaqBlock data={block.data} />;
        case "hero": return <HeroBlock data={block.data} isFirst={isFirst} />;
        case "ribbon": return <RibbonBlock data={block.data} />;
        case "marquee_ticker": return <MarqueeTickerBlock data={block.data} />;
        case "login": return <LoginBlock data={block.data} />;
        case "grid_features": return <GridFeaturesBlock data={block.data} />;
        case "faq": return <FAQBlock data={block.data} />;
        case "pricing": return <PricingBlock data={block.data} />;
        case "testimonials": return <TestimonialsBlock data={block.data} />;
        case "team": return <TeamBlock data={block.data} />;
        case "bug_chart": return <BugChartBlock data={block.data} />;
        case "booking": return <BookingBlock data={block.data} pageSlug={pageSlug} />;
        case "text": return <TextBlock data={block.data} />;
        case "two_col": return <TwoColBlock data={block.data} />;
        case "cta": return <CtaBlock data={block.data} />;
        case "stats": return <StatsBlock data={block.data} />;
        case "image": return <ImageBlock data={block.data} />;
        case "divider": return <DividerBlock data={block.data} />;
        case "video_hero": return <VideoHeroBlock data={block.data} />;
        case "countdown": return <CountdownBlock data={block.data} />;
        case "newsletter": return <NewsletterBlock data={block.data} />;
        case "comparison": return <ComparisonBlock data={block.data} />;
        case "steps": return <StepsBlock data={block.data} />;
        case "logo_cloud": return <LogoCloudBlock data={block.data} />;
        case "banner": return <BannerBlock data={block.data} />;
        case "gallery": return <GalleryBlock data={block.data} />;
        case "map_embed": return <MapEmbedBlock data={block.data} />;
        case "contact_form": return <ContactFormBlock data={block.data} />;
        case "timeline": return <TimelineBlock data={block.data} />;
        case "code_block": return <CodeBlockSection data={block.data} />;
        case "progress_bars": return <ProgressBarsBlock data={block.data} />;
        case "icon_cards": return <IconCardsBlock data={block.data} />;
        case "social_proof": return <SocialProofBlock data={block.data} />;
        case "embed": return <EmbedBlock data={block.data} />;
        case "number_counter": return <NumberCounterBlock data={block.data} />;
        case "data_table": return <DataTableBlock data={block.data} />;
        case "accordion": return <AccordionBlock data={block.data} />;
        case "breadcrumb": return <BreadcrumbBlock data={block.data} />;
        case "quote": return <QuoteBlock data={block.data} />;
        case "feature_highlight": return <FeatureHighlightBlock data={block.data} />;
        default: return null;
    }
}

export function PublicPageContent({ slug }: { slug: string }) {
    const page = useQuery(api.pages.getBySlug, { slug });


    if (page === undefined) {
        return (
        <div className="min-h-screen relative overflow-x-hidden">
            <div className="fixed inset-0 grid-bg pointer-events-none opacity-50" />
            <Navbar />
                <div className="max-w-5xl mx-auto px-4 py-32 flex flex-col items-center gap-4">
                    <div className="skeleton w-64 h-10 rounded-lg" />
                    <div className="skeleton w-full max-w-2xl h-4 rounded" />
                    <div className="skeleton w-3/4 max-w-xl h-4 rounded" />
                </div>
            </div>
        );
    }

    if (!page || !page.isPublished) {
        return (
        <div className="min-h-screen relative overflow-x-hidden">
            <div className="fixed inset-0 grid-bg pointer-events-none opacity-50" />
            <Navbar />
                <div className="max-w-5xl mx-auto px-4 py-32 text-center flex flex-col items-center justify-center">
                    <img src="/404-logo.png" alt="BugScribe 404 Logo" className="w-[300px] h-auto mb-6 object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500" />
                    <h1 className="text-3xl font-bold text-white mb-2">Oops! Page Not Found</h1>
                    <p className="text-slate-400 mb-8 max-w-lg mx-auto leading-relaxed">This page doesn&apos;t exist, might have been moved, or hasn&apos;t been published yet.</p>
                    <Link href="/" className="btn-primary inline-flex">Return Home</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-x-hidden">
            <div className="fixed inset-0 grid-bg pointer-events-none opacity-50" />
            <Navbar />
            <main className="max-w-5xl mx-auto px-4 pt-32 pb-20" aria-label={`${page.title} content`}>
                {page.blocks.map((block: any, index: number) => (
                    <RenderBlock key={block.id} block={block} pageSlug={page.slug} isFirst={index === 0} />
                ))}
            </main>
            <Footer />
        </div>
    );
}

export default function PublicPage() {
    const params = useParams();
    const slug = Array.isArray(params?.slug) ? params.slug.join("/") : (typeof params?.slug === "string" ? params.slug : "");
    return <PublicPageContent slug={slug} />;
}
