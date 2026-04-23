let recordedChunks = [];
let mediaRecorder = null;
let stream = null;
let steps = [];
let overlay = null;
let latestBugContext = null;

// --- Error and Network Capture ---
let consoleErrors = [];
let networkLogs = [];

const MAX_LOGS = 50;

function captureConsoleError(msg, file, line, col, error) {
    const errorLog = {
        message: msg,
        file: file || "Unknown",
        line: line || 0,
        column: col || 0,
        stack: error ? error.stack : "No stack trace",
        timestamp: Date.now()
    };
    consoleErrors.push(errorLog);
    if (consoleErrors.length > MAX_LOGS) consoleErrors.shift();
}

window.addEventListener('error', (event) => {
    captureConsoleError(event.message, event.filename, event.lineno, event.colno, event.error);
}, true);

window.addEventListener('unhandledrejection', (event) => {
    captureConsoleError(
        `Unhandled Promise Rejection: ${event.reason}`,
        "Unknown", 0, 0,
        event.reason instanceof Error ? event.reason : null
    );
}, true);

// Hook into fetch
const originalFetch = window.fetch;
window.fetch = async (...args) => {
    const startTime = Date.now();
    const url = args[0] instanceof Request ? args[0].url : args[0];
    const method = (args[1] && args[1].method) || (args[0] instanceof Request ? args[0].method : 'GET');

    try {
        const response = await originalFetch(...args);
        if (!response.ok) {
            networkLogs.push({
                url,
                method,
                status: response.status,
                responseTime: Date.now() - startTime,
                timestamp: Date.now()
            });
            if (networkLogs.length > MAX_LOGS) networkLogs.shift();
        }
        return response;
    } catch (error) {
        networkLogs.push({
            url,
            method,
            status: 0, // Failed to fetch (e.g. CORS or Network error)
            error: error.message,
            responseTime: Date.now() - startTime,
            timestamp: Date.now()
        });
        if (networkLogs.length > MAX_LOGS) networkLogs.shift();
        throw error;
    }
};

// Hook into XHR
const originalXHR = window.XMLHttpRequest.prototype.open;
const originalXHRSend = window.XMLHttpRequest.prototype.send;

window.XMLHttpRequest.prototype.open = function (method, url) {
    this._method = method;
    this._url = url;
    this._startTime = Date.now();
    return originalXHR.apply(this, arguments);
};

window.XMLHttpRequest.prototype.send = function () {
    this.addEventListener('load', function () {
        if (this.status >= 400 || this.status === 0) {
            networkLogs.push({
                url: this._url,
                method: this._method,
                status: this.status,
                responseTime: Date.now() - this._startTime,
                timestamp: Date.now()
            });
            if (networkLogs.length > MAX_LOGS) networkLogs.shift();
        }
    });
    this.addEventListener('error', function () {
        networkLogs.push({
            url: this._url,
            method: this._method,
            status: 0,
            error: "Network error",
            responseTime: Date.now() - this._startTime,
            timestamp: Date.now()
        });
        if (networkLogs.length > MAX_LOGS) networkLogs.shift();
    });
    return originalXHRSend.apply(this, arguments);
};

function buildSelector(element) {
    if (!element || element.nodeType !== 1) return "";
    if (element.id) return `#${CSS.escape(element.id)}`;

    const segments = [];
    let current = element;
    while (current && current.nodeType === 1 && current !== document.body) {
        let segment = current.tagName.toLowerCase();
        if (current.classList && current.classList.length > 0) {
            const className = current.classList[0];
            if (className) segment += `.${CSS.escape(className)}`;
        }
        if (current.parentElement) {
            const siblings = Array.from(current.parentElement.children).filter(
                (sibling) => sibling.tagName === current.tagName
            );
            if (siblings.length > 1) {
                segment += `:nth-of-type(${siblings.indexOf(current) + 1})`;
            }
        }
        segments.unshift(segment);
        current = current.parentElement;
    }
    return segments.join(" > ");
}

function updateLatestBugContext(event) {
    if (!event || !event.target || event.target.closest('#bugscribe-recording-overlay')) return;
    const href = window.location.href;
    const safeUrl = (href.startsWith("http://") || href.startsWith("https://")) ? href.substring(0, 2048) : "";
    latestBugContext = {
        page_url:         safeUrl,
        x_coordinate:     Number.isFinite(event.clientX) ? Math.round(event.clientX) : 0,
        y_coordinate:     Number.isFinite(event.clientY) ? Math.round(event.clientY) : 0,
        scroll_position:  Math.round(window.scrollY || 0),
        scrollX:          Math.round(window.scrollX || 0),
        scrollY:          Math.round(window.scrollY || 0),
        element_selector: buildSelector(event.target),
        created_at:       Date.now(),
    };
}

function getActionDescription(e) {
    const tag = e.target.tagName.toLowerCase();
    const text = e.target.innerText ? e.target.innerText.substring(0, 30).trim() : '';
    const name = e.target.name || e.target.placeholder || e.target.id || text || tag;
    return `Clicked on ${name}`;
}

const clickListener = (e) => {
    // Avoid logging clicks on our own overlay
    if (e.target.closest('#bugscribe-recording-overlay')) return;
    updateLatestBugContext(e);
    steps.push(getActionDescription(e));
};

const inputListener = (e) => {
    if (e.target.closest('#bugscribe-recording-overlay')) return;
    updateLatestBugContext(e);
    const name = e.target.name || e.target.placeholder || e.target.id || 'input';
    steps.push(`Typed in ${name}`);
};

document.addEventListener("pointerdown", updateLatestBugContext, true);
document.addEventListener("mousemove", (e) => {
    if (!latestBugContext) updateLatestBugContext(e);
}, { capture: true, passive: true });

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "START_RECORDING") {
        startRecording();
        sendResponse(toon.encode({ status: "started" }));
        return true; // Keep channel open
    } else if (request.action === "GET_ENV_DATA") {
        try {
            const truncateEntries = (entries) => {
                try {
                    return JSON.stringify(entries.slice(0, 30).map(([k, v]) => [
                        String(k).substring(0, 100),
                        typeof v === 'string' && v.length > 200 ? v.substring(0, 200) + '...' : v
                    ]));
                } catch { return "[]"; }
            };
            const pageLoadTime = window.performance?.timing
                ? window.performance.timing.loadEventEnd - window.performance.timing.navigationStart
                : 0;
            const href = window.location.href;
            const safeHref = (href.startsWith("http://") || href.startsWith("https://")) ? href.substring(0, 2048) : "";
            sendResponse(toon.encode({
                localStorage:     truncateEntries(Object.entries(localStorage)),
                sessionStorage:   truncateEntries(Object.entries(sessionStorage)),
                cookies:          document.cookie.substring(0, 500), // truncate cookies
                windowSize:       `${window.innerWidth}x${window.innerHeight}`,
                screenResolution: `${window.screen.width}x${window.screen.height}`,
                userAgent:        navigator.userAgent.substring(0, 500), // truncate UA
                pageLoadTime:     (Number.isFinite(pageLoadTime) && pageLoadTime > 0) ? pageLoadTime : "Unknown",
                consoleErrors:    toon.encode(consoleErrors.slice(0, 20)),
                networkLogs:      toon.encode(networkLogs.slice(0, 20)),
                deviceType:       /Mobile|Android|iPhone/i.test(navigator.userAgent) ? "Mobile" : "Desktop",
                pageUrl:          safeHref,
            }));
        } catch (e) {
            sendResponse(toon.encode({ error: "Failed to collect environment data" }));
        }
        return true;
    } else if (request.action === "GET_BUG_CONTEXT") {
        try {
            const fallbackX = Math.round(window.innerWidth / 2);
            const fallbackY = Math.round(window.innerHeight / 2);
            sendResponse(toon.encode({
                page_url: window.location.href,
                x_coordinate: latestBugContext?.x_coordinate ?? fallbackX,
                y_coordinate: latestBugContext?.y_coordinate ?? fallbackY,
                scroll_position: latestBugContext?.scroll_position ?? Math.round(window.scrollY),
                scrollX: latestBugContext?.scrollX ?? Math.round(window.scrollX),
                scrollY: latestBugContext?.scrollY ?? Math.round(window.scrollY),
                element_selector: latestBugContext?.element_selector || "",
                created_at: latestBugContext?.created_at ?? Date.now(),
            }));
        } catch (e) {
            console.error("Error getting bug context:", e);
            sendResponse(toon.encode({ error: e.message }));
        }
        return true; // Keep channel open
    } else if (request.action === "HIDE_IFRAME") {
        const fab = document.getElementById('bugscribe-iframe-widget-container');
        if (fab) fab.style.display = 'none';
        sendResponse(toon.encode({ status: "hidden" }));
        return true; // Keep channel open
    } else if (request.action === "SHOW_IFRAME") {
        const fab = document.getElementById('bugscribe-iframe-widget-container');
        if (fab) fab.style.display = '';
        sendResponse(toon.encode({ status: "shown" }));
        return true; // Keep channel open
    } else if (request.action === "CLOSE_WIDGET") {
        closeWidget();
        sendResponse(toon.encode({ status: "closed" }));
        return true; // Keep channel open
    } else if (request.action === "OPEN_WIDGET") {
        // Ensure widget is injected then open it
        injectIframeWidget();
        setTimeout(() => {
            const container = document.getElementById('bugscribe-iframe-widget-container');
            if (container && container.shadowRoot) {
                const iframeWrapper = container.shadowRoot.getElementById('iframeWrapper');
                const sideTabBtn = container.shadowRoot.getElementById('sideTabBtn');
                if (iframeWrapper && !iframeWrapper.classList.contains('show')) {
                    iframeWrapper.classList.add('show');
                    if (sideTabBtn) {
                        sideTabBtn.classList.add('active');
                        const tabText = sideTabBtn.querySelector('.side-tab-text');
                        if (tabText) tabText.textContent = 'Close';
                    }
                }
            }
        }, 100);
        sendResponse(toon.encode({ status: "opened" }));
        return true;
    } else if (request.action === "START_ANNOTATE") {
        startAnnotation();
        sendResponse(toon.encode({ status: "started" }));
        return true; // Keep channel open
    }
    return false; // Not handling this message
});

async function startRecording() {
    try {
        stream = await navigator.mediaDevices.getDisplayMedia({
            video: {
                displaySurface: "browser",
                frameRate: { max: 15 },
                width: { max: 1920 },
                height: { max: 1080 }
            },
            audio: false
        });

        // Setup tracking
        steps = ["Started video recording"];
        document.addEventListener('click', clickListener, true);
        document.addEventListener('change', inputListener, true);

        // UI Overlay for stop button
        overlay = document.createElement("div");
        overlay.id = "bugscribe-recording-overlay";
        overlay.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <div style="width: 10px; height: 10px; border-radius: 50%; background-color: white; animation: pulse 1.5s infinite;"></div>
                <span>Stop Recording</span>
            </div>
        `;
        overlay.style.position = "fixed";
        overlay.style.bottom = "24px";
        overlay.style.left = "24px";
        overlay.style.zIndex = "9999999";
        overlay.style.backgroundColor = "#ef4444";
        overlay.style.color = "white";
        overlay.style.padding = "12px 20px";
        overlay.style.borderRadius = "8px";
        overlay.style.fontFamily = "-apple-system, sans-serif";
        overlay.style.fontWeight = "600";
        overlay.style.fontSize = "14px";
        overlay.style.cursor = "pointer";
        overlay.style.boxShadow = "0 10px 15px -3px rgba(0,0,0,0.3)";

        const style = document.createElement('style');
        style.innerHTML = `@keyframes pulse { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } 100% { opacity: 1; transform: scale(1); } }`;
        document.head.appendChild(style);

        overlay.onclick = stopRecording;
        document.body.appendChild(overlay);

        // Setup recorder
        recordedChunks = [];
        let options = { mimeType: 'video/webm' };
        if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
            options = { mimeType: 'video/webm;codecs=vp8', videoBitsPerSecond: 250000 };
        }
        mediaRecorder = new MediaRecorder(stream, options);
        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) recordedChunks.push(e.data);
        };
        mediaRecorder.onstop = saveRecording;
        mediaRecorder.start(1000); // chunk every second

        // If user stops via browser UI natively
        stream.getVideoTracks()[0].onended = () => {
            stopRecording();
        };

    } catch (err) {
        console.error("BugScribe: Error starting recording:", err);
        alert("BugScribe: Could not start screen recording. " + err.message);
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
    }
    if (stream) {
        stream.getTracks().forEach(t => t.stop());
    }
    if (overlay) {
        overlay.remove();
    }
    document.removeEventListener('click', clickListener, true);
    document.removeEventListener('change', inputListener, true);
}

function saveRecording() {
    if (!recordedChunks || recordedChunks.length === 0) {
        alert("BugScribe: No recording data found.");
        return;
    }
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onerror = () => {
        console.error("BugScribe: Failed to read recording blob");
        alert("BugScribe: Failed to process recording. Please try again.");
    };
    reader.onloadend = () => {
        const base64data = reader.result;
        if (!base64data || base64data === "data:") {
            alert("BugScribe: Recording data is empty. Please try again.");
            return;
        }
        chrome.storage.local.set({
            bugscribe_pending_media: base64data,
            bugscribe_pending_mediatype: "video",
            bugscribe_pending_steps: steps
        }, () => {
            const wdw = document.getElementById('bugscribe-iframe-widget-container');
            if (wdw) {
                const iframe = wdw.shadowRoot ? wdw.shadowRoot.querySelector('iframe') : null;
                if (iframe) iframe.src = chrome.runtime.getURL('extension/popup.html?v=' + Date.now());
                // Also open the widget if it's closed
                const shadow = wdw.shadowRoot;
                if (shadow) {
                    const iframeWrapper = shadow.getElementById('iframeWrapper');
                    const sideTabBtn = shadow.getElementById('sideTabBtn');
                    if (iframeWrapper && !iframeWrapper.classList.contains('show')) {
                        iframeWrapper.classList.add('show');
                        if (sideTabBtn) {
                            sideTabBtn.classList.add('active');
                            const tabText = sideTabBtn.querySelector('.side-tab-text');
                            if (tabText) tabText.textContent = 'Close';
                        }
                    }
                }
            } else {
                alert("BugScribe: Recording saved! Open the side tab to submit the bug.");
            }
        });
    };
}

// --- Close Widget ---
function closeWidget() {
    const container = document.getElementById('bugscribe-iframe-widget-container');
    if (container) {
        const shadow = container.shadowRoot;
        if (shadow) {
            const iframeWrapper = shadow.getElementById('iframeWrapper');
            const fabBtn = shadow.getElementById('fabBtn');
            if (iframeWrapper) iframeWrapper.classList.remove('show');
            if (fabBtn) {
                fabBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>';
                fabBtn.style.background = '#ffffff';
                fabBtn.style.color = '#0f172a';
            }
        }
    }
}

// Listen for postMessage from the iframe popup — validate origin
window.addEventListener("message", (event) => {
    // Only accept from our own extension or same origin
    const extensionOrigin = chrome.runtime.getURL("").replace(/\/$/, "");
    if (event.origin !== window.location.origin && event.origin !== extensionOrigin) {
        return; // Reject messages from unknown origins
    }
    if (event.data === "CLOSE_BUGScribe_IFRAME") {
        closeWidget();
    }
});

// --- Full-Page Annotation Mode ---
function startAnnotation() {
    // Hide the widget
    const widgetContainer = document.getElementById('bugscribe-iframe-widget-container');
    if (widgetContainer) widgetContainer.style.display = 'none';

    let annotationColor = '#ef4444';
    let currentTool = 'pen'; // 'pen', 'arrow', 'box', 'circle', 'text'
    let strokeHistory = [];

    // Create fullscreen overlay
    const overlay = document.createElement('div');
    overlay.id = 'bugscribe-annotation-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:2147483646;cursor:crosshair;';

    // Canvas on top of page
    const canvas = document.createElement('canvas');
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.cssText = 'width:100%;height:100%;';
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.scale(dpr, dpr);

    overlay.appendChild(canvas);

    // Floating annotation toolbar
    const toolbar = document.createElement('div');
    toolbar.id = 'bugscribe-floating-toolbar';
    toolbar.style.cssText = 'position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:2147483647;display:flex;align-items:center;gap:6px;padding:8px 14px;background:rgba(15,23,42,0.95);backdrop-filter:blur(8px);border-radius:999px;border:1px solid #334155;box-shadow:0 10px 30px rgba(0,0,0,0.45);font-family:-apple-system,sans-serif;user-select:none;max-width:96vw;overflow-x:auto;';

    const colors = ['#ef4444', '#facc15', '#22c55e', '#3b82f6', '#ffffff'];
    colors.forEach(color => {
        const dot = document.createElement('span');
        dot.style.cssText = `width:22px;height:22px;border-radius:50%;background:${color};cursor:pointer;border:2px solid ${color === annotationColor ? 'white' : 'transparent'};transition:0.15s;flex-shrink:0;`;
        dot.addEventListener('click', () => {
            annotationColor = color;
            toolbar.querySelectorAll('span[data-type="color"]').forEach(d => d.style.borderColor = 'transparent');
            dot.style.borderColor = 'white';
        });
        dot.dataset.type = 'color';
        toolbar.appendChild(dot);
    });

    const makeSep = () => {
        const s = document.createElement('div');
        s.style.cssText = 'width:1px;height:22px;background:#475569;margin:0 4px;flex-shrink:0;';
        return s;
    };
    toolbar.appendChild(makeSep());

    const btnStyle = 'background:#334155;border:1px solid #475569;color:#e2e8f0;font-size:12px;padding:5px 11px;border-radius:6px;cursor:pointer;font-weight:600;transition:0.15s;font-family:inherit;white-space:nowrap;';
    const activeBtnStyle = 'background:#4f46e5;color:white;border-color:#4338ca;';

    const tools = [
        { id: 'pen', emoji: '✏️', label: 'Pen' },
        { id: 'arrow', emoji: '↗', label: 'Arrow' },
        { id: 'box', emoji: '⬜', label: 'Box' },
        { id: 'circle', emoji: '⭕', label: 'Circle' },
        { id: 'blur', emoji: '🌫️', label: 'Blur' },
        { id: 'text', emoji: 'T', label: 'Text' }
    ];

    tools.forEach(t => {
        const btn = document.createElement('button');
        btn.innerHTML = `${t.emoji} <span style="margin-left:2px">${t.label}</span>`;
        btn.style.cssText = btnStyle + (t.id === currentTool ? activeBtnStyle : '');
        btn.dataset.toolId = t.id;
        btn.addEventListener('click', () => {
            currentTool = t.id;
            toolbar.querySelectorAll('button[data-tool-id]').forEach(b => {
                b.style.background = '#334155';
                b.style.color = '#e2e8f0';
                if (b.dataset.toolId === currentTool) {
                    b.style.background = '#4f46e5';
                    b.style.color = 'white';
                }
            });
            canvas.style.cursor = currentTool === 'text' ? 'text' : 'crosshair';
        });
        toolbar.appendChild(btn);
    });

    toolbar.appendChild(makeSep());

    const undoBtn = document.createElement('button');
    undoBtn.textContent = '↩ Undo';
    undoBtn.style.cssText = btnStyle;
    undoBtn.addEventListener('click', () => {
        if (strokeHistory.length > 0) {
            const prev = strokeHistory.pop();
            ctx.putImageData(prev, 0, 0);
        }
    });
    toolbar.appendChild(undoBtn);

    const doneBtn = document.createElement('button');
    doneBtn.textContent = '✅ Done';
    doneBtn.style.cssText = btnStyle + 'background:#22c55e;border-color:#16a34a;color:white;';
    doneBtn.addEventListener('click', async () => {
        toolbar.remove();
        await new Promise(r => setTimeout(r, 100));
        chrome.runtime.sendMessage({ action: "CAPTURE_SCREENSHOT" }, (response) => {
            const decodedResponse = toon.decode(response);
            overlay.remove();
            if (widgetContainer) widgetContainer.style.display = '';
            if (decodedResponse && decodedResponse.dataUrl) {
                chrome.storage.local.set({
                    bugscribe_pending_media: decodedResponse.dataUrl,
                    bugscribe_pending_mediatype: "image",
                    bugscribe_pending_steps: ["Annotated screenshot on page"]
                }, () => {
                    if (widgetContainer) {
                        const shadow = widgetContainer.shadowRoot;
                        if (shadow) {
                            const iframe = shadow.querySelector('iframe');
                            const iframeWrapper = shadow.getElementById('iframeWrapper');
                            const fabBtn = shadow.getElementById('fabBtn');
                            if (iframe) iframe.src = chrome.runtime.getURL('extension/popup.html?v=' + Date.now());
                            if (iframeWrapper) iframeWrapper.classList.add('show');
                            if (fabBtn) {
                                fabBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
                                fabBtn.style.background = '#f8fafc';
                                fabBtn.style.color = '#0f172a';
                            }
                        }
                    }
                });
            }
        });
    });
    toolbar.appendChild(doneBtn);

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '✕';
    cancelBtn.style.cssText = btnStyle + 'background:#ef4444;border-color:#dc2626;color:white;padding-left:10px;padding-right:10px;';
    cancelBtn.addEventListener('click', () => {
        overlay.remove();
        toolbar.remove();
        if (widgetContainer) widgetContainer.style.display = '';
    });
    toolbar.appendChild(cancelBtn);

    document.body.appendChild(overlay);
    document.body.appendChild(toolbar);

    // Drawing logic
    let isDrawing = false;
    let startX, startY;
    let snapshot = null;

    const drawArrow = (x1, y1, x2, y2) => {
        if (x1 === x2 && y1 === y2) return; // Skip zero-length arrows
        const headlen = 15;
        const angle = Math.atan2(y2 - y1, x2 - x1);
        if (!Number.isFinite(angle)) return;
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

    canvas.addEventListener('mousedown', (e) => {
        startX = e.clientX;
        startY = e.clientY;
        isDrawing = true;
        strokeHistory.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
        snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);

        if (currentTool === 'pen') {
            ctx.beginPath();
            ctx.moveTo(startX, startY);
        } else if (currentTool === 'text') {
            isDrawing = false;

            const input = document.createElement('input');
            input.type = 'text';
            input.style.cssText = `
                position: fixed;
                left: ${startX}px;
                top: ${startY - 15}px;
                z-index: 2147483647;
                background: #1e293b;
                color: white;
                border: 2px solid ${annotationColor};
                border-radius: 4px;
                padding: 4px 8px;
                font-family: sans-serif;
                font-weight: bold;
                font-size: 16px;
                outline: none;
                box-shadow: 0 4px 12px rgba(0,0,0,0.5);
                min-width: 100px;
            `;

            document.body.appendChild(input);
            setTimeout(() => input.focus(), 10);

            const commitText = () => {
                const text = input.value.trim();
                if (text) {
                    ctx.fillStyle = annotationColor;
                    ctx.font = 'bold 24px sans-serif';
                    ctx.strokeStyle = "rgba(0,0,0,0.4)";
                    ctx.lineWidth = 3;
                    ctx.strokeText(text, startX, startY);
                    ctx.fillText(text, startX, startY);
                    strokeHistory.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
                }
                input.remove();
            };

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') commitText();
                if (e.key === 'Escape') input.remove();
            });

            input.addEventListener('blur', commitText);
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!isDrawing) return;

        ctx.strokeStyle = annotationColor;
        ctx.fillStyle = annotationColor;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (currentTool === 'pen') {
            ctx.lineTo(e.clientX, e.clientY);
            ctx.stroke();
        } else if (currentTool === 'blur') {
            ctx.putImageData(snapshot, 0, 0);
            const w = e.clientX - startX;
            const h = e.clientY - startY;

            ctx.save();
            ctx.filter = 'blur(10px)';
            ctx.drawImage(canvas, startX * window.devicePixelRatio, startY * window.devicePixelRatio, w * window.devicePixelRatio, h * window.devicePixelRatio, startX, startY, w, h);
            ctx.restore();

            ctx.fillStyle = 'rgba(150, 150, 150, 0.2)';
            ctx.fillRect(startX, startY, w, h);
        } else {
            ctx.putImageData(snapshot, 0, 0);
            const w = e.clientX - startX;
            const h = e.clientY - startY;

            if (currentTool === 'arrow') {
                drawArrow(startX, startY, e.clientX, e.clientY);
            } else if (currentTool === 'box') {
                ctx.strokeRect(startX, startY, w, h);
            } else if (currentTool === 'circle') {
                ctx.beginPath();
                ctx.ellipse(startX + w / 2, startY + h / 2, Math.abs(w / 2), Math.abs(h / 2), 0, 0, 2 * Math.PI);
                ctx.stroke();
            }
        }
    });

    canvas.addEventListener('mouseup', () => isDrawing = false);
    canvas.addEventListener('mouseout', () => isDrawing = false);
}

chrome.storage.local.get(["bugscribeConnectionKey", "bugscribeProjects", "bugscribeActiveProject"], (res) => {
    // Inject if legacy key exists OR if any projects are configured
    const hasLegacyKey = !!res.bugscribeConnectionKey;
    const hasProjects = Array.isArray(res.bugscribeProjects) && res.bugscribeProjects.length > 0;
    
    if (hasLegacyKey || hasProjects) {
        injectIframeWidget();
    }
});

function parseHighlightParams() {
    if (!window.location.hash) return null;
    const hashValue = window.location.hash.replace(/^#/, "");
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

function showLocationHighlight() {
    const payload = parseHighlightParams();
    if (!payload) return;

    const scrollTop = Number.isFinite(payload.scroll) ? payload.scroll : Math.max(0, payload.y - Math.round(window.innerHeight / 2));
    window.scrollTo({ top: scrollTop, left: 0, behavior: "smooth" });

    const showPulseMarker = (x, y) => {
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
        marker.style.zIndex = "2147483647";
        marker.style.pointerEvents = "none";
        marker.style.transition = "opacity 0.5s ease";
        document.documentElement.appendChild(marker);
        setTimeout(() => {
            marker.style.opacity = "0";
            setTimeout(() => marker.remove(), 500);
        }, 2600);
    };

    const showElementBox = (rect) => {
        const box = document.createElement("div");
        box.style.position = "fixed";
        box.style.left = `${Math.max(0, rect.left)}px`;
        box.style.top = `${Math.max(0, rect.top)}px`;
        box.style.width = `${Math.max(24, rect.width)}px`;
        box.style.height = `${Math.max(24, rect.height)}px`;
        box.style.border = "2px solid #ef4444";
        box.style.background = "rgba(239,68,68,0.08)";
        box.style.boxShadow = "0 0 0 4px rgba(239,68,68,0.18)";
        box.style.zIndex = "2147483647";
        box.style.pointerEvents = "none";
        box.style.transition = "opacity 0.5s ease";
        document.documentElement.appendChild(box);
        setTimeout(() => {
            box.style.opacity = "0";
            setTimeout(() => box.remove(), 500);
        }, 2600);
        showPulseMarker(rect.left + rect.width / 2, rect.top + rect.height / 2);
    };

    setTimeout(() => {
        if (payload.selector) {
            try {
                const selector = decodeURIComponent(payload.selector);
                // Validate selector is safe before using it
                let el = null;
                try {
                    document.createDocumentFragment().querySelector(selector);
                    el = document.querySelector(selector);
                } catch (_) {
                    el = null;
                }
                if (el) {
                    showElementBox(el.getBoundingClientRect());
                    return;
                }
            } catch { }
        }
        showPulseMarker(payload.x, payload.y);
    }, 450);
}

showLocationHighlight();

// Always inject the widget so users can access setup even without a project configured
injectIframeWidget();

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
        if (changes.bugscribeProjects) {
            const projects = changes.bugscribeProjects.newValue;
            if (!projects || projects.length === 0) {
                chrome.storage.local.get(["bugscribeConnectionKey"], (res) => {
                    if (!res.bugscribeConnectionKey) {
                        const w = document.getElementById('bugscribe-iframe-widget-container');
                        if (w) w.remove();
                    }
                });
            }
        }
    }
});

function injectIframeWidget() {
    if (document.getElementById('bugscribe-iframe-widget-container')) return;

    if (window.self !== window.top) return; // don't inject inside other iframes!

    const container = document.createElement('div');
    container.id = 'bugscribe-iframe-widget-container';
    container.style.position = 'fixed';
    container.style.bottom = '24px';
    container.style.right = '24px';
    container.style.zIndex = '2147483647';
    container.style.fontFamily = '-apple-system, sans-serif';
    container.style.transition = 'opacity 0.1s ease'; // for HIDE_IFRAME

    const shadow = container.attachShadow({ mode: 'open' });

    shadow.innerHTML = `
        <style>
            .fab-container {
                display: flex;
                flex-direction: column;
                align-items: flex-end;
                position: relative;
            }
            
            /* Side Tab Toggle Button */
            .side-tab {
                position: fixed;
                right: 0;
                top: 50%;
                transform: translateY(-50%);
                background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
                color: white;
                border: none;
                border-radius: 8px 0 0 8px;
                padding: 12px 8px;
                cursor: pointer;
                box-shadow: -3px 0 10px rgba(79, 70, 229, 0.4);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                z-index: 2147483646;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 6px;
                font-size: 9px;
                font-weight: 700;
                letter-spacing: 0.5px;
                text-transform: uppercase;
                writing-mode: vertical-rl;
                text-orientation: mixed;
                min-height: 90px;
            }
            
            .side-tab:hover {
                right: 0;
                padding-right: 12px;
                box-shadow: -5px 0 16px rgba(79, 70, 229, 0.6);
                background: linear-gradient(135deg, #4338ca 0%, #6d28d9 100%);
            }
            
            .side-tab.active {
                background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
                box-shadow: -3px 0 10px rgba(34, 197, 94, 0.4);
            }
            
            .side-tab.active:hover {
                background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
                box-shadow: -5px 0 16px rgba(34, 197, 94, 0.6);
            }
            
            .side-tab svg {
                width: 16px;
                height: 16px;
                transform: rotate(90deg);
            }
            
            .side-tab-text {
                font-size: 10px;
                font-weight: 700;
                letter-spacing: 0.8px;
            }
            
            /* Chevron indicator */
            .side-tab::before {
                content: '';
                position: absolute;
                left: 6px;
                top: 50%;
                transform: translateY(-50%);
                width: 0;
                height: 0;
                border-right: 5px solid white;
                border-top: 4px solid transparent;
                border-bottom: 4px solid transparent;
                opacity: 0.7;
                transition: all 0.3s;
            }
            
            .side-tab:hover::before {
                left: 4px;
                opacity: 1;
            }
            
            .iframe-wrapper {
                width: min(420px, calc(100vw - 48px));
                max-width: 420px;
                height: min(640px, calc(100vh - 100px));
                background: #0f172a;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.5);
                border: 1px solid #1e293b;
                overflow: hidden;
                display: none;
                margin-bottom: 12px;
                transform-origin: bottom right;
                transition: transform 0.2s ease, opacity 0.2s ease;
                position: fixed;
                bottom: 24px;
                right: 24px;
            }
            
            @media (max-width: 480px) {
                .iframe-wrapper {
                    width: calc(100vw - 32px);
                    height: calc(100vh - 120px);
                    bottom: 16px;
                    right: 16px;
                    margin-bottom: 0;
                }
                
                .side-tab {
                    min-height: 75px;
                    padding: 10px 7px;
                    font-size: 8px;
                }
                
                .side-tab svg {
                    width: 14px;
                    height: 14px;
                }
            }
            
            .iframe-wrapper.show {
                display: block;
                animation: popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }
            
            @keyframes popIn {
                from { 
                    opacity: 0; 
                    transform: scale(0.95) translateY(10px);
                }
                to { 
                    opacity: 1; 
                    transform: scale(1) translateY(0);
                }
            }
            
            iframe {
                width: 100%;
                height: 100%;
                border: none;
                background: transparent;
            }
            
            /* Hide side tab when widget is open */
            .side-tab.widget-open {
                right: 0;
                opacity: 1;
                pointer-events: all;
            }
        </style>
        <div class="fab-container">
            <button class="side-tab" id="sideTabBtn" title="Report Bug">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="m8 2 1.88 1.88"/>
                    <path d="M14.12 3.88 16 2"/>
                    <path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/>
                    <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/>
                    <path d="M12 20v-9"/>
                    <path d="M6.53 9C4.6 8.8 3 7.1 3 5"/>
                    <path d="M6 13H2"/>
                    <path d="M3 21c0-2.1 1.7-3.9 3.8-4"/>
                    <path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/>
                    <path d="M22 13h-4"/>
                    <path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/>
                </svg>
                <span class="side-tab-text">Report Bug</span>
            </button>
            <div class="iframe-wrapper" id="iframeWrapper">
                <iframe src="${chrome.runtime.getURL('extension/popup.html')}" allow="display-capture *"></iframe>
            </div>
        </div>
    `;

    document.body.appendChild(container);

    const sideTabBtn = shadow.getElementById('sideTabBtn');
    const iframeWrapper = shadow.getElementById('iframeWrapper');

    // Close widget when clicking outside
    document.addEventListener('click', (e) => {
        const isClickInsideWidget = container.contains(e.target);
        const isClickOnTab = e.composedPath().includes(sideTabBtn);
        
        if (!isClickInsideWidget && iframeWrapper.classList.contains('show')) {
            iframeWrapper.classList.remove('show');
            sideTabBtn.classList.remove('widget-open');
            sideTabBtn.classList.remove('active');
            sideTabBtn.querySelector('.side-tab-text').textContent = 'Report Bug';
        }
    });

    sideTabBtn.addEventListener('click', () => {
        iframeWrapper.classList.toggle('show');
        sideTabBtn.classList.toggle('widget-open');
        sideTabBtn.classList.toggle('active');
        
        if (iframeWrapper.classList.contains('show')) {
            sideTabBtn.querySelector('.side-tab-text').textContent = 'Close';
        } else {
            sideTabBtn.querySelector('.side-tab-text').textContent = 'Report Bug';
        }
    });
}
