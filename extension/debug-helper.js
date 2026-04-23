/**
 * BugScribe Debug Helper
 * Provides debugging utilities for troubleshooting extension issues
 */

const BugScribeDebug = {
    /**
     * Check if extension is properly configured
     */
    async checkConfiguration() {
        console.log("🔍 BugScribe Configuration Check");
        console.log("================================");
        
        return new Promise((resolve) => {
            chrome.storage.local.get([
                'bugscribeProjectId',
                'bugscribeApiKey',
                'bugscribeConnectionKey',
                'bugscribeConfig'
            ], (result) => {
                const status = {
                    configured: false,
                    projectId: !!result.bugscribeProjectId,
                    apiKey: !!result.bugscribeApiKey,
                    connectionKey: !!result.bugscribeConnectionKey,
                    config: !!result.bugscribeConfig,
                    details: {}
                };

                if (result.bugscribeProjectId) {
                    status.details.projectId = result.bugscribeProjectId;
                    console.log("✅ Project ID:", result.bugscribeProjectId);
                } else {
                    console.log("❌ Project ID: Not set");
                }

                if (result.bugscribeApiKey) {
                    console.log("✅ API Key:", result.bugscribeApiKey.substring(0, 10) + "...");
                } else {
                    console.log("❌ API Key: Not set");
                }

                if (result.bugscribeConnectionKey) {
                    console.log("✅ Connection Key: Set");
                } else {
                    console.log("❌ Connection Key: Not set");
                }

                if (result.bugscribeConfig) {
                    console.log("✅ Configuration:", result.bugscribeConfig);
                    status.details.config = result.bugscribeConfig;
                } else {
                    console.log("⚠️ Configuration: Using defaults");
                }

                status.configured = status.projectId && status.apiKey;
                console.log("\n" + (status.configured ? "✅ Extension is configured" : "❌ Extension needs configuration"));
                console.log("================================\n");

                resolve(status);
            });
        });
    },

    /**
     * Test API connectivity
     */
    async testAPIConnection(apiEndpoint = "https://bug-higt.vercel.app/api/reports") {
        console.log("🌐 Testing API Connection");
        console.log("Endpoint:", apiEndpoint);
        
        try {
            const response = await fetch(apiEndpoint, {
                method: "OPTIONS",
                headers: {
                    "Content-Type": "application/json"
                }
            });

            console.log("Response status:", response.status);
            console.log("Response headers:", [...response.headers.entries()]);

            if (response.ok || response.status === 405) {
                console.log("✅ API endpoint is reachable");
                return { success: true, status: response.status };
            } else {
                console.log("⚠️ API returned status:", response.status);
                return { success: false, status: response.status };
            }
        } catch (error) {
            console.error("❌ API connection failed:", error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Test screenshot capture
     */
    async testScreenshotCapture() {
        console.log("📸 Testing Screenshot Capture");
        
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({ action: "CAPTURE_SCREENSHOT" }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("❌ Screenshot capture failed:", chrome.runtime.lastError);
                    resolve({ success: false, error: chrome.runtime.lastError.message });
                    return;
                }

                const decoded = toon.decode(response);
                if (decoded && decoded.dataUrl) {
                    console.log("✅ Screenshot captured successfully");
                    console.log("Data URL length:", decoded.dataUrl.length);
                    resolve({ success: true, dataUrl: decoded.dataUrl });
                } else {
                    console.error("❌ Screenshot capture failed:", decoded?.error);
                    resolve({ success: false, error: decoded?.error || "Unknown error" });
                }
            });
        });
    },

    /**
     * Test form data creation
     */
    async testFormDataCreation() {
        console.log("📝 Testing Form Data Creation");
        
        const testData = {
            title: "Test Bug Report",
            description: "This is a test",
            priority: "medium",
            type: "general",
            url: window.location.href
        };

        try {
            const formData = new FormData();
            Object.entries(testData).forEach(([key, value]) => {
                formData.append(key, value);
            });

            console.log("✅ Form data created successfully");
            console.log("Form data entries:");
            for (let [key, value] of formData.entries()) {
                console.log(`  ${key}:`, value);
            }

            return { success: true, formData };
        } catch (error) {
            console.error("❌ Form data creation failed:", error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Test complete submission flow (dry run)
     */
    async testSubmissionFlow(dryRun = true) {
        console.log("🧪 Testing Complete Submission Flow");
        console.log("Dry run:", dryRun);
        console.log("================================");

        const results = {
            configuration: await this.checkConfiguration(),
            apiConnection: await this.testAPIConnection(),
            screenshot: await this.testScreenshotCapture(),
            formData: await this.testFormDataCreation()
        };

        console.log("\n📊 Test Results Summary");
        console.log("================================");
        console.log("Configuration:", results.configuration.configured ? "✅ PASS" : "❌ FAIL");
        console.log("API Connection:", results.apiConnection.success ? "✅ PASS" : "❌ FAIL");
        console.log("Screenshot:", results.screenshot.success ? "✅ PASS" : "❌ FAIL");
        console.log("Form Data:", results.formData.success ? "✅ PASS" : "❌ FAIL");

        const allPassed = results.configuration.configured &&
                         results.apiConnection.success &&
                         results.screenshot.success &&
                         results.formData.success;

        console.log("\n" + (allPassed ? "✅ All tests passed!" : "❌ Some tests failed"));
        console.log("================================\n");

        return results;
    },

    /**
     * Get diagnostic information
     */
    async getDiagnostics() {
        const diagnostics = {
            timestamp: new Date().toISOString(),
            browser: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            online: navigator.onLine,
            cookiesEnabled: navigator.cookieEnabled,
            extensionVersion: chrome.runtime.getManifest().version,
            configuration: await this.checkConfiguration(),
        };

        console.log("🔬 Diagnostics Information");
        console.log(JSON.stringify(diagnostics, null, 2));

        return diagnostics;
    },

    /**
     * Export diagnostics to clipboard
     */
    async exportDiagnostics() {
        const diagnostics = await this.getDiagnostics();
        const text = JSON.stringify(diagnostics, null, 2);
        
        try {
            await navigator.clipboard.writeText(text);
            console.log("✅ Diagnostics copied to clipboard");
            return true;
        } catch (error) {
            console.error("❌ Failed to copy diagnostics:", error);
            return false;
        }
    },

    /**
     * Clear all extension data
     */
    async clearAllData() {
        console.log("🗑️ Clearing all extension data...");
        
        return new Promise((resolve) => {
            chrome.storage.local.clear(() => {
                console.log("✅ All data cleared");
                resolve(true);
            });
        });
    },

    /**
     * Reset to defaults
     */
    async resetToDefaults() {
        console.log("🔄 Resetting to defaults...");
        
        await this.clearAllData();
        
        if (typeof BugScribeConfig !== 'undefined') {
            await BugScribeConfig.init();
            console.log("✅ Configuration reset to defaults");
        }
        
        return true;
    }
};

// Make available globally
if (typeof window !== 'undefined') {
    window.BugScribeDebug = BugScribeDebug;
}

// Auto-run diagnostics in debug mode
if (typeof window !== 'undefined') {
    chrome.storage.local.get(['bugscribeConfig'], (result) => {
        if (result.bugscribeConfig?.enableDebugMode) {
            console.log("🐛 Debug mode enabled");
            console.log("Run BugScribeDebug.testSubmissionFlow() to test the extension");
            console.log("Run BugScribeDebug.getDiagnostics() to get diagnostic information");
        }
    });
}
