# OneSignal Integration for BugScribe

OneSignal push notifications have been successfully integrated into BugScribe! 🎉

## What's Been Added

### 1. Core Files
- **`lib/onesignal.ts`** - OneSignal configuration and utility functions
- **`components/OneSignalProvider.tsx`** - React provider for OneSignal initialization
- **`components/NotificationBell.tsx`** - UI component for notification center
- **`hooks/useNotifications.ts`** - Custom hook for notification management
- **`convex/notifications.ts`** - Backend notification logic
- **`app/api/notifications/send/route.ts`** - API endpoint for sending notifications

### 2. Database Schema
Added `notifications` table to `convex/schema.ts`:
- Stores notification history
- Tracks read/unread status
- Links to bugs and projects

### 3. Service Worker
- **`public/OneSignalSDKWorker.js`** - Required for push notifications

### 4. Documentation
- **`docs/ONESIGNAL_SETUP.md`** - Complete setup guide
- **`docs/NOTIFICATION_INTEGRATION.md`** - Integration examples
- **`.env.example`** - Updated with OneSignal variables

## Quick Start

### 1. Install Dependencies
No additional npm packages needed! OneSignal loads via CDN.

### 2. Get OneSignal Credentials
1. Create account at [OneSignal.com](https://onesignal.com)
2. Create a new Web Push app
3. Get your App ID and REST API Key

### 3. Configure Environment Variables
Add to `.env.local`:
```bash
NEXT_PUBLIC_ONESIGNAL_APP_ID=your_app_id_here
ONESIGNAL_REST_API_KEY=your_rest_api_key_here
```

### 4. Update Convex Schema
Run Convex to apply the schema changes:
```bash
npx convex dev
```

### 5. Test It Out
1. Start your dev server: `npm run dev`
2. Open the app in your browser
3. Grant notification permission when prompted
4. Create a test bug to trigger a notification

## Features

### Automatic Notifications
- ✅ New bug reports
- ✅ Bug status changes
- ✅ Real-time delivery
- 🔜 Comments (ready to implement)
- 🔜 Bug assignments (ready to implement)

### User Experience
- ✅ Notification bell with unread count
- ✅ Dropdown notification center
- ✅ Mark as read functionality
- ✅ Real-time updates via Convex
- ✅ User segmentation by role

### Developer Experience
- ✅ Simple hook-based API
- ✅ TypeScript support
- ✅ Automatic user sync
- ✅ Error handling
- ✅ Development mode support

## Usage Examples

### Send Notification on Bug Creation
```typescript
import { useNotifications } from '@/hooks/useNotifications';

const { sendNewBugNotification } = useNotifications();

await sendNewBugNotification({
  bugId: bug._id,
  projectId: project._id,
  title: bug.title,
  priority: bug.priority,
  projectName: project.name,
});
```

### Add Notification Bell to Navbar
```typescript
import { NotificationBell } from '@/components/NotificationBell';

<NotificationBell />
```

### Check Unread Count
```typescript
const { unreadCount } = useNotifications();
```

## Architecture

```
User Action (Bug Created)
    ↓
Convex Mutation (convex/notifications.ts)
    ↓
Store in Database + Get User IDs
    ↓
API Route (/api/notifications/send)
    ↓
OneSignal REST API
    ↓
Push to User Devices
```

## Next Steps

1. **Add to Navbar**: Import `NotificationBell` component
2. **Integrate with Bug Creation**: Use `sendNewBugNotification` hook
3. **Integrate with Kanban**: Use `sendStatusChangeNotification` hook
4. **Customize**: Update notification messages and icons
5. **Test**: Create bugs and move them between statuses

## Customization

### Change Notification Icon
Update in OneSignal dashboard under Settings → Platforms → Web Push

### Modify Welcome Message
Edit `lib/onesignal.ts`:
```typescript
welcomeNotification: {
  title: 'Your Custom Title',
  message: 'Your custom message',
}
```

### Add Custom Notification Types
Extend `convex/notifications.ts` with new mutation functions

## Troubleshooting

### Notifications Not Showing
1. Check browser notification permissions
2. Verify environment variables are set
3. Check browser console for errors
4. Ensure HTTPS in production

### User Not Subscribed
1. Clear browser cache
2. Re-grant notification permission
3. Check OneSignal dashboard for subscription

### API Errors
1. Verify REST API key is correct
2. Check OneSignal dashboard for API limits
3. Review server logs for detailed errors

## Resources

- [OneSignal Documentation](https://documentation.onesignal.com/)
- [Setup Guide](./docs/ONESIGNAL_SETUP.md)
- [Integration Examples](./docs/NOTIFICATION_INTEGRATION.md)

## Support

For issues or questions:
1. Check the documentation files
2. Review OneSignal dashboard logs
3. Check browser console for errors
4. Contact support@bugscribe.io

---

**Status**: ✅ Ready for Integration
**Version**: 1.0.0
**Last Updated**: 2026-04-24
