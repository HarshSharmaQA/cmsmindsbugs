# Notification Integration Examples

This document shows how to integrate OneSignal notifications into your existing BugScribe workflows.

## 1. Notify on New Bug Creation

When a bug is created via the widget or dashboard, send a notification:

```typescript
import { useNotifications } from '@/hooks/useNotifications';

function BugCreationComponent() {
  const { sendNewBugNotification } = useNotifications();
  const createBug = useMutation(api.bugs.create);

  const handleCreateBug = async (bugData) => {
    // Create the bug
    const bugId = await createBug(bugData);

    // Send notification
    await sendNewBugNotification({
      bugId,
      projectId: bugData.projectId,
      title: bugData.title,
      priority: bugData.priority,
      projectName: project.name,
    });
  };

  return (
    // Your component JSX
  );
}
```

## 2. Notify on Status Change (Kanban Board)

When a bug is moved between columns:

```typescript
import { useNotifications } from '@/hooks/useNotifications';

function KanbanBoard() {
  const { sendStatusChangeNotification } = useNotifications();
  const updateBugStatus = useMutation(api.bugs.updateStatus);

  const handleDragEnd = async (result) => {
    const { draggableId, source, destination } = result;
    
    if (!destination) return;

    const oldStatus = source.droppableId;
    const newStatus = destination.droppableId;

    // Update bug status
    await updateBugStatus({
      bugId: draggableId,
      status: newStatus,
    });

    // Send notification
    await sendStatusChangeNotification({
      bugId: draggableId,
      oldStatus,
      newStatus,
      projectId: currentProject._id,
      projectName: currentProject.name,
      bugTitle: bug.title,
    });
  };

  return (
    // Your Kanban board JSX
  );
}
```

## 3. Add Notification Bell to Navbar

Update your Navbar component to show notifications:

```typescript
import { NotificationBell } from '@/components/NotificationBell';

export function Navbar() {
  return (
    <nav className="...">
      <div className="flex items-center gap-4">
        {/* Other navbar items */}
        <NotificationBell />
        {/* User menu, etc. */}
      </div>
    </nav>
  );
}
```

## 4. Custom Notification Types

You can extend the notification system for other events:

### Comment Added
```typescript
export const notifyCommentAdded = mutation({
  args: {
    bugId: v.id("bugs"),
    commentAuthor: v.string(),
    commentText: v.string(),
  },
  handler: async (ctx, args) => {
    const bug = await ctx.db.get(args.bugId);
    // ... notification logic
  },
});
```

### Bug Assigned
```typescript
export const notifyBugAssigned = mutation({
  args: {
    bugId: v.id("bugs"),
    assigneeId: v.string(),
    assignedBy: v.string(),
  },
  handler: async (ctx, args) => {
    // Send notification to specific assignee
  },
});
```

## 5. Notification Preferences

Allow users to customize notification settings:

```typescript
// Add to convex/schema.ts
notificationPreferences: defineTable({
  userId: v.string(),
  newBugs: v.boolean(),
  statusChanges: v.boolean(),
  comments: v.boolean(),
  assignments: v.boolean(),
  emailNotifications: v.boolean(),
})
  .index("by_user", ["userId"]),
```

## 6. Testing Notifications

### Test in Development
```typescript
// Add a test button in your dashboard
<button onClick={async () => {
  await sendNotification({
    title: 'Test Notification',
    message: 'This is a test from BugScribe',
    url: '/dashboard',
  });
}}>
  Send Test Notification
</button>
```

### Test via API
```bash
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Bug Report",
    "message": "A new critical bug was reported",
    "projectId": "project_id_here",
    "url": "/dashboard/project_id_here"
  }'
```

## 7. Notification Batching

For high-volume projects, batch notifications:

```typescript
// Send digest every hour instead of real-time
export const sendHourlyDigest = mutation({
  handler: async (ctx) => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    
    const recentBugs = await ctx.db
      .query("bugs")
      .filter((q) => q.gte(q.field("createdAt"), oneHourAgo))
      .collect();

    if (recentBugs.length > 0) {
      await sendNotification({
        title: `${recentBugs.length} New Bugs`,
        message: `You have ${recentBugs.length} new bugs to review`,
        url: '/dashboard',
      });
    }
  },
});
```

## 8. Rich Notifications

Add action buttons to notifications:

```typescript
await sendNotification({
  title: 'New Critical Bug',
  message: bug.title,
  url: `/dashboard/${projectId}`,
  buttons: [
    {
      id: 'view',
      text: 'View Bug',
      url: `/dashboard/${projectId}?bug=${bugId}`,
    },
    {
      id: 'assign',
      text: 'Assign to Me',
      url: `/dashboard/${projectId}?assign=${bugId}`,
    },
  ],
});
```

## 9. Analytics & Tracking

Track notification engagement:

```typescript
export const trackNotificationClick = mutation({
  args: {
    notificationId: v.id("notifications"),
    action: v.string(), // "clicked" | "dismissed"
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, {
      clickedAt: Date.now(),
      action: args.action,
    });
  },
});
```

## 10. Unsubscribe/Opt-out

Allow users to manage their subscription:

```typescript
import { removeOneSignalExternalUserId } from '@/lib/onesignal';

function NotificationSettings() {
  const handleUnsubscribe = () => {
    removeOneSignalExternalUserId();
    // Update user preferences in database
  };

  return (
    <button onClick={handleUnsubscribe}>
      Disable Push Notifications
    </button>
  );
}
```
