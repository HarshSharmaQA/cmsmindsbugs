# Hide/Show Columns Feature

## Overview
Added a collapsible feature to Kanban columns that allows users to hide/show the list of issues in each column while keeping the column header and count visible.

## Changes Made

### File Modified
- `app/dashboard/[projectId]/page.tsx`

### Implementation Details

#### 1. Added State Management
```typescript
const [isCollapsed, setIsCollapsed] = useState(false);
```
Each Kanban column now has its own collapse state.

#### 2. Updated Column Header
The column header now includes:
- **Clickable toggle button** - Click on the column name/icon to collapse/expand
- **Chevron indicator** - Shows the current state (down = expanded, left = collapsed)
- **Visual feedback** - Hover effect on the toggle button

```typescript
<button
    onClick={() => setIsCollapsed(!isCollapsed)}
    className="flex items-center gap-2.5 hover:opacity-70 transition-opacity"
    title={isCollapsed ? "Expand column" : "Collapse column"}
>
    <div className={`flex items-center gap-2.5 ${color}`}>
        {icon || <CircleDot className="w-5 h-5" />}
        <span className="text-sm font-bold text-slate-800">{label}</span>
    </div>
    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
</button>
```

#### 3. Conditional Rendering of Cards
The cards section is now conditionally rendered based on the collapse state:

```typescript
{!isCollapsed && (
    <div className="flex-1 flex flex-col gap-2.5 p-3 overflow-y-auto min-h-0 custom-scrollbar">
        {bugs.map((bug, index) => (
            // ... bug cards
        ))}
    </div>
)}
```

## Features

### User Experience
1. **Click to Toggle** - Click anywhere on the column name/icon area to collapse/expand
2. **Visual Indicator** - Chevron icon rotates to show current state
3. **Persistent Count** - Bug count badge remains visible when collapsed
4. **Smooth Animation** - Chevron rotates smoothly with CSS transitions
5. **Tooltip** - Hover over the toggle to see "Expand column" or "Collapse column"

### Benefits
- **Reduced Clutter** - Hide columns you're not currently working on
- **Better Focus** - Focus on specific columns by collapsing others
- **Space Saving** - More horizontal space for expanded columns
- **Quick Overview** - See all column names and counts at a glance

## Usage

### For Users
1. Navigate to any project dashboard
2. Click on any column header (name/icon area) to collapse it
3. Click again to expand it
4. The column count badge remains visible when collapsed

### For Developers
The collapse state is managed locally in each `KanbanColumn` component using React's `useState` hook. Each column maintains its own independent state.

## Technical Notes

- **State Management**: Local component state (not persisted)
- **Performance**: No impact on performance as it's just conditional rendering
- **Accessibility**: Includes title attribute for screen readers
- **Responsive**: Works on all screen sizes

## Future Enhancements (Optional)

1. **Persist State** - Save collapse state to localStorage
2. **Collapse All/Expand All** - Add buttons to collapse/expand all columns at once
3. **Keyboard Shortcuts** - Add keyboard shortcuts for quick toggling
4. **Animation** - Add slide animation when collapsing/expanding
5. **Default State** - Allow setting default collapsed state per column

## Testing

✅ No TypeScript errors
✅ No ESLint errors
✅ Maintains existing functionality
✅ Works with drag-and-drop
✅ Compatible with all column actions (move, delete, etc.)

## Screenshots

### Expanded State (Default)
- Shows all bug cards in the column
- Chevron points down

### Collapsed State
- Hides all bug cards
- Shows only column header with name, icon, and count
- Chevron points left
- Column takes minimal horizontal space

## Compatibility

- ✅ Works with custom statuses
- ✅ Works with default statuses
- ✅ Works with admin features (move, delete buckets)
- ✅ Works with drag-and-drop
- ✅ Works with all view modes
- ✅ Mobile responsive
