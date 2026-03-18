document.addEventListener("DOMContentLoaded", () => {
    const setupView = document.getElementById("setupView");
    const reportView = document.getElementById("reportView");
    const successView = document.getElementById("successView");
    const settingsBtn = document.getElementById("settingsBtn");

    const bugType = document.getElementById("bugType");
    const bugTitle = document.getElementById("bugTitle");
    const bugDescription = document.getElementById("bugDescription");
    const bugPriority = document.getElementById("bugPriority");
    const submitBtn = document.getElementById("submitBtn");
    const errorMessage = document.getElementById("errorMessage");

    let currentMediaBlob = null;
    let currentMediaType = "image";
    let currentSteps = [];
    let pageUrl = "Unknown";
    let currentDrawTool = "pen"; // "pen", "arrow", "box", "circle", "text"
    let annotationColor = "#ef4444";
    let strokeHistory = []; 
    let baseImageData = null;
    let bugLocationContext = null;

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

    // --- Loading State & Auth Check ---
    chrome.storage.local.get(["bugscribeProjectId", "bugscribeApiKey", "bugscribeConnectionKey"], (result) => {
        if (result.bugscribeProjectId && result.bugscribeApiKey) {
            if (result.bugscribeConnectionKey) {
                document.getElementById("setupConnectionKey").value = result.bugscribeConnectionKey;
            }
            showReportView();
        } else {
            showSetupView();
        }
    });

    settingsBtn.addEventListener("click", () => {
        showSetupView();
    });

    function showSetupView() {
        setupView.style.display = "block";
        reportView.style.display = "none";
        successView.style.display = "none";
        settingsBtn.style.display = "none";
    }

    async function showReportView() {
        setupView.style.display = "none";
        reportView.style.display = "block";
        successView.style.display = "none";
        settingsBtn.style.display = "block";

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            pageUrl = tab.url || "Unknown";
            if (tab && tab.id) {
                try {
                    bugLocationContext = await new Promise((resolve) => {
                        chrome.tabs.sendMessage(tab.id, { action: "GET_BUG_CONTEXT" }, (res) => {
                            resolve(res || null);
                        });
                    });
                } catch (e) {
                    bugLocationContext = null;
                }
            }

            chrome.storage.local.get(["bugscribe_pending_media", "bugscribe_pending_steps", "bugscribe_pending_mediatype"], (data) => {
                if (data.bugscribe_pending_media) {
                    currentMediaType = data.bugscribe_pending_mediatype || "video";
                    currentSteps = data.bugscribe_pending_steps || [];

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
                        .then(blob => currentMediaBlob = blob);

                    if (currentSteps.length > 0) {
                        const stepsContainer = document.getElementById("stepsContainer");
                        const stepsList = document.getElementById("stepsList");
                        stepsContainer.style.display = "block";
                        // Build steps safely via DOM — never innerHTML with user data
                        stepsList.innerHTML = "";
                        currentSteps.forEach(s => {
                            const li = document.createElement("li");
                            li.textContent = s; // textContent auto-escapes
                            stepsList.appendChild(li);
                        });
                    }
                } else {
                    captureScreenshot();
                }
            });
        } catch (err) {
            console.error(err);
        }
    }

    function initCanvas(mediaUrl) {
        const canvas = document.getElementById("screenshotCanvas");
        const toolbar = document.getElementById("annotationToolbar");
        const ctx = canvas.getContext("2d");
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
            if (chrome.runtime.lastError || !response || !response.dataUrl) {
                console.error(chrome.runtime.lastError || response?.error);
                document.getElementById("screenshotPreviewContainer").style.display = "none";
                document.getElementById("annotationToolbar").style.display = "none";
            } else {
                imgEl.src = response.dataUrl;
                document.getElementById("screenshotPreviewContainer").style.display = "block";
                initCanvas(response.dataUrl);
                
                fetch(response.dataUrl)
                    .then(res => res.blob())
                    .then(blob => currentMediaBlob = blob);
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
        const ctx = canvas.getContext("2d");
        if (strokeHistory.length > 0) {
            const prev = strokeHistory.pop();
            ctx.putImageData(prev, 0, 0);
        }
    });

    document.getElementById("clearBtn").addEventListener("click", () => {
        const canvas = document.getElementById("screenshotCanvas");
        const ctx = canvas.getContext("2d");
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
        if (e.target.disabled) return;
        e.target.disabled = true;
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        chrome.tabs.sendMessage(tab.id, { action: "START_RECORDING" }, (res) => {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError);
                alert("Please refresh the page before starting a recording.");
            } else {
                window.parent.postMessage("CLOSE_BUGScribe_IFRAME", "*");
                window.close();
            }
        });
    });

    document.getElementById("annotatePageBtn").addEventListener("click", async (e) => {
        if (e.target.disabled) return;
        e.target.disabled = true;
        const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
        if (tab && tab.id) {
            chrome.tabs.sendMessage(tab.id, { action: "START_ANNOTATE" }, (res) => {
                if (chrome.runtime.lastError) {
                    alert("Please refresh the page before annotating.");
                } else {
                    window.close();
                }
            });
        }
    });

    // --- Save Credentials ---
    document.getElementById("saveBtn").addEventListener("click", () => {
        const connectionKey = document.getElementById("setupConnectionKey").value.trim();
        const errorMsg = document.getElementById("setupErrorMsg");
        errorMsg.style.display = "none";
        errorMsg.textContent = "";

        if (!connectionKey) {
            errorMsg.textContent = "Please enter a connection key.";
            errorMsg.style.display = "block";
            return;
        }

        try {
            const decoded = atob(connectionKey);
            const parts = decoded.split('|');

            if (parts.length >= 2) {
                const projectId = parts[0];
                const apiKey = parts[1];

                chrome.storage.local.set({
                    bugscribeProjectId: projectId,
                    bugscribeApiKey: apiKey,
                    bugscribeConnectionKey: connectionKey
                }, () => {
                    const msg = document.getElementById("savedMsg");
                    msg.style.display = "block";
                    setTimeout(() => {
                        msg.style.display = "none";
                        showReportView();
                    }, 1000);
                });
            } else {
                throw new Error("Invalid key format");
            }
        } catch (e) {
            errorMsg.textContent = "Invalid connection key. Please copy the exact key from your dashboard.";
            errorMsg.style.display = "block";
        }
    });

    // --- Submit Bug Report ---
    submitBtn.addEventListener("click", async () => {
        if (!bugTitle.value.trim()) {
            errorMessage.textContent = "Title is required";
            errorMessage.style.display = "block";
            return;
        }

        if (submitBtn.disabled) return;
        submitBtn.disabled = true;
        submitBtn.textContent = "Sending...";
        errorMessage.style.display = "none";

        chrome.storage.local.get(["bugscribeProjectId", "bugscribeApiKey"], async (creds) => {
            try {
                const formData = new FormData();
                formData.append("projectId", creds.bugscribeProjectId);
                formData.append("apiKey", creds.bugscribeApiKey);
                formData.append("title", bugTitle.value.trim());
                formData.append("description", bugDescription.value.trim());
                formData.append("priority", bugPriority.value);
                formData.append("type", bugType.value);
                formData.append("url", pageUrl);
                formData.append("page_url", bugLocationContext?.page_url || pageUrl);
                if (bugLocationContext?.x_coordinate !== undefined) formData.append("x_coordinate", String(bugLocationContext.x_coordinate));
                if (bugLocationContext?.y_coordinate !== undefined) formData.append("y_coordinate", String(bugLocationContext.y_coordinate));
                if (bugLocationContext?.scroll_position !== undefined) formData.append("scroll_position", String(bugLocationContext.scroll_position));
                if (bugLocationContext?.scrollX !== undefined) formData.append("scrollX", String(bugLocationContext.scrollX));
                if (bugLocationContext?.scrollY !== undefined) formData.append("scrollY", String(bugLocationContext.scrollY));
                if (bugLocationContext?.element_selector) formData.append("element_selector", bugLocationContext.element_selector);
                formData.append("created_at", String(bugLocationContext?.created_at || Date.now()));

                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tab && tab.id) {
                    try {
                        const envData = await new Promise((resolve) => {
                            chrome.tabs.sendMessage(tab.id, { action: "GET_ENV_DATA" }, (res) => {
                                resolve(res);
                            });
                        });
                        if (envData) {
                            formData.append("environmentData", JSON.stringify(envData));
                        }
                    } catch (e) {
                        console.log("Could not get environment data", e);
                    }
                }
                formData.append("mediaType", currentMediaType);
                formData.append("steps", JSON.stringify(currentSteps));
                formData.append("browser", navigator.userAgent);
                formData.append("os", navigator.platform);

                if (currentMediaType === "image") {
                    const canvas = document.getElementById("screenshotCanvas");
                    if (canvas && canvas.style.display !== "none") {
                        currentMediaBlob = await new Promise(resolve => canvas.toBlob(resolve, "image/webp", 0.6));
                    }
                }

                if (currentMediaBlob) {
                    const filename = currentMediaType === "video" ? "recording.webm" : "screenshot.webp";
                    formData.append("screenshot", currentMediaBlob, filename);
                }

                const response = await fetch("https://bug-higt.vercel.app/api/reports", {
                    method: "POST",
                    body: formData
                });

                if (!response.ok) {
                    const errObj = await response.json().catch(() => ({}));
                    throw new Error(errObj.error || "Failed to submit report");
                }

                chrome.storage.local.remove(["bugscribe_pending_media", "bugscribe_pending_steps", "bugscribe_pending_mediatype"]);

                reportView.style.display = "none";
                settingsBtn.style.display = "none";
                successView.style.display = "block";

                setTimeout(() => {
                    resetFormForNewBug();
                }, 3000);

            } catch (err) {
                console.error(err);
                errorMessage.textContent = err.message || "Failed to send bug report";
                errorMessage.style.display = "block";
                submitBtn.disabled = false;
                submitBtn.textContent = "Submit Bug Report";
            }
        });
    });

    function resetFormForNewBug() {
        successView.style.display = "none";
        reportView.style.display = "block";
        settingsBtn.style.display = "block";
        bugTitle.value = "";
        bugDescription.value = "";
        bugPriority.value = "medium";
        bugType.value = "general";
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Bug Report";
        currentMediaBlob = null;
        currentMediaType = "image";
        currentSteps = [];
        document.getElementById("stepsContainer").style.display = "none";
        document.getElementById("annotationToolbar").style.display = "none";
        captureScreenshot();
    }

    document.getElementById("reportAnotherBtn").addEventListener("click", () => {
        resetFormForNewBug();
    });

    document.getElementById("closeBtn").addEventListener("click", () => {
        window.close();
    });
});
