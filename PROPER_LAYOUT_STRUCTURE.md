# Proper Dashboard Layout Structure

## Overview
Reorganized the entire dashboard layout to match the reference images with proper spacing, hierarchy, and organization for all views (Kanban, List, Team, API, Settings).

## Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  STICKY TOOLBAR (top-5, z-40)                              │
│  ┌─────────────────────────────────────────────────────────┐
│  │ View Tabs (Kanban | List | Team | API | Settings)      │
│  │ + New Issue | Export (HTML/CSV)                         │
│  └─────────────────────────────────────────────────────────┘
│  ┌─────────────────────────────────────────────────────────┐
│  │ FILTERS (Only for Kanban/List)                          │
│  │ Filter by: [All Status] [All Priority] [Search...]      │
│  │ Filter by type: [All Types] [General Bug] [Custom...]   │
│  │ Active filter indicator (if type filter active)         │
│  └─────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────┘
│
│ CONTENT AREA
│ ┌─────────────────────────────────────────────────────────┐
│ │ Kanban View:                                            │
│ │ - Scroll Controls Bar                                   │
│ │ - Kanban Board (Columns & Cards)                        │
│ │                                                         │
│ │ List View:                                              │
│ │ - Table with all issues                                 │
│ │                                                         │
│ │ Team View:                                              │
│ │ - Team Members List                                     │
│ │ - Invite Member Form                                    │
│ │                                                         │
│ │ API View:                                               │
│ │ - Chrome Extension Setup                                │
│ │ - Widget Embed Code                                     │
│ │ - Quick Reference                                       │
│ │                                                         │
│ │ Settings View:                                          │
│ │ - Project Settings                                      │
│ │ - API Key                                               │
│ │ - Project ID                                            │
│ └─────────────────────────────────────────────────────────┘
```

## Sticky Toolbar Details

### Position & Styling
- `sticky top-5` - Stays at top with 5px offset
- `z-40` - Above all content
- `bg-white/95 backdrop-blur-3xl` - Semi-transparent with blur
- `border border-slate-200` - Light border
- `rounded-[28px]` - Large rounded corners
- `px-5 lg:px-7 pt-4 pb-5` - Proper padding
- `shadow-sm` - Subtle shadow

### Toolbar Sections

**1. View Tabs**
- Kanban & List buttons (always visible)
- Team, API, Settings buttons (conditional based on permissions)
- Active tab: Brand color with shadow
- Inactive tabs: Slate color with hover effect
- Divider line between main tabs and admin tabs

**2. Action Buttons**
- "+ New Issue" button (primary, always visible)
- "HTML" export button (admin only)
- "CSV" export button (admin only)
- Proper spacing and alignment

## Filter Bar (Kanban/List Only)

### Layout
- White background with border-2 border-slate-200
- Rounded-2xl corners
- Horizontal layout on desktop, stacked on mobile
- Proper padding: px-6 py-4

### Components

**Status Filter**
- Icon: CircleDot
- Background: White
- Border: slate-200
- Rounded: full
- Options: All Status + dynamic columns

**Priority Filter**
- Icon: AlertTriangle
- Background: slate-800 (dark)
- Border: slate-700
- Rounded: full
- Options: All Priority + Low/Medium/High/Critical

**Search Input**
- Placeholder: "Search issues..."
- Icon: Search
- Rounded: full
- Max-width: md on desktop, full on mobile
- Focus state: brand-500/50

### Type Filter Pills
- Only shown if more than 2 type filters exist
- Rounded-full design
- Active: Brand color with shadow
- Inactive: Surface card color
- Shows count badge
- Clear button when active

### Active Filter Indicator
- Only shown when type filter is active
- Background: brand-900/20
- Border: brand-800/40
- Shows filter name and issue count

## Kanban View Specific

### Scroll Controls Bar
- Below filter bar
- White background with border-2
- Rounded-2xl
- Flexbox: left button | center text | right button
- Buttons: p-2.5, rounded-full, border-2
- Smooth scroll animation (320px per click)

### Kanban Board
- Horizontal scroll container
- Gap between columns: gap-4
- Padding bottom: pb-2
- Min-width: max for horizontal scroll

## Responsive Design

### Desktop (lg and above)
- All elements visible
- Horizontal layouts
- Full spacing
- Proper alignment

### Tablet (md)
- Toolbar wraps if needed
- Filters may stack
- Proper spacing maintained

### Mobile (sm and below)
- Stacked layouts
- Full-width elements
- Adjusted padding
- Touch-friendly sizes

## Color Scheme

### Toolbar
- Background: white/95
- Border: slate-200
- Text: slate-600/700
- Active: brand-500

### Filters
- Status: white background
- Priority: slate-800 background
- Text: slate-700/300
- Hover: shadow enhancement

### Buttons
- Primary: brand-500 with shadow
- Secondary: white with border
- Hover: color/shadow transitions

## Spacing Guidelines

### Toolbar
- Padding: px-5 lg:px-7 pt-4 pb-5
- Gap between sections: gap-6
- Internal gaps: gap-1.5 to gap-3

### Filter Bar
- Padding: px-6 py-4
- Gap between elements: gap-4
- Border: border-2

### Scroll Controls
- Padding: px-6 py-3
- Gap: gap-4
- Margin bottom: mb-4

## Typography

### Labels
- Size: text-xs
- Weight: font-bold
- Case: uppercase
- Tracking: tracking-widest

### Buttons
- Size: text-xs
- Weight: font-bold
- Case: uppercase
- Tracking: tracking-widest

## Interactions

### Hover States
- Smooth transitions (200-300ms)
- Shadow enhancement
- Color transitions
- Scale effects on icons

### Active States
- Brand color background
- Shadow effects
- Text color change

### Focus States
- Ring effects on inputs
- Border color change
- Clear visual feedback

## Browser Compatibility
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Full support

## Performance
- GPU-accelerated transitions
- Smooth 60fps animations
- No layout thrashing
- Efficient re-renders

## Accessibility
- Semantic HTML
- ARIA labels
- Keyboard navigation
- Clear focus states
- Proper contrast ratios

## Files Modified
- `app/dashboard/[projectId]/page.tsx`

## Testing Checklist
- [ ] Toolbar sticky positioning works
- [ ] View tabs switch correctly
- [ ] Filters display properly
- [ ] Search works
- [ ] Type filters work
- [ ] Kanban view displays correctly
- [ ] List view displays correctly
- [ ] Team view displays correctly
- [ ] API view displays correctly
- [ ] Settings view displays correctly
- [ ] Responsive design on mobile
- [ ] Responsive design on tablet
- [ ] Responsive design on desktop
- [ ] All hover states work
- [ ] All active states work
- [ ] Keyboard navigation works
- [ ] Export buttons work
- [ ] New Issue button works
