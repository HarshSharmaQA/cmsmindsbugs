"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Bug, ShieldAlert, Zap, FileText, ChevronDown, Menu, X } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

function NavbarContent() {
    const [devToken, setDevToken] = useState<string | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem("bugscribe_dev_token");
        setDevToken(stored);
    }, []);

    const [profileOpen, setProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const user = useQuery(api.users.currentUser, { devToken: devToken || undefined });
    const isSuperAdmin = user?.role === "super_admin";
    const publishedPages = useQuery(api.pages.list, { devToken: undefined }) ?? [];
    
    // Split menu pages into two halves for the center logo layout
    const menuPages = (publishedPages as any[]).filter(p => p.showInMenu && p.slug !== "");
    const half = Math.ceil(menuPages.length / 2);
    const leftMenu = menuPages.slice(0, half);
    const rightMenu = menuPages.slice(half);

    return (
        <div className="fixed top-6 left-0 right-0 z-[100] flex justify-center px-4 pointer-events-none">
            {/* Mobile Menu Backdrop */}
            {mobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[101] md:hidden pointer-events-auto"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Mobile Menu Drawer */}
            <div className={`fixed top-0 left-0 bottom-0 w-[280px] bg-[#09090E] border-r border-white/5 z-[102] md:hidden transition-transform duration-500 pointer-events-auto ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6">
                    <div className="flex items-center justify-between mb-10">
                        <Link href="/" className="flex items-center gap-2">
                            <Bug className="w-6 h-6 text-brand-400" />
                            <span className="font-bold text-white text-lg">BugScribe</span>
                        </Link>
                        <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-lg bg-white/5 text-slate-400">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Link href="/" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 rounded-xl bg-white/5 text-white font-semibold">Home</Link>
                        {publishedPages.filter((p: any) => p.showInMenu).map((page: any) => (
                            <Link 
                                key={page._id} 
                                href={`/${page.slug}`} 
                                onClick={() => setMobileMenuOpen(false)}
                                className="px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all font-medium"
                            >
                                {page.title}
                            </Link>
                        ))}
                        {isSuperAdmin && (
                            <Link 
                                href="/admin" 
                                onClick={() => setMobileMenuOpen(false)}
                                className="px-4 py-3 rounded-xl text-brand-400 hover:bg-brand-400/10 transition-all font-bold mt-4 border border-brand-500/10 flex items-center gap-2"
                            >
                                <ShieldAlert className="w-4 h-4" />
                                Admin Dashboard
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            <nav
                className="h-16 rounded-full flex items-center px-2 pointer-events-auto relative group shadow-2xl"
                style={{
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(16px) saturate(1.8)',
                    WebkitBackdropFilter: 'blur(16px) saturate(1.8)',
                    background: 'rgba(9, 9, 14, 0.7)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 0, 0, 0.1)',
                }}
            >
                {/* Subtle glow effect */}
                <div className="absolute inset-0 rounded-full opacity-20 group-hover:opacity-30 transition-opacity bg-gradient-to-r from-brand-500/10 via-brand-500/20 to-brand-500/10 pointer-events-none" />

                <div className="flex items-center gap-1 sm:gap-4 px-2 sm:px-4 h-full">
                    {/* Mobile Menu Trigger */}
                    <button 
                        onClick={() => setMobileMenuOpen(true)}
                        className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <Menu className="w-6 h-6" />
                    </button>

                    {/* Left Menu Items (Desktop) */}
                    <Link href="/" className="nav-link hidden md:block text-xs sm:text-[13px] font-semibold text-slate-400 hover:text-white transition-all px-3 py-2">
                        Home
                    </Link>
                    {leftMenu.map(page => (
                        <Link
                            key={`left-${page._id}`}
                            href={`/${page.slug}`}
                            className="nav-link hidden lg:block text-[13px] font-semibold text-slate-400 hover:text-white transition-all px-3 py-2"
                        >
                            {page.title}
                        </Link>
                    ))}

                    {/* Center Logo */}
                    <Link href="/" className="flex items-center gap-2.5 group/logo px-4 shrink-0 transform hover:scale-105 transition-all duration-300">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center relative overflow-hidden rotate-45 group-hover/logo:rotate-[225deg] transition-transform duration-700"
                            style={{
                                background: 'linear-gradient(135deg, #00D4FF 0%, #0099CC 100%)',
                                boxShadow: '0 0 20px rgba(0, 212, 255, 0.4)',
                            }}>
                            <Bug className="w-5 h-5 text-[#09090E] -rotate-45 group-hover/logo:rotate-[-225deg] transition-transform duration-700" />
                        </div>
                        <span className="font-bold text-white text-[15px] tracking-tight hidden sm:block">
                            Bug<span className="text-brand-400">Scribe</span>
                        </span>
                    </Link>

                    {/* Right Menu Items */}
                    {rightMenu.map(page => (
                        <Link
                            key={`right-${page._id}`}
                            href={`/${page.slug}`}
                            className="nav-link hidden lg:block text-[13px] font-semibold text-slate-400 hover:text-white transition-all px-3 py-2"
                        >
                            {page.title}
                        </Link>
                    ))}

                    {isSuperAdmin && (
                        <Link
                            href="/admin"
                            className="nav-link hidden md:flex text-xs sm:text-[13px] font-bold text-brand-400 hover:text-brand-300 transition-all px-3 py-2 items-center gap-1.5"
                        >
                            <ShieldAlert className="w-3.5 h-3.5" />
                            Admin
                        </Link>
                    )}

                    {/* Action Area */}
                    <div className="flex items-center gap-2 ml-2 sm:ml-4 pl-4 border-l border-white/5 h-1/2">
                        {user ? (
                            <div className="relative" ref={profileRef}>
                                <button 
                                    onClick={() => setProfileOpen(!profileOpen)}
                                    className="w-8 h-8 rounded-full overflow-hidden border border-brand-500/30 hover:border-brand-400 transition-all flex items-center justify-center bg-brand-500/10 text-brand-400 text-[11px] font-bold uppercase"
                                >
                                    {(user.name || user.email || "U")[0]}
                                </button>
                                
                                {profileOpen && (
                                    <div className="absolute top-12 right-0 w-48 card p-1 shadow-2xl ring-1 ring-surface-border z-50 animate-slide-down bg-[#0d0d14]/95 backdrop-blur-md">
                                        <div className="px-3 py-2 border-b border-white/5 mb-1">
                                            <p className="text-xs font-bold text-white truncate">{user.name || user.email}</p>
                                            <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                                        </div>
                                        <Link href="/admin" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-all">
                                            <ShieldAlert className="w-3.5 h-3.5 text-brand-400" />
                                            Dashboard
                                        </Link>
                                        <button 
                                            onClick={() => {
                                                localStorage.removeItem("bugscribe_dev_token");
                                                window.location.href = "/";
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-all mt-1"
                                        >
                                            <ShieldAlert className="w-3.5 h-3.5 rotate-180" />
                                            Log Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={() => {
                                    if (window.location.pathname === "/") {
                                        window.dispatchEvent(new Event("open-login-modal"));
                                    } else {
                                        window.location.href = "/?login=1";
                                    }
                                }}
                                className="px-5 py-2 rounded-full bg-white text-[#09090E] text-[13px] font-bold hover:bg-brand-400 hover:text-white transition-all shadow-lg active:scale-95"
                            >
                                Login
                            </button>
                        )}
                    </div>
                </div>
            </nav>
        </div>
    );
}

export function Navbar() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    if (!mounted) {
        return (
            <div className="fixed top-6 left-0 right-0 z-[100] flex justify-center px-4">
                <nav className="h-16 w-32 rounded-full border border-white/5 bg-surface-card/50 backdrop-blur-xl animate-pulse" />
            </div>
        );
    }

    return <NavbarContent />;
}
