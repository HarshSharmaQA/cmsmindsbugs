'use client';

import { useEffect, useRef } from 'react';
import {
  initOneSignal,
  setOneSignalExternalUserId,
  removeOneSignalExternalUserId,
  setOneSignalTags,
  getNotificationPermission,
  promptForNotificationPermission,
} from '@/lib/onesignal';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAppContext } from '@/contexts/AppContext';

/**
 * OneSignal Provider Component
 *
 * - Initialises the OneSignal SDK once on mount.
 * - Syncs the logged-in user's identity and tags with OneSignal.
 * - Cleans up (logout) when the user signs out.
 * - Prompts for notification permission after the user logs in,
 *   but only if they haven't been asked before.
 */
export function OneSignalProvider({ children }: { children: React.ReactNode }) {
  const { devToken } = useAppContext();
  const currentUser = useQuery(api.users.currentUser, { devToken: devToken ?? undefined });
  const prevUserIdRef = useRef<string | null>(null);

  // Initialise OneSignal once
  useEffect(() => {
    initOneSignal();
  }, []);

  // Sync user identity and tags
  useEffect(() => {
    if (currentUser === undefined) return; // still loading

    if (currentUser) {
      const userId = currentUser._id;

      // Only re-login if the user changed (avoids redundant calls)
      if (prevUserIdRef.current !== userId) {
        prevUserIdRef.current = userId;
        setOneSignalExternalUserId(userId);

        setOneSignalTags({
          role: currentUser.role || 'user',
          email: currentUser.email || '',
          isApproved: currentUser.isApproved ? 'true' : 'false',
        });

        // Prompt for permission if the browser hasn't been asked yet.
        // We wait a moment so the prompt doesn't fire immediately on page load.
        if (getNotificationPermission() === 'default') {
          const timer = setTimeout(() => {
            promptForNotificationPermission();
          }, 5000);
          return () => clearTimeout(timer);
        }
      }
    } else {
      // User logged out — unlink from OneSignal
      if (prevUserIdRef.current !== null) {
        prevUserIdRef.current = null;
        removeOneSignalExternalUserId();
      }
    }
  }, [currentUser]);

  return <>{children}</>;
}
