"use client";

import React from "react";
import Link from "next/link";
import { Bug, Twitter, Facebook, Instagram, Linkedin, Youtube, Github } from "lucide-react";
import { useAppContext } from "@/contexts/AppContext";

type FooterLink = { label: string; path: string; subLinks?: { label: string; path: string }[] };

const SOCIAL_ICONS: Record<string, React.ElementType> = {
    twitter: Twitter,
    facebook: Facebook,
    instagram: Instagram,
    linkedin: Linkedin,
    youtube: Youtube,
    github: Github,
};

export function Footer() {
    // ── All settings from shared context (one subscription for the whole app) ──
    const { settings } = useAppContext();

    const footerLinksRaw  = settings["nav_footer_links"];
    const footerTitle     = settings["nav_footer_title"] as string | undefined;
    const footerDesc      = settings["footer_description"] as string | undefined;
    const copyright       = settings["footer_copyright"] as string | undefined;
    const siteName        = settings["site_name"] as string | undefined;
    const socialRaw       = settings["social_media"] as Record<string, string> | undefined;

    const footerLinks: FooterLink[] = Array.isArray(footerLinksRaw)
        ? (footerLinksRaw as FooterLink[]).filter(l => l.label)
        : [];

    const year          = new Date().getFullYear();
    const brandName     = siteName || "BugScribe";
    const description   = footerDesc || "Visual bug tracking and feedback tool for modern development teams.";
    const copyrightText = (copyright || `© ${year} All Rights Reserved. ${brandName}`)
        .replace("{year}", String(year))
        .replace("@{year}", String(year));

    const hasSocial = socialRaw && Object.entries(socialRaw).some(([, v]) => v);
    const hasLinks  = footerLinks.length > 0;

    return (
        <footer className="border-t border-surface-border bg-[#09090f]/90 backdrop-blur-sm mt-auto">
            <div className="max-w-7xl mx-auto px-4 py-12">

                {/* Main columns */}
                <div className={`grid gap-10 mb-10 ${hasLinks ? "grid-cols-1 md:grid-cols-[1fr_auto]" : "grid-cols-1"}`}>

                    {/* ── Brand column ── */}
                    <div className="max-w-xs">
                        <Link href="/" className="flex items-center gap-2.5 mb-4 group w-fit">
                            <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                style={{
                                    background: "linear-gradient(135deg, #00D4FF 0%, #0099CC 100%)",
                                    boxShadow: "0 0 16px rgba(0,212,255,0.3)",
                                }}
                            >
                                <Bug className="w-4 h-4 text-[#09090E]" />
                            </div>
                            <span className="font-bold text-white text-[15px] tracking-tight">
                                {brandName}
                            </span>
                        </Link>

                        <p className="text-slate-500 text-sm leading-relaxed">{description}</p>

                        {/* Social icons — only when configured */}
                        {hasSocial && (
                            <div className="flex items-center gap-2.5 mt-5 flex-wrap">
                                {Object.entries(socialRaw!).filter(([, url]) => url).map(([key, url]) => {
                                    const Icon = SOCIAL_ICONS[key.toLowerCase()];
                                    if (!Icon) return null;
                                    return (
                                        <a
                                            key={key}
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-8 h-8 rounded-lg border border-surface-border flex items-center justify-center text-slate-500 hover:text-brand-400 hover:border-brand-500/30 transition-all"
                                            aria-label={key}
                                        >
                                            <Icon className="w-3.5 h-3.5" />
                                        </a>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* ── Dynamic footer links — only rendered when links exist ── */}
                    {hasLinks && (
                        <div className="min-w-[160px]">
                            {footerTitle && (
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">
                                    {footerTitle}
                                </p>
                            )}
                            <ul className="space-y-2.5">
                                {footerLinks.map((link, i) => (
                                    <li key={i}>
                                        <Link
                                            href={link.path}
                                            className="text-sm text-slate-400 hover:text-white transition-colors"
                                        >
                                            {link.label}
                                        </Link>
                                        {/* Sub-links */}
                                        {link.subLinks && link.subLinks.length > 0 && (
                                            <ul className="mt-1.5 pl-3 space-y-1.5 border-l border-surface-border">
                                                {link.subLinks.map((sub, si) => (
                                                    <li key={si}>
                                                        <Link
                                                            href={sub.path}
                                                            className="text-xs text-slate-600 hover:text-slate-300 transition-colors"
                                                        >
                                                            {sub.label}
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* ── Bottom bar ── */}
                <div className="border-t border-surface-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-xs text-slate-600">{copyrightText}</p>
                    <p className="text-xs text-slate-700">
                        Built with <span className="text-brand-500/70">BugScribe</span>
                    </p>
                </div>
            </div>
        </footer>
    );
}
