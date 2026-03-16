const CONVEX_URL = "https://limitless-chinchilla-790.convex.cloud";

document.addEventListener("DOMContentLoaded", async () => {
    // ── Elements ─────────────────────────────────────────────────────────────
    const views = {
        login: document.getElementById("loginView"),
        project: document.getElementById("projectView"),
        actions: document.getElementById("actionsView"),
        bugs: document.getElementById("bugListView"),
    };

    const banners = {
        error: document.getElementById("errorBanner"),
        success: document.getElementById("successBanner"),
    };

    // Login Elements
    const loginEmail = document.getElementById("loginEmail");
    const loginPassword = document.getElementById("loginPassword");
    const loginBtn = document.getElementById("loginBtn");

    // Project Select Elements
    const userEmailText = document.getElementById("userEmail");
    const userInitial = document.getElementById("userInitial");
    const projectSelect = document.getElementById("projectSelect");
    const confirmProjectBtn = document.getElementById("confirmProjectBtn");
    const logoutBtn = document.getElementById("logoutBtn");

    // Main Actions Elements
    const activeProjectName = document.getElementById("activeProjectName");
    const switchProjectBtn = document.getElementById("switchProjectBtn");
    const openDashboardBtn = document.getElementById("openDashboardBtn");
    const reportBtn = document.getElementById("reportBtn");
    const showBugsBtn = document.getElementById("showBugsBtn");

    // Bug List Elements
    const bugListContainer = document.getElementById("bugListContainer");
    const backToActionsBtn = document.getElementById("backToActionsBtn");
    const refreshBugsBtn = document.getElementById("refreshBugsBtn");

    // ── State ────────────────────────────────────────────────────────────────
    let currentUser = null;
    let projects = [];
    let selectedProject = null;

    // ── Utils ────────────────────────────────────────────────────────────────
    function switchView(viewName) {
        Object.values(views).forEach(v => v.classList.remove("active"));
        views[viewName].classList.add("active");
    }

    function showBanner(type, message) {
        const el = banners[type];
        el.textContent = message; // Safe: textContent not innerHTML
        el.style.display = "block";
        setTimeout(() => { el.style.display = "none"; }, 5000);
    }

    // Sanitize user-supplied strings before inserting into DOM
    function escapeHtml(str) {
        if (typeof str !== "string") return String(str ?? "");
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    async function convexRequest(type, path, args) {
        const url = `${CONVEX_URL}/api/${type}`;
        try {
            const resp = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ path, args, format: "json" }),
            });
            const data = await resp.json();
            if (data.status === "error") {
                throw new Error(data.errorMessage || "Convex error");
            }
            return data.value;
        } catch (err) {
            console.error(`Convex ${type} error [${path}]:`, err);
            throw err;
        }
    }

    const query = (path, args = {}) => convexRequest("query", path, args);
    const mutation = (path, args = {}) => convexRequest("mutation", path, args);

    async function loadAppState() {
        const storage = await chrome.storage.local.get([
            "bugscribeTokenIdentifier",
            "bugscribeUserEmail",
            "bugscribeProjectId",
            "bugscribeProjectName",
            "bugscribeApiKey"
        ]);

        if (storage.bugscribeTokenIdentifier) {
            // Hotfix: if the token is secretly an object (from the old bug), clear it!
            if (typeof storage.bugscribeTokenIdentifier === "object") {
                await chrome.storage.local.remove(["bugscribeTokenIdentifier", "bugscribeUserEmail"]);
                switchView("login");
                return;
            }

            currentUser = {
                tokenIdentifier: storage.bugscribeTokenIdentifier,
                email: storage.bugscribeUserEmail
            };
            userEmailText.textContent = currentUser.email;
            userInitial.textContent = (currentUser.email || "U")[0].toUpperCase();

            if (storage.bugscribeProjectId) {
                selectedProject = {
                    id: storage.bugscribeProjectId,
                    name: storage.bugscribeProjectName,
                    apiKey: storage.bugscribeApiKey
                };
                activeProjectName.textContent = selectedProject.name;
                switchView("actions");
            } else {
                await fetchAndShowProjects();
            }
        } else {
            switchView("login");
        }
    }

    async function fetchAndShowProjects() {
        if (!currentUser) return;
        try {
            // Safe: use innerHTML only for static strings (no user data)
            projectSelect.innerHTML = '<option value="" disabled selected>Loading projects...</option>';
            projects = await query("projects:listProjects", { devToken: currentUser.tokenIdentifier });

            // Build options safely using DOM API to prevent XSS from server data
            projectSelect.innerHTML = "";
            if (projects.length === 0) {
                const opt = document.createElement("option");
                opt.value = "";
                opt.disabled = true;
                opt.textContent = "No projects found";
                projectSelect.appendChild(opt);
            } else {
                projects.forEach(p => {
                    const opt = document.createElement("option");
                    opt.value = escapeHtml(p._id);   // IDs are safe, but escape anyway
                    opt.textContent = p.name;         // textContent auto-escapes
                    projectSelect.appendChild(opt);
                });
                projectSelect.selectedIndex = 0;
            }

            switchView("project");
        } catch (err) {
            showBanner("error", "Failed to load projects: " + err.message);
        }
    }

    async function fetchAndShowBugs() {
        if (!selectedProject || !currentUser) return;
        try {
            // Safe: static HTML string (no user data)
            bugListContainer.innerHTML = '<div class="text-center" style="padding:20px; color:var(--text-muted); font-size:12px;">Loading reports...</div>';
            const bugs = await query("bugs:getBugs", {
                projectId: selectedProject.id,
                devToken: currentUser.tokenIdentifier
            });

            if (bugs.length === 0) {
                bugListContainer.innerHTML = '<div class="text-center" style="padding:20px; color:var(--text-muted); font-size:12px;">No bugs reported yet.</div>';
                return;
            }

            // Build bug list using safe DOM API — no innerHTML with server data
            bugListContainer.innerHTML = "";
            bugs.forEach(bug => {
                const item = document.createElement("div");
                item.className = "bug-item";
                item.style.cursor = "pointer";
                item.onclick = () => locateBugOnPage(bug);

                const titleRow = document.createElement("div");
                titleRow.style.display = "flex";
                titleRow.style.justifyContent = "space-between";
                titleRow.style.alignItems = "flex-start";
                titleRow.style.gap = "8px";

                const titleEl = document.createElement("div");
                titleEl.className = "bug-title";
                titleEl.title = bug.title;
                titleEl.textContent = bug.title;
                titleEl.style.flex = "1";

                const prioritySpan = document.createElement("span");
                prioritySpan.className = `priority-pill priority-${escapeHtml(bug.priority)}`;
                prioritySpan.textContent = bug.priority;
                
                titleRow.appendChild(titleEl);
                titleRow.appendChild(prioritySpan);

                const metaEl = document.createElement("div");
                metaEl.className = "bug-meta";

                const statusSpan = document.createElement("span");
                statusSpan.className = `status-pill status-${escapeHtml(bug.status)}`;
                statusSpan.textContent = bug.status.replace("_", " ");

                const dateSpan = document.createElement("span");
                dateSpan.style.marginLeft = "auto";
                dateSpan.textContent = new Date(bug.createdAt).toLocaleDateString();

                metaEl.appendChild(statusSpan);
                metaEl.appendChild(dateSpan);
                
                item.appendChild(titleRow);
                item.appendChild(metaEl);
                bugListContainer.appendChild(item);
            });
        } catch (err) {
            showBanner("error", "Failed to load bugs: " + err.message);
        }
    }

    function locateBugOnPage(bug) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0]) return;
            
            // Build the highlight URL
            let targetUrl;
            try {
                targetUrl = new URL(bug.url);
            } catch (e) {
                console.error("Invalid bug URL:", bug.url);
                return;
            }

            const params = new URLSearchParams();
            params.set("bugscribe-highlight", `${bug.x_coordinate},${bug.y_coordinate}`);
            params.set("bugscribe-scroll", bug.scrollY || bug.y_coordinate);
            if (bug.element_selector) {
                params.set("bugscribe-selector", bug.element_selector);
            }
            
            targetUrl.hash = params.toString();
            
            // If we are already on the same page, just updating the hash is enough
            // because of the hashchange listener in the widget.
            // However, to be extra safe, we'll force a reload if the user clicks again.
            const currentUrl = new URL(tabs[0].url);
            if (currentUrl.origin === targetUrl.origin && currentUrl.pathname === targetUrl.pathname) {
                chrome.tabs.update(tabs[0].id, { url: targetUrl.toString() });
            } else {
                chrome.tabs.update(tabs[0].id, { url: targetUrl.toString() });
            }
            showBanner("success", "Locating bug on page...");
        });
    }

    // ── Auth Handlers ────────────────────────────────────────────────────────
    loginBtn.addEventListener("click", async () => {
        const email = loginEmail.value.trim();
        const password = loginPassword.value;

        if (!email || !password) {
            showBanner("error", "Please enter email and password.");
            return;
        }

        loginBtn.disabled = true;
        loginBtn.innerHTML = '<div class="loading-spinner"></div>';

        try {
            const result = await mutation("users:loginUser", { email, password });
            const tokenIdentifier = result.token;

            if (!result.isApproved) {
                showBanner("error", "Your account is pending approval. Please wait for an admin to approve your access.");
                return;
            }

            currentUser = { tokenIdentifier, email };
            userEmailText.textContent = email;
            userInitial.textContent = email[0].toUpperCase();

            await chrome.storage.local.set({
                bugscribeTokenIdentifier: tokenIdentifier,
                bugscribeUserEmail: email
            });

            showBanner("success", "Logged in successfully!");
            await fetchAndShowProjects();
        } catch (err) {
            showBanner("error", "Login failed: " + err.message);
        } finally {
            loginBtn.disabled = false;
            loginBtn.innerHTML = "<span>Login</span>";
        }
    });

    logoutBtn.addEventListener("click", async () => {
        await chrome.storage.local.clear();
        currentUser = null;
        selectedProject = null;
        switchView("login");
    });

    // ── Project Handlers ─────────────────────────────────────────────────────
    confirmProjectBtn.addEventListener("click", async () => {
        const projectId = projectSelect.value;
        const project = projects.find(p => p._id === projectId);

        if (!project) return;

        selectedProject = {
            id: project._id,
            name: project.name,
            apiKey: project.apiKey
        };

        await chrome.storage.local.set({
            bugscribeProjectId: selectedProject.id,
            bugscribeProjectName: selectedProject.name,
            bugscribeApiKey: selectedProject.apiKey,
            bugscribeConvexUrl: CONVEX_URL
        });

        activeProjectName.textContent = selectedProject.name;
        switchView("actions");

        // Re-inject content script into current tab
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    files: ["content.js"]
                }).catch(err => console.log("Injection skip:", err));
            }
        });
    });

    switchProjectBtn.addEventListener("click", () => {
        fetchAndShowProjects();
    });

    // ── Action Handlers ──────────────────────────────────────────────────────
    reportBtn.addEventListener("click", () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0]) return;
            const tabId = tabs[0].id;

            chrome.tabs.sendMessage(tabId, { action: "trigger-report" }, (response) => {
                if (chrome.runtime.lastError) {
                    chrome.scripting.executeScript({
                        target: { tabId },
                        files: ["content.js"]
                    }, () => {
                        setTimeout(() => {
                            chrome.tabs.sendMessage(tabId, { action: "trigger-report" }, (resp2) => {
                                if (chrome.runtime.lastError) {
                                    showBanner("error", "Could not connect to page. Refresh the page and try again.");
                                }
                            });
                        }, 500);
                    });
                }
            });
        });
    });

    openDashboardBtn.addEventListener("click", () => {
        const url = selectedProject
            ? `https://bugscribe.com/dashboard/${selectedProject.id}`
            : "https://bugscribe.com";
        window.open(url, "_blank");
    });

    showBugsBtn.addEventListener("click", () => {
        switchView("bugs");
        fetchAndShowBugs();
    });

    // ── Bug List Handlers ────────────────────────────────────────────────────
    backToActionsBtn.addEventListener("click", () => switchView("actions"));
    refreshBugsBtn.addEventListener("click", () => fetchAndShowBugs());

    // ── Init ─────────────────────────────────────────────────────────────────
    loadAppState();
});
