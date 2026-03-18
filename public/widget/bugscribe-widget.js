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

    function parseHighlightPayload() {
        const hash = window.location.hash;
        if (!hash) return null;
        const hashValue = hash.replace(/^#/, "");
        const params = new URLSearchParams(hashValue);
        const coordsRaw = params.get("bugscribe-highlight");
        if (!coordsRaw) return null;
        const [xRaw, yRaw] = coordsRaw.split(",");
        const x = Number(xRaw);
        const y = Number(yRaw);
        if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
        return {
            x,
            y,
            scroll: Number(params.get("bugscribe-scroll")),
            selector: params.get("bugscribe-selector"),
        };
    }

    function showPulseMarker(x, y) {
        const safeX = Number.isFinite(x) ? x : Math.round(window.innerWidth / 2);
        const safeY = Number.isFinite(y) ? y : Math.round(window.innerHeight / 2);
        const marker = document.createElement("div");
        marker.style.position = "fixed";
        marker.style.left = `${Math.max(0, safeX - 18)}px`;
        marker.style.top = `${Math.max(0, safeY - 18)}px`;
        marker.style.width = "36px";
        marker.style.height = "36px";
        marker.style.border = "3px solid #ef4444";
        marker.style.borderRadius = "9999px";
        marker.style.boxShadow = "0 0 0 6px rgba(239,68,68,0.25)";
        marker.style.background = "rgba(239,68,68,0.15)";
        marker.style.pointerEvents = "none";
        marker.style.zIndex = "2147483647";
        marker.style.transition = "opacity 0.5s ease";
        document.documentElement.appendChild(marker);
        setTimeout(() => {
            marker.style.opacity = "0";
            setTimeout(() => marker.remove(), 500);
        }, 2600);
    }

    function showElementBox(rect) {
        const box = document.createElement("div");
        box.style.position = "fixed";
        box.style.left = `${Math.max(0, rect.left)}px`;
        box.style.top = `${Math.max(0, rect.top)}px`;
        box.style.width = `${Math.max(24, rect.width)}px`;
        box.style.height = `${Math.max(24, rect.height)}px`;
        box.style.border = "2px solid #ef4444";
        box.style.background = "rgba(239,68,68,0.08)";
        box.style.boxShadow = "0 0 0 4px rgba(239,68,68,0.18)";
        box.style.pointerEvents = "none";
        box.style.zIndex = "2147483647";
        box.style.transition = "opacity 0.5s ease";
        document.documentElement.appendChild(box);
        setTimeout(() => {
            box.style.opacity = "0";
            setTimeout(() => box.remove(), 500);
        }, 2600);
        showPulseMarker(rect.left + rect.width / 2, rect.top + rect.height / 2);
    }

    function handleHighlight() {
        const payload = parseHighlightPayload();
        if (!payload) return;

        // Give the page a moment to settle
        setTimeout(() => {
            const scrollTop = Number.isFinite(payload.scroll) ? payload.scroll : Math.max(0, payload.y - Math.round(window.innerHeight / 2));
            window.scrollTo({ left: 0, top: scrollTop, behavior: "smooth" });

            setTimeout(() => {
                if (payload.selector) {
                    try {
                        const selector = decodeURIComponent(payload.selector);
                        const el = document.querySelector(selector);
                        if (el) {
                            showElementBox(el.getBoundingClientRect());
                            return;
                        }
                    } catch { }
                }
                showPulseMarker(payload.x, payload.y);
            }, 600); // Wait for scroll to finish
        }, 500);
    }

    window.addEventListener("load", handleHighlight);
    window.addEventListener("hashchange", handleHighlight);

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
      justify-content: center;
      width: 48px;
      height: 48px;
      background: #ffffff;
      color: #0f172a;
      border: 1px solid #e2e8f0;
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transition: all 0.2s ease;
      user-select: none;
    }
    #bugscribe-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.2); }
    #bugscribe-btn svg { color: #0f172a; }

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
        height: 450px;
        margin-bottom: 20px;
        background: #0f1117;
        border-radius: 12px;
        border: 1px solid #2a2d3e;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }
    #bs-toolbar {
        position: absolute;
        top: 16px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(15, 17, 26, 0.85);
        backdrop-filter: blur(16px);
        padding: 6px 10px;
        border-radius: 99px;
        display: flex;
        align-items: center;
        gap: 8px;
        z-index: 100;
        border: 1px solid rgba(255,255,255,0.1);
        width: fit-content;
        box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        cursor: grab;
        user-select: none;
        transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), padding 0.3s;
        overflow: hidden;
    }
    #bs-toolbar.collapsed {
        width: 40px;
        padding: 6px;
        justify-content: center;
    }
    #bs-toolbar.collapsed > *:not(#bs-toggle-toolbar) {
        display: none !important;
    }
    #bs-toggle-toolbar {
        all: unset;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: rgba(255,255,255,0.05);
        color: #fff;
        cursor: pointer;
        transition: all 0.2s;
        flex-shrink: 0;
    }
    #bs-toggle-toolbar:hover {
        background: rgba(255,255,255,0.15);
        transform: scale(1.1);
    }
    #bs-toggle-toolbar svg {
        transition: transform 0.3s;
    }
    #bs-toolbar.collapsed #bs-toggle-toolbar svg {
        transform: rotate(180deg);
    }
    
    .bs-color-dot {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        cursor: pointer;
        border: 2px solid transparent;
        transition: all 0.2s;
    }
    .bs-color-dot.active { border-color: #fff; transform: scale(1.2); }

    .bs-tool {
        all: unset;
        background: transparent;
        color: #94a3b8;
        padding: 6px 12px;
        border-radius: 8px;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 6px;
        white-space: nowrap;
        text-transform: capitalize;
    }
    .bs-tool:hover { background: rgba(255,255,255,0.05); color: #e2e8f0; }
    .bs-tool.active { background: #4f5dff; color: #fff; box-shadow: 0 4px 12px rgba(79,93,255,0.3); }

    .bs-divider {
        width: 1px;
        height: 16px;
        background: rgba(255,255,255,0.1);
        margin: 0 4px;
    }

    .bs-action-btn {
        all: unset;
        padding: 6px 12px;
        border-radius: 8px;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: all 0.2s;
    }
    #bs-undo { background: rgba(79,93,255,0.1); color: #818cf8; }
    #bs-undo:hover { background: rgba(79,93,255,0.2); }
    #bs-done { background: #22c55e; color: #fff; }
    #bs-done:hover { background: #16a34a; }
    #bs-close-canvas { background: #ef4444; color: #fff; padding: 6px; border-radius: 8px; }
    #bs-close-canvas:hover { background: #dc2626; }

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
    btn.title = "Report Bug";
    btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>`;
    document.body.appendChild(btn);
    btn.onclick = openWidget;

    let bgImage = null;
    let selectedElement = null;
    let selectionCoords = null;

    async function openWidget() {
        if (document.getElementById("bugscribe-modal-overlay")) return;

        // Reset previous selection
        selectedElement = null;
        selectionCoords = null;

        btn.disabled = true;
        btn.textContent = "Selecting…";

        // Step 1: Start Element Picker
        const picker = await startElementPicker();
        if (!picker) {
            btn.disabled = false;
            btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> Report Bug`;
            return;
        }

        selectedElement = picker.element;
        selectionCoords = picker.coords;

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

    function startElementPicker() {
        return new Promise((resolve) => {
            const overlay = document.createElement("div");
            overlay.style.cssText = "position:fixed;inset:0;z-index:2147483645;cursor:crosshair;background:rgba(79,93,255,0.05);";
            
            const highlight = document.createElement("div");
            highlight.style.cssText = "position:fixed;pointer-events:none;border:2px solid #4f5dff;background:rgba(79,93,255,0.1);z-index:2147483646;display:none;transition:all 0.1s ease;";
            
            const label = document.createElement("div");
            label.style.cssText = "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1a1d27;color:#fff;padding:8px 16px;border-radius:8px;font-size:12px;font-weight:600;z-index:2147483647;box-shadow:0 4px 20px rgba(0,0,0,0.3);border:1px solid #2a2d3e;";
            label.textContent = "Click on the issue to select it (Esc to cancel)";

            document.body.appendChild(overlay);
            document.body.appendChild(highlight);
            document.body.appendChild(label);

            const onMove = (e) => {
                overlay.style.pointerEvents = "none";
                const el = document.elementFromPoint(e.clientX, e.clientY);
                overlay.style.pointerEvents = "auto";

                if (el && el !== overlay && el !== highlight && el !== label && el !== btn) {
                    const rect = el.getBoundingClientRect();
                    highlight.style.display = "block";
                    highlight.style.top = `${rect.top}px`;
                    highlight.style.left = `${rect.left}px`;
                    highlight.style.width = `${rect.width}px`;
                    highlight.style.height = `${rect.height}px`;
                } else {
                    highlight.style.display = "none";
                }
            };

            const onClick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                overlay.style.pointerEvents = "none";
                const el = document.elementFromPoint(e.clientX, e.clientY);
                cleanup();
                
                if (el && el !== btn) {
                    resolve({
                        element: el,
                        coords: { x: e.clientX, y: e.clientY }
                    });
                } else {
                    resolve(null);
                }
            };

            const onKey = (e) => {
                if (e.key === "Escape") {
                    cleanup();
                    resolve(null);
                }
            };

            const cleanup = () => {
                window.removeEventListener("mousemove", onMove);
                window.removeEventListener("click", onClick, true);
                window.removeEventListener("keydown", onKey);
                overlay.remove();
                highlight.remove();
                label.remove();
            };

            window.addEventListener("mousemove", onMove);
            window.addEventListener("click", onClick, true);
            window.addEventListener("keydown", onKey);
        });
    }

    function getQuerySelector(el) {
        if (el.id) return `#${el.id}`;
        if (el.tagName === "BODY") return "body";
        let path = [];
        while (el && el.nodeType === Node.ELEMENT_NODE) {
            let selector = el.nodeName.toLowerCase();
            if (el.id) {
                selector += `#${el.id}`;
                path.unshift(selector);
                break;
            } else {
                let sib = el, nth = 1;
                while (sib = sib.previousElementSibling) {
                    if (sib.nodeName.toLowerCase() == selector) nth++;
                }
                if (nth != 1) selector += `:nth-of-type(${nth})`;
            }
            path.unshift(selector);
            el = el.parentNode;
        }
        return path.join(" > ");
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
                        const dataUrl = await window.htmlToImage.toWebp(document.body, {
                            pixelRatio: 2,
                            backgroundColor: "#ffffff",
                            quality: 0.8,
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
                <div id="bs-step-1" style="display: ${bgImage ? 'block' : 'none'};">
                    <header style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                        <h2 style="display:flex; align-items:center; gap:8px; font-size:16px;">
                            🎨 Annotate Screenshot
                        </h2>
                        <span style="font-size:10px; color:#64748b; font-weight:600; background:rgba(255,255,255,0.05); padding:4px 8px; border-radius:6px;">
                            ${PROJECT_NAME}
                        </span>
                    </header>
                    
                    <div id="bs-canvas-wrapper">
                        <div id="bs-toolbar">
                            <button type="button" id="bs-toggle-toolbar" title="Toggle toolbar">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M15 18l-6-6 6-6"/>
                                </svg>
                            </button>
                            <div style="display:flex; gap:6px; padding:0 4px;">
                                <div class="bs-color-dot active" style="background:#ef4444;" data-color="#ef4444"></div>
                                <div class="bs-color-dot" style="background:#f59e0b;" data-color="#f59e0b"></div>
                                <div class="bs-color-dot" style="background:#10b981;" data-color="#10b981"></div>
                                <div class="bs-color-dot" style="background:#3b82f6;" data-color="#3b82f6"></div>
                                <div class="bs-color-dot" style="background:#ffffff;" data-color="#ffffff"></div>
                            </div>
                            <div class="bs-divider"></div>
                            <button type="button" class="bs-tool active" data-tool="pen">✏️ Pen</button>
                            <button type="button" class="bs-tool" data-tool="arrow">↗ Arrow</button>
                            <button type="button" class="bs-tool" data-tool="rect">⬜ Box</button>
                            <button type="button" class="bs-tool" data-tool="circle">⭕ Circle</button>
                            <button type="button" class="bs-tool" data-tool="blur">💧 Blur</button>
                            <button type="button" class="bs-tool" data-tool="text">T Text</button>
                            <div class="bs-divider"></div>
                            <button type="button" class="bs-action-btn" id="bs-undo">↩️ Undo</button>
                            <button type="button" class="bs-action-btn" id="bs-done">✅ Done</button>
                            <button type="button" id="bs-close-canvas" title="Close editor">✕</button>
                        </div>
                        <canvas id="bs-draw-canvas"></canvas>
                    </div>
                </div>

                <div id="bs-step-2" style="display: ${bgImage ? 'none' : 'block'};">
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
        const toolbar = document.getElementById("bs-toolbar");

        canvas.width = bgImage.width;
        canvas.height = bgImage.height;
        ctx.drawImage(bgImage, 0, 0);

        // --- Draggable Toolbar ---
        let isDragging = false, dragX, dragY;
        toolbar.onmousedown = (e) => {
            if (e.target.closest("button") || e.target.closest(".bs-color-dot")) return;
            isDragging = true;
            dragX = e.clientX - toolbar.offsetLeft;
            dragY = e.clientY - toolbar.offsetTop;
        };
        window.onmousemove = (e) => {
            if (!isDragging) return;
            toolbar.style.left = (e.clientX - dragX) + "px";
            toolbar.style.top = (e.clientY - dragY) + "px";
            toolbar.style.transform = "none";
        };
        window.onmouseup = () => isDragging = false;

        // --- Toggle Toolbar ---
        const toggleBtn = document.getElementById("bs-toggle-toolbar");
        toggleBtn.onclick = (e) => {
            e.stopPropagation();
            toolbar.classList.toggle("collapsed");
        };

        // Auto-draw selection marker...
        if (selectionCoords) {
            ctx.save();
            const scaleX = canvas.width / window.innerWidth;
            const scaleY = canvas.height / window.innerHeight;
            if (selectedElement) {
                const rect = selectedElement.getBoundingClientRect();
                ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 5;
                ctx.strokeRect(rect.left * scaleX, rect.top * scaleY, rect.width * scaleX, rect.height * scaleY);
                ctx.fillStyle = "rgba(239, 68, 68, 0.1)";
                ctx.fillRect(rect.left * scaleX, rect.top * scaleY, rect.width * scaleX, rect.height * scaleY);
            } else {
                ctx.beginPath(); ctx.arc(selectionCoords.x * scaleX, selectionCoords.y * scaleY, 20, 0, Math.PI * 2);
                ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 5; ctx.stroke();
                ctx.fillStyle = "rgba(239, 68, 68, 0.2)"; ctx.fill();
            }
            ctx.restore();
        }

        let drawing = false, mode = "pen", color = "#ef4444", startX, startY, snapshot;
        const undoStack = [];

        const saveState = () => {
            if (undoStack.length >= 20) undoStack.shift();
            undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
        };
        saveState();

        document.getElementById("bs-undo").onclick = (e) => {
            e.stopPropagation();
            if (undoStack.length > 1) {
                undoStack.pop();
                ctx.putImageData(undoStack[undoStack.length - 1], 0, 0);
            }
        };

        document.getElementById("bs-done").onclick = (e) => {
            e.stopPropagation();
            document.getElementById("bs-step-1").style.display = "none";
            document.getElementById("bs-step-2").style.display = "block";
        };

        document.getElementById("bs-close-canvas").onclick = (e) => {
            e.stopPropagation();
            if (confirm("Remove screenshot and go back to form?")) {
                bgImage = null;
                document.getElementById("bs-step-1").style.display = "none";
                document.getElementById("bs-step-2").style.display = "block";
            }
        };

        document.querySelectorAll(".bs-color-dot").forEach(dot => {
            dot.onclick = () => {
                document.querySelectorAll(".bs-color-dot").forEach(d => d.classList.remove("active"));
                dot.classList.add("active");
                color = dot.dataset.color;
            };
        });

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

        const drawArrow = (x1, y1, x2, y2) => {
            const headLen = 20;
            const angle = Math.atan2(y2 - y1, x2 - x1);
            ctx.strokeStyle = color; ctx.fillStyle = color;
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
            if (mode === "text") return;
            const pos = getPos(e);
            drawing = true;
            startX = pos.x; startY = pos.y;
            snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
            if (mode === "pen") {
                ctx.beginPath(); ctx.moveTo(startX, startY);
                ctx.strokeStyle = color; ctx.lineWidth = 5;
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
                ctx.putImageData(snapshot, 0, 0);
                ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 5;
                if (mode === "arrow") drawArrow(startX, startY, pos.x, pos.y);
                else if (mode === "rect") ctx.strokeRect(startX, startY, pos.x - startX, pos.y - startY);
                else if (mode === "circle") {
                    const rx = Math.abs(pos.x - startX) / 2, ry = Math.abs(pos.y - startY) / 2;
                    const cx = startX + (pos.x - startX) / 2, cy = startY + (pos.y - startY) / 2;
                    ctx.beginPath(); ctx.ellipse(cx, cy, Math.max(rx, 1), Math.max(ry, 1), 0, 0, 2 * Math.PI); ctx.stroke();
                } else if (mode === "blur") {
                    ctx.filter = "blur(15px)";
                    ctx.drawImage(canvas, startX, startY, pos.x - startX, pos.y - startY, startX, startY, pos.x - startX, pos.y - startY);
                    ctx.filter = "none";
                }
            }
        };

        const stop = () => { if (drawing) { drawing = false; saveState(); } };

        canvas.addEventListener("click", (e) => {
            if (mode !== "text") return;
            const text = prompt("Enter annotation text:");
            if (!text) return;
            saveState();
            const pos = getPos(e);
            ctx.font = "bold 20px Inter, system-ui, sans-serif";
            ctx.fillStyle = color;
            ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.lineWidth = 3;
            ctx.strokeText(text, pos.x, pos.y); ctx.fillText(text, pos.x, pos.y);
            saveState();
        });

        canvas.addEventListener("mousedown", start);
        canvas.addEventListener("touchstart", start, { passive: false });
        window.addEventListener("mousemove", move, { passive: false });
        window.addEventListener("touchmove", move, { passive: false });
        window.addEventListener("mouseup", stop);
        window.addEventListener("touchend", stop);

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

    async function handleSubmit(e) {
        if (e && e.preventDefault) e.preventDefault();
        
        const subBtn = document.getElementById("bs-submit");
        if (subBtn && subBtn.disabled) return; // Prevent multiple requests

        const title = document.getElementById("bs-title").value.trim();
        if (!title) return document.getElementById("bs-title").focus();

        subBtn.disabled = true; subBtn.textContent = "Submitting...";

        try {
            const canvas = document.getElementById("bs-draw-canvas");
            let screenshotStorageId;
            if (canvas) {
                console.log("[BugScribe] Preparing screenshot upload...");
                const blob = await new Promise(r => canvas.toBlob(r, "image/webp", 0.6));

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
                x_coordinate: selectionCoords ? selectionCoords.x : window.scrollX,
                y_coordinate: selectionCoords ? selectionCoords.y : window.scrollY,
                element_selector: selectedElement ? getQuerySelector(selectedElement) : undefined,
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
