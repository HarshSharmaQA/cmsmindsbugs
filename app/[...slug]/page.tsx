"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Navbar } from "@/components/Navbar";
import BookingBlock from "@/components/BookingWidget";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowRight, ExternalLink } from "lucide-react";

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

// ─── Team Section Block ───────────────────────────────────────────────────────

function TeamBlock({ data }: { data: any }) {
    const members = [1, 2, 3, 4, 5, 6]
        .map(n => ({ name: data[`member${n}Name`], role: data[`member${n}Role`], photo: data[`member${n}Photo`] }))
        .filter(m => m.name);

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
                {members.map((member, i) => (
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

function HeroBlock({ data }: { data: any }) {
    return (
        <section className="relative py-20 md:py-32 text-center overflow-hidden">
            <div className="absolute inset-0 -z-10" style={{ background: "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(0,212,255,0.1) 0%, transparent 70%)" }} />
            {data.badge && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-widest text-brand-400 border border-brand-500/30 bg-brand-500/10 mb-6 animate-fade-in">
                    {data.badge}
                </div>
            )}
            <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-6 animate-slide-up leading-tight">
                {data.heading?.includes(" ") ? (
                    <>{data.heading.split(" ").slice(0, -1).join(" ")} <span className="text-gradient">{data.heading.split(" ").pop()}</span></>
                ) : (
                    <span className="text-gradient">{data.heading}</span>
                )}
            </h1>
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
                    {data.imageLeft && <div className="rounded-2xl overflow-hidden mb-6 border border-surface-border"><img src={data.imageLeft} alt="" className="w-full object-cover" /></div>}
                    {data.leftHeading && <h3 className="text-2xl font-bold text-white mb-3">{data.leftHeading}</h3>}
                    {data.leftBody && <p className="text-slate-400 leading-relaxed">{data.leftBody}</p>}
                </div>
                <div>
                    {data.imageRight && <div className="rounded-2xl overflow-hidden mb-6 border border-surface-border"><img src={data.imageRight} alt="" className="w-full object-cover" /></div>}
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

export function RenderBlock({ block, pageSlug }: { block: { id: string; type: string; data: any }; pageSlug: string }) {
    switch (block.type) {
        case "hero": return <HeroBlock data={block.data} />;
        case "ribbon": return <RibbonBlock data={block.data} />;
        case "team": return <TeamBlock data={block.data} />;
        case "bug_chart": return <BugChartBlock data={block.data} />;
        case "booking": return <BookingBlock data={block.data} pageSlug={pageSlug} />;
        case "text": return <TextBlock data={block.data} />;
        case "two_col": return <TwoColBlock data={block.data} />;
        case "cta": return <CtaBlock data={block.data} />;
        case "stats": return <StatsBlock data={block.data} />;
        case "image": return <ImageBlock data={block.data} />;
        case "divider": return <DividerBlock data={block.data} />;
        default: return null;
    }
}

export function PublicPageContent({ slug }: { slug: string }) {
    const page = useQuery(api.pages.getBySlug, { slug });

    if (page === undefined) {
        return (
            <div className="min-h-screen"><Navbar />
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
            <div className="min-h-screen"><Navbar />
                <div className="max-w-5xl mx-auto px-4 py-32 text-center">
                    <div className="text-7xl font-bold text-gradient mb-4">404</div>
                    <h1 className="text-2xl font-bold text-white mb-2">Page Not Found</h1>
                    <p className="text-slate-400 mb-8">This page doesn't exist or hasn't been published yet.</p>
                    <Link href="/" className="btn-primary inline-flex">Go Home</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            {page.metaDescription && (
                <>
                    <title>{page.title} | BugScribe</title>
                    <meta name="description" content={page.metaDescription} />
                    <meta property="og:title" content={`${page.title} | BugScribe`} />
                    <meta property="og:description" content={page.metaDescription} />
                </>
            )}
            <Navbar />
            <main className="max-w-5xl mx-auto px-4 pb-20">
                {page.blocks.map((block: any) => (
                    <RenderBlock key={block.id} block={block} pageSlug={page.slug} />
                ))}
            </main>
            <div className="border-t border-surface-border py-6 text-center">
                <p className="text-slate-600 text-xs">
                    Powered by <Link href="/" className="text-brand-400 hover:text-brand-300 transition-colors font-semibold">BugScribe</Link>
                </p>
            </div>
        </div>
    );
}

export default function PublicPage() {
    const params = useParams();
    const slug = Array.isArray(params?.slug) ? params.slug.join("/") : (typeof params?.slug === "string" ? params.slug : "");
    return <PublicPageContent slug={slug} />;
}
