/**
 * BugScribe Widget v1.2 - High Isolation Version
 */
(function () {
    "use strict";

    // ── Config ─────────────────────────────────────────────────────────────────
    const script = document.getElementById("bugscribe-injected-script") || document.currentScript;
    let PROJECT_NAME = script?.getAttribute("data-project-name") || "Loading...";
    const PROJECT_ID = script?.getAttribute("data-project-id") || "";
    const API_KEY = script?.getAttribute("data-api-key") || "";
    const CONVEX_URL = script?.getAttribute("data-convex-url") || "";

    if (!PROJECT_ID || !API_KEY || !CONVEX_URL) {
        console.warn("[BugScribe] Missing required attributes: data-project-id, data-api-key, or data-convex-url.");
        return;
    }

    // Check for highlight parameter in URL
    window.addEventListener("load", () => {
        const hash = window.location.hash;
        if (hash.startsWith("#bugscribe-highlight=")) {
            const coords = hash.replace("#bugscribe-highlight=", "").split(",");
            if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
                const x = parseInt(coords[0], 10);
                const y = parseInt(coords[1], 10);
                window.scrollTo({ left: x, top: y, behavior: "smooth" });
                
                // Add a visual highlight overlay briefly
                const highlight = document.createElement("div");
                highlight.style.position = "absolute";
                highlight.style.left = "0";
                highlight.style.top = `${y}px`;
                highlight.style.width = "100%";
                highlight.style.height = `${window.innerHeight}px`;
                highlight.style.boxShadow = "inset 0 0 0 8px rgba(239, 68, 68, 0.8), inset 0 0 40px rgba(239, 68, 68, 0.4)";
                highlight.style.pointerEvents = "none";
                highlight.style.zIndex = "2147483647";
                highlight.style.transition = "opacity 1s ease-out";
                highlight.style.background = "rgba(239, 68, 68, 0.1)";
                
                // Draw a targeting reticle in the center
                highlight.innerHTML = `
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 100px; height: 100px; border: 4px dashed rgba(239, 68, 68, 0.9); border-radius: 50%; animation: pulse 2s infinite;"></div>
                    <style>@keyframes pulse { 0% { transform: translate(-50%, -50%) scale(0.9); opacity: 1; } 50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.8; } 100% { transform: translate(-50%, -50%) scale(0.9); opacity: 1; } }</style>
                `;
                
                document.body.appendChild(highlight);
                
                setTimeout(() => {
                    highlight.style.opacity = "0";
                    setTimeout(() => highlight.remove(), 1000);
                }, 3000);
            }
        }
    });

    // Initialize: Fetch fresh project info from Convex
    (async function init() {
        try {
            const project = await convexReq("projects:getProjectByApiKey", { apiKey: API_KEY }, "query");
            if (project) {
                PROJECT_NAME = project.name;
                const display = document.getElementById("bs-project-name-display");
                if (display) display.textContent = PROJECT_NAME;
                console.log(`[BugScribe] Connected to Workspace: ${PROJECT_NAME}`);
            }
        } catch (err) {
            console.error("[BugScribe] Failed to fetch project info:", err);
            if (PROJECT_NAME === "Loading...") {
                PROJECT_NAME = "Untitled Project";
                const display = document.getElementById("bs-project-name-display");
                if (display) display.textContent = PROJECT_NAME;
            }
        }
    })();

    // ── Console Error Collector ────────────────────────────────────────────────
    const capturedErrors = [];
    const _origError = console.error.bind(console);
    console.error = function (...args) {
        const errorStr = args.map(String).join(" ");
        if (!errorStr.includes("A tree hydrated but") && !errorStr.includes("Hydration failed")) {
            capturedErrors.push(errorStr);
            if (capturedErrors.length > 20) capturedErrors.shift();
        }
        _origError(...args);
    };

    window.addEventListener("error", (e) => {
        const errorMsg = e.error?.stack || `${e.message} (${e.filename}:${e.lineno})`;
        capturedErrors.push(errorMsg);
        if (capturedErrors.length > 20) capturedErrors.shift();
    });

    // ── Styles (Scoped & Isolated) ─────────────────────────────────────────────
    const css = `
    #bugscribe-btn {
      all: initial;
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 2147483647;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      background: #4f5dff;
      color: #fff;
      font-family: Inter, system-ui, -apple-system, sans-serif;
      font-size: 13px;
      font-weight: 600;
      border: none;
      border-radius: 50px;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(79,93,255,0.4);
      transition: all 0.2s ease;
      user-select: none;
    }
    #bugscribe-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(79,93,255,0.5); background: #4f5dff; color: #fff; }

    #bugscribe-modal-overlay {
      all: initial;
      position: fixed; 
      inset: 0; 
      z-index: 2147483646;
      background: rgba(0,0,0,0.7);
      backdrop-filter: blur(4px);
      display: flex; 
      align-items: center; 
      justify-content: center;
      font-family: Inter, system-ui, sans-serif;
      animation: bsIn 0.2s ease;
    }
    @keyframes bsIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }

    #bugscribe-modal {
      background: #1a1d27;
      border: 1px solid #2a2d3e;
      border-radius: 16px;
      padding: 24px;
      width: 750px;
      max-width: calc(100vw - 32px);
      max-height: calc(100vh - 32px);
      overflow-y: auto;
      box-shadow: 0 24px 64px rgba(0,0,0,0.5);
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
    }

    #bugscribe-modal h2 { margin: 0 0 4px; color: #fff; font-size: 18px; font-weight: 700; }
    #bugscribe-modal p.sub { margin: 0 0 20px; color: #64748b; font-size: 12px; }
    #bugscribe-modal label { display: block; margin-bottom: 6px; color: #94a3b8; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
    
    #bugscribe-modal input,
    #bugscribe-modal textarea,
    #bugscribe-modal select {
      all: unset;
      display: block;
      width: 100%;
      background: #0f1117;
      border: 1px solid #2a2d3e;
      border-radius: 8px;
      padding: 10px 12px;
      color: #e2e8f0;
      font-size: 13px;
      font-family: inherit;
      margin-bottom: 16px;
      box-sizing: border-box;
      transition: border-color 0.15s;
    }
    #bugscribe-modal input:focus, #bugscribe-modal textarea:focus { border-color: #4f5dff; }
    #bugscribe-modal textarea { min-height: 80px; }

    #bs-canvas-wrapper {
        position: relative;
        width: 100%;
        height: 350px;
        margin-bottom: 20px;
        background: #0f1117;
        border-radius: 8px;
        border: 1px solid #2a2d3e;
        overflow: auto;
    }
    #bs-toolbar {
        position: sticky;
        top: 8px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(42, 45, 62, 0.95);
        backdrop-filter: blur(8px);
        padding: 6px;
        border-radius: 8px;
        display: flex;
        gap: 6px;
        z-index: 100;
        border: 1px solid rgba(255,255,255,0.15);
        width: fit-content;
    }
    .bs-tool {
        all: unset;
        background: transparent;
        color: #94a3b8;
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s;
    }
    .bs-tool:hover { background: rgba(255,255,255,0.05); color: #e2e8f0; }
    .bs-tool.active { background: #4f5dff; color: #fff; }

    #bs-draw-canvas { 
        display: block; 
        cursor: crosshair;
        background: #fff;
    }

    #bugscribe-actions { display: flex; gap: 12px; margin-top: 8px; }
    .bs-primary-btn {
        all: unset;
        flex: 1;
        padding: 12px;
        background: #4f5dff;
        color: #fff;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        text-align: center;
        cursor: pointer;
        transition: background 0.15s;
    }
    .bs-primary-btn:hover { background: #3a3df5; }
    .bs-primary-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .bs-secondary-btn {
        all: unset;
        padding: 12px 20px;
        background: transparent;
        color: #64748b;
        border: 1px solid #2a2d3e;
        border-radius: 8px;
        font-size: 14px;
        text-align: center;
        cursor: pointer;
        transition: all 0.15s;
    }
    .bs-secondary-btn:hover { border-color: #3e4259; color: #94a3b8; }
    `;

    const styleEl = document.createElement("style");
    styleEl.textContent = css;
    document.head.appendChild(styleEl);

    // ── Floating Button ────────────────────────────────────────────────────────
    const btn = document.createElement("button");
    btn.id = "bugscribe-btn";
    btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> Report Bug`;
    document.body.appendChild(btn);
    btn.onclick = openWidget;

    let bgImage = null;

    async function openWidget() {
        if (document.getElementById("bugscribe-modal-overlay")) return;

        btn.disabled = true;
        btn.textContent = "Capturing…";

        try {
            const dataUrl = await captureScreenshot();
            if (dataUrl) {
                bgImage = new Image();
                bgImage.src = dataUrl;
                await new Promise((resolve) => {
                    bgImage.onload = resolve;
                    bgImage.onerror = resolve; // Fallback if image fails to load
                });
            }
        } catch (err) {
            console.error("[BugScribe] Capture failed:", err);
        }

        btn.disabled = false;
        btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> Report Bug`;
        renderModal();
    }

    function loadHtmlToImage() {
        return new Promise((res, rej) => {
            if (window.htmlToImage) return res();
            const s = document.createElement("script");
            s.src = "https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.min.js";
            s.onload = res; s.onerror = rej;
            document.head.appendChild(s);
        });
    }

    function captureScreenshot() {
        return new Promise((resolve, reject) => {
            let handled = false;

            const onReady = (e) => {
                handled = true;
                window.removeEventListener("bugscribe-screenshot-ready", onReady);
                resolve(e.detail);
            };
            window.addEventListener("bugscribe-screenshot-ready", onReady);

            window.dispatchEvent(new Event("bugscribe-request-screenshot"));

            setTimeout(async () => {
                if (!handled) {
                    window.removeEventListener("bugscribe-screenshot-ready", onReady);
                    try {
                        await loadHtmlToImage();
                        const dataUrl = await window.htmlToImage.toPng(document.body, {
                            pixelRatio: 2,
                            backgroundColor: "#ffffff",
                            filter: (el) => el.id !== "bugscribe-btn" && el.id !== "bugscribe-modal-overlay"
                        });
                        resolve(dataUrl);
                    } catch (err) {
                        reject(err);
                    }
                }
            }, 300); // 300ms fallback
        });
    }

    function renderModal() {
        const overlay = document.createElement("div");
        overlay.id = "bugscribe-modal-overlay";
        overlay.innerHTML = `
            <div id="bugscribe-modal">
                <header style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
                    <div>
                        <h2 style="display:flex; align-items:center; gap:8px;">
                            <span style="font-size:20px;">🐛</span> Report a Bug
                        </h2>
                        <span style="font-size:10px; color:#818cf8; text-transform:uppercase; font-weight:700; background:rgba(129,140,248,0.1); padding:2px 6px; border-radius:4px; margin-top:4px; display:inline-block;">
                            Workspace: <span id="bs-project-name-display">${PROJECT_NAME}</span>
                        </span>
                    </div>
                </header>
                <p class="sub" style="margin-bottom:20px;">Help us fix this. Your report goes straight to the team.</p>

                ${bgImage ? `
                <div id="bs-canvas-wrapper">
                    <div id="bs-toolbar">
                        <button type="button" class="bs-tool active" data-tool="pen">✏️ Pen</button>
                        <button type="button" class="bs-tool" data-tool="arrow">↗ Arrow</button>
                        <button type="button" class="bs-tool" data-tool="rect">⬜ Box</button>
                        <button type="button" class="bs-tool" data-tool="circle">⭕ Circle</button>
                        <button type="button" class="bs-tool" data-tool="text">T Text</button>
                        <button type="button" class="bs-tool" data-tool="blur">💧 Blur</button>
                        <button type="button" class="bs-tool" data-tool="redact">⬛ Redact</button>
                        <div style="width:1px; background:rgba(255,255,255,0.1); height:16px; margin:0 4px;"></div>
                        <button type="button" class="bs-tool" id="bs-undo" title="Undo (Ctrl+Z)">↩️ Undo</button>
                    </div>
                    <canvas id="bs-draw-canvas"></canvas>
                </div>` : ""}

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-bottom:16px;">
                    <div>
                        <label>Bug Title *</label>
                        <input id="bs-title" type="text" placeholder="What went wrong?" style="margin-bottom:0;" />
                    </div>
                    <div>
                        <label>Bug Type</label>
                        <select id="bs-type" style="margin-bottom:0;">
                            <option value="general">General</option>
                            <option value="ui_ux">UI/UX</option>
                            <option value="performance">Performance</option>
                            <option value="security">Security</option>
                            <option value="crash">Crash</option>
                            <option value="network">Network</option>
                        </select>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-bottom:16px;">
                    <div>
                        <label>Priority</label>
                        <select id="bs-priority" style="margin-bottom:0;">
                            <option value="low">Low</option>
                            <option value="medium" selected>Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                        </select>
                    </div>
                    <div>
                        <label>Your Name</label>
                        <input id="bs-reporter-name" type="text" placeholder="John Doe" style="margin-bottom:0;" />
                    </div>
                </div>
                <label>Description</label>
                <textarea id="bs-desc" placeholder="Steps to reproduce..." style="min-height:70px;"></textarea>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-bottom:0px;">
                    <div>
                        <label>Your Email</label>
                        <input id="bs-reporter-email" type="email" placeholder="john@example.com" />
                    </div>
                </div>

                <div id="bugscribe-actions">
                    <button id="bs-submit" class="bs-primary-btn">Submit Report</button>
                    <button id="bs-cancel" class="bs-secondary-btn">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        document.getElementById("bs-cancel").onclick = () => overlay.remove();
        document.getElementById("bs-submit").onclick = handleSubmit;

        if (bgImage) initCanvas();
    }

    function initCanvas() {
        const canvas = document.getElementById("bs-draw-canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = bgImage.width;
        canvas.height = bgImage.height;
        ctx.drawImage(bgImage, 0, 0);

        let drawing = false, mode = "pen", startX, startY, snapshot;
        const undoStack = [];

        const saveState = () => {
            if (undoStack.length >= 20) undoStack.shift();
            undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
        };

        saveState(); // Initial state

        document.getElementById("bs-undo").onclick = (e) => {
            e.stopPropagation();
            if (undoStack.length > 1) {
                undoStack.pop();
                ctx.putImageData(undoStack[undoStack.length - 1], 0, 0);
            }
        };

        document.querySelectorAll(".bs-tool[data-tool]").forEach(t => {
            t.onclick = () => {
                document.querySelectorAll(".bs-tool[data-tool]").forEach(b => b.classList.remove("active"));
                t.classList.add("active");
                mode = t.dataset.tool;
                canvas.style.cursor = mode === "text" ? "text" : "crosshair";
            };
        });

        const getPos = (e) => {
            const r = canvas.getBoundingClientRect();
            const clientX = (e.touches ? e.touches[0].clientX : e.clientX) || 0;
            const clientY = (e.touches ? e.touches[0].clientY : e.clientY) || 0;
            return {
                x: (clientX - r.left) * (canvas.width / r.width),
                y: (clientY - r.top)  * (canvas.height / r.height)
            };
        };

        /** Draw filled-head arrow on ctx from (x1,y1) to (x2,y2) */
        const drawArrow = (x1, y1, x2, y2) => {
            const headLen = 20;
            const angle = Math.atan2(y2 - y1, x2 - x1);
            ctx.strokeStyle = "#ef4444"; ctx.fillStyle = "#ef4444";
            ctx.lineWidth = 5; ctx.lineCap = "round";
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x2, y2);
            ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
            ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
            ctx.closePath(); ctx.fill();
        };

        const start = (e) => {
            if (e.target.closest("#bs-toolbar")) return;
            if (mode === "text") return; // handled via click
            const pos = getPos(e);
            drawing = true;
            startX = pos.x; startY = pos.y;
            snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
            if (mode === "pen") {
                ctx.beginPath(); ctx.moveTo(startX, startY);
                ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 5;
                ctx.lineCap = "round"; ctx.lineJoin = "round";
            }
        };

        const move = (e) => {
            if (!drawing) return;
            if (e.cancelable) e.preventDefault();
            const pos = getPos(e);
            if (mode === "pen") {
                ctx.lineTo(pos.x, pos.y); ctx.stroke();
            } else {
                ctx.putImageData(snapshot, 0, 0); // restore for live preview
                if (mode === "arrow") {
                    drawArrow(startX, startY, pos.x, pos.y);
                } else if (mode === "rect") {
                    ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 5;
                    ctx.strokeRect(startX, startY, pos.x - startX, pos.y - startY);
                } else if (mode === "circle") {
                    const rx = Math.abs(pos.x - startX) / 2;
                    const ry = Math.abs(pos.y - startY) / 2;
                    const cx = startX + (pos.x - startX) / 2;
                    const cy = startY + (pos.y - startY) / 2;
                    ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 5;
                    ctx.beginPath();
                    ctx.ellipse(cx, cy, Math.max(rx, 1), Math.max(ry, 1), 0, 0, 2 * Math.PI);
                    ctx.stroke();
                } else if (mode === "redact") {
                    ctx.fillStyle = "#000";
                    ctx.fillRect(startX, startY, pos.x - startX, pos.y - startY);
                } else if (mode === "blur") {
                    ctx.filter = "blur(15px)";
                    ctx.drawImage(canvas, startX, startY, pos.x - startX, pos.y - startY, startX, startY, pos.x - startX, pos.y - startY);
                    ctx.filter = "none";
                }
            }
        };

        const stop = () => {
            if (drawing) { drawing = false; saveState(); }
        };

        // Text tool – click to place
        canvas.addEventListener("click", (e) => {
            if (mode !== "text") return;
            const text = prompt("Enter annotation text:");
            if (!text) return;
            saveState();
            const pos = getPos(e);
            ctx.font      = "bold 20px Inter, system-ui, sans-serif";
            ctx.fillStyle = "#ef4444";
            ctx.strokeStyle = "rgba(0,0,0,0.5)";
            ctx.lineWidth   = 3;
            ctx.strokeText(text, pos.x, pos.y);
            ctx.fillText(text, pos.x, pos.y);
            saveState();
        });

        canvas.addEventListener("mousedown", start);
        canvas.addEventListener("touchstart", start, { passive: false });

        window.addEventListener("mousemove", move, { passive: false });
        window.addEventListener("touchmove", move, { passive: false });

        window.addEventListener("mouseup", stop);
        window.addEventListener("touchend", stop);

        // Cleanup on modal close
        const observer = new MutationObserver(() => {
            if (!document.getElementById("bugscribe-modal")) {
                window.removeEventListener("mousemove", move);
                window.removeEventListener("touchmove", move);
                window.removeEventListener("mouseup", stop);
                window.removeEventListener("touchend", stop);
                observer.disconnect();
            }
        });
        observer.observe(document.body, { childList: true });
    }

    async function handleSubmit() {
        const title = document.getElementById("bs-title").value.trim();
        if (!title) return document.getElementById("bs-title").focus();

        const subBtn = document.getElementById("bs-submit");
        subBtn.disabled = true; subBtn.textContent = "Submitting...";

        try {
            const canvas = document.getElementById("bs-draw-canvas");
            let screenshotStorageId;
            if (canvas) {
                console.log("[BugScribe] Preparing screenshot upload...");
                const blob = await new Promise(r => canvas.toBlob(r, "image/jpeg", 0.7));

                const urlRes = await convexReq("bugs:generateUploadUrl", {});
                console.log("[BugScribe] Upload URL acquired.");

                const upRes = await fetch(urlRes, {
                    method: "POST",
                    body: blob
                });

                if (!upRes.ok) {
                    throw new Error(`Upload failed: ${upRes.status} ${upRes.statusText}`);
                }

                const { storageId } = await upRes.json();
                screenshotStorageId = storageId;
            }

            const getOS = () => {
                const ua = navigator.userAgent;
                if (/Windows/.test(ua)) return "Windows";
                if (/Macintosh/.test(ua)) return "macOS";
                if (/Linux/.test(ua)) return "Linux";
                if (/Android/.test(ua)) return "Android";
                if (/iPhone|iPad|iPod/.test(ua)) return "iOS";
                return "Unknown";
            };

            console.log("[BugScribe] Creating bug record...");
            await convexReq("bugs:createBug", {
                projectId: PROJECT_ID,
                apiKey: API_KEY,
                title,
                description: document.getElementById("bs-desc").value,
                priority: document.getElementById("bs-priority").value,
                type: document.getElementById("bs-type").value,
                reporterName: document.getElementById("bs-reporter-name").value,
                reporterEmail: document.getElementById("bs-reporter-email").value,
                screenshotStorageId,
                browser: navigator.userAgent,
                os: getOS(),
                url: window.location.href,
                screenWidth: window.innerWidth,
                screenHeight: window.innerHeight,
                scrollX: window.scrollX,
                scrollY: window.scrollY,
                consoleErrors: capturedErrors
            });

            console.log("[BugScribe] Success!");
            document.getElementById("bugscribe-modal").innerHTML = `
                <div style="text-align:center; padding: 40px 0;">
                    <div style="font-size: 40px; margin-bottom: 20px;">✅</div>
                    <h2>Bug Reported!</h2>
                    <p style="color:#64748b">The team has been notified.</p>
                </div>
            `;
            setTimeout(() => {
                const overlay = document.getElementById("bugscribe-modal-overlay");
                if (overlay) overlay.remove();
            }, 2000);
        } catch (err) {
            console.error("[BugScribe] Failed to submit bug report:", err);
            alert(`Failed to submit: ${err.message || "Unknown error"}. Check console for details.`);
            subBtn.disabled = false; subBtn.textContent = "Try Again";
        }
    }

    async function convexReq(path, args, type = "mutation") {
        try {
            const resp = await fetch(`${CONVEX_URL}/api/${type}`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ path, args: { ...args, projectId: PROJECT_ID, apiKey: API_KEY }, format: "json" })
            });

            if (!resp.ok) {
                const text = await resp.text();
                throw new Error(`Convex API error: ${resp.status} ${text}`);
            }

            const data = await resp.json();
            if (data.status === "error") throw new Error(data.errorMessage || `Convex ${type} failed`);
            return data.value;
        } catch (err) {
            console.error(`[BugScribe] Request error [${path}]:`, err);
            throw err;
        }
    }
})();
