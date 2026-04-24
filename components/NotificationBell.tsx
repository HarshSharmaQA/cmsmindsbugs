'use client';

import { Bell, Bug, GitPullRequest, MessageSquare, UserCheck, CheckCheck } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useState, useRef, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

/** Map notification type → icon */
function NotificationIcon({ type }: { type: string }) {
  const cls = 'w-4 h-4 shrink-0 mt-0.5';
  switch (type) {
    case 'new_bug':
      return <Bug className={`${cls} text-red-400`} />;
    case 'bug_status_change':
      return <GitPullRequest className={`${cls} text-blue-400`} />;
    case 'comment_added':
      return <MessageSquare className={`${cls} text-green-400`} />;
    case 'bug_assigned':
      return <UserCheck className={`${cls} text-purple-400`} />;
    default:
      return <Bell className={`${cls} text-gray-400`} />;
  }
}

/**
 * Notification Bell Component
 *
 * - Shows unread count badge
 * - Dropdown with notification list
 * - Mark individual or all notifications as read
 * - Navigates to the notification's action URL on click
 */
export function NotificationBell() {
  const { notifications, unreadCount, markNotificationAsRead, markAllAsRead } =
    useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // Don't render until data is loaded
  if (notifications === undefined) return null;

  const handleMarkAllRead = async () => {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);
    try {
      await markAllAsRead();
    } finally {
      setMarkingAll(false);
    }
  };

  const handleNotificationClick = async (notification: {
    _id: string;
    read: boolean;
    actionUrl?: string;
  }) => {
    if (!notification.read) {
      await markNotificationAsRead(notification._id as any);
    }
    setIsOpen(false);
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#FF6B35] text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-[#111118] border border-[#1E1E2E] rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1E1E2E]">
            <div>
              <h3 className="text-white font-semibold text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <p className="text-xs text-gray-400 mt-0.5">{unreadCount} unread</p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markingAll}
                className="flex items-center gap-1.5 text-xs text-[#00D4FF] hover:text-white transition-colors disabled:opacity-50"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                {markingAll ? 'Marking…' : 'Mark all read'}
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-[#1E1E2E]">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                <Bell className="w-8 h-8 text-gray-600 mb-2" />
                <p className="text-gray-400 text-sm">No notifications yet</p>
                <p className="text-gray-600 text-xs mt-1">
                  You'll be notified about new bugs and status changes.
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification._id}
                  className={`w-full text-left p-4 hover:bg-[#1E1E2E] transition-colors ${
                    !notification.read ? 'bg-[#1E1E2E]/40' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <NotificationIcon type={notification.type} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm leading-snug truncate">
                        {notification.title}
                      </p>
                      <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-gray-600 text-[11px] mt-1.5">
                        {formatDistanceToNow(notification.sentAt, { addSuffix: true })}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-[#00D4FF] rounded-full mt-1 shrink-0" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-[#1E1E2E] text-center">
              <p className="text-xs text-gray-600">
                Showing last {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
