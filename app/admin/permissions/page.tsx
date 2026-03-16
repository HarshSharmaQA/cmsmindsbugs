"use client";

import { useState, useEffect, Fragment } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ArrowLeft, Save, AlertCircle, Users, Fingerprint, Settings, Eye, PencilLine, Trash2, ShieldCheck, Layout, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const ALL_ROLES = ["owner", "admin", "editor", "viewer"] as const;
type Role = typeof ALL_ROLES[number];

const PERMISSION_GROUPS = [
    {
        name: "User Management",
        icon: Users,
        permissions: [
            { id: "manage_users", label: "Manage Users", desc: "Invite, remove, and manage user roles", icon: Users },
        ]
    },
    {
        name: "Infrastructure",
        icon: ShieldCheck,
        permissions: [
            { id: "view_api", label: "View API Key", desc: "Access sensitive API credentials", icon: Fingerprint },
            { id: "view_settings", label: "Project Settings", desc: "Modify global project configuration", icon: Settings },
        ]
    },
    {
        name: "Bug Operations",
        icon: Layout,
        permissions: [
            { id: "view_bugs", label: "View Bugs", desc: "Read-only access to bug reports", icon: Eye },
            { id: "update_bugs", label: "Update Bugs", desc: "Edit and move bugs in Kanban", icon: PencilLine },
            { id: "delete_bugs", label: "Delete Bugs", desc: "Permanently remove bug entries", icon: Trash2 },
        ]
    }
];

const ALL_PERMISSION_IDS = PERMISSION_GROUPS.flatMap(g => g.permissions.map(p => p.id));

export default function GlobalPermissionsPage() {
    const [devToken, setDevToken] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem("bugscribe_dev_token");
        if (stored) setDevToken(stored);
        setMounted(true);
    }, []);

    const defaultStats = useQuery(api.admin.getStats, mounted ? { devToken: devToken || undefined } : "skip");
    const rolePermissions = useQuery(api.permissions.getGlobal, mounted ? { devToken: devToken || undefined } : "skip");
    const updateRolePermissions = useMutation(api.permissions.setGlobal);
    const router = useRouter();

    const [localPermissions, setLocalPermissions] = useState<Record<string, string[]>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        if (rolePermissions) {
            setLocalPermissions(rolePermissions);
        }
    }, [rolePermissions]);

    if (!mounted) {
        return <div className="min-h-screen bg-[#09090E] text-gray-100 flex items-center justify-center font-medium">Initializing...</div>;
    }

    if ((defaultStats === undefined || rolePermissions === undefined) && devToken) {
        return (
            <div className="min-h-screen bg-[#09090E] text-gray-100 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-8 h-8 text-[#00D4FF] animate-spin" />
                <span className="text-sm tracking-widest text-[#00D4FF] font-bold uppercase">Loading Permissions</span>
            </div>
        );
    }

    if (!devToken || defaultStats === null || rolePermissions === null) {
        return (
            <div className="min-h-screen bg-[#09090E] flex items-center justify-center p-8">
                <div className="glass border-red-500/20 p-8 rounded-2xl max-w-md text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
                    <p className="text-gray-400">This sector is restricted to Super Admin protocols only.</p>
                </div>
            </div>
        );
    }

    const togglePermission = (role: string, permissionId: string) => {
        setLocalPermissions((prev: Record<string, string[]>) => {
            const rolePerms = prev[role] || [];
            const result = rolePerms.includes(permissionId)
                ? rolePerms.filter((p: string) => p !== permissionId)
                : [...rolePerms, permissionId];
            return { ...prev, [role]: result };
        });
    };

    const toggleRoleAll = (role: string) => {
        const currentPerms = localPermissions[role] || [];
        const allAlreadySelected = ALL_PERMISSION_IDS.every(id => currentPerms.includes(id));
        
        setLocalPermissions((prev: Record<string, string[]>) => ({
            ...prev,
            [role]: allAlreadySelected ? [] : [...ALL_PERMISSION_IDS]
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError("");
        setShowSuccess(false);
        try {
            for (const role of ALL_ROLES) {
                const perms = localPermissions[role] || [];
                await updateRolePermissions({ role, permissions: perms, devToken: devToken || undefined });
            }
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (err: any) {
            setError(err.message || "Failed to save permissions");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#09090E] text-gray-100 p-6 md:p-12 selection:bg-[#00D4FF33]">
            <title>Global Role Permissions | BugScribe Admin</title>
            <meta name="description" content="Manage global role-based access control and security permissions for the BugScribe platform." />
            <div className="max-w-7xl mx-auto space-y-10 animate-fade-in">
                
                {/* ── Top Navigation ── */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-4">
                        <button 
                            onClick={() => router.back()} 
                            className="flex items-center gap-2 text-xs font-bold text-[#00D4FF] uppercase tracking-widest hover:translate-x-[-4px] transition-transform"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Return to Command Center
                        </button>
                        <div>
                            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gradient">
                                Role Permissions
                            </h1>
                            <p className="text-gray-400 mt-2 max-w-lg">
                                Centralized security protocols. Define the operational scope for every role in the BugScribe ecosystem.
                            </p>
                        </div>
                    </div>
                    
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`btn-primary px-8 py-3.5 rounded-xl h-14 min-w-[180px] shadow-lg ${isSaving ? 'animate-glow-pulse' : ''}`}
                    >
                        {isSaving ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : showSuccess ? (
                            <Check className="w-5 h-5" />
                        ) : (
                            <Save className="w-5 h-5" />
                        )}
                        <span className="font-bold uppercase tracking-wider text-xs">
                            {isSaving ? "Syncing..." : showSuccess ? "Changes Applied" : "Save Protocols"}
                        </span>
                    </button>
                </div>

                {error && (
                    <div className="glass border-red-500/30 p-4 rounded-xl flex items-center gap-4 animate-slide-up">
                        <AlertCircle className="w-6 h-6 text-red-400" />
                        <span className="text-red-400 font-medium">{error}</span>
                    </div>
                )}

                {/* ── Matrix Container ── */}
                <div className="glass rounded-3xl overflow-hidden border-[#1E1E2E] shadow-2xl animate-slide-up">
                    <div className="overflow-x-auto scrollbar-hide">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-[#111118]/80 border-b border-[#1E1E2E]">
                                    <th className="p-8 font-extrabold text-[#00D4FF] uppercase tracking-[0.2em] text-[10px] w-1/3">
                                        Security Scopes
                                    </th>
                                    {ALL_ROLES.map(role => {
                                         const currentPerms = localPermissions[role] || [];
                                         const allActive = ALL_PERMISSION_IDS.every(id => currentPerms.includes(id));
                                         return (
                                            <th key={role} className="p-6 text-center group cursor-pointer" onClick={() => toggleRoleAll(role)} aria-label={`Toggle all permissions for ${role}`}>
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className={`text-[10px] uppercase font-black transition-colors ${allActive ? 'text-[#00D4FF]' : 'text-gray-500 group-hover:text-gray-300'}`}>
                                                        {role}
                                                    </span>
                                                    <div className={`text-[8px] font-bold px-2 py-0.5 rounded-full border transition-all ${allActive ? 'border-[#00D4FF]/40 bg-[#00D4FF]/10 text-[#00D4FF]' : 'border-gray-800 text-gray-600'}`}>
                                                        {allActive ? 'FULL ACCESS' : 'CUSTOM'}
                                                    </div>
                                                </div>
                                            </th>
                                         );
                                    })}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#1E1E2E]/50">
                                {PERMISSION_GROUPS.map((group) => (
                                    <Fragment key={group.name}>
                                        <tr className="bg-[#16161F]/30">
                                            <td colSpan={5} className="px-8 py-4">
                                                <div className="flex items-center gap-3">
                                                    <group.icon className="w-3.5 h-3.5 text-[#00D4FF]" />
                                                    <span className="text-[11px] font-black uppercase tracking-widest text-[#00D4FF]/70">
                                                        {group.name}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                        {group.permissions.map((perm) => (
                                            <tr key={perm.id} className="group hover:bg-[#00D4FF]/[0.02] transition-colors border-l-2 border-l-transparent hover:border-l-[#00D4FF]">
                                                <td className="p-6 pl-10">
                                                    <div className="flex items-start gap-4">
                                                        <div className="p-2.5 rounded-lg bg-[#111118] border border-[#1E1E2E] group-hover:border-[#00D4FF]/30 transition-colors">
                                                            <perm.icon className="w-5 h-5 text-gray-400 group-hover:text-[#00D4FF] transition-colors" />
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold text-white group-hover:text-[#00D4FF] transition-colors">{perm.label}</div>
                                                            <div className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{perm.desc}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                {ALL_ROLES.map(role => {
                                                    const isChecked = (localPermissions[role] || []).includes(perm.id);
                                                    return (
                                                        <td key={`${perm.id}-${role}`} className="p-6 text-center">
                                                            <div className="flex justify-center">
                                                                <button
                                                                    onClick={() => togglePermission(role, perm.id)}
                                                                    aria-label={`Toggle ${perm.label} for ${role}`}
                                                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isChecked ? 'bg-[#00D4FF] glow' : 'bg-[#1E1E2E]'}`}
                                                                >
                                                                    <span
                                                                        aria-hidden="true"
                                                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isChecked ? 'translate-x-5' : 'translate-x-0'}`}
                                                                    />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex justify-center">
                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.3em]">
                        Validated by BugScribe Security Engine © 2026
                    </p>
                </div>
            </div>
        </div>
    );
}

import React from "react";
