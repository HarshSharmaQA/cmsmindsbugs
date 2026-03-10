"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastItemProps {
    toast: Toast;
    onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
    useEffect(() => {
        const t = setTimeout(() => onRemove(toast.id), 3500);
        return () => clearTimeout(t);
    }, [toast.id, onRemove]);

    const icons = {
        success: <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />,
        error: <XCircle className="w-4 h-4 text-red-400 shrink-0" />,
        info: <Info className="w-4 h-4 text-brand-400 shrink-0" />,
    };

    const borders = {
        success: "border-green-500/30",
        error: "border-red-500/30",
        info: "border-brand-500/30",
    };

    return (
        <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-[#111118] border ${borders[toast.type]} shadow-2xl animate-slide-up min-w-[260px] max-w-[380px]`}
            style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}
        >
            {icons[toast.type]}
            <p className="text-sm text-white flex-1 font-medium">{toast.message}</p>
            <button
                onClick={() => onRemove(toast.id)}
                className="text-slate-500 hover:text-white transition-colors ml-1"
            >
                <X className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}

interface ToastContainerProps {
    toasts: Toast[];
    onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
            {toasts.map((t) => (
                <div key={t.id} className="pointer-events-auto">
                    <ToastItem toast={t} onRemove={onRemove} />
                </div>
            ))}
        </div>
    );
}

export function useToast() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: ToastType = "info") => {
        const id = Math.random().toString(36).slice(2);
        setToasts((prev) => [...prev, { id, message, type }]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const toast = {
        success: (msg: string) => addToast(msg, "success"),
        error: (msg: string) => addToast(msg, "error"),
        info: (msg: string) => addToast(msg, "info"),
    };

    return { toasts, toast, removeToast };
}
