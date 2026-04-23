/**
 * BugScribe Extension - Local Configuration Manager
 * Handles local settings, preferences, and configuration storage
 */

const BugScribeConfig = {
    // Default configuration values
    defaults: {
        // API Configuration
        apiEndpoint: 'http://localhost:3000/api/reports', // Default to localhost for development
        apiTimeout: 30000,
        
        // UI Preferences
        theme: 'auto', // 'light', 'dark', 'auto'
        position: 'bottom-right', // 'bottom-right', 'bottom-left', 'top-right', 'top-left'
        fabSize: 'medium', // 'small', 'medium', 'large'
        
        // Capture Settings
        screenshotQuality: 60, // 1-100
        screenshotFormat: 'jpeg', // 'jpeg', 'png', 'webp'
        videoQuality: 250000, // bits per second
        videoFrameRate: 15,
        maxVideoWidth: 1920,
        maxVideoHeight: 1080,
        
        // Recording Settings
        autoStopRecording: false,
        maxRecordingDuration: 300, // seconds (5 minutes)
        captureAudio: false,
        
        // Annotation Settings
        defaultAnnotationColor: '#ef4444',
        defaultAnnotationTool: 'pen',
        annotationStrokeWidth: 4,
        
        // Privacy Settings
        blurSensitiveData: false,
        excludePasswords: true,
        excludeCookies: false,
        truncateLocalStorage: true,
        maxLogEntries: 50,
        
        // Behavior Settings
        autoCapture: true,
        captureConsoleErrors: true,
        captureNetworkErrors: true,
        trackUserActions: true,
        
        // Notification Settings
        showSuccessNotification: true,
        showErrorNotification: true,
        notificationDuration: 3000,
        
        // Advanced Settings
        enableDebugMode: false,
        customCSS: '',
        customLabels: {},
        
        // Keyboard Shortcuts
        shortcuts: {
            captureScreenshot: 'Alt+Shift+S',
            startRecording: 'Alt+Shift+R',
            toggleWidget: 'Alt+Shift+B'
        }
    },

    /**
     * Initialize configuration with defaults
     */
    async init() {
        const stored = await this.getAll();
        if (!stored || Object.keys(stored).length === 0) {
            await this.setAll(this.defaults);
            return this.defaults;
        }
        // Merge with defaults to ensure all keys exist
        const merged = { ...this.defaults, ...stored };
        return merged;
    },

    /**
     * Get all configuration
     */
    async getAll() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['bugscribeConfig'], (result) => {
                resolve(result.bugscribeConfig || {});
            });
        });
    },

    /**
     * Set all configuration
     */
    async setAll(config) {
        return new Promise((resolve) => {
            chrome.storage.local.set({ bugscribeConfig: config }, () => {
                resolve(config);
            });
        });
    },

    /**
     * Get a specific configuration value
     */
    async get(key) {
        const config = await this.getAll();
        return config[key] !== undefined ? config[key] : this.defaults[key];
    },

    /**
     * Set a specific configuration value
     */
    async set(key, value) {
        const config = await this.getAll();
        config[key] = value;
        await this.setAll(config);
        return value;
    },

    /**
     * Reset to defaults
     */
    async reset() {
        await this.setAll(this.defaults);
        return this.defaults;
    },

    /**
     * Export configuration as JSON
     */
    async export() {
        const config = await this.getAll();
        const exportData = {
            version: '2.0',
            timestamp: Date.now(),
            config: config
        };
        return JSON.stringify(exportData, null, 2);
    },

    /**
     * Import configuration from JSON
     */
    async import(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (data.config) {
                await this.setAll(data.config);
                return { success: true, config: data.config };
            }
            throw new Error('Invalid configuration format');
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Validate configuration
     */
    validate(config) {
        const errors = [];
        
        // Validate API endpoint
        if (config.apiEndpoint && !config.apiEndpoint.startsWith('http')) {
            errors.push('API endpoint must be a valid URL');
        }
        
        // Validate quality settings
        if (config.screenshotQuality < 1 || config.screenshotQuality > 100) {
            errors.push('Screenshot quality must be between 1 and 100');
        }
        
        // Validate video settings
        if (config.videoFrameRate < 1 || config.videoFrameRate > 60) {
            errors.push('Video frame rate must be between 1 and 60');
        }
        
        // Validate recording duration
        if (config.maxRecordingDuration < 10 || config.maxRecordingDuration > 600) {
            errors.push('Max recording duration must be between 10 and 600 seconds');
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    },

    /**
     * Get theme based on system preference if set to auto
     */
    async getEffectiveTheme() {
        const theme = await this.get('theme');
        if (theme === 'auto') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return theme;
    },

    /**
     * Get FAB position coordinates
     */
    async getFabPosition() {
        const position = await this.get('position');
        const size = await this.get('fabSize');
        
        const sizeMap = {
            small: { width: 48, height: 48 },
            medium: { width: 56, height: 56 },
            large: { width: 64, height: 64 }
        };
        
        const dimensions = sizeMap[size] || sizeMap.medium;
        
        const positions = {
            'bottom-right': { bottom: '24px', right: '24px' },
            'bottom-left': { bottom: '24px', left: '24px' },
            'top-right': { top: '24px', right: '24px' },
            'top-left': { top: '24px', left: '24px' }
        };
        
        return {
            ...positions[position],
            ...dimensions
        };
    },

    /**
     * Listen for configuration changes
     */
    onChange(callback) {
        chrome.storage.onChanged.addListener((changes, namespace) => {
            if (namespace === 'local' && changes.bugscribeConfig) {
                callback(changes.bugscribeConfig.newValue, changes.bugscribeConfig.oldValue);
            }
        });
    }
};

// Make it available globally
if (typeof window !== 'undefined') {
    window.BugScribeConfig = BugScribeConfig;
}

// For use in service worker
if (typeof self !== 'undefined' && self.importScripts) {
    self.BugScribeConfig = BugScribeConfig;
}
