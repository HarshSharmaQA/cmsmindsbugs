document.addEventListener("DOMContentLoaded", () => {
    const setupView = document.getElementById("setupView");
    const reportView = document.getElementById("reportView");
    const successView = document.getElementById("successView");
    const settingsBtn = document.getElementById("settingsBtn");

    const bugTitle = document.getElementById("bugTitle");
    const bugDescription = document.getElementById("bugDescription");
    const bugPriority = document.getElementById("bugPriority");
    const submitBtn = document.getElementById("submitBtn");
    const errorMessage = document.getElementById("errorMessage");

    let currentMediaBlob = null;
    let currentMediaType = "image";
    let currentSteps = [];
    let pageUrl = "Unknown";

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

            chrome.storage.local.get(["bugscribe_pending_media", "bugscribe_pending_steps", "bugscribe_pending_mediatype"], (data) => {
                if (data.bugscribe_pending_media) {
                    currentMediaType = data.bugscribe_pending_mediatype || "video";
                    currentSteps = data.bugscribe_pending_steps || [];

                    if (currentMediaType === "video") {
                        // Show video player
                        document.getElementById("screenshotPreview").style.display = "none";
                        document.getElementById("screenshotCanvas").style.display = "none";
                        document.getElementById("annotationToolbar").style.display = "none";
                        const videoEl = document.getElementById("videoPreview");
                        videoEl.style.display = "block";
                        videoEl.src = data.bugscribe_pending_media;
                    } else {
                        // Show image preview with annotation canvas
                        document.getElementById("videoPreview").style.display = "none";
                        const imgEl = document.getElementById("screenshotPreview");
                        imgEl.src = data.bugscribe_pending_media;
                        imgEl.style.display = "block";
                        document.getElementById("screenshotPreviewContainer").style.display = "block";

                        // Set up canvas for annotation
                        const canvas = document.getElementById("screenshotCanvas");
                        const toolbar = document.getElementById("annotationToolbar");
                        const ctx = canvas.getContext("2d");
                        strokeHistory = [];

                        const imgObj = new Image();
                        imgObj.onload = () => {
                            canvas.width = imgObj.width;
                            canvas.height = imgObj.height;
                            ctx.drawImage(imgObj, 0, 0);
                            baseImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                            canvas.style.display = "block";
                            imgEl.style.display = "none";
                            toolbar.style.display = "flex";

                            let isDrawing = false;
                            const getMousePos = (e) => {
                                const rect = canvas.getBoundingClientRect();
                                return {
                                    x: (e.clientX - rect.left) * (canvas.width / rect.width),
                                    y: (e.clientY - rect.top) * (canvas.height / rect.height)
                                };
                            };
                            canvas.onmousedown = (e) => {
                                isDrawing = true;
                                strokeHistory.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
                                ctx.beginPath();
                                const pos = getMousePos(e);
                                ctx.moveTo(pos.x, pos.y);
                            };
                            canvas.onmousemove = (e) => {
                                if (!isDrawing) return;
                                const pos = getMousePos(e);
                                ctx.lineTo(pos.x, pos.y);
                                ctx.strokeStyle = annotationColor;
                                ctx.lineWidth = Math.max(4, canvas.width * 0.003);
                                ctx.lineCap = "round";
                                ctx.lineJoin = "round";
                                ctx.stroke();
                            };
                            canvas.onmouseup = () => isDrawing = false;
                            canvas.onmouseout = () => isDrawing = false;
                        };
                        imgObj.src = data.bugscribe_pending_media;
                    }

                    fetch(data.bugscribe_pending_media)
                        .then(res => res.blob())
                        .then(blob => currentMediaBlob = blob);

                    // Show steps
                    if (currentSteps.length > 0) {
                        const stepsContainer = document.getElementById("stepsContainer");
                        const stepsList = document.getElementById("stepsList");
                        stepsContainer.style.display = "block";
                        stepsList.innerHTML = currentSteps.map(s => `<li>${s}</li>`).join("");
                    }
                } else {
                    // Standard screenshot
                    captureScreenshot();
                }
            });
        } catch (err) {
            console.error(err);
        }
    }

    let annotationColor = "#ef4444";
    let strokeHistory = []; // array of ImageData snapshots for undo
    let baseImageData = null; // the original screenshot without annotations

    async function captureScreenshot() {
        currentMediaType = "image";
        currentSteps = [];
        document.getElementById("stepsContainer").style.display = "none";
        document.getElementById("videoPreview").style.display = "none";
        document.getElementById("videoPreview").src = "";
        const imgEl = document.getElementById("screenshotPreview");
        imgEl.style.display = "block";

        // Background handles: hide widget → capture → show widget
        chrome.runtime.sendMessage({ action: "CAPTURE_SCREENSHOT" }, (response) => {
            if (chrome.runtime.lastError || !response || !response.dataUrl) {
                console.error(chrome.runtime.lastError || response?.error);
                document.getElementById("screenshotPreviewContainer").style.display = "none";
                document.getElementById("annotationToolbar").style.display = "none";
            } else {
                imgEl.src = response.dataUrl;
                document.getElementById("screenshotPreviewContainer").style.display = "block";

                // Initialize Canvas Annotation
                const canvas = document.getElementById("screenshotCanvas");
                const toolbar = document.getElementById("annotationToolbar");
                const ctx = canvas.getContext("2d");
                strokeHistory = [];

                const imgObj = new Image();
                imgObj.onload = () => {
                    canvas.width = imgObj.width;
                    canvas.height = imgObj.height;
                    ctx.drawImage(imgObj, 0, 0);
                    baseImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

                    canvas.style.display = "block";
                    imgEl.style.display = "none";
                    toolbar.style.display = "flex";

                    // Drawing state
                    let isDrawing = false;

                    const getMousePos = (e) => {
                        const rect = canvas.getBoundingClientRect();
                        const scaleX = canvas.width / rect.width;
                        const scaleY = canvas.height / rect.height;
                        return {
                            x: (e.clientX - rect.left) * scaleX,
                            y: (e.clientY - rect.top) * scaleY
                        };
                    };

                    canvas.onmousedown = (e) => {
                        isDrawing = true;
                        // Save state before this stroke for undo
                        strokeHistory.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
                        ctx.beginPath();
                        const pos = getMousePos(e);
                        ctx.moveTo(pos.x, pos.y);
                    };

                    canvas.onmousemove = (e) => {
                        if (!isDrawing) return;
                        const pos = getMousePos(e);
                        ctx.lineTo(pos.x, pos.y);
                        ctx.strokeStyle = annotationColor;
                        ctx.lineWidth = Math.max(4, canvas.width * 0.003);
                        ctx.lineCap = "round";
                        ctx.lineJoin = "round";
                        ctx.stroke();
                    };

                    canvas.onmouseup = () => isDrawing = false;
                    canvas.onmouseout = () => isDrawing = false;
                };
                imgObj.src = response.dataUrl;

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

    document.getElementById("recordBtn").addEventListener("click", async () => {
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

    document.getElementById("annotatePageBtn").addEventListener("click", async () => {
        const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
        if (tab && tab.id) {
            chrome.tabs.sendMessage(tab.id, { action: "START_ANNOTATE" }, (res) => {
                if (chrome.runtime.lastError) {
                    alert("Please refresh the page before annotating.");
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
                formData.append("url", pageUrl);

                // Ask content.js for environment data
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

                // If using image, extract the latest drawn blob from canvas
                if (currentMediaType === "image") {
                    const canvas = document.getElementById("screenshotCanvas");
                    if (canvas && canvas.style.display !== "none") {
                        currentMediaBlob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
                    }
                }

                if (currentMediaBlob) {
                    const filename = currentMediaType === "video" ? "recording.webm" : "screenshot.png";
                    formData.append("screenshot", currentMediaBlob, filename);
                }

                // In Production, this URL should be your hosted Next.js API route
                // For local dev with extension:
                // IMPORTANT: Change to production URL if deployed
                const response = await fetch("https://bugscripe.vercel.app/api/reports", {
                    method: "POST",
                    body: formData
                });

                if (!response.ok) {
                    const errObj = await response.json().catch(() => ({}));
                    throw new Error(errObj.error || "Failed to submit report");
                }

                // Clear pending recording
                chrome.storage.local.remove(["bugscribe_pending_media", "bugscribe_pending_steps", "bugscribe_pending_mediatype"]);

                reportView.style.display = "none";
                settingsBtn.style.display = "none";
                successView.style.display = "block";

                // Auto-reset to allow reporting another bug after 3 seconds
                setTimeout(() => {
                    successView.style.display = "none";
                    reportView.style.display = "block";
                    settingsBtn.style.display = "block";
                    bugTitle.value = "";
                    bugDescription.value = "";
                    bugPriority.value = "medium";
                    submitBtn.disabled = false;
                    submitBtn.textContent = "Submit Bug Report";
                    currentMediaBlob = null;
                    currentMediaType = "image";
                    currentSteps = [];
                    document.getElementById("stepsContainer").style.display = "none";
                    document.getElementById("annotationToolbar").style.display = "none";
                    // Take a fresh screenshot for the next bug
                    captureScreenshot();
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
        window.parent.postMessage("CLOSE_BUGScribe_IFRAME", "*");
        window.close();
    });
});
