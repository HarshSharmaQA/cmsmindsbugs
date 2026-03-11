let recordedChunks = [];
let mediaRecorder = null;
let stream = null;
let steps = [];
let overlay = null;

function getActionDescription(e) {
    const tag = e.target.tagName.toLowerCase();
    const text = e.target.innerText ? e.target.innerText.substring(0, 30).trim() : '';
    const name = e.target.name || e.target.placeholder || e.target.id || text || tag;
    return `Clicked on ${name}`;
}

const clickListener = (e) => {
    // Avoid logging clicks on our own overlay
    if (e.target.closest('#bugscribe-recording-overlay')) return;
    steps.push(getActionDescription(e));
};

const inputListener = (e) => {
    if (e.target.closest('#bugscribe-recording-overlay')) return;
    const name = e.target.name || e.target.placeholder || e.target.id || 'input';
    steps.push(`Typed in ${name}`);
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "START_RECORDING") {
        startRecording();
        sendResponse({ status: "started" });
    } else if (request.action === "GET_ENV_DATA") {
        sendResponse({
            localStorage: JSON.stringify(Object.entries(localStorage)),
            sessionStorage: JSON.stringify(Object.entries(sessionStorage)),
            cookies: document.cookie,
            windowSize: `${window.innerWidth}x${window.innerHeight}`
        });
    } else if (request.action === "HIDE_IFRAME") {
        const fab = document.getElementById('bugscribe-iframe-widget-container');
        if (fab) fab.style.display = 'none';
        sendResponse({ status: "hidden" });
    } else if (request.action === "SHOW_IFRAME") {
        const fab = document.getElementById('bugscribe-iframe-widget-container');
        if (fab) fab.style.display = '';
        sendResponse({ status: "shown" });
    } else if (request.action === "CLOSE_WIDGET") {
        closeWidget();
        sendResponse({ status: "closed" });
    } else if (request.action === "START_ANNOTATE") {
        startAnnotation();
        sendResponse({ status: "started" });
    }
});

async function startRecording() {
    try {
        stream = await navigator.mediaDevices.getDisplayMedia({
            video: { displaySurface: "browser" },
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
        mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
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
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
        const base64data = reader.result;
        chrome.storage.local.set({
            bugscribe_pending_media: base64data,
            bugscribe_pending_mediatype: "video",
            bugscribe_pending_steps: steps
        }, () => {
            // Let the widget handle it instead of alerting
            const wdw = document.getElementById('bugscribe-iframe-widget-container');
            if (wdw) {
                const iframe = wdw.shadowRoot.querySelector('iframe');
                if (iframe) iframe.src = chrome.runtime.getURL('popup.html?v=' + Date.now()); // force reload
            } else {
                alert("BugScribe: Recording saved! Click the extension icon to submit the bug.");
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
                fabBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/><path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M6 13H2"/><path d="M3 21c0-2.1 1.7-3.9 3.8-4"/><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/><path d="M22 13h-4"/><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/></svg> Report Bug';
                fabBtn.style.background = '#4f46e5';
            }
        }
    }
}

// Listen for postMessage from the iframe popup
window.addEventListener("message", (event) => {
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
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
    canvas.style.cssText = 'width:100%;height:100%;';
    const ctx = canvas.getContext('2d');
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    overlay.appendChild(canvas);

    // Floating annotation toolbar
    const toolbar = document.createElement('div');
    toolbar.id = 'bugscribe-floating-toolbar';
    toolbar.style.cssText = 'position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:2147483647;display:flex;align-items:center;gap:6px;padding:8px 14px;background:#1e293b;border-radius:999px;border:1px solid #334155;box-shadow:0 8px 32px rgba(0,0,0,0.5);font-family:-apple-system,sans-serif;user-select:none;';

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
        { id: 'pen',    emoji: '✏️', label: 'Pen'    },
        { id: 'arrow',  emoji: '↗',  label: 'Arrow'  },
        { id: 'box',    emoji: '⬜', label: 'Box'    },
        { id: 'circle', emoji: '⭕', label: 'Circle' },
        { id: 'text',   emoji: 'T',  label: 'Text'   }
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
            overlay.remove();
            if (widgetContainer) widgetContainer.style.display = '';
            if (response && response.dataUrl) {
                chrome.storage.local.set({
                    bugscribe_pending_media: response.dataUrl,
                    bugscribe_pending_mediatype: "image",
                    bugscribe_pending_steps: ["Annotated screenshot on page"]
                }, () => {
                    if (widgetContainer) {
                        const shadow = widgetContainer.shadowRoot;
                        if (shadow) {
                            const iframe = shadow.querySelector('iframe');
                            const iframeWrapper = shadow.getElementById('iframeWrapper');
                            const fabBtn = shadow.getElementById('fabBtn');
                            if (iframe) iframe.src = chrome.runtime.getURL('popup.html?v=' + Date.now());
                            if (iframeWrapper) iframeWrapper.classList.add('show');
                            if (fabBtn) {
                                fabBtn.innerHTML = '✕ Close';
                                fabBtn.style.background = '#334155';
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
        const headlen = 15;
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
            const text = prompt("Enter text to add:");
            if (text) {
                ctx.fillStyle = annotationColor;
                ctx.font = 'bold 24px sans-serif';
                ctx.strokeStyle = "rgba(0,0,0,0.4)";
                ctx.lineWidth = 3;
                ctx.strokeText(text, startX, startY);
                ctx.fillText(text, startX, startY);
                isDrawing = false;
            }
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
                ctx.ellipse(startX + w/2, startY + h/2, Math.abs(w/2), Math.abs(h/2), 0, 0, 2 * Math.PI);
                ctx.stroke();
            }
        }
    });

    canvas.addEventListener('mouseup', () => isDrawing = false);
    canvas.addEventListener('mouseout', () => isDrawing = false);
}

chrome.storage.local.get(["bugscribeConnectionKey"], (res) => {
    if (res.bugscribeConnectionKey) {
        injectIframeWidget();
    }
});

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.bugscribeConnectionKey) {
        if (changes.bugscribeConnectionKey.newValue) {
            injectIframeWidget();
        } else {
            const w = document.getElementById('bugscribe-iframe-widget-container');
            if (w) w.remove();
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
            }
            .iframe-wrapper {
                width: 350px;
                height: 580px;
                background: #0f172a;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.5);
                border: 1px solid #1e293b;
                overflow: hidden;
                display: none;
                margin-bottom: 12px;
                transform-origin: bottom right;
                transition: transform 0.2s ease, opacity 0.2s ease;
            }
            .iframe-wrapper.show {
                display: block;
                animation: popIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            }
            @keyframes popIn {
                from { opacity: 0; transform: scale(0.95) translateY(10px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
            }
            iframe {
                width: 100%;
                height: 100%;
                border: none;
                background: transparent;
            }
            .fab-btn {
                background: #4f46e5;
                color: white;
                border: none;
                border-radius: 999px;
                padding: 12px 24px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
                display: flex;
                align-items: center;
                gap: 8px;
                transition: 0.2s;
            }
            .fab-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(79, 70, 229, 0.5);
            }
        </style>
        <div class="fab-container">
            <div class="iframe-wrapper" id="iframeWrapper">
                <iframe src="${chrome.runtime.getURL('popup.html')}" allow="display-capture *"></iframe>
            </div>
            <button class="fab-btn" id="fabBtn">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/><path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M6 13H2"/><path d="M3 21c0-2.1 1.7-3.9 3.8-4"/><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/><path d="M22 13h-4"/><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/></svg>
               Report Bug
            </button>
        </div>
    `;

    document.body.appendChild(container);

    const fabBtn = shadow.getElementById('fabBtn');
    const iframeWrapper = shadow.getElementById('iframeWrapper');

    fabBtn.addEventListener('click', () => {
        iframeWrapper.classList.toggle('show');
        if (iframeWrapper.classList.contains('show')) {
            fabBtn.innerHTML = '✕ Close';
            fabBtn.style.background = '#334155';
        } else {
            fabBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/><path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M6 13H2"/><path d="M3 21c0-2.1 1.7-3.9 3.8-4"/><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/><path d="M22 13h-4"/><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/></svg> Report Bug';
            fabBtn.style.background = '#4f46e5';
        }
    });
}
