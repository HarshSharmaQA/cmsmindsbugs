importScripts('toon_utils.js');

console.log("BugScribe Ext: Background Service Worker Active v2.1");

// Handle extension icon click - do nothing or show notification
chrome.action.onClicked.addListener((tab) => {
    console.log("Extension icon clicked - use the side tab to open BugScribe");
    // Optionally show a notification
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon128.png',
        title: 'BugScribe Reporter',
        message: 'Look for the purple tab on the right side of your screen to report bugs!',
        priority: 1
    });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "CAPTURE_SCREENSHOT") {
        (async () => {
            try {
                console.log("📸 Screenshot capture requested");
                
                // Find the active tab
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (!tab) {
                    console.error("No active tab found");
                    sendResponse(toon.encode({ error: "No active tab found" }));
                    return;
                }

                console.log("Tab found:", tab.id, tab.url);

                // Try to hide the widget iframe before capturing
                try {
                    await chrome.tabs.sendMessage(tab.id, { action: "HIDE_IFRAME" });
                    console.log("Widget hidden");
                    // Wait for the iframe to disappear from the render
                    await new Promise(r => setTimeout(r, 100));
                } catch (e) {
                    // Content script might not be loaded — that's fine
                    console.log("Could not hide widget (content script may not be loaded)");
                }

                // Capture the screenshot with better error handling
                console.log("Capturing visible tab...");
                let dataUrl;
                try {
                    dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { 
                        format: "png", 
                        quality: 90 
                    });
                } catch (captureError) {
                    console.error("First capture attempt failed:", captureError.message);
                    // Try again with JPEG format
                    try {
                        await new Promise(r => setTimeout(r, 200));
                        dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { 
                            format: "jpeg", 
                            quality: 80 
                        });
                    } catch (retryError) {
                        throw new Error(`Failed to capture screenshot: ${retryError.message}`);
                    }
                }

                console.log("✅ Screenshot captured, size:", Math.round(dataUrl.length / 1024), "KB");

                // Show the widget again
                try {
                    await chrome.tabs.sendMessage(tab.id, { action: "SHOW_IFRAME" });
                    console.log("Widget shown");
                } catch (e) {
                    console.log("Could not show widget");
                }

                sendResponse(toon.encode({ dataUrl }));
            } catch (err) {
                console.error("❌ BugScribe capture error:", err);
                sendResponse(toon.encode({ error: err.message || "Failed to capture screenshot" }));
            }
        })();
        return true; // Keep the message channel open for async response
    }
    
    return false; // Not handling this message
});

// Log when the service worker starts
chrome.runtime.onStartup.addListener(() => {
    console.log("BugScribe: Extension started");
});

// Log when the extension is installed or updated
chrome.runtime.onInstalled.addListener((details) => {
    console.log("BugScribe: Extension installed/updated", details.reason);
    if (details.reason === 'install') {
        console.log("Welcome to BugScribe! Please configure your connection key.");
    } else if (details.reason === 'update') {
        console.log("BugScribe updated to version", chrome.runtime.getManifest().version);
    }
});
