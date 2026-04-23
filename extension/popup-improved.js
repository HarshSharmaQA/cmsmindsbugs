// BugScribe Extension - Improved Popup Script v2.2
// Enhanced with better error handling, new features, and bug fixes

document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
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

    // State
    let currentMediaBlob = null;
    let currentMediaType = "image";
    let currentSteps = [];
    let pageUrl = "Unknown";
    let currentDrawTool = "pen";
    let annotationColor = "#ef4444";
    let strokeHistory = [];
    let baseImageData = null;
    let bugLocationContext = null;
    let isSubmitting = false;

    // Utility Functions
    function escapeHtml(str) {
        if (typeof str !== "string") return String(str ?? "");
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function showToast(message, type = "info") {
        const toast = document.createElement("div");
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 16px;
            right: 16px;
            padding: 12px 20px;
            background: ${type === "error" ? "#ef4444" : type === "success" ? "#22c55e" : "#3b82f6"};
            color: white;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = "slideOut 0.3s ease";
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    function validateForm() {
        const errors = [];
        
        if (!bugTitle.value.trim()) {
            errors.push("Title is required");
        }
        
        if (bugTitle.value.trim().length < 3) {
            errors.push("Title must be at least 3 characters");
        }
        
        if (bugTitle.value.trim().length > 200) {
            errors.push("Title must be less than 200 characters");
        }
        
        return errors;
    }

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Auto-save draft
    const saveDraft = debounce(() => {
        chrome.storage.local.set({
            bugscribe_draft: {
                title: bugTitle.value,
                description: bugDescription.value,
                priority: bugPriority.value,
                type: bugType.value,
                timestamp: Date.now()
            }
        });
    }, 1000);

    bugTitle.addEventListener("input", saveDraft);
    bugDescription.addEventListener("input", saveDraft);

    // Load draft
    chrome.storage.local.get(["bugscribe_draft"], (data) => {
        if (data.bugscribe_draft) {
            const draft = data.bugscribe_draft;
            // Only load if less than 1 hour old
            if (Date.now() - draft.timestamp < 3600000) {
                bugTitle.value = draft.title || "";
                bugDescription.value = draft.description || "";
                bugPriority.value = draft.priority || "medium";
                bugType.value = draft.type || "general";
                showToast("Draft restored", "info");
            }
        }
    });

    // Initialize
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
                    bugLocationContext = await new Promise((resolve, reject) => {
                        const timeout = setTimeout(() => {
                            resolve(null);
                        }, 1000);
                        
                        chrome.tabs.sendMessage(tab.id, { action: "GET_BUG_CONTEXT" }, (res) => {
                            clearTimeout(timeout);
                            if (chrome.runtime.lastError) {
                                resolve(null);
                            } else {
                                try {
                                    resolve(toon.decode(res) || null);
                                } catch (e) {
                                    resolve(null);
                                }
                            }
                        });
                    });
                } catch (e) {
                    bugLocationContext = null;
                }
            }

            chrome.storage.local.get(["bugscribe_pending_media", "bugscribe_pending_steps", "bugscribe_pending_mediatype"], (data) => {
                if (data.bugscribe_pending_media) {
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
                        .then(blob => currentMediaBlob = blob)
                        .catch(err => console.error("Failed to load media blob:", err));

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
        } catch (err) {
            console.error("Error showing report view:", err);
            showToast("Failed to initialize report view", "error");
        }
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

            setupCanvasDrawing(canvas, ctx);
        };
        imgObj.onerror = () => {
            console.error("Failed to load image for annotation");
            showToast("Failed to load image", "error");
        };
        imgObj.src = mediaUrl;
    }

    function setupCanvasDrawing(canvas, ctx) {
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
                createTextInput(e.clientX, e.clientY, startX, startY, ctx, canvas);
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
    }

    function createTextInput(clientX, clientY, canvasX, canvasY, ctx, canvas) {
        const input = document.createElement("input");
        input.type = "text";
        input.style.cssText = `
            position: absolute;
            left: ${clientX}px;
            top: ${clientY - 15}px;
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
                ctx.strokeText(text, canvasX, canvasY);
                ctx.fillText(text, canvasX, canvasY);
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

    async function captureScreenshot() {
        currentMediaType = "image";
        currentSteps = [];
        document.getElementById("stepsContainer").style.display = "none";
        document.getElementById("videoPreview").style.display = "none";
        document.getElementById("videoPreview").src = "";
        const imgEl = document.getElementById("screenshotPreview");
        imgEl.style.display = "block";

        chrome.runtime.sendMessage({ action: "CAPTURE_SCREENSHOT" }, (response) => {
            const decodedResponse = toon.decode(response);
            if (chrome.runtime.lastError || !decodedResponse || !decodedResponse.dataUrl) {
                console.error(chrome.runtime.lastError || decodedResponse?.error);
                document.getElementById("screenshotPreviewContainer").style.display = "none";
                document.getElementById("annotationToolbar").style.display = "none";
                showToast("Failed to capture screenshot", "error");
            } else {
                imgEl.src = decodedResponse.dataUrl;
                document.getElementById("screenshotPreviewContainer").style.display = "block";
                initCanvas(decodedResponse.dataUrl);
                
                fetch(decodedResponse.dataUrl)
                    .then(res => res.blob())
                    .then(blob => currentMediaBlob = blob)
                    .catch(err => console.error("Failed to convert screenshot:", err));
            }
        });
    }

    // Annotation Toolbar
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

    // Action Buttons
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
                showToast("Please refresh the page before recording", "error");
                e.target.disabled = false;
            } else {
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
                    showToast("Please refresh the page before annotating", "error");
                    e.target.disabled = false;
                } else {
                    window.close();
                }
            });
        }
    });

    // Save Credentials
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
                    showToast("Connection saved successfully!", "success");
                    setTimeout(() => {
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

    // Submit Bug Report
    submitBtn.addEventListener("click", async () => {
        // Prevent double submission
        if (isSubmitting) return;
        
        // Validate form
        const validationErrors = validateForm();
        if (validationErrors.length > 0) {
            errorMessage.textContent = "⚠️ " + validationErrors.join(", ");
            errorMessage.style.display = "block";
            return;
        }

        isSubmitting = true;
        submitBtn.disabled = true;
        submitBtn.textContent = "📤 Sending...";
        errorMessage.style.display = "none";

        try {
            // Get credentials
            const creds = await new Promise((resolve) => {
                chrome.storage.local.get(["bugscribeProjectId", "bugscribeApiKey"], resolve);
            });

            if (!creds.bugscribeProjectId || !creds.bugscribeApiKey) {
                throw new Error("⚠️ Please connect your extension first. Click the settings icon.");
            }

            // Prepare form data
            const formData = new FormData();
            formData.append("projectId", creds.bugscribeProjectId);
            formData.append("apiKey", creds.bugscribeApiKey);
            formData.append("title", bugTitle.value.trim());
            formData.append("description", bugDescription.value.trim() || "No description provided");
            formData.append("priority", bugPriority.value);
            formData.append("type", bugType.value);
            formData.append("url", pageUrl);
            formData.append("page_url", bugLocationContext?.page_url || pageUrl);
            
            // Add location context
            if (bugLocationContext) {
                if (bugLocationContext.x_coordinate !== undefined) {
                    formData.append("x_coordinate", String(bugLocationContext.x_coordinate));
                }
                if (bugLocationContext.y_coordinate !== undefined) {
                    formData.append("y_coordinate", String(bugLocationContext.y_coordinate));
                }
                if (bugLocationContext.scroll_position !== undefined) {
                    formData.append("scroll_position", String(bugLocationContext.scroll_position));
                }
                if (bugLocationContext.scrollX !== undefined) {
                    formData.append("scrollX", String(bugLocationContext.scrollX));
                }
                if (bugLocationContext.scrollY !== undefined) {
                    formData.append("scrollY", String(bugLocationContext.scrollY));
                }
                if (bugLocationContext.element_selector) {
                    formData.append("element_selector", bugLocationContext.element_selector);
                }
                formData.append("created_at", String(bugLocationContext.created_at || Date.now()));
            } else {
                formData.append("created_at", String(Date.now()));
            }

            // Get environment data
            try {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tab && tab.id) {
                    const envData = await new Promise((resolve) => {
                        const timeout = setTimeout(() => {
                            console.warn("Environment data collection timed out");
                            resolve(null);
                        }, 2000);

                        chrome.tabs.sendMessage(tab.id, { action: "GET_ENV_DATA" }, (res) => {
                            clearTimeout(timeout);
                            if (chrome.runtime.lastError) {
                                console.warn("Could not get environment data:", chrome.runtime.lastError.message);
                                resolve(null);
                            } else {
                                try {
                                    resolve(toon.decode(res));
                                } catch (e) {
                                    console.warn("Failed to decode environment data:", e);
                                    resolve(null);
                                }
                            }
                        });
                    });
                    
                    if (envData) {
                        formData.append("environmentData", JSON.stringify(envData));
                    }
                }
            } catch (e) {
                console.warn("Could not get environment data:", e);
            }

            // Add media type and steps
            formData.append("mediaType", currentMediaType);
            formData.append("steps", JSON.stringify(currentSteps));
            formData.append("browser", navigator.userAgent);
            formData.append("os", navigator.platform);

            // Handle screenshot/video
            if (currentMediaType === "image") {
                const canvas = document.getElementById("screenshotCanvas");
                if (canvas && canvas.style.display !== "none") {
                    currentMediaBlob = await new Promise(resolve => {
                        canvas.toBlob(resolve, "image/webp", 0.6);
                    });
                }
            }

            if (currentMediaBlob) {
                const filename = currentMediaType === "video" ? "recording.webm" : "screenshot.webp";
                formData.append("screenshot", currentMediaBlob, filename);
            }

            // Get API endpoint
            let apiEndpoint = "http://localhost:3000/api/reports";
            try {
                if (typeof BugScribeConfig !== 'undefined') {
                    const configEndpoint = await BugScribeConfig.get('apiEndpoint');
                    if (configEndpoint && configEndpoint.trim()) {
                        apiEndpoint = configEndpoint.trim();
                    }
                }
            } catch (e) {
                console.log("Using default API endpoint");
            }

            // Submit with timeout
            const response = await fetch(apiEndpoint, {
                method: "POST",
                body: formData,
                signal: AbortSignal.timeout(30000)
            });

            if (!response.ok) {
                let errorMessage = `Server error: ${response.status}`;
                try {
                    const contentType = response.headers.get("content-type");
                    if (contentType && contentType.includes("application/json")) {
                        const errObj = await response.json();
                        errorMessage = errObj.error || errObj.message || errorMessage;
                    }
                } catch (e) {
                    console.error("Could not parse error response");
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();
            console.log("✅ Bug report submitted successfully:", result);

            // Clear pending media and draft
            chrome.storage.local.remove([
                "bugscribe_pending_media",
                "bugscribe_pending_steps",
                "bugscribe_pending_mediatype",
                "bugscribe_draft"
            ]);

            // Show success view
            reportView.style.display = "none";
            settingsBtn.style.display = "none";
            successView.style.display = "block";

            // Auto-reset after 3 seconds
            setTimeout(() => {
                resetFormForNewBug();
            }, 3000);

        } catch (err) {
            console.error("❌ Failed to submit bug report:", err);
            
            let userMessage = err.message || "Failed to send bug report";
            
            if (userMessage.includes("Failed to fetch") || userMessage.includes("NetworkError")) {
                userMessage = "🌐 Network error. Please check your connection.";
            } else if (userMessage.includes("401") || userMessage.includes("403")) {
                userMessage = "🔒 Authentication failed. Please reconnect in settings.";
            } else if (userMessage.includes("404")) {
                userMessage = "❌ API endpoint not found. Check configuration.";
            } else if (userMessage.includes("500") || userMessage.includes("502") || userMessage.includes("503")) {
                userMessage = "⚠️ Server error. Please try again.";
            } else if (userMessage.includes("timeout")) {
                userMessage = "⏱️ Request timed out. Please try again.";
            }
            
            errorMessage.textContent = userMessage;
            errorMessage.style.display = "block";
        } finally {
            isSubmitting = false;
            submitBtn.disabled = false;
            submitBtn.textContent = "🚀 Submit Bug Report";
        }
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
        submitBtn.textContent = "🚀 Submit Bug Report";
        currentMediaBlob = null;
        currentMediaType = "image";
        currentSteps = [];
        document.getElementById("stepsContainer").style.display = "none";
        document.getElementById("annotationToolbar").style.display = "none";
        captureScreenshot();
    }

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
        // Ctrl/Cmd + Enter to submit
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            if (reportView.style.display === "block" && !submitBtn.disabled) {
                submitBtn.click();
            }
        }
        
        // Escape to close
        if (e.key === "Escape") {
            window.close();
        }
    });
});
