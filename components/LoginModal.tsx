"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Bug, Mail, User, Key, X } from "lucide-react";

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
    const [email, setEmail] = useState("");
    const [emailToCheck, setEmailToCheck] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [loggingIn, setLoggingIn] = useState(false);
    const [pendingApproval, setPendingApproval] = useState(false);
    const [error, setError] = useState("");

    const emailExists = useQuery(
        api.users.checkEmailExists,
        emailToCheck ? { email: emailToCheck } : "skip"
    );
    const loginMutation = useMutation(api.users.loginUser);

    // Close on Escape key
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [isOpen, onClose]);

    // Lock body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [isOpen]);

    const resetForm = useCallback(() => {
        setEmail("");
        setEmailToCheck("");
        setPassword("");
        setName("");
        setError("");
        setPendingApproval(false);
        setLoggingIn(false);
    }, []);

    const handleClose = useCallback(() => {
        resetForm();
        onClose();
    }, [resetForm, onClose]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;
        setLoggingIn(true);
        setError("");
        try {
            const { token, isApproved } = await loginMutation({
                email: email.trim().toLowerCase(),
                name: name.trim() || undefined,
                password,
            });

            if (!isApproved) {
                setPendingApproval(true);
                setLoggingIn(false);
                return;
            }

            localStorage.setItem("bugscribe_dev_token", token);
            resetForm();
            onSuccess();
        } catch (err: any) {
            setError(err.message || "Login failed. Please try again.");
        } finally {
            setLoggingIn(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
            <div
                className="relative w-full max-w-md animate-slide-up"
                style={{
                    background: "linear-gradient(145deg, #0d0d18 0%, #0a0a14 100%)",
                    border: "1px solid rgba(0,212,255,0.2)",
                    borderRadius: "20px",
                    boxShadow: "0 0 60px rgba(0,212,255,0.1), 0 32px 64px rgba(0,0,0,0.6)",
                }}
            >
                {/* Top accent glow */}
                <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px"
                    style={{ background: "linear-gradient(to right, transparent, rgba(0,212,255,0.6), transparent)" }}
                />

                {/* Close button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all"
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div
                            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 mx-auto"
                            style={{
                                background: "rgba(0,212,255,0.08)",
                                border: "1px solid rgba(0,212,255,0.2)",
                                boxShadow: "0 0 24px rgba(0,212,255,0.1)",
                            }}
                        >
                            <Bug className="w-8 h-8 text-brand-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white tracking-tight mb-1">
                            Welcome to Bug<span className="text-gradient">Scribe</span>
                        </h2>
                        <p className="text-slate-400 text-sm">
                            Sign in to access your dashboard
                        </p>
                    </div>

                    {/* Form */}
                    {!pendingApproval ? (
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-400 font-medium block mb-1.5">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        id="modal-email"
                                        type="email"
                                        className="input pl-10"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onBlur={() => setEmailToCheck(email.trim().toLowerCase())}
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {emailExists === false && (
                                <div className="animate-slide-up">
                                    <label className="text-xs text-slate-400 font-medium block mb-1.5">
                                        Your Name <span className="text-slate-600">(new account)</span>
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input
                                            type="text"
                                            className="input pl-10"
                                            placeholder="Your full name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="text-xs text-slate-400 font-medium block mb-1.5">
                                    Password
                                </label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type="password"
                                        className="input pl-10"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs animate-slide-up">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="btn-primary w-full justify-center h-11 mt-2"
                                disabled={loggingIn}
                            >
                                {loggingIn ? (
                                    <span className="flex items-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Authenticating…
                                    </span>
                                ) : (
                                    "Continue to Dashboard"
                                )}
                            </button>
                        </form>
                    ) : (
                        <div className="text-center py-4 animate-fade-in">
                            <div className="w-14 h-14 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">⏳</span>
                            </div>
                            <p className="text-orange-400 font-semibold mb-1">Account Pending Approval</p>
                            <p className="text-slate-500 text-sm">
                                Please wait for a Super Admin to approve your access.
                            </p>
                            <button
                                onClick={handleClose}
                                className="btn-ghost mt-6 mx-auto"
                            >
                                Close
                            </button>
                        </div>
                    )}

                    {!pendingApproval && (
                        <p className="text-[10px] text-slate-600 text-center mt-5 uppercase tracking-widest font-semibold">
                            Protected by Convex Native Session
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
