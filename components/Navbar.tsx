"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bug, ShieldAlert } from "lucide-react";
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
        <nav className="h-14 border-b border-surface-border glass sticky top-0 z-50">
            <div className="max-w-[1600px] mx-auto px-4 h-full flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2.5 group">
                    <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center
                          group-hover:bg-brand-400 transition-colors">
                        <Bug className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-white text-lg tracking-tight">
                        Bug<span className="text-gradient">Scribe</span>
                    </span>
                </Link>

                <div className="flex items-center gap-4">
                    <Link href="/" className="btn-ghost text-xs">
                        Projects
                    </Link>
                    {isSuperAdmin && (
                        <Link href="/admin" className="btn-ghost text-xs text-brand-400 flex items-center gap-1.5 border border-brand-500/20 px-3 py-1.5 rounded-md hover:bg-brand-500/10">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            Admin
                        </Link>
                    )}
                    <a
                        href="/widget-demo.html"
                        target="_blank"
                        className="btn-ghost text-xs border border-surface-border rounded-md px-3 py-1.5"
                    >
                        Demo Widget
                    </a>
                    <div className="w-px h-6 bg-surface-border mx-1"></div>
                    {user ? (
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs text-white font-medium">{user.name || user.email}</p>
                                <p className="text-[10px] text-slate-500">{user.role === 'super_admin' ? 'Super Admin' : 'Member'}</p>
                            </div>
                            <button
                                onClick={() => {
                                    localStorage.removeItem("bugscribe_dev_token");
                                    window.location.href = "/";
                                }}
                                className="btn-ghost text-xs text-red-400 hover:bg-red-500/10"
                            >
                                Log Out
                            </button>
                        </div>
                    ) : (
                        <Link href="/" className="btn-primary text-xs">
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

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <nav className="h-14 border-b border-surface-border glass sticky top-0 z-50">
                <div className="max-w-[1600px] mx-auto px-4 h-full flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center
                              group-hover:bg-brand-400 transition-colors">
                            <Bug className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-white text-lg tracking-tight">
                            Bug<span className="text-gradient">Scribe</span>
                        </span>
                    </Link>
                </div>
            </nav>
        );
    }

    return <NavbarContent />;
}
