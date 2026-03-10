console.log("BugScribe Ext: Background Service Worker Active");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "CAPTURE_SCREENSHOT") {
        (async () => {
            try {
                // Find the active tab
                const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
                if (!tab) {
                    sendResponse({ error: "No active tab found" });
                    return;
                }

                // Hide the widget iframe before capturing
                try {
                    await chrome.tabs.sendMessage(tab.id, { action: "HIDE_IFRAME" });
                } catch (e) {
                    // Content script might not be loaded — that's fine
                }

                // Wait for the iframe to disappear from the render
                await new Promise(r => setTimeout(r, 200));

                // Capture the visible tab
                const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: "png" });

                // Show the widget again
                try {
                    await chrome.tabs.sendMessage(tab.id, { action: "SHOW_IFRAME" });
                } catch (e) { }

                sendResponse({ dataUrl });
            } catch (err) {
                console.error("BugScribe capture error:", err);
                sendResponse({ error: err.message });
            }
        })();
        return true; // async
    }
});
