import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { sendNotification } from '@/lib/onesignal';

/**
 * Hook for managing in-app and push notifications.
 *
 * Usage:
 *   const { notifications, unreadCount, markNotificationAsRead, markAllAsRead } = useNotifications();
 */
export function useNotifications() {
  const notifications = useQuery(api.notifications.getUserNotifications);
  const unreadCount = useQuery(api.notifications.getUnreadCount) ?? 0;

  const markAsRead = useMutation(api.notifications.markNotificationRead);
  const markAllRead = useMutation(api.notifications.markAllNotificationsRead);
  const notifyNewBug = useMutation(api.notifications.notifyNewBug);
  const notifyStatusChange = useMutation(api.notifications.notifyBugStatusChange);
  const notifyComment = useMutation(api.notifications.notifyCommentAdded);
  const notifyAssigned = useMutation(api.notifications.notifyBugAssigned);
  const attachOneSignalId = useMutation(api.notifications.attachOneSignalId);

  // ─── Send helpers ──────────────────────────────────────────────────────────

  /**
   * Create in-app notification rows and send a OneSignal push for a new bug.
   */
  const sendNewBugNotification = async (params: {
    bugId: Id<'bugs'>;
    projectId: Id<'projects'>;
    title: string;
    priority: string;
    projectName: string;
  }) => {
    // 1. Store in Convex (one row per user)
    const result = await notifyNewBug({
      bugId: params.bugId,
      projectId: params.projectId,
      title: params.title,
      priority: params.priority,
    });

    // 2. Send via OneSignal
    try {
      const { oneSignalId } = await sendNotification({
        title: `New ${params.priority} bug in ${params.projectName}`,
        message: params.title,
        bugId: params.bugId,
        projectId: params.projectId,
        url: `/dashboard/${params.projectId}`,
        userIds: result.userIds,
        buttons: [
          { id: 'view', text: 'View Bug', url: `/dashboard/${params.projectId}` },
        ],
      });

      // 3. Store the OneSignal ID back for delivery tracking
      await attachOneSignalId({
        projectId: params.projectId,
        bugId: params.bugId,
        type: 'new_bug',
        oneSignalId,
      });
    } catch (err) {
      // Push failure is non-fatal — in-app notifications are already stored
      console.warn('OneSignal push failed (new bug):', err);
    }

    return result;
  };

  /**
   * Create in-app notification rows and send a OneSignal push for a status change.
   */
  const sendStatusChangeNotification = async (params: {
    bugId: Id<'bugs'>;
    oldStatus: string;
    newStatus: string;
    projectId: Id<'projects'>;
    projectName: string;
    bugTitle: string;
  }) => {
    const result = await notifyStatusChange({
      bugId: params.bugId,
      oldStatus: params.oldStatus,
      newStatus: params.newStatus,
    });

    try {
      const { oneSignalId } = await sendNotification({
        title: `Bug status updated in ${params.projectName}`,
        message: `"${params.bugTitle}" moved from ${params.oldStatus} to ${params.newStatus}`,
        bugId: params.bugId,
        projectId: params.projectId,
        url: `/dashboard/${params.projectId}`,
        userIds: result.userIds,
      });

      await attachOneSignalId({
        projectId: params.projectId,
        bugId: params.bugId,
        type: 'bug_status_change',
        oneSignalId,
      });
    } catch (err) {
      console.warn('OneSignal push failed (status change):', err);
    }

    return result;
  };

  /**
   * Create in-app notification rows and send a OneSignal push for a new comment.
   */
  const sendCommentNotification = async (params: {
    bugId: Id<'bugs'>;
    projectId: Id<'projects'>;
    projectName: string;
    commentAuthor: string;
    commentPreview: string;
  }) => {
    const result = await notifyComment({
      bugId: params.bugId,
      commentAuthor: params.commentAuthor,
      commentPreview: params.commentPreview,
    });

    try {
      const { oneSignalId } = await sendNotification({
        title: `${params.commentAuthor} commented in ${params.projectName}`,
        message: params.commentPreview,
        bugId: params.bugId,
        projectId: params.projectId,
        url: `/dashboard/${params.projectId}`,
        userIds: result.userIds,
      });

      await attachOneSignalId({
        projectId: params.projectId,
        bugId: params.bugId,
        type: 'comment_added',
        oneSignalId,
      });
    } catch (err) {
      console.warn('OneSignal push failed (comment):', err);
    }

    return result;
  };

  /**
   * Notify a specific user that a bug was assigned to them.
   */
  const sendAssignmentNotification = async (params: {
    bugId: Id<'bugs'>;
    projectId: Id<'projects'>;
    projectName: string;
    assigneeTokenIdentifier: string;
    assignedByName: string;
    bugTitle: string;
  }) => {
    const result = await notifyAssigned({
      bugId: params.bugId,
      assigneeTokenIdentifier: params.assigneeTokenIdentifier,
      assignedByName: params.assignedByName,
    });

    try {
      const { oneSignalId } = await sendNotification({
        title: `Bug assigned to you in ${params.projectName}`,
        message: `${params.assignedByName} assigned "${params.bugTitle}" to you`,
        bugId: params.bugId,
        projectId: params.projectId,
        url: `/dashboard/${params.projectId}`,
        userIds: [params.assigneeTokenIdentifier],
        buttons: [
          { id: 'view', text: 'View Bug', url: `/dashboard/${params.projectId}` },
        ],
      });

      await attachOneSignalId({
        projectId: params.projectId,
        bugId: params.bugId,
        type: 'bug_assigned',
        oneSignalId,
      });
    } catch (err) {
      console.warn('OneSignal push failed (assignment):', err);
    }

    return result;
  };

  // ─── Read helpers ──────────────────────────────────────────────────────────

  const markNotificationAsRead = async (notificationId: Id<'notifications'>) => {
    try {
      await markAsRead({ notificationId });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  };

  const markAllAsRead = async () => {
    try {
      await markAllRead({});
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  };

  return {
    notifications,
    unreadCount,
    sendNewBugNotification,
    sendStatusChangeNotification,
    sendCommentNotification,
    sendAssignmentNotification,
    markNotificationAsRead,
    markAllAsRead,
  };
}
