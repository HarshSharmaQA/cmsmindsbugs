# Developer Quick Reference - BugScribe UI/UX Improvements

## Quick Links
- [Dashboard Changes](#dashboard-changes)
- [Extension Changes](#extension-changes)
- [Configuration API](#configuration-api)
- [Design Tokens](#design-tokens)
- [Common Patterns](#common-patterns)

---

## Dashboard Changes

### Modified Files
```
app/dashboard/[projectId]/page.tsx
styles.css
```

### Key Components Updated

#### Modal Drawer
```tsx
// Width increased
max-w-[680px]  // was max-w-[580px]

// Background enhanced
bg-gradient-to-br from-white via-slate-50/50 to-white

// Border enhanced
border-l border-slate-200/80
```

#### Form Inputs
```tsx
// Enhanced styling
className="w-full bg-white border-2 border-slate-200 rounded-xl 
           px-4 py-3 text-sm font-bold text-slate-800 
           focus:border-brand-400 focus:ring-4 focus:ring-brand-400/10"
```

#### Labels
```tsx
<label className="text-[10px] text-slate-600 uppercase tracking-[0.15em] 
                  font-black block flex items-center gap-2">
    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
    Label Text
</label>
```

#### Buttons
```tsx
// Primary action
className="p-3 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 
           text-white hover:from-brand-600 hover:to-brand-700 
           shadow-lg shadow-brand-500/30 active:scale-95"

// Secondary action
className="p-2.5 rounded-xl bg-white border border-slate-200 
           text-slate-500 hover:text-brand-500 hover:border-brand-400 
           hover:bg-brand-50 shadow-sm hover:shadow-md active:scale-95"
```

---

## Extension Changes

### New Files
```
extension/config.js                 - Configuration manager
extension/popup-enhanced.html       - Modern popup UI
extension/settings.html             - Settings page
extension/settings.js               - Settings logic
extension/settings-styles.css       - Settings styling
```

### Modified Files
```
extension/manifest.json             - Updated to v2.1
```

---

## Configuration API

### Initialize
```javascript
// Initialize with defaults
const config = await BugScribeConfig.init();
```

### Get Values
```javascript
// Get single value
const quality = await BugScribeConfig.get('screenshotQuality');

// Get all values
const allConfig = await BugScribeConfig.getAll();

// Get effective theme (respects system preference)
const theme = await BugScribeConfig.getEffectiveTheme();

// Get FAB position with size
const position = await BugScribeConfig.getFabPosition();
```

### Set Values
```javascript
// Set single value
await BugScribeConfig.set('theme', 'dark');

// Set multiple values
await BugScribeConfig.setAll({
    theme: 'dark',
    screenshotQuality: 80,
    position: 'bottom-left'
});
```

### Import/Export
```javascript
// Export configuration
const jsonString = await BugScribeConfig.export();

// Import configuration
const result = await BugScribeConfig.import(jsonString);
if (result.success) {
    console.log('Config imported:', result.config);
} else {
    console.error('Import failed:', result.error);
}
```

### Validation
```javascript
const validation = BugScribeConfig.validate(config);
if (!validation.valid) {
    console.error('Validation errors:', validation.errors);
}
```

### Listen for Changes
```javascript
BugScribeConfig.onChange((newValue, oldValue) => {
    console.log('Config changed:', newValue);
});
```

### Reset
```javascript
// Reset to defaults
const defaults = await BugScribeConfig.reset();
```

---

## Design Tokens

### Colors
```css
/* Primary */
--brand-400: #818cf8;
--brand-500: #6366f1;
--brand-600: #4f46e5;

/* Success */
--success-400: #4ade80;
--success-500: #22c55e;
--success-600: #16a34a;

/* Error */
--error-400: #f87171;
--error-500: #ef4444;
--error-600: #dc2626;

/* Warning */
--warning-400: #fbbf24;
--warning-500: #f59e0b;
--warning-600: #d97706;

/* Neutral */
--slate-50: #f8fafc;
--slate-100: #f1f5f9;
--slate-200: #e2e8f0;
--slate-300: #cbd5e1;
--slate-400: #94a3b8;
--slate-500: #64748b;
--slate-600: #475569;
--slate-700: #334155;
--slate-800: #1e293b;
--slate-900: #0f172a;
```

### Spacing
```css
/* Scale */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
```

### Typography
```css
/* Font Family */
font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 
             "Segoe UI", Roboto, sans-serif;

/* Font Sizes */
--text-xs: 10px;
--text-sm: 12px;
--text-base: 14px;
--text-lg: 16px;
--text-xl: 18px;
--text-2xl: 20px;
--text-3xl: 24px;
--text-4xl: 28px;

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-black: 800;

/* Letter Spacing */
--tracking-tight: -0.02em;
--tracking-normal: 0;
--tracking-wide: 0.1em;
--tracking-wider: 0.15em;
--tracking-widest: 0.25em;
```

### Border Radius
```css
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-xl: 20px;
--radius-2xl: 24px;
--radius-full: 9999px;
```

### Shadows
```css
--shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.1);
--shadow-md: 0 4px 16px rgba(0, 0, 0, 0.2);
--shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.3);
--shadow-xl: 0 12px 48px rgba(0, 0, 0, 0.4);
--shadow-brand: 0 8px 16px rgba(99, 102, 241, 0.3);
```

---

## Common Patterns

### Gradient Background
```css
background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
```

### Gradient Text
```css
background: linear-gradient(135deg, #fff, #cbd5e1);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
```

### Card Container
```css
background: rgba(30, 41, 59, 0.6);
border: 2px solid rgba(255, 255, 255, 0.08);
border-radius: 16px;
padding: 24px;
backdrop-filter: blur(10px);
```

### Enhanced Input
```css
width: 100%;
padding: 12px 14px;
background: rgba(15, 23, 42, 0.6);
border: 2px solid rgba(255, 255, 255, 0.08);
border-radius: 12px;
color: white;
font-size: 14px;
font-weight: 500;
transition: all 0.2s;

&:focus {
    outline: none;
    border-color: #6366f1;
    background: rgba(15, 23, 42, 0.8);
    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}
```

### Primary Button
```css
padding: 14px 28px;
background: linear-gradient(135deg, #6366f1, #8b5cf6);
color: white;
border: none;
border-radius: 12px;
font-weight: 700;
font-size: 15px;
cursor: pointer;
transition: all 0.2s;
box-shadow: 0 8px 16px rgba(99, 102, 241, 0.3);

&:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 24px rgba(99, 102, 241, 0.4);
}

&:active {
    transform: translateY(0);
}
```

### Secondary Button
```css
padding: 12px 20px;
background: rgba(255, 255, 255, 0.05);
color: #cbd5e1;
border: 2px solid rgba(255, 255, 255, 0.1);
border-radius: 10px;
font-weight: 600;
font-size: 13px;
cursor: pointer;
transition: all 0.2s;

&:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
}
```

### Label with Dot
```tsx
<label className="text-[10px] text-slate-600 uppercase tracking-[0.15em] 
                  font-black block flex items-center gap-2">
    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
    Label Text
</label>
```

### Section Header
```tsx
<div className="flex items-center gap-2.5 mb-4">
    <div className="w-1.5 h-1.5 rounded-full bg-brand-500 
                    shadow-[0_0_10px_rgba(99,102,241,0.8)] animate-pulse" />
    <span className="text-[10px] font-black text-slate-700 
                     uppercase tracking-[0.15em]">
        Section Title
    </span>
</div>
```

### Custom Scrollbar
```css
.custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: rgba(148, 163, 184, 0.3) transparent;
}

.custom-scrollbar::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(148, 163, 184, 0.3);
    border-radius: 10px;
    transition: background 0.2s;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(148, 163, 184, 0.5);
}
```

---

## Accessibility Patterns

### ARIA Labels
```tsx
// Button
<button aria-label="Close dialog" onClick={onClose}>
    <X className="w-4 h-4" />
</button>

// Input
<input 
    type="text" 
    aria-label="Enter bug title"
    placeholder="What went wrong?"
/>

// Select
<select aria-label="Select priority">
    <option value="low">Low</option>
</select>
```

### Collapsible Section
```tsx
<button
    onClick={() => setExpanded(!expanded)}
    aria-expanded={expanded}
    aria-label="Toggle section"
>
    <ChevronDown className={expanded ? 'rotate-180' : ''} />
    Section Title
</button>
```

### Tab Navigation
```tsx
<button
    onClick={() => setActiveTab('details')}
    aria-current={activeTab === 'details' ? 'page' : undefined}
    aria-label="View details tab"
>
    Details
</button>
```

---

## Animation Patterns

### Fade In
```css
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-in {
    animation: fadeIn 0.3s ease;
}
```

### Slide In
```css
@keyframes slideInFromRight {
    from {
        transform: translateX(2rem);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

.slide-in-from-right {
    animation: slideInFromRight 0.5s ease;
}
```

### Pulse
```css
@keyframes pulse {
    0%, 100% {
        opacity: 1;
        transform: scale(1);
    }
    50% {
        opacity: 0.5;
        transform: scale(0.95);
    }
}

.animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

---

## Testing Utilities

### Check Configuration
```javascript
// In browser console
chrome.storage.local.get(['bugscribeConfig'], (result) => {
    console.log('Current config:', result.bugscribeConfig);
});
```

### Test Validation
```javascript
const testConfig = {
    screenshotQuality: 150, // Invalid
    videoFrameRate: 100,    // Invalid
};

const validation = BugScribeConfig.validate(testConfig);
console.log('Validation:', validation);
```

### Debug Mode
```javascript
// Enable debug mode
await BugScribeConfig.set('enableDebugMode', true);

// Check if enabled
const debugMode = await BugScribeConfig.get('enableDebugMode');
console.log('Debug mode:', debugMode);
```

---

## Build & Deploy

### Dashboard
```bash
# No changes needed to build process
npm run build
npm run dev
```

### Extension
```bash
# Load unpacked extension
1. Open chrome://extensions/
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select extension folder

# Test changes
1. Make changes to files
2. Click reload icon in chrome://extensions/
3. Test functionality
```

---

## Troubleshooting

### Dashboard Issues
```javascript
// Check for console errors
// Verify all imports are correct
// Test responsive behavior
// Validate accessibility
```

### Extension Issues
```javascript
// Check manifest.json is valid
// Verify all files are included
// Test configuration save/load
// Check chrome.storage permissions
```

### Common Fixes
```javascript
// Clear extension storage
chrome.storage.local.clear();

// Reset configuration
await BugScribeConfig.reset();

// Check for conflicts
// Verify file paths
// Test in incognito mode
```

---

## Performance Tips

1. Use CSS transforms for animations (GPU-accelerated)
2. Debounce configuration saves
3. Lazy load heavy components
4. Optimize images and assets
5. Use efficient selectors
6. Minimize re-renders
7. Cache configuration values
8. Use requestAnimationFrame for animations

---

## Best Practices

1. Always validate configuration before saving
2. Provide clear error messages
3. Use consistent spacing and colors
4. Follow accessibility guidelines
5. Test on multiple browsers
6. Document configuration changes
7. Version configuration exports
8. Handle edge cases gracefully

---

**Quick Reference Version**: 2.1  
**Last Updated**: 2024  
**Maintainer**: BugScribe Team
