document.addEventListener("DOMContentLoaded", async () => {
    // Guard: toon_utils.js must be loaded
    if (typeof toon === 'undefined') {
        document.body.innerHTML = `
            <div style="padding:24px;text-align:center;font-family:sans-serif;color:#ef4444;">
                <p style="font-weight:700;font-size:15px;">Extension Error</p>
                <p style="font-size:12px;color:#64748b;">Failed to load required scripts.<br>Please reload the extension.</p>
            </div>`;
        return;
    }

    // ── Constants ────────────────────────────────────────────────────────────
    const MAX_NAME_LEN       = 100;
    const MAX_TITLE_LEN      = 200;
    const MAX_DESC_LEN       = 2000;
    const MAX_PROJECT_NAME   = 100;
    const MAX_PROJECTS       = 20;
    const ALLOWED_PRIORITIES = ["low", "medium", "high", "critical"];
    const ALLOWED_TYPES      = ["general", "ui_ux", "performance", "security", "crash", "network"];
    const ALLOWED_COLORS     = ["#ef4444", "#facc15", "#22c55e", "#3b82f6", "#a855f7", "#ffffff"];
    const ALLOWED_TOOLS      = ["pen", "arrow", "box", "circle", "blur", "text"];
    const EMAIL_RE           = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{1,63}$/;
    const PROJECT_ID_RE      = /^[a-zA-Z0-9_-]{8,128}$/;
    const API_KEY_RE         = /^[a-zA-Z0-9_-]{8,256}$/;

    // ── DOM refs ─────────────────────────────────────────────────────────────
    const setupView    = document.getElementById("setupView");
    const nameView     = document.getElementById("nameView");
    const reportView   = document.getElementById("reportView");
    const successView  = document.getElementById("successView");
    const disabledView = document.getElementById("disabledView");
    const settingsBtn  = document.getElementById("settingsBtn");
    const bugType      = document.getElementById("bugType");
    const bugTitle     = document.getElementById("bugTitle");
    const bugDescription = document.getElementById("bugDescription");
    const bugPriority  = document.getElementById("bugPriority");
    const submitBtn    = document.getElementById("submitBtn");
    const errorMessage = document.getElementById("errorMessage");

    // ── State ─────────────────────────────────────────────────────────────────
    let currentMediaBlob    = null;
    let currentMediaType    = "image";
    let currentSteps        = [];
    let pageUrl             = "Unknown";
    let currentDrawTool     = "pen";
    let annotationColor     = "#ef4444";
    let strokeHistory       = [];
    let baseImageData       = null;
    let bugLocationContext  = null;
    let allProjects         = [];
    let activeProjectId     = null;
    let isInitialized       = false;

    // ── Helpers ───────────────────────────────────────────────────────────────

    /** Escape HTML — always use for user data inserted into DOM */
    function escapeHtml(str) {
        if (typeof str !== "string") return String(str ?? "");
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    /** Validate a project ID from storage/input */
    function isValidProjectId(id) {
        return typeof id === "string" && PROJECT_ID_RE.test(id);
    }

    /** Validate an API key from storage/input */
    function isValidApiKey(key) {
        return typeof key === "string" && API_KEY_RE.test(key);
    }

    /** Validate and sanitize a project object from storage */
    function validateProject(p) {
        if (!p || typeof p !== "object") return null;
        if (typeof p.id !== "string" || !p.id) return null;
        if (!isValidProjectId(p.projectId)) return null;
        if (!isValidApiKey(p.apiKey)) return null;
        return {
            id:            String(p.id).substring(0, 64),
            name:          typeof p.name === "string" ? p.name.substring(0, MAX_PROJECT_NAME) : "Unnamed",
            projectId:     p.projectId,
            apiKey:        p.apiKey,
            connectionKey: typeof p.connectionKey === "string" ? p.connectionKey.substring(0, 512) : "",
            addedAt:       Number.isFinite(p.addedAt) ? p.addedAt : Date.now(),
        };
    }

    /** Validate a data URL (only allow image/* and video/*) */
    function isValidMediaDataUrl(url) {
        if (typeof url !== "string") return false;
        return /^data:(image\/(png|jpeg|webp|gif)|video\/webm);base64,[A-Za-z0-9+/]+=*$/.test(url.substring(0, 64));
    }

    /** Validate numeric coordinate */
    function safeCoord(v) {
        const n = Number(v);
        return Number.isFinite(n) ? Math.round(n) : null;
    }

    // Load all projects (validates data from storage)
    async function loadProjects() {
        return new Promise((resolve) => {
            chrome.storage.local.get(["bugscribeProjects", "bugscribeActiveProject"], (result) => {
                if (chrome.runtime.lastError) {
                    console.error("Storage read error:", chrome.runtime.lastError.message);
                    allProjects = [];
                    activeProjectId = null;
                    resolve();
                    return;
                }
                // Validate every project from storage — never trust stored data blindly
                const raw = Array.isArray(result.bugscribeProjects) ? result.bugscribeProjects : [];
                allProjects = raw
                    .map(validateProject)
                    .filter(Boolean)
                    .slice(0, MAX_PROJECTS);
                activeProjectId = typeof result.bugscribeActiveProject === "string"
                    ? result.bugscribeActiveProject
                    : null;
                resolve();
            });
        });
    }

    // Save projects (with storage error handling)
    function saveProjects() {
        chrome.storage.local.set({
            bugscribeProjects: allProjects,
            bugscribeActiveProject: activeProjectId
        }, () => {
            if (chrome.runtime.lastError) {
                console.error("Storage write error:", chrome.runtime.lastError.message);
            }
        });
    }

    // Get active project
    function getActiveProject() {
        if (!activeProjectId && allProjects.length > 0) {
            activeProjectId = allProjects[0].id;
        }
        return allProjects.find(p => p.id === activeProjectId);
    }

    // Set active project
    async function setActiveProject(projectId) {
        try {
            const project = allProjects.find(p => p.id === projectId);
            if (!project) {
                console.error("Project not found:", projectId);
                showSetupView();
                return;
            }

            // Only set after validation
            activeProjectId = projectId;
            renderProjects();

            // Set legacy storage for compatibility
            await new Promise((resolve) => {
                chrome.storage.local.set({
                    bugscribeProjectId: project.projectId,
                    bugscribeApiKey: project.apiKey,
                    bugscribeConnectionKey: project.connectionKey,
                    bugscribeActiveProject: projectId
                }, resolve);
            });

            // Check if user has provided their name FIRST (fast, local check)
            const nameResult = await new Promise((resolve) => {
                chrome.storage.local.get(["bugscribeUserName"], resolve);
            });

            if (!nameResult.bugscribeUserName) {
                showNameView();
                return;
            }

            // Show report view immediately — don't wait for network
            await showReportView();

            // Check reporting status in background (non-blocking)
            checkReportingStatus().then(enabled => {
                if (!enabled) {
                    showDisabledView();
                }
            }).catch(() => {
                // Ignore — default to enabled
            });

        } catch (error) {
            console.error("Error setting active project:", error);
            // Still try to show report view rather than going back to setup
            try {
                await showReportView();
            } catch {
                showSetupView();
            }
        }
    }

    // Render projects list — uses DOM methods, never innerHTML for user data
    function renderProjects() {
        const container = document.getElementById("projectsContainer");
        const projectsList = document.getElementById("projectsList");
        if (!container || !projectsList) return;

        if (!allProjects || allProjects.length === 0) {
            projectsList.style.display = "none";
            return;
        }

        projectsList.style.display = "block";
        container.innerHTML = "";

        allProjects.forEach(project => {
            const card = document.createElement("div");
            card.className = `project-card ${project.id === activeProjectId ? "active" : ""}`;

            // Build card content with DOM — no innerHTML for user data
            const content = document.createElement("div");
            content.className = "project-card-content";

            const nameDiv = document.createElement("div");
            nameDiv.className = "project-card-name";
            nameDiv.textContent = project.name || "Unnamed Project"; // textContent is XSS-safe

            const idDiv = document.createElement("div");
            idDiv.className = "project-card-id";
            idDiv.textContent = project.projectId.substring(0, 12) + "...";

            content.appendChild(nameDiv);
            content.appendChild(idDiv);

            const actions = document.createElement("div");
            actions.className = "project-card-actions";

            const useBtn = document.createElement("button");
            useBtn.className = "project-card-btn use";
            useBtn.title = "Use this project";
            useBtn.textContent = "Use";
            useBtn.style.cssText = "background:#4f46e5;border-color:#4f46e5;color:white;font-size:10px;padding:4px 8px;border-radius:6px;font-weight:700;";

            const deleteBtn = document.createElement("button");
            deleteBtn.className = "project-card-btn delete";
            deleteBtn.title = "Remove";
            deleteBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;

            actions.appendChild(useBtn);
            actions.appendChild(deleteBtn);
            card.appendChild(content);
            card.appendChild(actions);

            card.addEventListener("click", (e) => {
                if (!e.target.closest(".project-card-btn")) setActiveProject(project.id);
            });
            useBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                setActiveProject(project.id);
            });
            deleteBtn.addEventListener("click", async (e) => {
                e.stopPropagation();
                const displayName = project.name || "this project";
                if (!confirm(`Remove "${escapeHtml(displayName)}"?`)) return;

                // Atomic delete — re-read from storage to avoid race condition
                await new Promise((resolve) => {
                    chrome.storage.local.get(["bugscribeProjects"], (res) => {
                        let projects = Array.isArray(res.bugscribeProjects) ? res.bugscribeProjects : [];
                        projects = projects.filter(p => p.id !== project.id);
                        let newActiveId = activeProjectId;
                        if (newActiveId === project.id) {
                            newActiveId = projects.length > 0 ? projects[0].id : null;
                        }
                        allProjects = projects.map(validateProject).filter(Boolean);
                        activeProjectId = newActiveId;
                        chrome.storage.local.set({
                            bugscribeProjects: allProjects,
                            bugscribeActiveProject: activeProjectId
                        }, () => {
                            if (chrome.runtime.lastError) console.error("Storage error:", chrome.runtime.lastError.message);
                            resolve();
                        });
                    });
                });

                renderProjects();

                if (allProjects.length === 0) {
                    await new Promise((resolve) => {
                        chrome.storage.local.remove(["bugscribeProjectId", "bugscribeApiKey", "bugscribeConnectionKey"], resolve);
                    });
                    showSetupView();
                } else if (activeProjectId) {
                    await setActiveProject(activeProjectId);
                }
            });

            container.appendChild(card);
        });
    }

    settingsBtn.addEventListener("click", () => {
        // Clear name inputs so they don't show stale values
        const userNameEl = document.getElementById("userName");
        const userEmailEl = document.getElementById("userEmail");
        if (userNameEl) userNameEl.value = "";
        if (userEmailEl) userEmailEl.value = "";
        showSetupView();
        renderProjects();
    });

    // Initialize the extension
    async function initialize() {
        if (isInitialized) return;
        isInitialized = true;

        try {
            await loadProjects();
        } catch (e) {
            console.error("Failed to load projects:", e);
            showSetupView();
            return;
        }

        try {
            if (allProjects.length === 0) {
                showSetupView();
                return;
            }

            if (!activeProjectId) {
                activeProjectId = allProjects[0].id;
            }

            const activeProject = getActiveProject();
            if (!activeProject) {
                showSetupView();
                return;
            }

            // Check name first (local, instant)
            const nameResult = await new Promise((resolve) => {
                chrome.storage.local.get(["bugscribeUserName"], resolve);
            });

            if (!nameResult.bugscribeUserName) {
                showNameView();
                return;
            }

            // Show report view immediately
            await showReportView();

            // Check reporting status in background (non-blocking)
            checkReportingStatus().then(enabled => {
                if (!enabled) showDisabledView();
            }).catch(() => {});

        } catch (error) {
            console.error("Initialization error:", error);
            showSetupView();
        }
    }

    // Start initialization
    initialize();

    // --- Check if reporting is enabled ---
    async function checkReportingStatus() {
        try {
            const result = await new Promise((resolve) => {
                chrome.storage.local.get(["bugscribeProjectId", "bugscribeApiKey"], resolve);
            });

            if (!result.bugscribeProjectId || !result.bugscribeApiKey) {
                return true; // Not configured yet, allow reporting
            }

            // Determine the API base URL from the active tab's origin
            // Falls back to production URL if we can't get the tab
            let apiBase = "https://cmsmindsqa.vercel.app";
            try {
                const tabs = await Promise.race([
                    chrome.tabs.query({ active: true, currentWindow: true }),
                    new Promise(resolve => setTimeout(() => resolve([]), 1000))
                ]);
                const tab = tabs[0];
                if (tab && tab.url) {
                    const url = new URL(tab.url);
                    // Use localhost if on localhost, otherwise use production
                    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
                        apiBase = `${url.protocol}//${url.host}`;
                    }
                }
            } catch (_) {}

            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 3000);

            try {
                const response = await fetch(`${apiBase}/api/check-reporting-status`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        projectId: result.bugscribeProjectId,
                        apiKey: result.bugscribeApiKey
                    }),
                    signal: controller.signal
                });
                clearTimeout(timer);

                if (response.ok) {
                    const data = await response.json();
                    return data.enabled !== false;
                }
            } catch (_) {
                clearTimeout(timer);
            }

            return true; // Default to enabled
        } catch (_) {
            return true;
        }
    }


    function showSetupView() {
        setupView.style.display = "block";
        nameView.style.display = "none";
        reportView.style.display = "none";
        successView.style.display = "none";
        disabledView.style.display = "none";
        settingsBtn.style.display = "flex";
        // Clear any previous error messages
        const setupErr = document.getElementById("setupErrorMsg");
        if (setupErr) { setupErr.style.display = "none"; setupErr.textContent = ""; }
    }

    function showNameView() {
        setupView.style.display = "none";
        nameView.style.display = "block";
        reportView.style.display = "none";
        successView.style.display = "none";
        disabledView.style.display = "none";
        settingsBtn.style.display = "flex";
        // Reset name form state
        const saveNameBtn = document.getElementById("saveNameBtn");
        if (saveNameBtn) { saveNameBtn.disabled = false; saveNameBtn.textContent = "✅ Continue"; }
        const nameErr = document.getElementById("nameErrorMsg");
        if (nameErr) { nameErr.style.display = "none"; nameErr.textContent = ""; }
    }

    function showDisabledView() {
        setupView.style.display = "none";
        nameView.style.display = "none";
        reportView.style.display = "none";
        successView.style.display = "none";
        disabledView.style.display = "block";
        settingsBtn.style.display = "flex";
    }

    async function showReportView() {
        setupView.style.display = "none";
        nameView.style.display = "none";
        reportView.style.display = "block";
        successView.style.display = "none";
        disabledView.style.display = "none";
        settingsBtn.style.display = "flex";

        // Reset form fields every time report view is shown
        if (bugTitle) bugTitle.value = "";
        if (bugDescription) bugDescription.value = "";
        if (bugPriority) bugPriority.value = "medium";
        if (bugType) bugType.value = "general";
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "🚀 Submit Bug Report"; }
        if (errorMessage) { errorMessage.style.display = "none"; errorMessage.textContent = ""; }

        try {
            // Get tab info with a hard 2s timeout
            const tab = await Promise.race([
                chrome.tabs.query({ active: true, currentWindow: true }).then(tabs => tabs[0]),
                new Promise(resolve => setTimeout(() => resolve(null), 2000))
            ]);

            if (tab && tab.url && !tab.url.startsWith("chrome")) {
                pageUrl = tab.url;
                if (tab.id) {
                    // Get bug context with timeout — non-blocking
                    new Promise((resolve) => {
                        const timeout = setTimeout(() => resolve(null), 1500);
                        chrome.tabs.sendMessage(tab.id, { action: "GET_BUG_CONTEXT" }, (res) => {
                            clearTimeout(timeout);
                            if (chrome.runtime.lastError) { resolve(null); return; }
                            try { resolve(toon.decode(res) || null); } catch { resolve(null); }
                        });
                    }).then(ctx => { bugLocationContext = ctx; });
                }
            }
        } catch (err) {
            // Tab query failed — that's fine, continue without URL context
        }

        // Load pending media from storage
        chrome.storage.local.get(["bugscribe_pending_media", "bugscribe_pending_steps", "bugscribe_pending_mediatype"], (data) => {
            if (data.bugscribe_pending_media && isValidMediaDataUrl(data.bugscribe_pending_media)) {
                currentMediaType = data.bugscribe_pending_mediatype || "video";
                currentSteps = Array.isArray(data.bugscribe_pending_steps)
                    ? data.bugscribe_pending_steps
                    : (toon.decode(data.bugscribe_pending_steps) || []);

                if (currentMediaType === "video") {
                    document.getElementById("screenshotPreview").style.display = "none";
                    document.getElementById("screenshotCanvas").style.display = "none";
                    document.getElementById("annotationToolbar").style.display = "none";
                    const videoEl = document.getElementById("videoPreview");
                    videoEl.style.display = "block";
                    videoEl.src = data.bugscribe_pending_media;
                } else {
                    document.getElementById("videoPreview").style.display = "none";
                    const imgEl = document.getElementById("screenshotPreview");
                    imgEl.src = data.bugscribe_pending_media;
                    imgEl.style.display = "block";
                    document.getElementById("screenshotPreviewContainer").style.display = "block";
                    initCanvas(data.bugscribe_pending_media);
                }

                fetch(data.bugscribe_pending_media)
                    .then(res => res.blob())
                    .then(blob => { currentMediaBlob = blob; });

                if (currentSteps.length > 0) {
                    const stepsContainer = document.getElementById("stepsContainer");
                    const stepsList = document.getElementById("stepsList");
                    stepsContainer.style.display = "block";
                    stepsList.innerHTML = "";
                    currentSteps.forEach(s => {
                        const li = document.createElement("li");
                        li.textContent = s;
                        stepsList.appendChild(li);
                    });
                }
            } else {
                captureScreenshot();
            }
        });
    }

    function initCanvas(mediaUrl) {
        const canvas = document.getElementById("screenshotCanvas");
        const toolbar = document.getElementById("annotationToolbar");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        const imgEl = document.getElementById("screenshotPreview");
        
        strokeHistory = [];
        const imgObj = new Image();
        imgObj.onload = () => {
            canvas.width = imgObj.width;
            canvas.height = imgObj.height;
            ctx.drawImage(imgObj, 0, 0);
            baseImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            canvas.style.display = "block";
            imgEl.style.display = "none";
            toolbar.style.display = "block";

            let isDrawing = false;
            let startX, startY;
            let snapshot = null;

            const getMousePos = (e) => {
                const rect = canvas.getBoundingClientRect();
                return {
                    x: (e.clientX - rect.left) * (canvas.width / rect.width),
                    y: (e.clientY - rect.top) * (canvas.height / rect.height)
                };
            };

            const drawArrow = (x1, y1, x2, y2) => {
                const headlen = Math.max(10, canvas.width * 0.015);
                const angle = Math.atan2(y2 - y1, x2 - x1);
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(x2, y2);
                ctx.lineTo(x2 - headlen * Math.cos(angle - Math.PI / 6), y2 - headlen * Math.sin(angle - Math.PI / 6));
                ctx.lineTo(x2 - headlen * Math.cos(angle + Math.PI / 6), y2 - headlen * Math.sin(angle + Math.PI / 6));
                ctx.closePath();
                ctx.fill();
            };

            canvas.onmousedown = (e) => {
                const pos = getMousePos(e);
                startX = pos.x;
                startY = pos.y;
                isDrawing = true;
                
                strokeHistory.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
                snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
                
                if (currentDrawTool === "pen") {
                    ctx.beginPath();
                    ctx.moveTo(startX, startY);
                } else if (currentDrawTool === "text") {
                    isDrawing = false;
                    
                    const input = document.createElement("input");
                    input.type = "text";
                    const rect = canvas.getBoundingClientRect();
                    input.style.cssText = `
                        position: absolute;
                        left: ${e.clientX}px;
                        top: ${e.clientY - 15}px;
                        z-index: 1000;
                        background: #1e293b;
                        color: white;
                        border: 2px solid ${annotationColor};
                        border-radius: 4px;
                        padding: 2px 6px;
                        font-family: sans-serif;
                        font-weight: bold;
                        font-size: 14px;
                        outline: none;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
                        width: 120px;
                    `;
                    
                    document.body.appendChild(input);
                    setTimeout(() => input.focus(), 10);

                    const commitText = () => {
                        const text = input.value.trim();
                        if (text) {
                            ctx.fillStyle = annotationColor;
                            const fontSize = Math.max(20, canvas.width * 0.03);
                            ctx.font = `bold ${fontSize}px sans-serif`;
                            ctx.strokeStyle = "rgba(0,0,0,0.4)";
                            ctx.lineWidth = 3;
                            ctx.strokeText(text, startX, startY);
                            ctx.fillText(text, startX, startY);
                            strokeHistory.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
                        }
                        if (input.parentNode) input.parentNode.removeChild(input);
                    };

                    input.addEventListener("keydown", (evt) => {
                        if (evt.key === "Enter") commitText();
                        if (evt.key === "Escape") input.parentNode.removeChild(input);
                    });
                    
                    input.addEventListener("blur", commitText);
                }
            };

            canvas.onmousemove = (e) => {
                if (!isDrawing) return;
                const pos = getMousePos(e);
                
                ctx.strokeStyle = annotationColor;
                ctx.fillStyle = annotationColor;
                ctx.lineWidth = Math.max(4, canvas.width * 0.003);
                ctx.lineCap = "round";
                ctx.lineJoin = "round";

                if (currentDrawTool === "pen") {
                    ctx.lineTo(pos.x, pos.y);
                    ctx.stroke();
                } else if (currentDrawTool === "blur") {
                    ctx.putImageData(snapshot, 0, 0);
                    const w = pos.x - startX;
                    const h = pos.y - startY;

                    ctx.save();
                    ctx.filter = 'blur(10px)';
                    ctx.drawImage(canvas, startX, startY, w, h, startX, startY, w, h);
                    ctx.restore();

                    ctx.fillStyle = 'rgba(150, 150, 150, 0.2)';
                    ctx.fillRect(startX, startY, w, h);
                } else {
                    ctx.putImageData(snapshot, 0, 0);
                    const w = pos.x - startX;
                    const h = pos.y - startY;

                    if (currentDrawTool === "arrow") {
                        drawArrow(startX, startY, pos.x, pos.y);
                    } else if (currentDrawTool === "box") {
                        ctx.strokeRect(startX, startY, w, h);
                    } else if (currentDrawTool === "circle") {
                        ctx.beginPath();
                        ctx.ellipse(startX + w/2, startY + h/2, Math.abs(w/2), Math.abs(h/2), 0, 0, 2 * Math.PI);
                        ctx.stroke();
                    }
                }
            };

            canvas.onmouseup = () => isDrawing = false;
            canvas.onmouseout = () => isDrawing = false;
        };
        imgObj.src = mediaUrl;
    }

    async function captureScreenshot() {
        currentMediaType = "image";
        currentSteps = [];
        document.getElementById("stepsContainer").style.display = "none";
        document.getElementById("videoPreview").style.display = "none";
        document.getElementById("videoPreview").src = "";
        const imgEl = document.getElementById("screenshotPreview");
        imgEl.style.display = "block";

        chrome.runtime.sendMessage({ action: "CAPTURE_SCREENSHOT" }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("Screenshot error:", chrome.runtime.lastError.message);
                document.getElementById("screenshotPreviewContainer").style.display = "none";
                document.getElementById("annotationToolbar").style.display = "none";
                return;
            }
            let decodedResponse = null;
            try { decodedResponse = response ? toon.decode(response) : null; } catch (_) {}
            // Validate data URL before using it
            if (!decodedResponse?.dataUrl || !isValidMediaDataUrl(decodedResponse.dataUrl)) {
                document.getElementById("screenshotPreviewContainer").style.display = "none";
                document.getElementById("annotationToolbar").style.display = "none";
            } else {
                imgEl.src = decodedResponse.dataUrl;
                document.getElementById("screenshotPreviewContainer").style.display = "block";
                initCanvas(decodedResponse.dataUrl);
                fetch(decodedResponse.dataUrl)
                    .then(res => res.blob())
                    .then(blob => currentMediaBlob = blob)
                    .catch(() => {});
            }
        });
    }

    // --- Annotation Toolbar ---
    document.querySelectorAll(".annotation-toolbar .color-dot").forEach(dot => {
        dot.addEventListener("click", () => {
            document.querySelectorAll(".annotation-toolbar .color-dot").forEach(d => d.classList.remove("active"));
            dot.classList.add("active");
            annotationColor = dot.dataset.color;
        });
    });

    document.querySelectorAll(".tool-btn[data-draw-tool]").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".tool-btn[data-draw-tool]").forEach(b => b.classList.remove("active-tool"));
            btn.classList.add("active-tool");
            currentDrawTool = btn.dataset.drawTool;
            
            const canvas = document.getElementById("screenshotCanvas");
            if (currentDrawTool === "text") {
                canvas.style.cursor = "text";
            } else {
                canvas.style.cursor = "crosshair";
            }
        });
    });

    document.getElementById("undoBtn").addEventListener("click", () => {
        const canvas = document.getElementById("screenshotCanvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (strokeHistory.length > 0) {
            const prev = strokeHistory.pop();
            ctx.putImageData(prev, 0, 0);
        }
    });

    document.getElementById("clearBtn").addEventListener("click", () => {
        const canvas = document.getElementById("screenshotCanvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (baseImageData) {
            strokeHistory = [];
            ctx.putImageData(baseImageData, 0, 0);
        }
    });

    // --- Action Buttons ---
    document.getElementById("captureBtn").addEventListener("click", () => {
        chrome.storage.local.remove(["bugscribe_pending_media", "bugscribe_pending_steps", "bugscribe_pending_mediatype"], () => {
            captureScreenshot();
        });
    });

    document.getElementById("recordBtn").addEventListener("click", async (e) => {
        const btn = e.currentTarget;
        if (btn.disabled) return;
        btn.disabled = true;
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab || !tab.id || tab.url.startsWith("chrome")) {
                alert("Please navigate to a webpage before starting a recording.");
                btn.disabled = false;
                return;
            }
            chrome.tabs.sendMessage(tab.id, { action: "START_RECORDING" }, (res) => {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError);
                    alert("Please refresh the page before starting a recording.");
                    btn.disabled = false;
                } else {
                    window.parent.postMessage("CLOSE_BUGScribe_IFRAME", "*");
                    window.close();
                }
            });
        } catch (err) {
            console.error("Record error:", err);
            btn.disabled = false;
        }
    });

    document.getElementById("annotatePageBtn").addEventListener("click", async (e) => {
        const btn = e.currentTarget;
        if (btn.disabled) return;
        btn.disabled = true;
        try {
            const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
            if (!tab || !tab.id || tab.url.startsWith("chrome")) {
                alert("Please navigate to a webpage before annotating.");
                btn.disabled = false;
                return;
            }
            chrome.tabs.sendMessage(tab.id, { action: "START_ANNOTATE" }, (res) => {
                if (chrome.runtime.lastError) {
                    alert("Please refresh the page before annotating.");
                    btn.disabled = false;
                } else {
                    window.close();
                }
            });
        } catch (err) {
            console.error("Annotate error:", err);
            btn.disabled = false;
        }
    });

    // --- Save Credentials ---
    document.getElementById("saveBtn").addEventListener("click", async () => {
        const connectionKey = document.getElementById("setupConnectionKey").value.trim();
        const projectName   = document.getElementById("projectName").value.trim();
        const errorMsg      = document.getElementById("setupErrorMsg");
        const saveBtn       = document.getElementById("saveBtn");

        errorMsg.style.display = "none";
        errorMsg.textContent = "";

        if (!connectionKey) {
            errorMsg.textContent = "Please enter a connection key.";
            errorMsg.style.display = "block";
            return;
        }
        if (connectionKey.length > 1024) {
            errorMsg.textContent = "Connection key is too long.";
            errorMsg.style.display = "block";
            return;
        }
        if (projectName.length > MAX_PROJECT_NAME) {
            errorMsg.textContent = `Project name must be under ${MAX_PROJECT_NAME} characters.`;
            errorMsg.style.display = "block";
            return;
        }
        if (allProjects.length >= MAX_PROJECTS) {
            errorMsg.textContent = `Maximum ${MAX_PROJECTS} projects allowed.`;
            errorMsg.style.display = "block";
            return;
        }

        try {
            saveBtn.disabled = true;
            saveBtn.textContent = "Adding...";

            let decoded;
            try {
                decoded = atob(connectionKey);
            } catch (_) {
                throw new Error("Invalid connection key — not valid base64.");
            }

            const parts = decoded.split("|");
            if (parts.length < 2) throw new Error("Invalid key format.");

            const projectId = parts[0].trim();
            const apiKey    = parts[1].trim();

            if (!isValidProjectId(projectId)) throw new Error("Invalid project ID in key.");
            if (!isValidApiKey(apiKey))       throw new Error("Invalid API key in key.");

            if (allProjects.find(p => p.projectId === projectId)) {
                errorMsg.textContent = "This project is already added.";
                errorMsg.style.display = "block";
                saveBtn.disabled = false;
                saveBtn.textContent = "➕ Add Project";
                return;
            }

            const newProject = validateProject({
                id:            Date.now().toString(),
                name:          projectName || `Project ${allProjects.length + 1}`,
                projectId,
                apiKey,
                connectionKey,
                addedAt:       Date.now(),
            });
            if (!newProject) throw new Error("Failed to validate project data.");

            allProjects.push(newProject);
            saveProjects();

            const msg = document.getElementById("savedMsg");
            if (msg) msg.style.display = "block";
            document.getElementById("setupConnectionKey").value = "";
            document.getElementById("projectName").value = "";

            setTimeout(async () => {
                if (msg) msg.style.display = "none";
                saveBtn.disabled = false;
                saveBtn.textContent = "➕ Add Project";
                renderProjects();
                await setActiveProject(newProject.id);
            }, 1000);

        } catch (e) {
            errorMsg.textContent = e.message || "Invalid connection key. Please copy the exact key from your dashboard.";
            errorMsg.style.display = "block";
            saveBtn.disabled = false;
            saveBtn.textContent = "➕ Add Project";
        }
    });

    // --- Back to setup from name view ---
    document.getElementById("backToSetupBtn").addEventListener("click", () => {
        showSetupView();
        renderProjects();
    });

    // --- Back to setup from disabled view ---
    document.getElementById("disabledBackBtn").addEventListener("click", () => {
        showSetupView();
        renderProjects();
    });

    // --- Save User Name ---
    document.getElementById("saveNameBtn").addEventListener("click", async () => {
        const userName    = document.getElementById("userName").value.trim();
        const userEmail   = document.getElementById("userEmail").value.trim();
        const errorMsg    = document.getElementById("nameErrorMsg");
        const saveNameBtn = document.getElementById("saveNameBtn");

        errorMsg.style.display = "none";
        errorMsg.textContent = "";

        if (!userName) {
            errorMsg.textContent = "Please enter your name.";
            errorMsg.style.display = "block";
            return;
        }
        if (userName.length < 2 || userName.length > MAX_NAME_LEN) {
            errorMsg.textContent = `Name must be 2–${MAX_NAME_LEN} characters.`;
            errorMsg.style.display = "block";
            return;
        }
        if (userEmail && !EMAIL_RE.test(userEmail)) {
            errorMsg.textContent = "Please enter a valid email address.";
            errorMsg.style.display = "block";
            return;
        }

        try {
            saveNameBtn.disabled = true;
            saveNameBtn.textContent = "Saving...";

            await new Promise((resolve, reject) => {
                chrome.storage.local.set({
                    bugscribeUserName:  userName.substring(0, MAX_NAME_LEN),
                    bugscribeUserEmail: userEmail.substring(0, 254),
                }, () => {
                    if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
                    else resolve();
                });
            });

            await showReportView();
        } catch (error) {
            errorMsg.textContent = "Failed to save. Please try again.";
            errorMsg.style.display = "block";
            saveNameBtn.disabled = false;
            saveNameBtn.textContent = "✅ Continue";
        }
    });

    // --- Submit Bug Report ---
    submitBtn.addEventListener("click", async () => {
        const titleVal = bugTitle.value.trim();
        const descVal  = bugDescription.value.trim();

        if (!titleVal) {
            errorMessage.textContent = "Title is required.";
            errorMessage.style.display = "block";
            return;
        }
        if (titleVal.length > MAX_TITLE_LEN) {
            errorMessage.textContent = `Title must be under ${MAX_TITLE_LEN} characters.`;
            errorMessage.style.display = "block";
            return;
        }
        if (descVal.length > MAX_DESC_LEN) {
            errorMessage.textContent = `Description must be under ${MAX_DESC_LEN} characters.`;
            errorMessage.style.display = "block";
            return;
        }

        const priorityVal = ALLOWED_PRIORITIES.includes(bugPriority.value) ? bugPriority.value : "medium";
        const typeVal     = ALLOWED_TYPES.includes(bugType.value) ? bugType.value : "general";

        if (submitBtn.disabled) return;
        submitBtn.disabled = true;
        submitBtn.textContent = "📤 Sending...";
        errorMessage.style.display = "none";

        try {
            const creds = await new Promise((resolve, reject) => {
                chrome.storage.local.get(["bugscribeProjectId", "bugscribeApiKey", "bugscribeUserName", "bugscribeUserEmail"], (res) => {
                    if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
                    else resolve(res);
                });
            });

            if (!isValidProjectId(creds.bugscribeProjectId)) throw new Error("No valid project configured. Click the settings icon.");
            if (!isValidApiKey(creds.bugscribeApiKey))       throw new Error("No valid API key configured. Click the settings icon.");

            const userName  = typeof creds.bugscribeUserName  === "string" ? creds.bugscribeUserName.substring(0, MAX_NAME_LEN)  : "Anonymous";
            const userEmail = typeof creds.bugscribeUserEmail === "string" ? creds.bugscribeUserEmail.substring(0, 254) : "";

            const safePageUrl = (typeof pageUrl === "string" && (pageUrl.startsWith("http://") || pageUrl.startsWith("https://")))
                ? pageUrl.substring(0, 2048) : "Unknown";

            const formData = new FormData();
            formData.append("projectId",    creds.bugscribeProjectId);
            formData.append("apiKey",       creds.bugscribeApiKey);
            formData.append("title",        titleVal.substring(0, MAX_TITLE_LEN));
            formData.append("description",  descVal.substring(0, MAX_DESC_LEN) || "No description provided");
            formData.append("priority",     priorityVal);
            formData.append("type",         typeVal);
            formData.append("url",          safePageUrl);
            formData.append("page_url",     bugLocationContext?.page_url ? String(bugLocationContext.page_url).substring(0, 2048) : safePageUrl);
            formData.append("reporterName", userName);
            formData.append("reporterEmail", userEmail);
            formData.append("created_at",   String(Date.now()));

            const cx = safeCoord(bugLocationContext?.x_coordinate);
            const cy = safeCoord(bugLocationContext?.y_coordinate);
            const cs = safeCoord(bugLocationContext?.scroll_position);
            const csx = safeCoord(bugLocationContext?.scrollX);
            const csy = safeCoord(bugLocationContext?.scrollY);
            if (cx !== null) formData.append("x_coordinate", String(cx));
            if (cy !== null) formData.append("y_coordinate", String(cy));
            if (cs !== null) formData.append("scroll_position", String(cs));
            if (csx !== null) formData.append("scrollX", String(csx));
            if (csy !== null) formData.append("scrollY", String(csy));
            if (typeof bugLocationContext?.element_selector === "string") {
                formData.append("element_selector", bugLocationContext.element_selector.substring(0, 500));
            }

            // Environment data (non-blocking, with timeout)
            try {
                const tabs = await Promise.race([
                    chrome.tabs.query({ active: true, currentWindow: true }),
                    new Promise(r => setTimeout(() => r([]), 1500))
                ]);
                const tab = tabs[0];
                if (tab && tab.id) {
                    const envData = await new Promise((resolve) => {
                        const timeout = setTimeout(() => resolve(null), 2000);
                        chrome.tabs.sendMessage(tab.id, { action: "GET_ENV_DATA" }, (res) => {
                            clearTimeout(timeout);
                            if (chrome.runtime.lastError) { resolve(null); return; }
                            try { resolve(toon.decode(res)); } catch { resolve(null); }
                        });
                    });
                    if (envData && typeof envData === "object") {
                        formData.append("environmentData", JSON.stringify(envData));
                    }
                }
            } catch (_) {}

            formData.append("mediaType", currentMediaType === "video" ? "video" : "image");
            formData.append("steps",     JSON.stringify(Array.isArray(currentSteps) ? currentSteps.slice(0, 100) : []));
            formData.append("browser",   navigator.userAgent.substring(0, 500));
            formData.append("os",        navigator.platform.substring(0, 100));

            // Canvas → blob with WebP/PNG fallback
            if (currentMediaType === "image") {
                const canvas = document.getElementById("screenshotCanvas");
                if (canvas && canvas.style.display !== "none") {
                    currentMediaBlob = await new Promise((resolve, reject) => {
                        canvas.toBlob(blob => {
                            if (blob) { resolve(blob); return; }
                            canvas.toBlob(blob2 => {
                                if (blob2) resolve(blob2);
                                else reject(new Error("Failed to create screenshot blob"));
                            }, "image/png");
                        }, "image/webp", 0.6);
                    });
                }
            }

            if (currentMediaBlob) {
                const ext = currentMediaType === "video" ? "webm" : (currentMediaBlob.type === "image/png" ? "png" : "webp");
                formData.append("screenshot", currentMediaBlob, `screenshot.${ext}`);
            }

            // Determine API endpoint
            let apiEndpoint = "https://cmsmindsqa.vercel.app/api/reports";
            try {
                const tabs2 = await Promise.race([
                    chrome.tabs.query({ active: true, currentWindow: true }),
                    new Promise(r => setTimeout(() => r([]), 1000))
                ]);
                const tab2 = tabs2[0];
                if (tab2?.url) {
                    const u = new URL(tab2.url);
                    if (u.hostname === "localhost" || u.hostname === "127.0.0.1") {
                        apiEndpoint = `http://${u.host}/api/reports`;
                    }
                }
                if (typeof BugScribeConfig !== "undefined") {
                    const cfg = await BugScribeConfig.get("apiEndpoint");
                    if (cfg && typeof cfg === "string" && cfg.startsWith("https://")) {
                        apiEndpoint = cfg.trim();
                    }
                }
            } catch (_) {}

            const response = await fetch(apiEndpoint, {
                method: "POST",
                body: formData,
                signal: AbortSignal.timeout(30000),
            });

            if (!response.ok) {
                let msg = `Server error: ${response.status}`;
                try {
                    const ct = response.headers.get("content-type") || "";
                    if (ct.includes("application/json")) {
                        const err = await response.json();
                        if (typeof err?.error === "string") msg = err.error;
                    }
                } catch (_) {}
                throw new Error(msg);
            }

            const result = await response.json();
            if (!result || typeof result !== "object") throw new Error("Invalid server response.");

            chrome.storage.local.remove(["bugscribe_pending_media", "bugscribe_pending_steps", "bugscribe_pending_mediatype"]);

            reportView.style.display = "none";
            settingsBtn.style.display = "none";
            successView.style.display = "block";

            if (window._resetTimer) clearTimeout(window._resetTimer);
            window._resetTimer = setTimeout(() => resetFormForNewBug(), 3000);

        } catch (err) {
            let msg = err?.message || "Failed to send bug report.";
            if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) msg = "Network error. Check your connection.";
            else if (msg.includes("401") || msg.includes("403")) msg = "Authentication failed. Reconnect in settings.";
            else if (msg.includes("404")) msg = "API endpoint not found. Check your configuration.";
            else if (msg.includes("500") || msg.includes("502") || msg.includes("503")) msg = "Server error. Please try again.";
            else if (msg.includes("timed out") || msg.includes("AbortError")) msg = "Request timed out. Check your server.";

            errorMessage.textContent = msg;
            errorMessage.style.display = "block";
            submitBtn.disabled = false;
            submitBtn.textContent = "🚀 Submit Bug Report";
        }
    });

    function resetFormForNewBug() {
        successView.style.display = "none";
        reportView.style.display = "block";
        settingsBtn.style.display = "flex";
        bugTitle.value = "";
        bugDescription.value = "";
        bugPriority.value = "medium";
        bugType.value = "general";
        submitBtn.disabled = false;
        submitBtn.textContent = "🚀 Submit Bug Report";
        errorMessage.style.display = "none";
        errorMessage.textContent = "";
        currentMediaBlob = null;
        currentMediaType = "image";
        currentSteps = [];
        document.getElementById("stepsContainer").style.display = "none";
        document.getElementById("annotationToolbar").style.display = "none";
        captureScreenshot();
    }

    document.getElementById("reportAnotherBtn").addEventListener("click", () => {
        if (window._resetTimer) { clearTimeout(window._resetTimer); window._resetTimer = null; }
        resetFormForNewBug();
    });

    document.getElementById("closeBtn").addEventListener("click", () => {
        // Send to extension origin specifically, not wildcard
        try {
            const extOrigin = chrome.runtime.getURL("").replace(/\/$/, "");
            window.parent.postMessage("CLOSE_BUGScribe_IFRAME", extOrigin);
        } catch (_) {
            try { window.parent.postMessage("CLOSE_BUGScribe_IFRAME", "*"); } catch (_2) {}
        }
        window.close();
    });
});
