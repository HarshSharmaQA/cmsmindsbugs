"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCcw } from "lucide-react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("BugScribe Application Error:", error);
    }, [error]);

    const isDeploymentSync = error.message?.toLowerCase().includes("function not found") ||
        error.message?.toLowerCase().includes("could not find function");

    return (
        <div className="min-h-screen bg-[#0F1117] text-gray-100 flex flex-col items-center justify-center p-8">
            <div className="max-w-md w-full bg-white/5 border border-white/10 p-8 rounded-2xl shadow-2xl flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-6">
                    <AlertTriangle className="w-8 h-8" />
                </div>

                <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-red-400 to-amber-500 bg-clip-text text-transparent">
                    Something went wrong
                </h2>

                {isDeploymentSync ? (
                    <p className="text-slate-400 mb-8 text-sm leading-relaxed">
                        The application is currently syncing a new update. Please wait a moment and try again.
                    </p>
                ) : (
                    <div className="w-full bg-black/40 rounded p-4 mb-8 overflow-auto border border-white/5">
                        <p className="text-red-400 text-xs font-mono text-left break-words">
                            {error.message || "An unexpected error occurred."}
                        </p>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <button
                        onClick={() => reset()}
                        className="flex-1 flex justify-center items-center gap-2 px-5 py-2.5 bg-[#6366F1] hover:bg-[#5355D1] transition-colors rounded-xl font-medium"
                    >
                        <RefreshCcw className="w-4 h-4" /> Try again
                    </button>
                    <Link
                        href="/"
                        className="flex-1 flex justify-center items-center px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors rounded-xl font-medium text-slate-300"
                    >
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
