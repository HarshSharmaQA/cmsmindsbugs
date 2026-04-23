# Add Focus/Target Button to Bug Cards

## What to Add

Add a target/bullseye icon button to each bug card that allows users to quickly focus on or view the bug details.

## Code to Add

### 1. Import the Target Icon

At the top of your bug card component file, add:

```typescript
import { Target } from "lucide-react";
```

### 2. Add the Button to Bug Card

In your bug card component (wherever you render individual bugs), add this button in the top-right corner:

```tsx
{/* Bug Card Header with Actions */}
<div className="flex items-start justify-between gap-2 mb-2">
  <div className="flex items-center gap-2">
    <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-semibold">
      #{bug.issueNumber || bug._id.substring(0, 8)}
    </span>
  </div>
  
  <div className="flex items-center gap-1">
    {/* Focus/Target Button */}
    <button
      onClick={(e) => {
        e.stopPropagation();
        onBugClick(bug._id);
      }}
      className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 hover:border-cyan-300 transition-all shadow-sm opacity-0 group-hover:opacity-100"
      title="View details"
    >
      <Target className="w-4 h-4" />
    </button>
    
    {/* More Options Button (if you have one) */}
    <button
      onClick={(e) => {
        e.stopPropagation();
        // Handle more options
      }}
      className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all shadow-sm opacity-0 group-hover:opacity-100"
      title="More options"
    >
      <MoreVertical className="w-4 h-4" />
    </button>
  </div>
</div>
```

### 3. Add Group Hover to Card Container

Make sure your bug card container has the `group` class:

```tsx
<div 
  className="group p-4 bg-white border border-slate-200 rounded-xl hover:shadow-lg transition-all cursor-pointer"
  onClick={() => onBugClick(bug._id)}
>
  {/* Card content */}
</div>
```

### 4. Complete Bug Card Example

Here's a complete example of what a bug card should look like:

```tsx
<div 
  className="group p-4 bg-white border border-slate-200 rounded-xl hover:shadow-lg hover:border-cyan-300 transition-all cursor-pointer"
  onClick={() => setSelectedBugId(bug._id)}
>
  {/* Header with Issue Number and Actions */}
  <div className="flex items-start justify-between gap-2 mb-3">
    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold">
      #{bug.issueNumber || bug._id.substring(0, 8).toUpperCase()}
    </span>
    
    <div className="flex items-center gap-1">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setSelectedBugId(bug._id);
        }}
        className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 hover:border-cyan-300 transition-all shadow-sm opacity-0 group-hover:opacity-100"
        title="View details"
      >
        <Target className="w-4 h-4" />
      </button>
    </div>
  </div>

  {/* Title */}
  <h3 className="text-sm font-semibold text-slate-800 mb-2 line-clamp-2">
    {bug.title}
  </h3>

  {/* Priority Badge */}
  <div className="mb-3">
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
      {bug.priority === "low" && "🟢 Low"}
      {bug.priority === "medium" && "🔵 Medium"}
      {bug.priority === "high" && "🟠 High"}
      {bug.priority === "critical" && "🔴 Critical"}
    </span>
  </div>

  {/* Screenshot Preview (if available) */}
  {bug.screenshotUrl && (
    <div className="mb-3 rounded-lg overflow-hidden border border-slate-200">
      <img 
        src={bug.screenshotUrl} 
        alt="Bug screenshot" 
        className="w-full h-32 object-cover"
      />
    </div>
  )}

  {/* Footer with Reporter and Time */}
  <div className="flex items-center justify-between text-xs text-slate-500">
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
        {(bug.reporterName || 'U')[0].toUpperCase()}
      </div>
      <span>{formatDistanceToNow(new Date(bug.createdAt), { addSuffix: true })}</span>
    </div>
    
    {bug.url && (
      <div className="flex items-center gap-1 text-slate-400">
        <Globe className="w-3 h-3" />
        <span className="text-xs">extensions</span>
      </div>
    )}
  </div>
</div>
```

## Styling Notes

1. The button uses `opacity-0 group-hover:opacity-100` to show only on hover
2. The `e.stopPropagation()` prevents the card click event from firing
3. The button has hover states with cyan colors to match your theme
4. The shadow and border effects make it feel interactive

## Where to Find Your Bug Cards

Look for code that:
- Maps over bugs/issues array
- Renders individual bug items
- Is inside a kanban column or list view
- Has click handlers for viewing bug details

The pattern will look something like:
```tsx
{bugs.map((bug) => (
  <div key={bug._id} onClick={() => handleBugClick(bug._id)}>
    {/* This is where you add the button */}
  </div>
))}
```
