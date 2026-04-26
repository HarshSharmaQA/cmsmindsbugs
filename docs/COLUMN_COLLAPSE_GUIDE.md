# Column Collapse Feature - User Guide

## Quick Start

### How to Collapse a Column
1. Click on the column header (the area with the column name and icon)
2. The column will collapse, showing only the header and count
3. The chevron icon will rotate to point left

### How to Expand a Column
1. Click on the collapsed column header
2. The column will expand, showing all issues
3. The chevron icon will rotate to point down

## Visual Guide

### Column Header Components

```
┌─────────────────────────────────────────────────────────┐
│  [Icon] Column Name ▼  [24]  [←] [→] [🗑️]              │
│   ↑         ↑        ↑    ↑     ↑   ↑    ↑              │
│   │         │        │    │     │   │    │              │
│   │         │        │    │     │   │    └─ Delete      │
│   │         │        │    │     │   └────── Move Right  │
│   │         │        │    │     └────────── Move Left   │
│   │         │        │    └──────────────── Count Badge │
│   │         │        └───────────────────── Chevron     │
│   │         └────────────────────────────── Name        │
│   └──────────────────────────────────────── Icon        │
│                                                          │
│  Click this entire area to toggle collapse ─────────────┘
```

### Expanded State

```
┌─────────────────────────────────────────┐
│  🔵 New Issues ▼  [24]                  │
├─────────────────────────────────────────┤
│  ┌───────────────────────────────────┐  │
│  │ #1 Bug title here                 │  │
│  │ Description...                    │  │
│  │ [Priority Badge]                  │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │ #2 Another bug                    │  │
│  │ Description...                    │  │
│  │ [Priority Badge]                  │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │ #3 Third bug                      │  │
│  │ Description...                    │  │
│  │ [Priority Badge]                  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Collapsed State

```
┌─────────────────────────────────────────┐
│  🔵 New Issues ◄  [24]                  │
└─────────────────────────────────────────┘
     ↑            ↑    ↑
     │            │    └─ Count still visible
     │            └────── Chevron points left
     └─────────────────── Column name visible
```

## Use Cases

### 1. Focus Mode
Collapse columns you're not working on to focus on specific statuses:
- Collapse "Closed" and "Resolved" to focus on active work
- Collapse "New Issues" when working on in-progress items

### 2. Space Management
When you have many columns:
- Collapse less important columns to see more of the active ones
- Useful when you have 5+ custom status columns

### 3. Quick Overview
Collapse all columns to see:
- All column names at a glance
- Issue counts per column
- Overall project structure

### 4. Presentation Mode
When sharing your screen:
- Collapse columns with sensitive information
- Show only relevant columns to stakeholders

## Tips & Tricks

### Keyboard Navigation
- Tab through columns
- Enter/Space to toggle (when focused)

### Best Practices
1. **Keep Active Columns Expanded** - Expand columns you're actively working with
2. **Collapse Completed Work** - Collapse "Closed" or "Done" columns to reduce clutter
3. **Use Count Badges** - Quickly check issue counts without expanding
4. **Combine with Filters** - Use filters + collapse for powerful organization

### Common Workflows

#### Daily Standup
1. Collapse "New Issues" and "Closed"
2. Focus on "In Progress" and "Ready for Review"
3. Quickly see what's being worked on

#### Sprint Planning
1. Expand "New Issues" to see backlog
2. Collapse "In Progress" and "Done"
3. Focus on planning new work

#### Bug Triage
1. Expand "New Issues"
2. Collapse everything else
3. Focus on triaging new reports

## Troubleshooting

### Column Won't Collapse
- Make sure you're clicking on the header area (name/icon)
- Check that you're not clicking on action buttons (move/delete)

### Cards Not Showing After Expand
- Try refreshing the page
- Check browser console for errors

### Chevron Not Rotating
- This is a visual indicator only
- The collapse/expand should still work

## Technical Details

### State Persistence
- **Current**: State is NOT persisted (resets on page reload)
- **Future**: May add localStorage persistence

### Performance
- No performance impact
- Instant toggle response
- No API calls required

### Browser Support
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers

## Feedback

If you encounter any issues or have suggestions for improvements, please:
1. Check the browser console for errors
2. Try refreshing the page
3. Report the issue with steps to reproduce
