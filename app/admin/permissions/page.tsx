"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ArrowLeft, Save, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const ALL_ROLES = ["owner", "admin", "editor", "viewer"];
const ALL_PERMISSIONS = [
    { id: "manage_users", label: "Manage Users (Invite/Remove)" },
    { id: "view_api", label: "View API Key & Settings" },
    { id: "view_settings", label: "View Project Settings" },
    { id: "delete_bugs", label: "Delete Bugs" },
    { id: "update_bugs", label: "Update Bugs (Kanban)" },
    { id: "view_bugs", label: "View Bugs" },
];

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

    // Initialize local state when data loads
    useEffect(() => {
        if (rolePermissions) {
            setLocalPermissions(rolePermissions);
        }
    }, [rolePermissions]);

    if (!mounted) {
        return <div className="min-h-screen bg-[#0F1117] text-gray-100 flex items-center justify-center">Loading...</div>;
    }

    // Simple auth check via getStats (it throws if not SuperAdmin, but if it's undefined it's loading)
    if ((defaultStats === undefined || rolePermissions === undefined) && devToken) {
        return <div className="min-h-screen bg-[#0F1117] text-gray-100 flex items-center justify-center">Loading Permissions...</div>;
    }

    if (!devToken || defaultStats === null || rolePermissions === null) {
        return <div className="min-h-screen bg-[#0F1117] text-red-500 p-8">Unauthorized. Please log in as Super Admin.</div>;
    }

    const togglePermission = (role: string, permissionId: string) => {
        setLocalPermissions(prev => {
            const rolePerms = prev[role] || [];
            if (rolePerms.includes(permissionId)) {
                return { ...prev, [role]: rolePerms.filter(p => p !== permissionId) };
            } else {
                return { ...prev, [role]: [...rolePerms, permissionId] };
            }
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError("");
        try {
            // Save each role sequentially
            for (const role of ALL_ROLES) {
                const perms = localPermissions[role] || [];
                await updateRolePermissions({ role, permissions: perms });
            }
            alert("Permissions saved successfully!");
        } catch (err: any) {
            setError(err.message || "Failed to save permissions");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0F1117] text-gray-100 p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                                Global Role Permissions
                            </h1>
                            <p className="text-gray-400 mt-1">Configure access levels for all projects.</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-[#6366F1] hover:bg-[#5355D1] text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-medium">Error saving permissions</h3>
                            <p className="text-sm mt-1">{error}</p>
                        </div>
                    </div>
                )}

                {/* Permissions Matrix */}
                <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr>
                                    <th className="p-4 border-b border-white/10 bg-white/5 font-medium text-gray-300">Permission</th>
                                    {ALL_ROLES.map(role => (
                                        <th key={role} className="p-4 border-b border-white/10 bg-white/5 font-medium text-gray-300 text-center capitalize">
                                            {role}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {ALL_PERMISSIONS.map((perm) => (
                                    <tr key={perm.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                        <td className="p-4 text-gray-300 font-medium">
                                            {perm.label}
                                        </td>
                                        {ALL_ROLES.map(role => {
                                            const rolePerms = localPermissions[role] || [];
                                            const isChecked = rolePerms.includes(perm.id);
                                            return (
                                                <td key={`${perm.id}-${role}`} className="p-4 text-center">
                                                    <label className="inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            className="sr-only peer"
                                                            checked={isChecked}
                                                            onChange={() => togglePermission(role, perm.id)}
                                                        />
                                                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6366F1] relative"></div>
                                                    </label>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
