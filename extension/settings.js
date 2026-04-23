document.addEventListener('DOMContentLoaded', async () => {
    // Initialize configuration
    const config = await BugScribeConfig.init();
    
    // Load current settings into form
    loadSettings(config);
    
    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            switchTab(tabName);
        });
    });
    
    // Range input live update
    const qualityInput = document.getElementById('screenshotQuality');
    const qualityValue = document.getElementById('qualityValue');
    qualityInput.addEventListener('input', () => {
        qualityValue.textContent = qualityInput.value;
    });
    
    // Save settings
    document.getElementById('saveSettings').addEventListener('click', async () => {
        await saveSettings();
    });
    
    // Export config
    document.getElementById('exportConfig').addEventListener('click', async () => {
        const jsonString = await BugScribeConfig.export();
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bugscribe-config-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showStatus('Configuration exported successfully!', 'success');
    });
    
    // Import config
    document.getElementById('importConfig').addEventListener('click', () => {
        document.getElementById('importFileInput').click();
    });
    
    document.getElementById('importFileInput').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = async (event) => {
            const result = await BugScribeConfig.import(event.target.result);
            if (result.success) {
                loadSettings(result.config);
                showStatus('Configuration imported successfully!', 'success');
            } else {
                showStatus(`Import failed: ${result.error}`, 'error');
            }
        };
        reader.readAsText(file);
    });
    
    // Reset config
    document.getElementById('resetConfig').addEventListener('click', async () => {
        if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
            const defaults = await BugScribeConfig.reset();
            loadSettings(defaults);
            showStatus('Settings reset to defaults', 'success');
        }
    });
    
    // Close settings
    document.getElementById('closeSettings').addEventListener('click', () => {
        window.close();
    });
});

function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.tab === tabName) {
            tab.classList.add('active');
        }
    });
    
    // Update tab panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

function loadSettings(config) {
    // Connection
    document.getElementById('apiEndpoint').value = config.apiEndpoint || '';
    document.getElementById('apiTimeout').value = config.apiTimeout || 30000;
    
    // Get connection key from storage
    chrome.storage.local.get(['bugscribeConnectionKey'], (result) => {
        if (result.bugscribeConnectionKey) {
            document.getElementById('connectionKey').value = result.bugscribeConnectionKey;
        }
    });
    
    // Capture
    document.getElementById('screenshotQuality').value = config.screenshotQuality || 60;
    document.getElementById('qualityValue').textContent = config.screenshotQuality || 60;
    document.getElementById('screenshotFormat').value = config.screenshotFormat || 'jpeg';
    document.getElementById('videoFrameRate').value = config.videoFrameRate || 15;
    document.getElementById('maxRecordingDuration').value = config.maxRecordingDuration || 300;
    document.getElementById('captureAudio').checked = config.captureAudio || false;
    document.getElementById('autoStopRecording').checked = config.autoStopRecording || false;
    document.getElementById('defaultAnnotationColor').value = config.defaultAnnotationColor || '#ef4444';
    document.getElementById('defaultAnnotationTool').value = config.defaultAnnotationTool || 'pen';
    
    // Privacy
    document.getElementById('captureConsoleErrors').checked = config.captureConsoleErrors !== false;
    document.getElementById('captureNetworkErrors').checked = config.captureNetworkErrors !== false;
    document.getElementById('trackUserActions').checked = config.trackUserActions !== false;
    document.getElementById('blurSensitiveData').checked = config.blurSensitiveData || false;
    document.getElementById('excludePasswords').checked = config.excludePasswords !== false;
    document.getElementById('excludeCookies').checked = config.excludeCookies || false;
    document.getElementById('truncateLocalStorage').checked = config.truncateLocalStorage !== false;
    document.getElementById('maxLogEntries').value = config.maxLogEntries || 50;
    
    // Advanced
    document.getElementById('theme').value = config.theme || 'auto';
    document.getElementById('position').value = config.position || 'bottom-right';
    document.getElementById('fabSize').value = config.fabSize || 'medium';
    document.getElementById('showSuccessNotification').checked = config.showSuccessNotification !== false;
    document.getElementById('showErrorNotification').checked = config.showErrorNotification !== false;
    document.getElementById('notificationDuration').value = config.notificationDuration || 3000;
    document.getElementById('enableDebugMode').checked = config.enableDebugMode || false;
}

async function saveSettings() {
    const newConfig = {
        // Connection
        apiEndpoint: document.getElementById('apiEndpoint').value.trim(),
        apiTimeout: parseInt(document.getElementById('apiTimeout').value),
        
        // Capture
        screenshotQuality: parseInt(document.getElementById('screenshotQuality').value),
        screenshotFormat: document.getElementById('screenshotFormat').value,
        videoFrameRate: parseInt(document.getElementById('videoFrameRate').value),
        maxRecordingDuration: parseInt(document.getElementById('maxRecordingDuration').value),
        captureAudio: document.getElementById('captureAudio').checked,
        autoStopRecording: document.getElementById('autoStopRecording').checked,
        defaultAnnotationColor: document.getElementById('defaultAnnotationColor').value,
        defaultAnnotationTool: document.getElementById('defaultAnnotationTool').value,
        
        // Privacy
        captureConsoleErrors: document.getElementById('captureConsoleErrors').checked,
        captureNetworkErrors: document.getElementById('captureNetworkErrors').checked,
        trackUserActions: document.getElementById('trackUserActions').checked,
        blurSensitiveData: document.getElementById('blurSensitiveData').checked,
        excludePasswords: document.getElementById('excludePasswords').checked,
        excludeCookies: document.getElementById('excludeCookies').checked,
        truncateLocalStorage: document.getElementById('truncateLocalStorage').checked,
        maxLogEntries: parseInt(document.getElementById('maxLogEntries').value),
        
        // Advanced
        theme: document.getElementById('theme').value,
        position: document.getElementById('position').value,
        fabSize: document.getElementById('fabSize').value,
        showSuccessNotification: document.getElementById('showSuccessNotification').checked,
        showErrorNotification: document.getElementById('showErrorNotification').checked,
        notificationDuration: parseInt(document.getElementById('notificationDuration').value),
        enableDebugMode: document.getElementById('enableDebugMode').checked,
    };
    
    // Validate configuration
    const validation = BugScribeConfig.validate(newConfig);
    if (!validation.valid) {
        showStatus(`Validation errors: ${validation.errors.join(', ')}`, 'error');
        return;
    }
    
    // Save to storage
    await BugScribeConfig.setAll(newConfig);
    
    // Save connection key separately
    const connectionKey = document.getElementById('connectionKey').value.trim();
    if (connectionKey) {
        try {
            const decoded = atob(connectionKey);
            const parts = decoded.split('|');
            if (parts.length >= 2) {
                chrome.storage.local.set({
                    bugscribeProjectId: parts[0],
                    bugscribeApiKey: parts[1],
                    bugscribeConnectionKey: connectionKey
                });
            }
        } catch (e) {
            console.error('Invalid connection key format');
        }
    }
    
    showStatus('Settings saved successfully!', 'success');
}

function showStatus(message, type) {
    const statusEl = document.getElementById('saveStatus');
    statusEl.textContent = message;
    statusEl.className = `save-status ${type}`;
    
    setTimeout(() => {
        statusEl.textContent = '';
        statusEl.className = 'save-status';
    }, 3000);
}
