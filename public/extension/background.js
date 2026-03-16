console.log("BugScribe Ext: Background Service Worker Active");

// This enables the Side Panel to open when you click the extension icon
chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));

// Listen for icon clicks to ensure the side panel behavior is consistent
chrome.action.onClicked.addListener((tab) => {
    // With openPanelOnActionClick: true, this usually opens the side panel.
    // If the side panel is already open, some Chrome versions might close it.
    console.log("BugScribe Ext: Icon clicked");
});

// Handle screenshot capture from content scripts securely 
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "capture-screenshot") {
        chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
            sendResponse({ dataUrl });
        });
        return true; // Keep the message channel open for async response
    }
});
