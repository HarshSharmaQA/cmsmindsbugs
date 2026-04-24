import { NextRequest, NextResponse } from 'next/server';

// NEXT_PUBLIC_ prefix is for client-side; server-side route uses the non-prefixed key.
// Support both names so the app works regardless of which env var is set.
const ONESIGNAL_APP_ID =
  process.env.ONESIGNAL_APP_ID || process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

interface ActionButton {
  id: string;
  text: string;
  url?: string;
}

interface NotificationPayload {
  title: string;
  message: string;
  /** OneSignal external user IDs (tokenIdentifiers) to target */
  userIds?: string[];
  projectId?: string;
  bugId?: string;
  /** Deep-link URL opened when the notification is clicked */
  url?: string;
  /** Optional action buttons shown on the notification */
  buttons?: ActionButton[];
  /** Optional small icon URL (96×96 recommended) */
  smallIcon?: string;
  /** Optional large icon URL (192×192 recommended) */
  largeIcon?: string;
}

export async function POST(request: NextRequest) {
  try {
    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      console.error('OneSignal env vars missing:', {
        hasAppId: !!ONESIGNAL_APP_ID,
        hasApiKey: !!ONESIGNAL_REST_API_KEY,
      });
      return NextResponse.json(
        { error: 'OneSignal not configured — set ONESIGNAL_APP_ID and ONESIGNAL_REST_API_KEY' },
        { status: 500 }
      );
    }

    const body: NotificationPayload = await request.json();
    const { title, message, userIds, projectId, bugId, url, buttons, smallIcon, largeIcon } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: 'title and message are required' },
        { status: 400 }
      );
    }

    // Build OneSignal v1 notification payload
    const notificationPayload: Record<string, unknown> = {
      app_id: ONESIGNAL_APP_ID,
      headings: { en: title },
      contents: { en: message },
      data: {
        projectId: projectId ?? null,
        bugId: bugId ?? null,
      },
    };

    // Target specific users or broadcast to all subscribers
    if (userIds && userIds.length > 0) {
      notificationPayload.include_external_user_ids = userIds;
      // Required when using external user IDs
      notificationPayload.channel_for_external_user_ids = 'push';
    } else {
      notificationPayload.included_segments = ['All'];
    }

    // Deep-link URL
    if (url) {
      notificationPayload.url = url;
    }

    // Action buttons (web push supports up to 2)
    if (buttons && buttons.length > 0) {
      notificationPayload.web_buttons = buttons.slice(0, 2).map((b) => ({
        id: b.id,
        text: b.text,
        url: b.url,
      }));
    }

    // Icons
    if (smallIcon) notificationPayload.small_icon = smallIcon;
    if (largeIcon) notificationPayload.large_icon = largeIcon;

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(notificationPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OneSignal API error:', data);
      return NextResponse.json(
        { error: 'Failed to send notification', details: data },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      /** OneSignal notification UUID — store this for delivery tracking */
      oneSignalId: data.id as string,
      recipients: data.recipients as number,
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
