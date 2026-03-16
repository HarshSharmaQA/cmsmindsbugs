const CONVEX_URL = "https://limitless-chinchilla-790.convex.cloud";

document.addEventListener("DOMContentLoaded", async () => {
    // ── Elements ─────────────────────────────────────────────────────────────
    const views = {
        login: document.getElementById("loginView"),
        project: document.getElementById("projectView"),
        actions: document.getElementById("actionsView"),
        bugs: document.getElementById("bugListView"),
        report: document.getElementById("reportView"),
        setup: document.getElementById("setupView"),
        success: document.getElementById("successView")
    };

    const setupConnectionKey = document.getElementById("setupConnectionKey");
    const saveSetupBtn = document.getElementById("saveSetupBtn");
    const setupErrorMsg = document.getElementById("setupErrorMsg");
    const settingsBtn = document.getElementById("settingsBtn");

    // --- Loading State & Auth Check ---
    chrome.storage.local.get(["bugscribeProjectId", "bugscribeApiKey", "bugscribeConnectionKey"], (result) => {
        if (result.bugscribeProjectId && result.bugscribeApiKey) {
            if (result.bugscribeConnectionKey) {
                setupConnectionKey.value = result.bugscribeConnectionKey;
            }
            // Auto-login if we have keys
            currentUser = { id: "ext-user" }; // Mock user for ext
            loadProjects();
        } else {
            switchView("setup");
        }
    });

    settingsBtn.addEventListener("click", () => switchView("setup"));

    saveSetupBtn.addEventListener("click", () => {
        const connectionKey = setupConnectionKey.value.trim();
        setupErrorMsg.style.display = "none";
        setupErrorMsg.textContent = "";

        if (!connectionKey) {
            setupErrorMsg.textContent = "Please enter a connection key.";
            setupErrorMsg.style.display = "block";
            return;
        }

        try {
            const decoded = atob(connectionKey);
            const [projectId, apiKey] = decoded.split(":");
            if (!projectId || !apiKey) throw new Error();

            chrome.storage.local.set({
                bugscribeProjectId: projectId,
                bugscribeApiKey: apiKey,
                bugscribeConnectionKey: connectionKey
            }, () => {
                showBanner("success", "Connection successful!");
                loadProjects();
            });
        } catch (e) {
            setupErrorMsg.textContent = "Invalid connection key format.";
            setupErrorMsg.style.display = "block";
        }
    });

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

    // Report Elements
    const cancelReportBtn = document.getElementById("cancelReportBtn");
    const submitBugBtn = document.getElementById("submitBugBtn");
    const annotationCanvas = document.getElementById("annotationCanvas");
    const bugTitleInput = document.getElementById("bugTitle");
    const bugDescInput = document.getElementById("bugDescription");
    const bugTypeInput = document.getElementById("bugType");
    const bugPriorityInput = document.getElementById("bugPriority");
    const undoBtn = document.getElementById("undoBtn");
    const clearCanvasBtn = document.getElementById("clearCanvasBtn");

    // ── State ────────────────────────────────────────────────────────────────
    let currentUser = null;
    let projects = [];
    let selectedProject = null;
    let currentScreenshot = null;
    let canvasCtx = null;
    let drawing = false;
    let currentTool = "pen";
    let currentColor = "#ef4444";
    let startX, startY, snapshot;
    let undoStack = [];

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
        reportBtn.disabled = true;
        reportBtn.innerHTML = '<div class="loading-spinner"></div> Capturing...';
        
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0]) {
                reportBtn.disabled = false;
                reportBtn.innerHTML = "<span>📸</span> Report Bug on Current Page";
                return;
            }
            
            chrome.runtime.sendMessage({ action: "capture-screenshot" }, async (response) => {
                reportBtn.disabled = false;
                reportBtn.innerHTML = "<span>📸</span> Report Bug on Current Page";
                
                if (response && response.dataUrl) {
                    currentScreenshot = response.dataUrl;
                    await initReportView(response.dataUrl);
                } else {
                    showBanner("error", "Failed to capture screenshot. Try refreshing the page.");
                }
            });
        });
    });

    async function initReportView(dataUrl) {
        switchView("report");
        bugTitleInput.value = "";
        bugDescInput.value = "";
        
        const img = new Image();
        img.src = dataUrl;
        await new Promise(r => img.onload = r);
        
        // Setup canvas size based on image aspect ratio while keeping width manageable
        const container = annotationCanvas.parentElement;
        const width = container.clientWidth;
        const height = (img.height / img.width) * width;
        
        annotationCanvas.width = img.width;
        annotationCanvas.height = img.height;
        
        canvasCtx = annotationCanvas.getContext("2d");
        canvasCtx.drawImage(img, 0, 0);
        
        undoStack = [];
        saveCanvasState();
        
        initCanvasEvents();
    }

    function saveCanvasState() {
        if (undoStack.length >= 20) undoStack.shift();
        undoStack.push(canvasCtx.getImageData(0, 0, annotationCanvas.width, annotationCanvas.height));
    }

    function initCanvasEvents() {
        const getPos = (e) => {
            const rect = annotationCanvas.getBoundingClientRect();
            const scaleX = annotationCanvas.width / rect.width;
            const scaleY = annotationCanvas.height / rect.height;
            return {
                x: (e.clientX - rect.left) * scaleX,
                y: (e.clientY - rect.top) * scaleY
            };
        };

        const start = (e) => {
            drawing = true;
            const pos = getPos(e);
            startX = pos.x; startY = pos.y;
            snapshot = canvasCtx.getImageData(0, 0, annotationCanvas.width, annotationCanvas.height);
            
            if (currentTool === "pen") {
                canvasCtx.beginPath();
                canvasCtx.moveTo(startX, startY);
                canvasCtx.strokeStyle = currentColor;
                canvasCtx.lineWidth = 10;
                canvasCtx.lineCap = "round";
                canvasCtx.lineJoin = "round";
            }
        };

        const move = (e) => {
            if (!drawing) return;
            const pos = getPos(e);
            
            if (currentTool === "pen") {
                canvasCtx.lineTo(pos.x, pos.y);
                canvasCtx.stroke();
            } else {
                canvasCtx.putImageData(snapshot, 0, 0);
                canvasCtx.strokeStyle = currentColor;
                canvasCtx.lineWidth = 10;
                
                if (currentTool === "arrow") {
                    drawArrow(startX, startY, pos.x, pos.y);
                } else if (currentTool === "rect") {
                    canvasCtx.strokeRect(startX, startY, pos.x - startX, pos.y - startY);
                } else if (currentTool === "circle") {
                    const rx = Math.abs(pos.x - startX) / 2;
                    const ry = Math.abs(pos.y - startY) / 2;
                    const cx = startX + (pos.x - startX) / 2;
                    const cy = startY + (pos.y - startY) / 2;
                    canvasCtx.beginPath();
                    canvasCtx.ellipse(cx, cy, Math.max(rx, 1), Math.max(ry, 1), 0, 0, 2 * Math.PI);
                    canvasCtx.stroke();
                } else if (currentTool === "blur") {
                    canvasCtx.filter = "blur(20px)";
                    canvasCtx.drawImage(annotationCanvas, startX, startY, pos.x - startX, pos.y - startY, startX, startY, pos.x - startX, pos.y - startY);
                    canvasCtx.filter = "none";
                }
            }
        };

        const stop = () => {
            if (drawing) {
                drawing = false;
                saveCanvasState();
            }
        };

        const drawArrow = (x1, y1, x2, y2) => {
            const headLen = 40;
            const angle = Math.atan2(y2 - y1, x2 - x1);
            canvasCtx.beginPath();
            canvasCtx.moveTo(x1, y1);
            canvasCtx.lineTo(x2, y2);
            canvasCtx.stroke();
            canvasCtx.beginPath();
            canvasCtx.moveTo(x2, y2);
            canvasCtx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
            canvasCtx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
            canvasCtx.closePath();
            canvasCtx.fillStyle = currentColor;
            canvasCtx.fill();
        };

        // Text tool – click to place
        const handleText = (e) => {
            if (currentTool !== "text" || drawing) return;
            const text = prompt("Enter annotation text:");
            if (!text) return;
            const pos = getPos(e);
            canvasCtx.font = "bold 60px Inter, sans-serif";
            canvasCtx.fillStyle = currentColor;
            canvasCtx.fillText(text, pos.x, pos.y);
            saveCanvasState();
        };

        annotationCanvas.onmousedown = start;
        window.onmousemove = move;
        window.onmouseup = stop;
        annotationCanvas.onclick = handleText;
    }

    // Tool selection
    document.querySelectorAll(".tool-btn[data-tool]").forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll(".tool-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentTool = btn.dataset.tool;
        };
    });

    // Color selection
    document.querySelectorAll(".color-dot").forEach(dot => {
        dot.onclick = () => {
            document.querySelectorAll(".color-dot").forEach(d => d.classList.remove("active"));
            dot.classList.add("active");
            currentColor = dot.dataset.color;
        };
    });

    undoBtn.onclick = () => {
        if (undoStack.length > 1) {
            undoStack.pop();
            canvasCtx.putImageData(undoStack[undoStack.length - 1], 0, 0);
        }
    };

    clearCanvasBtn.onclick = () => {
        const img = new Image();
        img.src = currentScreenshot;
        img.onload = () => {
            canvasCtx.drawImage(img, 0, 0);
            undoStack = [];
            saveCanvasState();
        };
    };

    cancelReportBtn.onclick = () => switchView("actions");

    submitBugBtn.onclick = async () => {
        const title = bugTitleInput.value.trim();
        if (!title) {
            showBanner("error", "Please enter a bug title.");
            bugTitleInput.focus();
            return;
        }

        submitBugBtn.disabled = true;
        submitBugBtn.textContent = "Submitting...";

        try {
            // 1. Get image blob from canvas in webp format
            const blob = await new Promise(r => annotationCanvas.toBlob(r, "image/webp", 0.8));
            
            // 2. Get upload URL from Convex
            const uploadUrl = await mutation("bugs:generateUploadUrl", {});
            
            // 3. Upload to storage
            const uploadResp = await fetch(uploadUrl, { method: "POST", body: blob });
            const { storageId } = await uploadResp.json();

            // 4. Create bug record
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            const tab = tabs[0];

            await mutation("bugs:createBug", {
                projectId: selectedProject.id,
                apiKey: selectedProject.apiKey,
                title,
                description: bugDescInput.value,
                type: bugTypeInput.value,
                priority: bugPriorityInput.value,
                screenshotStorageId: storageId,
                url: tab.url,
                browser: navigator.userAgent,
                os: "Extension",
                screenWidth: tab.width,
                screenHeight: tab.height,
                x_coordinate: window.scrollX, // Default to current scroll if no specific coord
                y_coordinate: window.scrollY
            });

            switchView("success");
        } catch (err) {
            showBanner("error", "Failed to submit: " + err.message);
        } finally {
            submitBugBtn.disabled = false;
            submitBugBtn.textContent = "Submit Bug Report";
        }
    };

    document.getElementById("successDoneBtn").onclick = () => switchView("actions");

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
