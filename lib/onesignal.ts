/**
 * OneSignal Configuration and Utilities
 * Handles push notification setup for BugScribe
 */

export const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || '';

export interface OneSignalConfig {
  appId: string;
  allowLocalhostAsSecureOrigin?: boolean;
  notifyButton?: {
    enable: boolean;
  };
  welcomeNotification?: {
    title?: string;
    message?: string;
    disable?: boolean;
  };
  promptOptions?: {
    slidedown?: {
      prompts?: Array<{
        type: string;
        autoPrompt: boolean;
        text: {
          actionMessage: string;
          acceptButton: string;
          cancelButton: string;
        };
      }>;
    };
  };
}

export const oneSignalConfig: OneSignalConfig = {
  appId: ONESIGNAL_APP_ID,
  allowLocalhostAsSecureOrigin: process.env.NODE_ENV === 'development',
  // Hide the floating bell — we use our own NotificationBell component
  notifyButton: {
    enable: false,
  },
  welcomeNotification: {
    title: 'Welcome to BugScribe!',
    message: 'You will now receive notifications for bug updates and project activities.',
  },
  promptOptions: {
    slidedown: {
      prompts: [
        {
          type: 'push',
          autoPrompt: false, // We trigger the prompt manually after user interaction
          text: {
            actionMessage: 'Get notified when new bugs are reported or statuses change.',
            acceptButton: 'Allow',
            cancelButton: 'Maybe later',
          },
        },
      ],
    },
  },
};

// ─── Initialisation ───────────────────────────────────────────────────────────

let _initialized = false;

/**
 * Initialize OneSignal. Safe to call multiple times — only runs once.
 */
export const initOneSignal = () => {
  if (typeof window === 'undefined' || !ONESIGNAL_APP_ID) {
    if (!ONESIGNAL_APP_ID) {
      console.warn('OneSignal: NEXT_PUBLIC_ONESIGNAL_APP_ID is not set');
    }
    return;
  }

  if (_initialized) return;
  _initialized = true;

  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal) => {
    await OneSignal.init(oneSignalConfig);
  });
};

// ─── User Identity ────────────────────────────────────────────────────────────

/**
 * Link the OneSignal player to your user system.
 * Call this after the user logs in.
 */
export const setOneSignalExternalUserId = (userId: string) => {
  if (typeof window === 'undefined') return;
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal) => {
    try {
      await OneSignal.login(userId);
    } catch (err) {
      console.warn('OneSignal login error:', err);
    }
  });
};

/**
 * Unlink the OneSignal player from your user system.
 * Call this when the user logs out.
 */
export const removeOneSignalExternalUserId = () => {
  if (typeof window === 'undefined') return;
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal) => {
    try {
      await OneSignal.logout();
    } catch (err) {
      console.warn('OneSignal logout error:', err);
    }
  });
};

// ─── Tags / Segmentation ──────────────────────────────────────────────────────

/**
 * Add tags to the current user for audience segmentation.
 */
export const setOneSignalTags = (tags: Record<string, string>) => {
  if (typeof window === 'undefined') return;
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal) => {
    try {
      await OneSignal.User.addTags(tags);
    } catch (err) {
      console.warn('OneSignal addTags error:', err);
    }
  });
};

// ─── Permission & Subscription ────────────────────────────────────────────────

/**
 * Returns the current browser notification permission state.
 * "default" = not yet asked, "granted" = allowed, "denied" = blocked.
 */
export const getNotificationPermission = (): NotificationPermission => {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'default';
  return Notification.permission;
};

/**
 * Returns true if the user is currently subscribed to push notifications.
 */
export const isSubscribedToNotifications = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.OneSignalDeferred) {
      resolve(false);
      return;
    }
    window.OneSignalDeferred.push(async (OneSignal) => {
      try {
        const isSubscribed = await OneSignal.User.PushSubscription.optedIn;
        resolve(!!isSubscribed);
      } catch {
        resolve(false);
      }
    });
  });
};

/**
 * Show the OneSignal permission prompt to the user.
 * Only works if permission is "default" (not yet asked).
 */
export const promptForNotificationPermission = () => {
  if (typeof window === 'undefined') return;
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal) => {
    try {
      await OneSignal.Slidedown.promptPush();
    } catch (err) {
      console.warn('OneSignal prompt error:', err);
    }
  });
};

/**
 * Opt the current device out of push notifications without revoking browser permission.
 */
export const optOutOfNotifications = () => {
  if (typeof window === 'undefined') return;
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal) => {
    try {
      await OneSignal.User.PushSubscription.optOut();
    } catch (err) {
      console.warn('OneSignal optOut error:', err);
    }
  });
};

/**
 * Opt the current device back in to push notifications.
 */
export const optInToNotifications = () => {
  if (typeof window === 'undefined') return;
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal) => {
    try {
      await OneSignal.User.PushSubscription.optIn();
    } catch (err) {
      console.warn('OneSignal optIn error:', err);
    }
  });
};

// ─── Send (via backend) ───────────────────────────────────────────────────────

export interface SendNotificationParams {
  title: string;
  message: string;
  userIds?: string[];
  projectId?: string;
  bugId?: string;
  url?: string;
  buttons?: Array<{ id: string; text: string; url?: string }>;
}

/**
 * Send a push notification via the BugScribe backend API.
 * Returns the OneSignal notification ID on success.
 */
export const sendNotification = async (
  params: SendNotificationParams
): Promise<{ oneSignalId: string; recipients: number }> => {
  const response = await fetch('/api/notifications/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error || 'Failed to send notification');
  }

  return response.json();
};

// ─── TypeScript declarations ──────────────────────────────────────────────────

declare global {
  interface Window {
    OneSignalDeferred?: Array<(oneSignal: any) => void>;
    OneSignal?: any;
  }
}
