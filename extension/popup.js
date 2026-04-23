document.addEventListener("DOMContentLoaded", () => {
    const setupView = document.getElementById("setupView");
    const nameView = document.getElementById("nameView");
    const reportView = document.getElementById("reportView");
    const successView = document.getElementById("successView");
    const disabledView = document.getElementById("disabledView");
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
    let currentDrawTool = "pen";
    let annotationColor = "#ef4444";
    let strokeHistory = []; 
    let baseImageData = null;
    let bugLocationContext = null;
    let reportingEnabled = true;
    let allProjects = [];
    let activeProjectId = null;

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

    // Load all projects
    async function loadProjects() {
        return new Promise((resolve) => {
            chrome.storage.local.get(["bugscribeProjects", "bugscribeActiveProject"], (result) => {
                allProjects = result.bugscribeProjects || [];
                activeProjectId = result.bugscribeActiveProject || null;
                resolve();
            });
        });
    }

    // Save projects
    function saveProjects() {
        chrome.storage.local.set({
            bugscribeProjects: allProjects,
            bugscribeActiveProject: activeProjectId
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
    function setActiveProject(projectId) {
        activeProjectId = projectId;
        const project = allProjects.find(p => p.id === projectId);
        if (project) {
            // Set legacy storage for compatibility
            chrome.storage.local.set({
                bugscribeProjectId: project.projectId,
                bugscribeApiKey: project.apiKey,
                bugscribeConnectionKey: project.connectionKey,
                bugscribeActiveProject: projectId
            }, async () => {
                renderProjects();
                
                // Check if reporting is enabled
                const reportingEnabled = await checkReportingStatus();
                
                if (!reportingEnabled) {
                    showDisabledView();
                } else {
                    // Check if user has provided their name
                    chrome.storage.local.get(["bugscribeUserName"], (result) => {
                        if (!result.bugscribeUserName) {
                            showNameView();
                        } else {
                            showReportView();
                        }
                    });
                }
            });
        }
    }

    // Render projects list
    function renderProjects() {
        const container = document.getElementById("projectsContainer");
        const projectsList = document.getElementById("projectsList");
        
        if (!allProjects || allProjects.length === 0) {
            projectsList.style.display = "none";
            return;
        }

        projectsList.style.display = "block";
        container.innerHTML = "";

        allProjects.forEach(project => {
            const card = document.createElement("div");
            card.className = `project-card ${project.id === activeProjectId ? 'active' : ''}`;
            
            card.innerHTML = `
                <div class="project-card-content">
                    <div class="project-card-name">${escapeHtml(project.name || 'Unnamed Project')}</div>
                    <div class="project-card-id">${escapeHtml(project.projectId.substring(0, 12))}...</div>
                </div>
                <div class="project-card-actions">
                    <button class="project-card-btn delete" data-id="${project.id}" title="Remove">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            `;

            card.addEventListener("click", (e) => {
                if (!e.target.closest('.project-card-btn')) {
                    setActiveProject(project.id);
                }
            });

            const deleteBtn = card.querySelector('.delete');
            deleteBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                if (confirm(`Remove "${project.name || 'this project'}"?`)) {
                    allProjects = allProjects.filter(p => p.id !== project.id);
                    if (activeProjectId === project.id) {
                        activeProjectId = allProjects.length > 0 ? allProjects[0].id : null;
                    }
                    saveProjects();
                    renderProjects();
                    
                    if (allProjects.length === 0) {
                        chrome.storage.local.remove(["bugscribeProjectId", "bugscribeApiKey", "bugscribeConnectionKey"]);
                    } else if (activeProjectId) {
                        setActiveProject(activeProjectId);
                    }
                }
            });

            container.appendChild(card);
        });
    }

    settingsBtn.addEventListener("click", () => {
        showSetupView();
        renderProjects();
    });

    // --- Check if reporting is enabled ---
    async function checkReportingStatus() {
        try {
            const result = await new Promise((resolve) => {
                chrome.storage.local.get(["bugscribeProjectId", "bugscribeApiKey"], resolve);
            });

            if (!result.bugscribeProjectId || !result.bugscribeApiKey) {
                return true; // Not configured yet
            }

            const response = await fetch(`https://bugscribe.convex.site/api/check-reporting-status`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId: result.bugscribeProjectId,
                    apiKey: result.bugscribeApiKey
                })
            });

            if (response.ok) {
                const data = await response.json();
                return data.enabled !== false;
            }
            return true;
        } catch (error) {
            console.error("Error checking reporting status:", error);
            return true; // Allow reporting if check fails
        }
    }


    function showSetupView() {
        setupView.style.display = "block";
        nameView.style.display = "none";
        reportView.style.display = "none";
        successView.style.display = "none";
        disabledView.style.display = "none";
        settingsBtn.style.display = "flex";
    }

    function showNameView() {
        setupView.style.display = "none";
        nameView.style.display = "block";
        reportView.style.display = "none";
        successView.style.display = "none";
        disabledView.style.display = "none";
        settingsBtn.style.display = "flex";
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

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            pageUrl = tab.url || "Unknown";
            if (tab && tab.id) {
                try {
                    bugLocationContext = await new Promise((resolve) => {
                        chrome.tabs.sendMessage(tab.id, { action: "GET_BUG_CONTEXT" }, (res) => {
                            resolve(toon.decode(res) || null);
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
            const decodedResponse = toon.decode(response);
            if (chrome.runtime.lastError || !decodedResponse || !decodedResponse.dataUrl) {
                console.error(chrome.runtime.lastError || decodedResponse?.error);
                document.getElementById("screenshotPreviewContainer").style.display = "none";
                document.getElementById("annotationToolbar").style.display = "none";
            } else {
                imgEl.src = decodedResponse.dataUrl;
                document.getElementById("screenshotPreviewContainer").style.display = "block";
                initCanvas(decodedResponse.dataUrl);
                
                fetch(decodedResponse.dataUrl)
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
        if (e.target.disabled) return;
        e.target.disabled = true;
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        chrome.tabs.sendMessage(tab.id, { action: "START_RECORDING" }, (res) => {
            const decodedRes = toon.decode(res);
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
                const decodedRes = toon.decode(res);
                if (chrome.runtime.lastError) {
                    alert("Please refresh the page before annotating.");
                } else {
                    window.close();
                }
            });
        }
    });

    // --- Save Credentials ---
    document.getElementById("saveBtn").addEventListener("click", async () => {
        const connectionKey = document.getElementById("setupConnectionKey").value.trim();
        const projectName = document.getElementById("projectName").value.trim();
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

                // Check if project already exists
                const existingProject = allProjects.find(p => p.projectId === projectId);
                if (existingProject) {
                    errorMsg.textContent = "This project is already added.";
                    errorMsg.style.display = "block";
                    return;
                }

                // Add new project
                const newProject = {
                    id: Date.now().toString(),
                    name: projectName || `Project ${allProjects.length + 1}`,
                    projectId: projectId,
                    apiKey: apiKey,
                    connectionKey: connectionKey,
                    addedAt: Date.now()
                };

                allProjects.push(newProject);
                saveProjects();

                const msg = document.getElementById("savedMsg");
                msg.style.display = "block";
                
                // Clear inputs
                document.getElementById("setupConnectionKey").value = "";
                document.getElementById("projectName").value = "";
                
                setTimeout(async () => {
                    msg.style.display = "none";
                    renderProjects();
                    
                    // Set as active project
                    await setActiveProject(newProject.id);
                }, 1000);
            } else {
                throw new Error("Invalid key format");
            }
        } catch (e) {
            errorMsg.textContent = "Invalid connection key. Please copy the exact key from your dashboard.";
            errorMsg.style.display = "block";
        }
    });

    // --- Save User Name ---
    document.getElementById("saveNameBtn").addEventListener("click", () => {
        const userName = document.getElementById("userName").value.trim();
        const userEmail = document.getElementById("userEmail").value.trim();
        const errorMsg = document.getElementById("nameErrorMsg");
        
        errorMsg.style.display = "none";
        errorMsg.textContent = "";

        if (!userName) {
            errorMsg.textContent = "Please enter your name.";
            errorMsg.style.display = "block";
            return;
        }

        if (userName.length < 2) {
            errorMsg.textContent = "Name must be at least 2 characters.";
            errorMsg.style.display = "block";
            return;
        }

        chrome.storage.local.set({
            bugscribeUserName: userName,
            bugscribeUserEmail: userEmail || ""
        }, () => {
            showReportView();
        });
    });

    // --- Submit Bug Report ---
    submitBtn.addEventListener("click", async () => {
        // Validate title
        if (!bugTitle.value.trim()) {
            errorMessage.textContent = "⚠️ Title is required";
            errorMessage.style.display = "block";
            return;
        }

        if (submitBtn.disabled) return;
        submitBtn.disabled = true;
        submitBtn.textContent = "📤 Sending...";
        errorMessage.style.display = "none";

        try {
            // Get credentials
            const creds = await new Promise((resolve) => {
                chrome.storage.local.get(["bugscribeProjectId", "bugscribeApiKey", "bugscribeUserName", "bugscribeUserEmail"], resolve);
            });

            if (!creds.bugscribeProjectId || !creds.bugscribeApiKey) {
                throw new Error("⚠️ Please connect your extension first. Click the settings icon.");
            }

            // Get user name
            const userName = creds.bugscribeUserName || "Anonymous";
            const userEmail = creds.bugscribeUserEmail || "";

            console.log("🔍 Submitting bug report...");
            console.log("Project ID:", creds.bugscribeProjectId);
            console.log("Reporter:", userName);
            console.log("Page URL:", pageUrl);

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
            formData.append("reporterName", userName);
            formData.append("reporterEmail", userEmail);
            
            // Add location context
            if (bugLocationContext?.x_coordinate !== undefined) {
                formData.append("x_coordinate", String(bugLocationContext.x_coordinate));
            }
            if (bugLocationContext?.y_coordinate !== undefined) {
                formData.append("y_coordinate", String(bugLocationContext.y_coordinate));
            }
            if (bugLocationContext?.scroll_position !== undefined) {
                formData.append("scroll_position", String(bugLocationContext.scroll_position));
            }
            if (bugLocationContext?.scrollX !== undefined) {
                formData.append("scrollX", String(bugLocationContext.scrollX));
            }
            if (bugLocationContext?.scrollY !== undefined) {
                formData.append("scrollY", String(bugLocationContext.scrollY));
            }
            if (bugLocationContext?.element_selector) {
                formData.append("element_selector", bugLocationContext.element_selector);
            }
            formData.append("created_at", String(bugLocationContext?.created_at || Date.now()));

            // Get environment data
            try {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tab && tab.id) {
                    const envData = await new Promise((resolve) => {
                        // Set a timeout to prevent hanging
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
                        console.log("✅ Environment data collected");
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

            console.log("Media type:", currentMediaType);
            console.log("Steps count:", currentSteps.length);

            // Handle screenshot/video
            if (currentMediaType === "image") {
                const canvas = document.getElementById("screenshotCanvas");
                if (canvas && canvas.style.display !== "none") {
                    console.log("📸 Converting canvas to blob...");
                    currentMediaBlob = await new Promise(resolve => {
                        canvas.toBlob(resolve, "image/webp", 0.6);
                    });
                }
            }

            if (currentMediaBlob) {
                const filename = currentMediaType === "video" ? "recording.webm" : "screenshot.webp";
                formData.append("screenshot", currentMediaBlob, filename);
                console.log("✅ Media attached:", filename, "Size:", Math.round(currentMediaBlob.size / 1024), "KB");
            } else {
                console.warn("⚠️ No media blob available");
            }

            // Get API endpoint from config or use default
            let apiEndpoint = "http://localhost:3000/api/reports"; // Default to localhost
            try {
                if (typeof BugScribeConfig !== 'undefined') {
                    const configEndpoint = await BugScribeConfig.get('apiEndpoint');
                    if (configEndpoint && configEndpoint.trim()) {
                        apiEndpoint = configEndpoint.trim();
                    }
                }
            } catch (e) {
                console.log("Using default API endpoint:", e.message);
            }

            console.log("🌐 Sending to:", apiEndpoint);

            // Submit the report with better error handling
            let response;
            try {
                response = await fetch(apiEndpoint, {
                    method: "POST",
                    body: formData,
                    // Add timeout
                    signal: AbortSignal.timeout(30000)
                });
            } catch (fetchError) {
                if (fetchError.name === 'AbortError') {
                    throw new Error("⏱️ Request timed out. Please check your server and try again.");
                }
                throw new Error(`🌐 Network error: ${fetchError.message}. Make sure your server is running.`);
            }

            console.log("📡 Response status:", response.status);

            if (!response.ok) {
                let errorMessage = `Server error: ${response.status} ${response.statusText}`;
                try {
                    const contentType = response.headers.get("content-type");
                    if (contentType && contentType.includes("application/json")) {
                        const errObj = await response.json();
                        errorMessage = errObj.error || errObj.message || errorMessage;
                        console.error("Server error details:", errObj);
                    } else {
                        const textError = await response.text();
                        console.error("Server response (text):", textError);
                        if (textError.length < 200) {
                            errorMessage = textError;
                        }
                    }
                } catch (e) {
                    console.error("Could not parse error response:", e);
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();
            console.log("✅ Bug report submitted successfully:", result);

            // Clear pending media
            chrome.storage.local.remove(["bugscribe_pending_media", "bugscribe_pending_steps", "bugscribe_pending_mediatype"]);

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
            
            // Show user-friendly error message
            let userMessage = err.message || "Failed to send bug report";
            
            // Add helpful hints based on error type
            if (userMessage.includes("Failed to fetch") || userMessage.includes("NetworkError")) {
                userMessage = "🌐 Network error. Please check your internet connection and try again.";
            } else if (userMessage.includes("401") || userMessage.includes("403")) {
                userMessage = "🔒 Authentication failed. Please reconnect your extension in settings.";
            } else if (userMessage.includes("404")) {
                userMessage = "❌ API endpoint not found. Please check your configuration.";
            } else if (userMessage.includes("500") || userMessage.includes("502") || userMessage.includes("503")) {
                userMessage = "⚠️ Server error. Please try again in a moment.";
            }
            
            errorMessage.textContent = userMessage;
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
