"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

// ── Types ──────────────────────────────────────────────────────────────────────

type AppUser = {
    _id: string;
    name?: string;
    email?: string;
    role?: string;
    [key: string]: unknown;
} | null | undefined;

type Settings = Record<string, unknown>;

interface AppContextValue {
    currentUser: AppUser;
    settings: Settings;
    devToken: string | null;
    setDevToken: (t: string | null) => void;
}

// ── Context ────────────────────────────────────────────────────────────────────

const AppContext = createContext<AppContextValue>({
    currentUser: undefined,
    settings: {},
    devToken: null,
    setDevToken: () => {},
});

// ── Provider ───────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
    const [devToken, setDevTokenState] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    // Read token from localStorage once on mount
    useEffect(() => {
        const stored = localStorage.getItem("bugscribe_dev_token");
        if (stored) setDevTokenState(stored);
        setMounted(true);
    }, []);

    const setDevToken = (t: string | null) => {
        setDevTokenState(t);
        if (t) localStorage.setItem("bugscribe_dev_token", t);
        else localStorage.removeItem("bugscribe_dev_token");
    };

    // ── Single subscriptions shared by all children ────────────────────────────
    // Use "skip" until mounted so we don't fire queries with undefined token during SSR
    const currentUser = useQuery(
        api.users.currentUser,
        mounted ? { devToken: devToken || undefined } : "skip"
    );

    // One call for ALL globalSettings instead of per-key calls
    const settingsRaw = useQuery(api.globalSettings.getAll, mounted ? {} : "skip");
    const settings: Settings = settingsRaw ?? {};

    return (
        <AppContext.Provider value={{ currentUser, settings, devToken, setDevToken }}>
            {children}
        </AppContext.Provider>
    );
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useAppContext() {
    return useContext(AppContext);
}
