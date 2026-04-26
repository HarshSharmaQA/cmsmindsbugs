"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Navbar } from "@/components/Navbar";
import { useState, useEffect, useCallback } from "react";
import {
    ArrowLeft, Plus, Trash2, GripVertical, ChevronDown, ChevronRight,
    Menu, Save, Check, Layout, Monitor, AlignLeft, AlignCenter
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

// ─── Types ────────────────────────────────────────────────────────────────────

type SubLink = { label: string; path: string; dropdown?: boolean };
type MenuLink = { label: string; path: string; dropdown?: boolean; subLinks?: SubLink[] };

// ─── Draggable Menu Item ──────────────────────────────────────────────────────

function MenuItemRow({
    item,
    index,
    onUpdate,
    onRemove,
    onMoveUp,
    onMoveDown,
    isFirst,
    isLast,
}: {
    item: MenuLink;
    index: number;
    onUpdate: (i: number, val: MenuLink) => void;
    onRemove: (i: number) => void;
    onMoveUp: (i: number) => void;
    onMoveDown: (i: number) => void;
    isFirst: boolean;
    isLast: boolean;
}) {
    const [expanded, setExpanded] = useState(false);

    const addSub = () => {
        const subs = [...(item.subLinks || []), { label: "", path: "" }];
        onUpdate(index, { ...item, subLinks: subs });
    };

    const updateSub = (si: number, val: SubLink) => {
        const subs = (item.subLinks || []).map((s, i) => i === si ? val : s);
        onUpdate(index, { ...item, subLinks: subs });
    };

    const removeSub = (si: number) => {
        const subs = (item.subLinks || []).filter((_, i) => i !== si);
        onUpdate(index, { ...item, subLinks: subs });
    };

    return (
        <div className="border border-[#2a2d3e] rounded-xl overflow-hidden bg-[#0d0d14]">
            {/* Top row */}
            <div className="flex items-center gap-2 px-3 py-2.5">
                <div className="flex flex-col gap-0.5 shrink-0">
                    <button onClick={() => onMoveUp(index)} disabled={isFirst} className="p-0.5 rounded text-slate-600 hover:text-slate-300 disabled:opacity-20 transition-colors">
                        <ChevronDown className="w-3.5 h-3.5 rotate-180" />
                    </button>
                    <button onClick={() => onMoveDown(index)} disabled={isLast} className="p-0.5 rounded text-slate-600 hover:text-slate-300 disabled:opacity-20 transition-colors">
                        <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                </div>
                <GripVertical className="w-4 h-4 text-slate-700 shrink-0" />

                <div className="flex-1 grid grid-cols-2 gap-2">
                    <div>
                        <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-1">Label</div>
                        <input
                            className="w-full bg-[#1a1d27] border border-[#2a2d3e] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-500/50"
                            value={item.label}
                            onChange={e => onUpdate(index, { ...item, label: e.target.value })}
                            placeholder="About"
                        />
                    </div>
                    <div>
                        <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-1">Destination Path</div>
                        <input
                            className="w-full bg-[#1a1d27] border border-[#2a2d3e] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-500/50"
                            value={item.path}
                            onChange={e => onUpdate(index, { ...item, path: e.target.value })}
                            placeholder="/about"
                        />
                    </div>
                </div>

                <label className="flex items-center gap-1.5 shrink-0 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={!!item.dropdown}
                        onChange={e => onUpdate(index, { ...item, dropdown: e.target.checked })}
                        className="w-3 h-3 accent-brand-500"
                    />
                    <span className="text-[10px] text-slate-500">Dropdown</span>
                </label>

                <button
                    onClick={() => setExpanded(!expanded)}
                    className="shrink-0 p-1.5 rounded-lg text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 transition-all"
                    title="Sub-links"
                >
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
                </button>

                <button
                    onClick={() => onRemove(index)}
                    className="shrink-0 p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Sub-links panel */}
            {expanded && (
                <div className="border-t border-[#2a2d3e] px-4 py-3 bg-[#09090f] space-y-2">
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-2">
                        Sub-Links for &ldquo;{item.label || "Item"}&rdquo;
                    </p>
                    {(item.subLinks || []).map((sub, si) => (
                        <div key={si} className="flex items-center gap-2">
                            <div className="flex-1 grid grid-cols-2 gap-2">
                                <input
                                    className="w-full bg-[#1a1d27] border border-[#2a2d3e] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-500/40"
                                    value={sub.label}
                                    onChange={e => updateSub(si, { ...sub, label: e.target.value })}
                                    placeholder="Sub-label"
                                />
                                <input
                                    className="w-full bg-[#1a1d27] border border-[#2a2d3e] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-500/40"
                                    value={sub.path}
                                    onChange={e => updateSub(si, { ...sub, path: e.target.value })}
                                    placeholder="/sub-path"
                                />
                            </div>
                            <label className="flex items-center gap-1 shrink-0 cursor-pointer">
                                <input type="checkbox" checked={!!sub.dropdown} onChange={e => updateSub(si, { ...sub, dropdown: e.target.checked })} className="w-3 h-3 accent-brand-500" />
                                <span className="text-[10px] text-slate-500">Dropdown</span>
                            </label>
                            <button onClick={() => removeSub(si)} className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all">
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={addSub}
                        className="flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-brand-400 font-semibold transition-colors px-1 py-1"
                    >
                        <Plus className="w-3 h-3" /> Add Sub-Link to &ldquo;{item.label || "this item"}&rdquo;
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── Menu Panel ───────────────────────────────────────────────────────────────

function MenuPanel({
    title,
    description,
    links,
    setLinks,
    saveLabel,
    onSave,
    saving,
    saved,
}: {
    title: string;
    description: string;
    links: MenuLink[];
    setLinks: (l: MenuLink[]) => void;
    saveLabel: string;
    onSave: () => void;
    saving: boolean;
    saved: boolean;
}) {
    const add = () => setLinks([...links, { label: "", path: "" }]);
    const update = (i: number, val: MenuLink) => setLinks(links.map((l, idx) => idx === i ? val : l));
    const remove = (i: number) => setLinks(links.filter((_, idx) => idx !== i));
    const moveUp = (i: number) => {
        if (i === 0) return;
        const n = [...links];
        [n[i - 1], n[i]] = [n[i], n[i - 1]];
        setLinks(n);
    };
    const moveDown = (i: number) => {
        if (i === links.length - 1) return;
        const n = [...links];
        [n[i], n[i + 1]] = [n[i + 1], n[i]];
        setLinks(n);
    };

    return (
        <div className="card p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-border bg-[#0d0d14]">
                <div className="flex items-center gap-2 mb-1">
                    <Menu className="w-4 h-4 text-brand-400" />
                    <h2 className="font-bold text-white text-sm">{title}</h2>
                </div>
                <p className="text-xs text-slate-500">{description}</p>
            </div>

            <div className="p-4 space-y-2">
                {links.length === 0 && (
                    <p className="text-center text-xs text-slate-600 py-6">No menu links yet. Add your first one below.</p>
                )}
                {links.map((item, i) => (
                    <MenuItemRow
                        key={i}
                        item={item}
                        index={i}
                        onUpdate={update}
                        onRemove={remove}
                        onMoveUp={moveUp}
                        onMoveDown={moveDown}
                        isFirst={i === 0}
                        isLast={i === links.length - 1}
                    />
                ))}
            </div>

            <div className="px-4 pb-4 flex items-center gap-3">
                <button
                    onClick={add}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-400 font-semibold border border-dashed border-[#2a2d3e] hover:border-brand-500/40 px-4 py-2 rounded-xl transition-all"
                >
                    <Plus className="w-3.5 h-3.5" /> Add Top-Level Link
                </button>
                <button
                    onClick={onSave}
                    disabled={saving}
                    className={`ml-auto flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${saved ? "bg-green-500/20 text-green-400 border border-green-500/30" : "btn-primary"}`}
                >
                    {saved ? <><Check className="w-3.5 h-3.5" /> Saved!</> : saving ? "Saving..." : <><Save className="w-3.5 h-3.5" /> {saveLabel}</>}
                </button>
            </div>
        </div>
    );
}

// ─── Visual Style Selector ────────────────────────────────────────────────────

function StyleOption({ id, label, desc, icon, selected, onSelect }: {
    id: string; label: string; desc: string; icon: React.ReactNode;
    selected: boolean; onSelect: () => void;
}) {
    return (
        <button
            onClick={onSelect}
            className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center ${selected ? "border-brand-500 bg-brand-500/10" : "border-[#2a2d3e] bg-[#0d0d14] hover:border-[#3a3d4e]"}`}
        >
            <div className={`text-3xl ${selected ? "text-brand-400" : "text-slate-600"}`}>{icon}</div>
            <div>
                <p className={`text-xs font-bold ${selected ? "text-brand-400" : "text-slate-300"}`}>{label}</p>
                <p className="text-[10px] text-slate-600 mt-0.5">{desc}</p>
            </div>
            {selected && <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />}
        </button>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function MenuSettingsContent() {
    const [devToken, setDevToken] = useState<string | null>(null);
    useEffect(() => {
        const stored = localStorage.getItem("bugscribe_dev_token");
        if (stored) setDevToken(stored);
    }, []);

    const setSetting = useMutation(api.globalSettings.setSetting);

    // ── Load ALL settings with single query (optimized)
    const allSettings = useQuery(api.globalSettings.getAll, {});
    
    // Extract individual settings from the map
    const savedStyle = allSettings?.["nav_style"];
    const savedLayout = allSettings?.["nav_layout"];
    const savedHeaderLinks = allSettings?.["nav_header_links"];
    const savedFooterLinks = allSettings?.["nav_footer_links"];
    const savedHeaderTitle = allSettings?.["nav_header_title"];
    const savedFooterTitle = allSettings?.["nav_footer_title"];
    const savedSiteName = allSettings?.["site_name"];
    const savedFooterDesc = allSettings?.["footer_description"];
    const savedCopyright = allSettings?.["footer_copyright"];

    // ── Local state
    const [navStyle, setNavStyle] = useState<string>("floating");
    const [navLayout, setNavLayout] = useState<string>("center");
    const [headerTitle, setHeaderTitle] = useState("");
    const [footerTitle, setFooterTitle] = useState("");
    const [headerLinks, setHeaderLinks] = useState<MenuLink[]>([]);
    const [footerLinks, setFooterLinks] = useState<MenuLink[]>([]);
    const [savingStyle, setSavingStyle] = useState(false);
    const [savedStyle2, setSavedStyle2] = useState(false);
    const [savingHeader, setSavingHeader] = useState(false);
    const [savedHeader, setSavedHeader] = useState(false);
    const [savingFooter, setSavingFooter] = useState(false);
    const [savedFooter, setSavedFooter] = useState(false);
    const [siteName, setSiteName] = useState("");
    const [footerDesc, setFooterDesc] = useState("");
    const [copyright, setCopyright] = useState("");
    const [savingIdent, setSavingIdent] = useState(false);
    const [savedIdent, setSavedIdent] = useState(false);

    // ── Sync loaded data into state
    useEffect(() => { if (savedStyle !== undefined) setNavStyle((savedStyle as string) || "floating"); }, [savedStyle]);
    useEffect(() => { if (savedLayout !== undefined) setNavLayout((savedLayout as string) || "center"); }, [savedLayout]);
    useEffect(() => { if (savedHeaderLinks !== undefined && Array.isArray(savedHeaderLinks)) setHeaderLinks(savedHeaderLinks); }, [savedHeaderLinks]);
    useEffect(() => { if (savedFooterLinks !== undefined && Array.isArray(savedFooterLinks)) setFooterLinks(savedFooterLinks); }, [savedFooterLinks]);
    useEffect(() => { if (savedHeaderTitle !== undefined) setHeaderTitle((savedHeaderTitle as string) || ""); }, [savedHeaderTitle]);
    useEffect(() => { if (savedFooterTitle  !== undefined) setFooterTitle((savedFooterTitle  as string) || ""); }, [savedFooterTitle]);
    useEffect(() => { if (savedSiteName   !== undefined) setSiteName((savedSiteName   as string) || ""); }, [savedSiteName]);
    useEffect(() => { if (savedFooterDesc !== undefined) setFooterDesc((savedFooterDesc as string) || ""); }, [savedFooterDesc]);
    useEffect(() => { if (savedCopyright  !== undefined) setCopyright((savedCopyright  as string) || ""); }, [savedCopyright]);

    const saveStyle = useCallback(async () => {
        if (!devToken) return;
        setSavingStyle(true);
        await setSetting({ key: "nav_style", value: navStyle, devToken });
        await setSetting({ key: "nav_layout", value: navLayout, devToken });
        setSavingStyle(false);
        setSavedStyle2(true);
        setTimeout(() => setSavedStyle2(false), 2000);
    }, [devToken, navStyle, navLayout, setSetting]);

    const saveHeader = useCallback(async () => {
        if (!devToken) return;
        setSavingHeader(true);
        await setSetting({ key: "nav_header_title", value: headerTitle, devToken });
        await setSetting({ key: "nav_header_links", value: headerLinks, devToken });
        setSavingHeader(false);
        setSavedHeader(true);
        setTimeout(() => setSavedHeader(false), 2000);
    }, [devToken, headerTitle, headerLinks, setSetting]);

    const saveFooter = useCallback(async () => {
        if (!devToken) return;
        setSavingFooter(true);
        await setSetting({ key: "nav_footer_title", value: footerTitle, devToken });
        await setSetting({ key: "nav_footer_links", value: footerLinks, devToken });
        setSavingFooter(false);
        setSavedFooter(true);
        setTimeout(() => setSavedFooter(false), 2000);
    }, [devToken, footerTitle, footerLinks, setSetting]);

    const saveIdent = useCallback(async () => {
        if (!devToken) return;
        setSavingIdent(true);
        await setSetting({ key: "site_name",         value: siteName,   devToken });
        await setSetting({ key: "footer_description",value: footerDesc,  devToken });
        await setSetting({ key: "footer_copyright",  value: copyright,   devToken });
        setSavingIdent(false);
        setSavedIdent(true);
        setTimeout(() => setSavedIdent(false), 2000);
    }, [devToken, siteName, footerDesc, copyright, setSetting]);

    return (
        <div className="min-h-screen bg-surface text-slate-200">
            <Navbar />
            <main className="max-w-6xl mx-auto px-4 pt-32 pb-20">

                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/admin" className="p-2 rounded-xl border border-surface-border text-slate-400 hover:text-white hover:border-brand-500/30 transition-all">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Menu Settings</h1>
                        <p className="text-sm text-slate-400 mt-0.5">Configure your site navigation and menu structure.</p>
                    </div>
                </div>

                <div className="space-y-6">

                    {/* ── Visual Style ──────────────────────────────────────── */}
                    <div className="card p-0 overflow-hidden">
                        <div className="px-5 py-4 border-b border-surface-border bg-[#0d0d14]">
                            <div className="flex items-center gap-2 mb-1">
                                <Monitor className="w-4 h-4 text-brand-400" />
                                <h2 className="font-bold text-white text-sm">Menu Design</h2>
                            </div>
                            <p className="text-xs text-slate-500">Choose the visual style and layout for your site navigation.</p>
                        </div>

                        <div className="p-5 space-y-5">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Visual Style</p>
                                <div className="flex gap-3">
                                    <StyleOption
                                        id="standard"
                                        label="Standard"
                                        desc="Full-width sticky header"
                                        icon={<Layout className="w-8 h-8" />}
                                        selected={navStyle === "standard"}
                                        onSelect={() => setNavStyle("standard")}
                                    />
                                    <StyleOption
                                        id="floating"
                                        label="Floating Pill"
                                        desc="Floats above content, rounded"
                                        icon={<Menu className="w-8 h-8" />}
                                        selected={navStyle === "floating"}
                                        onSelect={() => setNavStyle("floating")}
                                    />
                                </div>
                            </div>

                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Logo Layout</p>
                                <div className="flex gap-3">
                                    <StyleOption
                                        id="left"
                                        label="Logo Left"
                                        desc="Logo on left, menu on right"
                                        icon={<AlignLeft className="w-8 h-8" />}
                                        selected={navLayout === "left"}
                                        onSelect={() => setNavLayout("left")}
                                    />
                                    <StyleOption
                                        id="center"
                                        label="Logo Center"
                                        desc="Logo in center, split menu"
                                        icon={<AlignCenter className="w-8 h-8" />}
                                        selected={navLayout === "center"}
                                        onSelect={() => setNavLayout("center")}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={saveStyle}
                                disabled={savingStyle}
                                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${savedStyle2 ? "bg-green-500/20 text-green-400 border border-green-500/30" : "btn-primary"}`}
                            >
                                {savedStyle2 ? <><Check className="w-3.5 h-3.5" /> Saved!</> : savingStyle ? "Saving..." : <><Save className="w-3.5 h-3.5" /> Save Style Settings</>}
                            </button>
                        </div>
                    </div>

                    {/* ── Site Identity ──────────────────────────────────────── */}
                    <div className="card p-0 overflow-hidden">
                        <div className="px-5 py-4 border-b border-surface-border bg-[#0d0d14]">
                            <div className="flex items-center gap-2 mb-1">
                                <ChevronRight className="w-4 h-4 text-brand-400" />
                                <h2 className="font-bold text-white text-sm">Site Identity &amp; Footer Text</h2>
                            </div>
                            <p className="text-xs text-slate-500">Configure the brand name, footer description, and copyright line.</p>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-1.5">Site Name</div>
                                    <input
                                        className="w-full bg-[#1a1d27] border border-[#2a2d3e] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand-500/50"
                                        value={siteName}
                                        onChange={e => setSiteName(e.target.value)}
                                        placeholder="BugScribe"
                                    />
                                    <p className="text-[10px] text-slate-600 mt-1">Shown in footer logo and copyright.</p>
                                </div>
                                <div>
                                    <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-1.5">Copyright Text</div>
                                    <input
                                        className="w-full bg-[#1a1d27] border border-[#2a2d3e] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand-500/50"
                                        value={copyright}
                                        onChange={e => setCopyright(e.target.value)}
                                        placeholder="© {year} All Rights Reserved. BugScribe"
                                    />
                                    <p className="text-[10px] text-slate-600 mt-1">Use <code className="text-brand-400">{`{year}`}</code> for the current year.</p>
                                </div>
                            </div>
                            <div>
                                <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-1.5">Footer Description</div>
                                <textarea
                                    className="w-full bg-[#1a1d27] border border-[#2a2d3e] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand-500/50 resize-none"
                                    value={footerDesc}
                                    onChange={e => setFooterDesc(e.target.value)}
                                    placeholder="Visual bug tracking and feedback tool for modern development teams."
                                    rows={2}
                                />
                                <p className="text-[10px] text-slate-600 mt-1">Tagline shown under the logo in the footer.</p>
                            </div>
                            <button
                                onClick={saveIdent}
                                disabled={savingIdent}
                                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${savedIdent ? "bg-green-500/20 text-green-400 border border-green-500/30" : "btn-primary"}`}
                            >
                                {savedIdent ? <><Check className="w-3.5 h-3.5" /> Saved!</> : savingIdent ? "Saving..." : <><Save className="w-3.5 h-3.5" /> Save Identity</>}
                            </button>
                        </div>
                    </div>

                    {/* ── Two-column menu editors ────────────────────────────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                        {/* Header Menu */}
                        <div className="space-y-3">
                            <div className="card p-4 bg-[#0d0d14] border-brand-500/20">
                                <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-1.5">Header Menu Title (optional)</div>
                                <input
                                    className="w-full bg-[#1a1d27] border border-[#2a2d3e] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand-500/50"
                                    value={headerTitle}
                                    onChange={e => setHeaderTitle(e.target.value)}
                                    placeholder="e.g. QA"
                                />
                                <p className="text-[10px] text-slate-600 mt-1.5">An optional title for the menu.</p>
                            </div>
                            <MenuPanel
                                title="Header Menu"
                                description="Manage the navigation links for the header. Drag to reorder."
                                links={headerLinks}
                                setLinks={setHeaderLinks}
                                saveLabel="Save Header Menu"
                                onSave={saveHeader}
                                saving={savingHeader}
                                saved={savedHeader}
                            />
                        </div>

                        {/* Footer Menu */}
                        <div className="space-y-3">
                            <div className="card p-4 bg-[#0d0d14] border-brand-500/20">
                                <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-1.5">Footer Menu Title (optional)</div>
                                <input
                                    className="w-full bg-[#1a1d27] border border-[#2a2d3e] rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand-500/50"
                                    value={footerTitle}
                                    onChange={e => setFooterTitle(e.target.value)}
                                    placeholder="e.g. QA"
                                />
                                <p className="text-[10px] text-slate-600 mt-1.5">An optional title for the menu.</p>
                            </div>
                            <MenuPanel
                                title="Footer Menu"
                                description="Manage the navigation links for the footer. Drag to reorder."
                                links={footerLinks}
                                setLinks={setFooterLinks}
                                saveLabel="Save Footer Menu"
                                onSave={saveFooter}
                                saving={savingFooter}
                                saved={savedFooter}
                            />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function MenuSettingsPage() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    if (!mounted) return (
        <div className="min-h-screen bg-surface flex items-center justify-center">
            <p className="text-slate-500 animate-pulse text-sm">Loading Menu Settings...</p>
        </div>
    );
    return <MenuSettingsContent />;
}
