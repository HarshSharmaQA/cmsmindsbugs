// BugScribe Content Script Wrapper
function injectWidget() {
    chrome.storage.local.get(["bugscribeProjectId", "bugscribeApiKey", "bugscribeConvexUrl", "bugscribeProjectName"], (refs) => {
        if (!refs.bugscribeProjectId || !refs.bugscribeApiKey) {
            console.log("BugScribe Ext: No project credentials set. Open the extension popup to enter them.");
            return;
        }

        const convexUrl = refs.bugscribeConvexUrl || "https://limitless-chinchilla-790.convex.cloud";
        const projectName = refs.bugscribeProjectName || "Untitled Project";

        // Do not inject if already running
        if (document.getElementById("bugscribe-injected-script")) {
            console.log("BugScribe Ext: Widget already injected.");
            return;
        }

        console.log("BugScribe Ext: Attempting to load widget from localhost:3000...");

        // Create the script element
        const script = document.createElement("script");
        script.id = "bugscribe-injected-script";
        script.src = "http://localhost:3000/widget/bugscribe-widget.js";
        script.async = true;

        // Setup data attributes
        script.setAttribute("data-project-id", refs.bugscribeProjectId);
        script.setAttribute("data-api-key", refs.bugscribeApiKey);
        script.setAttribute("data-convex-url", convexUrl);
        script.setAttribute("data-project-name", projectName);

        script.onload = () => {
            console.log("BugScribe Ext: ✅ Widget script LOADED successfully.");
        };

        script.onerror = (e) => {
            console.error("BugScribe Ext: ❌ FAILED to load widget. Possible reasons:");
            console.error("1. 'npm run dev' is not running in your terminal.");
            console.error("2. Chrome is blocking 'Insecure Content' (HTTP on HTTPS site). Click the Lock icon in URL bar -> Site Settings -> Insecure Content -> Allow.");
            console.error("3. Localhost is not responding on port 3000.");
        };

        (document.head || document.documentElement).appendChild(script);
    });
}

// On page load, attempt injection
injectWidget();

// Listen for messages from the popup/sidepanel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "trigger-report") {
        console.log("BugScribe Ext: Received trigger-report message.");
        const reportBtn = document.getElementById("bugscribe-btn");
        if (reportBtn) {
            reportBtn.click();
            sendResponse({ status: "success" });
        } else {
            console.warn("BugScribe Ext: Widget button not found. Attempting re-injection...");
            injectWidget();
            sendResponse({ status: "attempting-reinjection" });
        }
    }
    return true;
});

// Bridge for widget to request native screenshots from the extension
window.addEventListener("bugscribe-request-screenshot", () => {
    chrome.runtime.sendMessage({ action: "capture-screenshot" }, (response) => {
        if (response && response.dataUrl) {
            window.dispatchEvent(new CustomEvent("bugscribe-screenshot-ready", { detail: response.dataUrl }));
        }
    });
});
