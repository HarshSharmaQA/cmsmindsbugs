import sys

file_path = "app/page.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

# Replace lines 130 to 755 (indices 129 to 755)
# Actually, let's just use string replace or range replace.
content = """// ─── DashboardContent Component ────────────────────────────────────────────────

function DashboardContent({ devToken }: { devToken: string }) {
    const { toast } = useToast();
    const [showForm, setShowForm] = useState(false);
    const [projName, setProjName] = useState("");
    const [projDomain, setProjDomain] = useState("");
    const [projDescription, setProjDescription] = useState("");
    const [creating, setCreating] = useState(false);
    const [newApiKey, setNewApiKey] = useState<string | null>(null);
    const [showUserManagement, setShowUserManagement] = useState(false);
    const [userSearch, setUserSearch] = useState("");
    const [userFilter, setUserFilter] = useState<"all" | "pending" | "approved">("all");

    const projects = useQuery(api.projects.listProjects, { devToken: devToken || undefined });
    const currentUser = useQuery(api.users.currentUser, { devToken: devToken || undefined });
    const isSuperAdmin = currentUser?.role === "super_admin";

    const allUsers = useQuery(api.users.listUsersForAdmin, { devToken: devToken || undefined });
    const approveUserMut = useMutation(api.users.approveUser);
    const setRoleMut = useMutation(api.users.setUserRole);
    const deleteUserMut = useMutation(api.users.deleteUser);

    const createProject = useMutation(api.projects.createProject);
    const deleteProject = useMutation(api.projects.deleteProject);

    const filteredUsers = (allUsers ?? []).filter(u => {
        const matchSearch = !userSearch ||
            u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
            u.email.toLowerCase().includes(userSearch.toLowerCase());
        const matchFilter =
            userFilter === "all" ||
            (userFilter === "pending" && !u.isApproved) ||
            (userFilter === "approved" && u.isApproved);
        return matchSearch && matchFilter;
    });

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!projName.trim()) return;
        setCreating(true);
        try {
            const result = await createProject({
                name: projName.trim(),
                domain: projDomain.trim() || undefined,
                description: projDescription.trim() || undefined,
                devToken: devToken || undefined,
            });
            setNewApiKey(result.apiKey);
            setProjName("");
            setProjDomain("");
            setProjDescription("");
            setShowForm(false);
            toast.success("Project created successfully!");
        } catch (err: any) {
            toast.error(err.message || "Failed to create project.");
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="mt-12">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 animate-slide-up">
                <div>
                    <h1 className="text-2xl font-bold text-white">Projects</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Manage your tracked applications
                    </p>
                </div>
                <button onClick={() => setShowForm(!showForm)} className="btn-primary">
                    <Plus className="w-4 h-4" />
                    New Project
                </button>
            </div>

            {isSuperAdmin && (
                <div className="mb-8 flex gap-3 animate-slide-up">
                    <button
                        onClick={() => setShowUserManagement(!showUserManagement)}
                        className={`btn-ghost flex items-center gap-2 ${showUserManagement ? "bg-brand-500/10 border-brand-500/30 text-white" : ""}`}
                    >
                        <Users className="w-4 h-4" />
                        Manage Users
                        {(allUsers?.filter(u => !u.isApproved).length ?? 0) > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full bg-orange-500 text-black text-[10px] font-bold">
                                {allUsers?.filter(u => !u.isApproved).length}
                            </span>
                        )}
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showUserManagement ? "rotate-180" : ""}`} />
                    </button>
                </div>
            )}

            {isSuperAdmin && showUserManagement && (
                <div className="card p-6 mb-12 animate-slide-up border-brand-500/20">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <Shield className="w-5 h-5 text-brand-400" />
                                User Management
                            </h2>
                            <p className="text-xs text-slate-500 mt-1">{allUsers?.length ?? 0} total users</p>
                        </div>
                        {/* Stats pills */}
                        <div className="flex gap-2 flex-wrap">
                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold">
                                <Check className="w-3 h-3" />
                                {allUsers?.filter(u => u.isApproved).length ?? 0} Approved
                            </span>
                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold">
                                <AlertTriangle className="w-3 h-3" />
                                {allUsers?.filter(u => !u.isApproved).length ?? 0} Pending
                            </span>
                        </div>
                    </div>

                    {/* Search + Filter */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-5">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                            <input
                                className="input pl-9 text-sm"
                                placeholder="Search by name or email…"
                                value={userSearch}
                                onChange={e => setUserSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex rounded-lg border border-surface-border overflow-hidden text-xs font-medium">
                            {(["all", "approved", "pending"] as const).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setUserFilter(f)}
                                    className={`px-3 py-2 capitalize transition-colors ${userFilter === f ? "bg-brand-500/20 text-brand-300" : "text-slate-400 hover:text-white"}`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* User list */}
                    <div className="space-y-2">
                        {filteredUsers.length === 0 && (
                            <p className="text-slate-500 text-sm text-center py-8">No users match your search.</p>
                        )}
                        {filteredUsers.map(user => (
                            <UserRow
                                key={user._id}
                                user={user}
                                currentUserEmail={currentUser?.email ?? ""}
                                onApprove={async () => {
                                    await approveUserMut({ email: user.email, devToken: devToken || undefined });
                                    toast.success(`${user.name || user.email} approved`);
                                }}
                                onRoleChange={async (role: "user" | "super_admin") => {
                                    await setRoleMut({ email: user.email, role, devToken: devToken || undefined });
                                    toast.success("Role updated");
                                }}
                                onDelete={async () => {
                                    await deleteUserMut({ email: user.email, devToken: devToken || undefined });
                                    toast.success(`${user.name || user.email} removed`);
                                }}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* New API Key Banner */}
            {newApiKey && (
                <div className="card p-4 mb-6 border-brand-500/30 bg-brand-500/5 animate-slide-up">
                    <div className="flex items-start gap-3">
                        <Key className="w-5 h-5 text-brand-400 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white">Project created! Here is your Widget API Key:</p>
                            <p className="text-xs text-slate-400 mt-1">Copy this now — it will not be shown again.</p>
                            <code className="mt-2 block bg-surface rounded-lg px-3 py-2 text-brand-300 text-xs font-mono break-all">
                                {newApiKey}
                            </code>
                        </div>
                        <button onClick={() => setNewApiKey(null)} className="text-slate-500 hover:text-slate-300 text-lg leading-none">×</button>
                    </div>
                </div>
            )}

            {/* New Project Form */}
            {showForm && (
                <div className="card p-6 mb-8 animate-slide-up shadow-2xl ring-1 ring-brand-500/20">
                    <h2 className="font-semibold text-white mb-4">Create New Project</h2>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-slate-400 font-medium block mb-1.5">Project Name *</label>
                                <input
                                    className="input"
                                    placeholder="e.g. BugScribe Production"
                                    value={projName}
                                    onChange={(e) => setProjName(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 font-medium block mb-1.5">Domain</label>
                                <input
                                    className="input"
                                    placeholder="e.g. app.bugscribe.io"
                                    value={projDomain}
                                    onChange={(e) => setProjDomain(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 font-medium block mb-1.5">Description</label>
                            <input
                                className="input"
                                placeholder="Visual feedback for the main web application..."
                                value={projDescription}
                                onChange={(e) => setProjDescription(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button type="submit" className="btn-primary" disabled={creating}>
                                {creating ? "Creating..." : "Create Project"}
                            </button>
                            <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Projects Grid */}
            {projects === undefined ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="card p-6 space-y-3">
                            <div className="skeleton h-5 w-3/4" />
                            <div className="skeleton h-4 w-1/2" />
                            <div className="skeleton h-4 w-full" />
                        </div>
                    ))}
                </div>
            ) : projects.length === 0 ? (
                <div className="text-center py-24 animate-fade-in card border-dashed border-2 bg-transparent">
                    <div className="w-16 h-16 rounded-2xl bg-surface-card border border-surface-border flex items-center justify-center mx-auto mb-4">
                        <Bug className="w-7 h-7 text-slate-500" />
                    </div>
                    <h3 className="text-white font-semibold text-lg">No projects active</h3>
                    <p className="text-slate-500 text-sm mt-2 mb-6 max-w-sm mx-auto">Create a project and install the snippet to start seeing visual bug reports.</p>
                    <button onClick={() => setShowForm(true)} className="btn-primary mx-auto">
                        <Plus className="w-4 h-4" />
                        Get Started
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projects.map((project: any) => (
                        <ProjectCard
                            key={project._id}
                            project={project}
                            onDelete={async () => {
                                await deleteProject({ projectId: project._id, devToken: devToken || undefined });
                                toast.success("Project deleted.");
                            }}
                            isSuperAdmin={isSuperAdmin}
                            devToken={devToken}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Home Page ────────────────────────────────────────────────────────────────

function HomePageContent() {
    const { toasts, toast, removeToast } = useToast();
    const [devToken, setDevToken] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);

    const currentUser = useQuery(api.users.currentUser, { devToken: devToken || undefined });
    const homePage = useQuery(api.pages.getBySlug, { slug: "home" });
    const isSuperAdmin = currentUser?.role === "super_admin";
    
    // Check ?preview=landing to simulate logged-out view
    const [isPreview, setIsPreview] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            if (params.get("preview") === "landing") {
                setIsPreview(true);
            }
        }
    }, [])

    // Re-verify login status on mount
    useEffect(() => {
        const stored = localStorage.getItem("bugscribe_dev_token");
        if (stored) setDevToken(stored);
        setMounted(true);
    }, []);

    useEffect(() => {
        // Auto-logout if backend confirms user doesn't exist
        if (devToken && currentUser === null) {
            localStorage.removeItem("bugscribe_dev_token");
            setDevToken(null);
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
                setShowLoginModal(true);
                // Clean up URL
                const url = new URL(window.location.href);
                url.searchParams.delete("login");
                window.history.replaceState({}, "", url.toString());
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
        <div className="min-h-screen">
            <Navbar />
            <ToastContainer toasts={toasts} onRemove={removeToast} />

            {/* Login Modal */}
            <LoginModal
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                onSuccess={handleLoginSuccess}
            />

            <main className="max-w-[1600px] mx-auto px-4 py-8">

                {/* ── Render Dynamic Blocks from Database (Always for preview, or for logged-out) ── */}
                {(!devToken || isPreview) && homePage && homePage.isPublished && (
                    <div className="-mx-4 mb-12 relative">
                        {devToken && currentUser?.role === "super_admin" && (
                            <div className="absolute top-4 right-8 z-50">
                                <a href="/admin/pages" className="btn-primary flex items-center gap-2 text-sm shadow-xl hover:scale-105 transition-transform">
                                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                    Edit Global Blocks (Admin)
                                </a>
                            </div>
                        )}
                        {homePage.blocks.map((block: any) => (
                            <RenderBlock key={block.id} block={block} pageSlug="home" />
                        ))}
                    </div>
                )}

                {/* ── Diagonal Scrolling Ticker (Fallback or Preview) ── */}
                {(!devToken || isPreview) && (
                    <div className="-mx-4 overflow-hidden relative">
                        {devToken && currentUser?.role === "super_admin" && (!homePage || !homePage.isPublished) && (
                            <div className="absolute top-4 right-8 z-50">
                                <a href="/admin/pages" className="btn-primary flex items-center gap-2 text-sm shadow-xl hover:scale-105 transition-transform">
                                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                    Initialize Global Blocks (Admin)
                                </a>
                            </div>
                        )}
                        <MarqueeTicker />
                    </div>
                )}

                {/* ── Hero CTA (Fallback or Preview) ── */}
                {(!devToken || isPreview) && (
                    <div className="text-center py-16 animate-fade-in relative">
                        <div
                            className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 mx-auto"
                            style={{
                                background: "rgba(0,212,255,0.08)",
                                border: "1px solid rgba(0,212,255,0.2)",
                                boxShadow: "0 0 40px rgba(0,212,255,0.1)",
                            }}
                        >
                            <Bug className="w-10 h-10 text-brand-500" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
                            Welcome to Bug<span className="text-gradient">Scribe</span>
                        </h1>
                        <p className="text-slate-400 text-lg mb-8 max-w-lg mx-auto leading-relaxed">
                            The visual bug tracking platform built for modern dev teams.
                        </p>
                        <button
                            id="hero-login-btn"
                            onClick={() => setShowLoginModal(true)}
                            className="btn-primary px-8 py-3 text-base"
                        >
                            Sign In to Dashboard
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* ── Dashboard for logged-in users (unless previewing landing page) ── */}
                {devToken && !isPreview && (
                    <DashboardContent devToken={devToken} />
                )}

            </main>
        </div>
    );
}
"""

new_lines = list(lines)[:130] + [content + "\n"] + list(lines)[756:]
with open(file_path, "w", encoding="utf-8") as f:
    f.writelines(new_lines)

print("Done")
