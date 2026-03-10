"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bug, ShieldAlert, Zap } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

function NavbarContent() {
    const [devToken, setDevToken] = useState<string | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem("bugscribe_dev_token");
        setDevToken(stored);
    }, []);

    const user = useQuery(api.users.currentUser, { devToken: devToken || undefined });
    const isSuperAdmin = user?.role === "super_admin";

    return (
        <nav
            className="h-14 sticky top-0 z-50"
            style={{
                borderBottom: '1px solid rgba(30, 30, 46, 0.8)',
                backdropFilter: 'blur(20px) saturate(1.5)',
                WebkitBackdropFilter: 'blur(20px) saturate(1.5)',
                background: 'rgba(9, 9, 14, 0.85)',
            }}
        >
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-400/50 to-transparent" />

            <div className="max-w-[1600px] mx-auto px-4 h-full flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2.5 group">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center relative overflow-hidden"
                        style={{
                            background: 'linear-gradient(135deg, #00D4FF 0%, #0099CC 100%)',
                            boxShadow: '0 0 16px rgba(0, 212, 255, 0.3)',
                        }}>
                        <Bug className="w-4 h-4 text-[#09090E]" />
                    </div>
                    <span className="font-bold text-white text-lg tracking-tight">
                        Bug<span className="text-gradient">Scribe</span>
                    </span>
                </Link>

                <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center gap-2">
                        <Link
                            href="/"
                            className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-md hover:bg-surface-hover transition-all font-medium"
                        >
                            Projects
                        </Link>

                        {isSuperAdmin && (
                            <Link
                                href="/admin"
                                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md transition-all"
                                style={{
                                    color: '#00D4FF',
                                    background: 'rgba(0, 212, 255, 0.08)',
                                    border: '1px solid rgba(0, 212, 255, 0.2)',
                                }}
                            >
                                <ShieldAlert className="w-3.5 h-3.5" />
                                Admin
                            </Link>
                        )}

                        <a
                            href="/widget-demo.html"
                            target="_blank"
                            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md text-slate-400 hover:text-white transition-all"
                            style={{ border: '1px solid #1E1E2E' }}
                        >
                            <Zap className="w-3 h-3" />
                            Demo
                        </a>

                        <div className="w-px h-5 bg-surface-border mx-1" />
                    </div>

                    {user ? (
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs text-white font-semibold leading-tight">{user.name || user.email}</p>
                                <p className="text-[10px] font-medium"
                                    style={{ color: isSuperAdmin ? '#00D4FF' : '#4B5563' }}>
                                    {user.role === 'super_admin' ? '★ Super Admin' : 'Member'}
                                </p>
                            </div>
                            <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.2) 0%, rgba(0, 153, 204, 0.2) 100%)',
                                    border: '1px solid rgba(0, 212, 255, 0.3)',
                                    color: '#00D4FF',
                                }}
                            >
                                {(user.name || user.email || "U")[0].toUpperCase()}
                            </div>
                            <button
                                onClick={() => {
                                    localStorage.removeItem("bugscribe_dev_token");
                                    window.location.href = "/";
                                }}
                                className="text-xs text-slate-500 hover:text-red-400 px-2 py-1 rounded transition-colors font-medium border border-surface-border bg-surface-elevated sm:border-transparent sm:bg-transparent"
                            >
                                Log Out
                            </button>
                        </div>
                    ) : (
                        <Link href="/" className="btn-primary text-xs shrink-0">
                            Log In
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
}

export function Navbar() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    if (!mounted) {
        return (
            <nav
                className="h-14 sticky top-0 z-50 transition-all duration-300"
                style={{
                    borderBottom: '1px solid rgba(30, 30, 46, 0.8)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    background: 'rgba(9, 9, 14, 0.85)',
                }}
            >
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-400/30 to-transparent" />
                <div className="max-w-[1600px] mx-auto px-4 h-full flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg" style={{ background: 'linear-gradient(135deg, #00D4FF 0%, #0099CC 100%)' }} />
                        <span className="font-bold text-white text-lg tracking-tight">
                            Bug<span className="text-gradient">Scribe</span>
                        </span>
                    </div>
                </div>
            </nav>
        );
    }

    return <NavbarContent />;
}
