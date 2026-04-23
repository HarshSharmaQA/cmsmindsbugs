"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import {
    Bug, Globe, ArrowRight,
    BarChart3,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ToastContainer, useToast } from "@/components/ui/Toast";
import { LoginModal } from "@/components/LoginModal";

export const dynamic = 'force-dynamic';

// ─── Home Page ────────────────────────────────────────────────────────────────
// ─── Home Page ────────────────────────────────────────────────────────────────

function HomePageContent() {
    const { toasts, removeToast } = useToast();
    const [devToken, setDevToken] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);

    const currentUser = useQuery(api.users.currentUser, { devToken: devToken || undefined });
    const homePage = useQuery(api.pages.getBySlug, { slug: "" });
    const isSuperAdmin = currentUser?.role === "super_admin";

    useEffect(() => {
        if (mounted) {
            document.title = "BugScribe | Visual Bug Tracking for Modern Dev Teams";

            // Update description meta tag
            let metaDesc = document.querySelector('meta[name="description"]');
            if (!metaDesc) {
                metaDesc = document.createElement('meta');
                metaDesc.setAttribute('name', 'description');
                document.head.appendChild(metaDesc);
            }
            metaDesc.setAttribute('content', 'Track bugs visually, manage user feedback, and improve build quality with BugScribe. The ultimate visual bug reporting tool.');
        }
    }, [mounted]);

    const hasCustomHome = homePage && homePage.isPublished;

    // Re-verify login status on mount
    useEffect(() => {
        const stored = localStorage.getItem("bugscribe_dev_token");
        if (stored) {
            setDevToken(stored);
        }
        setMounted(true);
    }, []);

    useEffect(() => {
        // Auto-logout if backend confirms user doesn't exist
        if (devToken && currentUser === null) {
            localStorage.removeItem("bugscribe_dev_token");
            window.location.reload();
        }
    }, [devToken, currentUser]);

    // Listen for the global "open-login-modal" event dispatched by the Navbar
    useEffect(() => {
        const handler = () => setShowLoginModal(true);
        window.addEventListener("open-login-modal", handler);
        return () => window.removeEventListener("open-login-modal", handler);
    }, []);

    // Check ?login=1 query param on load
    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            if (params.get("login") === "1") {
                // Clean up URL first
                const url = new URL(window.location.href);
                url.searchParams.delete("login");
                window.history.replaceState({}, "", url.toString());
                // Then show modal
                setTimeout(() => setShowLoginModal(true), 0);
            }
        }
    }, []);

    const handleLoginSuccess = () => {
        window.location.reload();
    };

    if (!mounted) {
        return <div className="min-h-screen bg-[#0A0A0A]" />; // Or a loading spinner
    }

    return (
        <div className="min-h-screen relative">
            <div className="fixed inset-0 grid-bg pointer-events-none opacity-50" />
            <Navbar />

            <ToastContainer toasts={toasts} onRemove={removeToast} />

            {/* Login Modal */}
            <LoginModal
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                onSuccess={handleLoginSuccess}
            />

            {/* ── Logged-in Welcome Bar ── */}
            {devToken && currentUser && (
                <div
                    className="fixed top-[96px] left-0 right-0 z-30 flex items-center justify-between gap-4 px-6 py-2.5 animate-slide-up shadow-xl"
                    style={{ background: "rgba(0,212,255,0.07)", borderBottom: "1px solid rgba(0,212,255,0.15)", backdropFilter: "blur(12px)" }}
                >
                    <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 text-[10px] font-bold shrink-0">
                            {(currentUser.name || currentUser.email || "U")[0].toUpperCase()}
                        </div>
                        <span className="text-sm text-slate-300">
                            Welcome back, <span className="font-semibold text-white">{currentUser.name || currentUser.email}</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {isSuperAdmin && (
                            <Link href="/admin/pages" className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 hover:text-white border border-surface-border hover:border-brand-500/40 px-3 py-1.5 rounded-lg transition-all">
                                <Globe className="w-3 h-3" /> Edit Page
                            </Link>
                        )}
                        <Link href="/dashboard" className="flex items-center gap-1.5 btn-primary py-1.5 px-4 text-sm">
                            <BarChart3 className="w-3.5 h-3.5" />
                            My Dashboard
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>
            )}

            <main className={`max-w-[1600px] mx-auto px-4 pb-20 ${devToken && currentUser ? "pt-44" : "pt-32"}`}>

                {/* ── Custom homepage blocks rendered via slug page ── */}
                {hasCustomHome && (
                    <div className="-mx-4 relative" />
                )}

                {/* ── Fallback: no custom home + logged out ── */}
                {!hasCustomHome && !devToken && (
                    <div className="text-center py-32 animate-fade-in">
                        <div className="w-20 h-20 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-6"
                            style={{ boxShadow: "0 0 40px rgba(0,212,255,0.1)" }}>
                            <Bug className="w-10 h-10 text-brand-400" />
                        </div>
                        <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight mb-4">
                            Visual Bug Tracking<br />
                            <span className="text-gradient">That Just Works.</span>
                        </h1>
                        <p className="text-slate-400 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
                            Capture annotated screenshots, manage issues with Kanban, and resolve bugs faster — right from your browser.
                        </p>
                        <button onClick={() => setShowLoginModal(true)} className="btn-primary px-8 py-3 text-base mx-auto">
                            Get Started Free <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* ── Fallback: no custom home + logged in ── */}
                {!hasCustomHome && devToken && (
                    <div className="text-center py-32 animate-fade-in">
                        <div className="w-20 h-20 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-6">
                            <Bug className="w-10 h-10 text-brand-400" />
                        </div>
                        <h2 className="text-4xl font-bold text-white mb-4">Welcome to BugScribe</h2>
                        <p className="text-slate-400 mb-8">Head to your dashboard to manage projects and track bugs.</p>
                        <Link href="/dashboard" className="btn-primary px-8 py-3 text-base inline-flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" /> Go to Dashboard <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                )}

            </main>
            <Footer />
        </div>
    );
}


export default function HomePage() {
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => {
        setMounted(true);
    }, []);
    
    if (!mounted) {
        return <div className="min-h-screen bg-[#0A0A0A]" suppressHydrationWarning />;
    }
    
    return <HomePageContent />;
}

