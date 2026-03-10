console.log("BugScribe Ext: Background Service Worker Active");

// This enables the Side Panel to open when you click the extension icon
chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));

// Handle screenshot capture from content scripts securely 
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "capture-screenshot") {
        chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
            sendResponse({ dataUrl });
        });
        return true; // Keep the message channel open for async response
    }
});
