'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import Link from 'next/link';
import { Plus, Globe, Trash2, ArrowRight, MapPin, Pencil, X, ShoppingCart, EyeOff, Eye, IndianRupee, Star } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { MapCarousel } from '@/components/ui/map-carousel';

export const dynamic = 'force-dynamic';

// ─── Location Form Modal (Add / Edit) ────────────────────────────────────────

const INDIA_LOCATIONS: Record<string, { city: string, lat: number, lng: number }[]> = {
    "Maharashtra": [
        { city: "Mumbai", lat: 18.9220, lng: 72.8347 },
        { city: "Pune", lat: 18.5204, lng: 73.8567 },
        { city: "Nagpur", lat: 21.1458, lng: 79.0882 },
    ],
    "Delhi": [
        { city: "New Delhi", lat: 28.6139, lng: 77.2090 },
    ],
    "Karnataka": [
        { city: "Bengaluru", lat: 12.9716, lng: 77.5946 },
        { city: "Mysuru", lat: 12.2958, lng: 76.6394 },
    ],
    "Tamil Nadu": [
        { city: "Chennai", lat: 13.0827, lng: 80.2707 },
        { city: "Coimbatore", lat: 11.0168, lng: 76.9558 },
    ],
    "Gujarat": [
        { city: "Ahmedabad", lat: 23.0225, lng: 72.5714 },
        { city: "Surat", lat: 21.1702, lng: 72.8311 },
    ],
    "Rajasthan": [
        { city: "Jaipur", lat: 26.9124, lng: 75.7873 },
        { city: "Udaipur", lat: 24.5854, lng: 73.7125 },
        { city: "Jodhpur", lat: 26.2389, lng: 73.0243 },
    ],
    "Uttar Pradesh": [
        { city: "Lucknow", lat: 26.8467, lng: 80.9462 },
        { city: "Agra", lat: 27.1767, lng: 78.0081 },
        { city: "Varanasi", lat: 25.3176, lng: 82.9739 },
    ],
    "West Bengal": [
        { city: "Kolkata", lat: 22.5726, lng: 88.3639 },
        { city: "Darjeeling", lat: 27.0360, lng: 88.2627 },
    ],
    "Kerala": [
        { city: "Kochi", lat: 9.9312, lng: 76.2673 },
        { city: "Thiruvananthapuram", lat: 8.5241, lng: 76.9366 },
    ],
    "Goa": [
        { city: "Panaji", lat: 15.4909, lng: 73.8278 },
        { city: "Margao", lat: 15.2750, lng: 73.9583 },
    ]
};

type LocationFormData = {
    name: string;
    productBy: string;
    subtitle: string;
    image: string;
    price: string;
    priceLabel: string;
    priceSubtext: string;
    rating: string;
    lat: string;
    lng: string;
    purchases: string;
    state: string;
    city: string;
    buyLink: string;
};

const emptyForm: LocationFormData = {
    name: "", productBy: "", subtitle: "", image: "", price: "", priceLabel: "",
    priceSubtext: "INR · Includes taxes and fees", rating: "", lat: "", lng: "", purchases: "",
    state: "", city: "", buyLink: "",
};

function LocationModal({
    mode,
    initial,
    onSave,
    onClose,
    saving,
}: {
    mode: "add" | "edit";
    initial: LocationFormData;
    onSave: (data: LocationFormData) => void;
    onClose: () => void;
    saving: boolean;
}) {
    const [form, setForm] = useState<LocationFormData>(initial);
    const set = (k: keyof LocationFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm(prev => ({ ...prev, [k]: e.target.value }));

    const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const state = e.target.value;
        setForm(prev => ({ ...prev, state, city: "" })); // Reset city when state changes
    };

    const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const city = e.target.value;
        const stateList = INDIA_LOCATIONS[form.state as keyof typeof INDIA_LOCATIONS];
        const cityObj = stateList?.find(c => c.city === city);

        if (cityObj) {
            setForm(prev => ({
                ...prev,
                city,
                lat: String(cityObj.lat),
                lng: String(cityObj.lng),
                subtitle: prev.subtitle || `${city}, ${form.state}`,
            }));
        } else {
            setForm(prev => ({ ...prev, city }));
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="card w-full max-w-lg p-6 shadow-2xl ring-1 ring-brand-500/20 animate-slide-up max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="font-semibold text-white text-lg flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-brand-400" />
                        {mode === "add" ? "Add Location" : "Edit Location"}
                    </h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                            <label className="text-xs text-slate-400 font-medium block mb-1">Name *</label>
                            <input className="input" placeholder="e.g. The Taj Mahal Palace" value={form.name} onChange={set("name")} required />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 font-medium block mb-1">State</label>
                            <select className="input cursor-pointer" value={form.state} onChange={handleStateChange}>
                                <option value="">Select State</option>
                                {Object.keys(INDIA_LOCATIONS).map(state => (
                                    <option key={state} value={state}>{state}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 font-medium block mb-1">City</label>
                            <select className="input cursor-pointer" value={form.city} onChange={handleCityChange} disabled={!form.state}>
                                <option value="">Select City</option>
                                {form.state && INDIA_LOCATIONS[form.state as keyof typeof INDIA_LOCATIONS]?.map(c => (
                                    <option key={c.city} value={c.city}>{c.city}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs text-slate-400 font-medium block mb-1">Product By</label>
                            <input className="input" placeholder="e.g. Vendor or Host" value={form.productBy} onChange={set("productBy")} />
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs text-slate-400 font-medium block mb-1">Subtitle / Area</label>
                            <input className="input" placeholder="e.g. Colaba, Mumbai" value={form.subtitle} onChange={set("subtitle")} />
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs text-slate-400 font-medium block mb-1">Image URL</label>
                            <input className="input" placeholder="https://images.unsplash.com/..." value={form.image} onChange={set("image")} />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 font-medium block mb-1">Price (INR) *</label>
                            <input className="input" type="number" min="0" placeholder="28400" value={form.price} onChange={set("price")} required />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 font-medium block mb-1">Rating (0–10)</label>
                            <input className="input" type="number" min="0" max="10" step="0.1" placeholder="8.6" value={form.rating} onChange={set("rating")} />
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs text-slate-400 font-medium block mb-1">Price Label</label>
                            <input className="input" placeholder="₹28,400 total Jan 29 – Feb 1" value={form.priceLabel} onChange={set("priceLabel")} />
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs text-slate-400 font-medium block mb-1">Price Subtext</label>
                            <input className="input" placeholder="INR · Includes taxes and fees" value={form.priceSubtext} onChange={set("priceSubtext")} />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 font-medium block mb-1">Latitude *</label>
                            <input className="input" type="number" step="any" placeholder="18.9217" value={form.lat} onChange={set("lat")} required />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 font-medium block mb-1">Longitude *</label>
                            <input className="input" type="number" step="any" placeholder="72.8332" value={form.lng} onChange={set("lng")} required />
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs text-slate-400 font-medium block mb-1">Total Purchases</label>
                            <input className="input" type="number" min="0" placeholder="142" value={form.purchases} onChange={set("purchases")} />
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs text-slate-400 font-medium block mb-1">Buy/Booking Link</label>
                            <input className="input" type="url" placeholder="https://..." value={form.buyLink} onChange={set("buyLink")} />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="submit" className="btn-primary flex-1 justify-center" disabled={saving}>
                            {saving ? "Saving…" : mode === "add" ? "Add Location" : "Save Changes"}
                        </button>
                        <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Map Section ──────────────────────────────────────────────────────────────

function MapSection({ devToken, isSuperAdmin }: { devToken: string | null; isSuperAdmin: boolean }) {
    const dbLocations = useQuery(api.mapLocations.list) ?? [];
    const createMut = useMutation(api.mapLocations.create);
    const updateMut = useMutation(api.mapLocations.update);
    const removeMut = useMutation(api.mapLocations.remove);

    const showMap = useQuery(api.globalSettings.get, { key: "showInteractiveMap" });
    const mapTitle = useQuery(api.globalSettings.get, { key: "mapTitle" }) || "Interactive Experience";
    const setSettingMut = useMutation(api.globalSettings.setSetting);

    const [modal, setModal] = useState<{ mode: "add" | "edit"; id?: string; initial: LocationFormData } | null>(null);
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const [filterState, setFilterState] = useState<string>("");
    const [filterCity, setFilterCity] = useState<string>("");
    const [editingTitle, setEditingTitle] = useState(false);
    const [tempTitle, setTempTitle] = useState("");

    // Filter locations based on dropdowns
    const filteredLocations = dbLocations.filter(loc => {
        if (filterState && loc.state !== filterState) return false;
        if (filterCity && loc.city !== filterCity) return false;
        return true;
    });

    // Build carousel-compatible location array from Convex data
    const carouselLocations = filteredLocations.map(loc => ({
        name: loc.name,
        subtitle: (loc.productBy ? `Product by ${loc.productBy} from ` : '') + (loc.subtitle || ''),
        image: loc.image,
        price: loc.price,
        priceLabel: loc.priceLabel || `₹${loc.price} per night`,
        priceSubtext: loc.purchases !== undefined && loc.purchases !== null
            ? `${loc.priceSubtext || ""} • ${loc.purchases} users bought`.trim()
            : loc.priceSubtext,
        rating: loc.rating,
        coordinates: [loc.lat, loc.lng] as [number, number],
        buyLink: loc.buyLink, // Store custom property to use in onSelectLocation
    }));

    const handleSave = async (form: LocationFormData) => {
        setSaving(true);
        try {
            const base = {
                name: form.name,
                productBy: form.productBy || undefined,
                subtitle: form.subtitle || undefined,
                image: form.image || undefined,
                price: parseFloat(form.price),
                priceLabel: form.priceLabel || undefined,
                priceSubtext: form.priceSubtext || undefined,
                rating: form.rating ? parseFloat(form.rating) : undefined,
                lat: parseFloat(form.lat),
                lng: parseFloat(form.lng),
                purchases: form.purchases ? parseInt(form.purchases, 10) : undefined,
                state: form.state || undefined,
                city: form.city || undefined,
                buyLink: form.buyLink || undefined,
                devToken: devToken || undefined,
            };
            if (modal?.mode === "add") {
                await createMut(base);
            } else if (modal?.id) {
                await updateMut({ id: modal.id as any, ...base });
            }
            setModal(null);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        await removeMut({ id: id as any, devToken: devToken || undefined });
        setConfirmDelete(null);
    };

    if (showMap === false && !isSuperAdmin) {
        return null;
    }

    return (
        <div className="mt-16 mb-8 animate-fade-in w-full">
            {/* Section header & Filters */}
            <div className={`flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 ${isSuperAdmin ? "" : "justify-center"}`}>
                <div className={`flex items-center gap-3 ${isSuperAdmin ? "" : "w-full justify-center"}`}>

                    {/* Map Title (Animated & Editable) */}
                    {editingTitle ? (
                        <div className="flex items-center gap-2 w-full max-w-sm">
                            <input
                                autoFocus
                                className="input flex-1 h-9"
                                value={tempTitle}
                                onChange={(e) => setTempTitle(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        setSettingMut({ key: "mapTitle", value: tempTitle, devToken: devToken || undefined });
                                        setEditingTitle(false);
                                    }
                                }}
                            />
                            <button onClick={() => {
                                setSettingMut({ key: "mapTitle", value: tempTitle, devToken: devToken || undefined });
                                setEditingTitle(false);
                            }} className="btn-primary h-9 px-3">Save</button>
                        </div>
                    ) : (
                        <div className={`group flex items-center gap-3 text-center ${isSuperAdmin ? "" : "flex-col justify-center animate-slide-up py-10"}`}>
                            {!isSuperAdmin && (
                                <div className="p-4 rounded-full bg-brand-500/10 border border-brand-500/20 mb-4 animate-bounce">
                                    <Globe className="w-12 h-12 text-brand-400" />
                                </div>
                            )}
                            <h2 className={`font-bold tracking-tight text-center ${isSuperAdmin ? "text-xl text-white" : "text-5xl md:text-7xl text-gradient pb-2 drop-shadow-[0_0_15px_rgba(0,212,255,0.3)]"}`}>
                                {isSuperAdmin && <Globe className="w-5 h-5 text-brand-400 mr-2" />}
                                {mapTitle}
                            </h2>
                            {!isSuperAdmin && (
                                <p className="text-slate-400 text-lg md:text-xl mt-4 max-w-2xl mx-auto animate-fade-in [animation-delay:400ms] leading-relaxed">
                                    Experience your data like never before.
                                    <span className="text-white block font-medium mt-1">Explore interactive regional insights across India.</span>
                                </p>
                            )}
                            {isSuperAdmin && (
                                <button
                                    onClick={() => { setTempTitle(mapTitle); setEditingTitle(true); }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-white"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    )}

                    {isSuperAdmin && (
                        <button
                            onClick={() => setSettingMut({ key: "showInteractiveMap", value: !showMap, devToken: devToken || undefined })}
                            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border transition-all ${showMap ? "text-green-400 border-green-400/30 bg-green-400/10 hover:bg-green-400/20" : "text-slate-400 border-slate-600 bg-surface hover:bg-surface-hover"
                                }`}
                        >
                            {showMap ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            {showMap ? "Visible" : "Hidden"}
                        </button>
                    )}
                </div>

                {isSuperAdmin && (
                    <div className="flex flex-wrap items-center gap-3">
                        <select
                            className="input h-9 text-sm py-0 w-36 hover:border-brand-500/50 transition-colors"
                            value={filterState}
                            onChange={(e) => { setFilterState(e.target.value); setFilterCity(""); }}
                        >
                            <option value="">All States</option>
                            {Object.keys(INDIA_LOCATIONS).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>

                        <select
                            className="input h-9 text-sm py-0 w-36 hover:border-brand-500/50 transition-colors"
                            value={filterCity}
                            onChange={(e) => setFilterCity(e.target.value)}
                            disabled={!filterState}
                        >
                            <option value="">All Cities</option>
                            {filterState && INDIA_LOCATIONS[filterState]?.map(c => (
                                <option key={c.city} value={c.city}>{c.city}</option>
                            ))}
                        </select>

                        <button
                            className="btn-primary h-9 px-4 ml-2"
                            onClick={() => setModal({ mode: "add", initial: emptyForm })}
                        >
                            <Plus className="w-4 h-4" />
                            Add Location
                        </button>
                    </div>
                )}
            </div>

            {/* Quick Stats (Super Admin only) */}
            {isSuperAdmin && filteredLocations.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mb-6 animate-fade-in">
                    <div className="card p-4 border-l-2 border-l-brand-500">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Locations</p>
                        <p className="text-2xl font-bold text-white mt-1">{filteredLocations.length}</p>
                    </div>
                    <div className="card p-4 border-l-2 border-l-purple-500">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Purchases</p>
                        <p className="text-2xl font-bold text-white mt-1">
                            {filteredLocations.reduce((sum, loc) => sum + (loc.purchases || 0), 0)}
                        </p>
                    </div>
                    <div className="card p-4 border-l-2 border-l-green-500">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Rating</p>
                        <p className="text-2xl font-bold text-white mt-1">
                            {(filteredLocations.reduce((sum, loc) => sum + (loc.rating || 0), 0) /
                                (filteredLocations.filter(loc => loc.rating).length || 1)).toFixed(1)}
                        </p>
                    </div>
                </div>
            )}

            {/* Map carousel */}
            {carouselLocations.length > 0 ? (
                <div className="relative z-0 rounded-2xl overflow-hidden border border-surface-border shadow-[0_0_40px_rgba(0,212,255,0.15)] ring-1 ring-brand-500/20">
                    <MapCarousel
                        data={{
                            title: filterCity ? `${filterCity} Locations` : filterState ? `${filterState} Locations` : "Featured Locations in India",
                            locations: carouselLocations,
                            center: carouselLocations.length > 0
                                ? [carouselLocations[0].coordinates[0], carouselLocations[0].coordinates[1]]
                                : [20.5937, 78.9629], /* Default: India */
                            zoom: carouselLocations.length === 1 ? 12 : 5,
                            mapStyle: "dark-matter",
                        }}
                        actions={{
                            onSelectLocation: (loc: any) => {
                                if (loc.buyLink) {
                                    window.open(loc.buyLink, "_blank");
                                } else {
                                    console.log("Selected:", loc.name);
                                }
                            }
                        }}
                        appearance={{ displayMode: "inline", mapHeight: "500px" }}
                    />
                </div>
            ) : (
                <div className="card border-dashed border-2 bg-transparent py-16 flex flex-col items-center gap-3 text-center">
                    <MapPin className="w-10 h-10 text-slate-600" />
                    <p className="text-slate-400 text-sm">No locations yet.</p>
                    {isSuperAdmin && (
                        <button className="btn-primary mt-2" onClick={() => setModal({ mode: "add", initial: emptyForm })}>
                            <Plus className="w-4 h-4" />
                            Add First Location
                        </button>
                    )}
                </div>
            )}

            {/* Super admin location list (manage) */}
            {isSuperAdmin && filteredLocations.length > 0 && (
                <div className="mt-8">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        Manage Locations
                        <span className="bg-surface-hover px-2 py-0.5 rounded-full text-[10px]">{filteredLocations.length}</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {filteredLocations.map(loc => (
                            <div key={loc._id} className="card p-4 group relative overflow-hidden hover:border-brand-500/30 transition-all">
                                <div className="flex items-start gap-3">
                                    {loc.image ? (
                                        <img src={loc.image} alt={loc.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0">
                                            <MapPin className="w-5 h-5 text-brand-400" />
                                        </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <p className="font-semibold text-white text-sm truncate">{loc.name}</p>
                                        {loc.subtitle && <p className="text-slate-500 text-xs truncate">{loc.subtitle}</p>}
                                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                            <span className="flex items-center gap-1 text-brand-400 text-xs font-semibold">
                                                <IndianRupee className="w-3 h-3" />{loc.price}
                                            </span>
                                            {loc.rating && (
                                                <span className="flex items-center gap-1 text-green-400 text-xs font-semibold">
                                                    <Star className="w-3 h-3 fill-green-400" />{loc.rating}
                                                </span>
                                            )}
                                            {loc.purchases !== undefined && (
                                                <span className="flex items-center gap-1 text-purple-400 text-xs font-semibold">
                                                    <ShoppingCart className="w-3 h-3" />{loc.purchases} bought
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Action buttons */}
                                <div className="flex gap-2 mt-3 pt-3 border-t border-surface-border">
                                    <button
                                        onClick={() => setModal({
                                            mode: "edit",
                                            id: loc._id,
                                            initial: {
                                                name: loc.name,
                                                productBy: loc.productBy ?? "",
                                                subtitle: loc.subtitle ?? "",
                                                image: loc.image ?? "",
                                                price: String(loc.price),
                                                priceLabel: loc.priceLabel ?? "",
                                                priceSubtext: loc.priceSubtext ?? "",
                                                rating: loc.rating ? String(loc.rating) : "",
                                                lat: String(loc.lat),
                                                lng: String(loc.lng),
                                                purchases: loc.purchases !== undefined ? String(loc.purchases) : "",
                                                state: loc.state ?? "",
                                                city: loc.city ?? "",
                                                buyLink: loc.buyLink ?? "",
                                            }
                                        })}
                                        className="flex-1 flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-white hover:bg-surface-hover rounded-lg py-1.5 transition-all"
                                    >
                                        <Pencil className="w-3.5 h-3.5" />
                                        Edit
                                    </button>
                                    {confirmDelete === loc._id ? (
                                        <div className="flex gap-1.5">
                                            <button
                                                onClick={() => handleDelete(loc._id)}
                                                className="text-[10px] text-red-100 px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 transition-colors"
                                            >
                                                Confirm
                                            </button>
                                            <button
                                                onClick={() => setConfirmDelete(null)}
                                                className="text-[10px] text-slate-500 px-2.5 py-1 rounded-lg bg-surface hover:bg-surface-hover transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setConfirmDelete(loc._id)}
                                            className="flex items-center justify-center gap-1.5 text-xs text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg px-3 py-1.5 transition-all"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Modal */}
            {modal && (
                <LocationModal
                    mode={modal.mode}
                    initial={modal.initial}
                    onSave={handleSave}
                    onClose={() => setModal(null)}
                    saving={saving}
                />
            )}
        </div>
    );
}


export default function AdminLocationsPage() {
   const [devToken, setDevToken] = useState<string | null>(null);
   useEffect(() => {
       const stored = localStorage.getItem("bugscribe_dev_token");
       if (stored) setDevToken(stored);
   }, []);

   const currentUser = useQuery(api.users.currentUser, { devToken: devToken || undefined });
   const isSuperAdmin = currentUser?.role === "super_admin";

   return (
      <div className="min-h-screen bg-surface">
         <Navbar />
         <div className="max-w-7xl mx-auto px-4 py-8">
            <MapSection devToken={devToken} isSuperAdmin={isSuperAdmin} />
         </div>
      </div>
   );
}
