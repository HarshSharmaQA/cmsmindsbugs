# OneSignal Setup Guide for BugScribe

This guide will help you set up OneSignal push notifications for BugScribe.

## 1. Create OneSignal Account

1. Go to [OneSignal](https://onesignal.com/) and create a free account
2. Click "New App/Website" to create a new application
3. Name it "BugScribe" (or your preferred name)
4. Select "Web Push" as the platform

## 2. Configure Web Push

1. In the OneSignal dashboard, go to **Settings** → **Platforms**
2. Click on **Web Push** configuration
3. Enter your site details:
   - **Site Name**: BugScribe
   - **Site URL**: Your production URL (e.g., `https://bugscribe.io`)
   - **Default Icon URL**: URL to your notification icon (192x192px recommended)
   - **Auto Resubscribe**: Enable (recommended)

4. For local development:
   - Add `http://localhost:3000` to **Local Testing** section
   - Enable "My site is not fully HTTPS"

## 3. Get Your API Keys

1. Go to **Settings** → **Keys & IDs**
2. Copy the following:
   - **App ID** (starts with a UUID format)
   - **REST API Key** (long string)

## 4. Configure Environment Variables

Add these to your `.env.local` file:

```bash
# OneSignal Configuration
NEXT_PUBLIC_ONESIGNAL_APP_ID=your_app_id_here
ONESIGNAL_REST_API_KEY=your_rest_api_key_here
```

**Important**: 
- `NEXT_PUBLIC_ONESIGNAL_APP_ID` must have the `NEXT_PUBLIC_` prefix (client-side)
- `ONESIGNAL_REST_API_KEY` should NOT have the prefix (server-side only)

## 5. Verify Installation

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open your browser console and look for OneSignal initialization messages

3. You should see a browser prompt asking for notification permission

4. Grant permission and check the OneSignal dashboard under **Audience** → **All Users** to see your subscription

## 6. Test Notifications

### Method 1: Using the Dashboard
1. Go to OneSignal dashboard → **Messages** → **New Push**
2. Create a test message
3. Send to "All Subscribers" or specific users
4. Check if you receive the notification

### Method 2: Using the API
You can test the notification API endpoint:

```bash
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Notification",
    "message": "This is a test from BugScribe",
    "url": "/dashboard"
  }'
```

## 7. Production Deployment

### Vercel Deployment
1. Add environment variables in Vercel dashboard:
   - Go to your project → **Settings** → **Environment Variables**
   - Add `NEXT_PUBLIC_ONESIGNAL_APP_ID`
   - Add `ONESIGNAL_REST_API_KEY`

2. Redeploy your application

### OneSignal Configuration
1. Update your OneSignal app settings with production URL
2. Ensure HTTPS is properly configured
3. Update the **Allowed Origins** in OneSignal settings

## 8. Features Implemented

### Automatic Notifications
BugScribe automatically sends notifications for:
- **New Bug Reports**: When a bug is submitted
- **Status Changes**: When a bug status is updated
- **Comments**: When someone comments on a bug (future)
- **Assignments**: When a bug is assigned to a user (future)

### User Segmentation
Users are automatically tagged with:
- `role`: User role (user, super_admin)
- `email`: User email
- `isApproved`: Approval status

### Notification Management
- View all notifications in the notification bell icon
- Mark notifications as read
- Unread count badge
- Real-time updates via Convex

## 9. Customization

### Notification Icons
Place your notification icons in the `public` folder:
- `notification-icon.png` (192x192px)
- `notification-badge.png` (96x96px)

Update OneSignal settings to use these URLs.

### Welcome Notification
Edit `lib/onesignal.ts` to customize the welcome message:

```typescript
welcomeNotification: {
  title: 'Welcome to BugScribe!',
  message: 'Your custom welcome message here',
}
```

### Notification Sounds
In OneSignal dashboard:
1. Go to **Settings** → **Platforms** → **Web Push**
2. Upload custom notification sound
3. Configure sound settings

## 10. Troubleshooting

### Notifications Not Showing
1. Check browser notification permissions
2. Verify environment variables are set correctly
3. Check browser console for errors
4. Ensure OneSignal SDK loaded successfully

### Service Worker Issues
1. Clear browser cache and service workers
2. Check `public/OneSignalSDKWorker.js` exists
3. Verify HTTPS is enabled (required for production)

### User Not Subscribed
1. Check if user granted notification permission
2. Verify OneSignal initialization in browser console
3. Check OneSignal dashboard for subscription status

## 11. Best Practices

1. **Don't Spam**: Only send important notifications
2. **Personalize**: Use user names and relevant context
3. **Timing**: Consider user timezones for scheduled notifications
4. **Opt-out**: Provide easy way to disable notifications
5. **Test**: Always test on multiple browsers and devices

## 12. Advanced Features

### Scheduled Notifications
Use OneSignal's scheduled delivery feature for:
- Daily digest of new bugs
- Weekly project summaries
- Reminder notifications

### A/B Testing
Test different notification messages in OneSignal dashboard

### Analytics
Track notification performance:
- Delivery rate
- Click-through rate
- Conversion rate

## Support

- [OneSignal Documentation](https://documentation.onesignal.com/)
- [OneSignal Web Push Guide](https://documentation.onesignal.com/docs/web-push-quickstart)
- [BugScribe Support](mailto:support@bugscribe.io)
