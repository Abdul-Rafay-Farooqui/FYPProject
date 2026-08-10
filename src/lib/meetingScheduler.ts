import { useUIStore } from '@/store/uiStore';

export class MeetingScheduler {
  private static checkInterval: NodeJS.Timeout | null = null;
  private static notifiedMeetings = new Set<string>();

  /**
   * Start monitoring scheduled meetings for notifications
   */
  static startMonitoring(meetings: any[]) {
    // Clear existing interval
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Check every minute
    this.checkInterval = setInterval(() => {
      this.checkMeetings(meetings);
    }, 60000);

    // Initial check
    this.checkMeetings(meetings);
  }

  /**
   * Stop monitoring
   */
  static stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.notifiedMeetings.clear();
  }

  /**
   * Check meetings and send notifications
   */
  private static checkMeetings(meetings: any[]) {
    const now = new Date();
    const { addMeetingNotification } = useUIStore.getState();

    meetings.forEach((meeting) => {
      if (meeting.status !== 'scheduled' || !meeting.starts_at) return;

      const startTime = new Date(meeting.starts_at);
      const timeDiff = startTime.getTime() - now.getTime();
      const minutesUntilStart = Math.floor(timeDiff / 60000);

      // Notify 15 minutes before
      if (minutesUntilStart === 15 && !this.notifiedMeetings.has(`${meeting.id}-15min`)) {
        this.notifiedMeetings.add(`${meeting.id}-15min`);
        addMeetingNotification({
          id: `${meeting.id}-15min-${Date.now()}`,
          meeting_id: meeting.id,
          organization_id: meeting.organization_id,
          team_id: meeting.team_id,
          title: meeting.title,
          type: 'starting_soon',
          message: 'Meeting starts in 15 minutes',
          call_type: meeting.call_type,
          starts_at: meeting.starts_at,
          created_at: new Date().toISOString(),
          read: false,
        });

        // Show browser notification if permitted
        this.showBrowserNotification(
          meeting.title,
          'Meeting starts in 15 minutes',
          meeting.call_type
        );
      }

      // Notify 5 minutes before
      if (minutesUntilStart === 5 && !this.notifiedMeetings.has(`${meeting.id}-5min`)) {
        this.notifiedMeetings.add(`${meeting.id}-5min`);
        addMeetingNotification({
          id: `${meeting.id}-5min-${Date.now()}`,
          meeting_id: meeting.id,
          organization_id: meeting.organization_id,
          team_id: meeting.team_id,
          title: meeting.title,
          type: 'starting_soon',
          message: 'Meeting starts in 5 minutes',
          call_type: meeting.call_type,
          starts_at: meeting.starts_at,
          created_at: new Date().toISOString(),
          read: false,
        });

        this.showBrowserNotification(
          meeting.title,
          'Meeting starts in 5 minutes',
          meeting.call_type
        );
      }

      // Notify at start time
      if (minutesUntilStart === 0 && !this.notifiedMeetings.has(`${meeting.id}-start`)) {
        this.notifiedMeetings.add(`${meeting.id}-start`);
        addMeetingNotification({
          id: `${meeting.id}-start-${Date.now()}`,
          meeting_id: meeting.id,
          organization_id: meeting.organization_id,
          team_id: meeting.team_id,
          title: meeting.title,
          type: 'starting_soon',
          message: 'Meeting is starting now!',
          call_type: meeting.call_type,
          starts_at: meeting.starts_at,
          created_at: new Date().toISOString(),
          read: false,
        });

        this.showBrowserNotification(
          meeting.title,
          'Meeting is starting now!',
          meeting.call_type
        );
      }
    });
  }

  /**
   * Show browser notification
   */
  private static async showBrowserNotification(
    title: string,
    body: string,
    callType?: 'voice' | 'video'
  ) {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      new Notification(`📹 ${title}`, {
        body,
        icon: '/meeting-icon.png',
        badge: '/meeting-badge.png',
        tag: `meeting-${title}`,
        requireInteraction: true,
      });
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification(`📹 ${title}`, {
          body,
          icon: '/meeting-icon.png',
        });
      }
    }
  }

  /**
   * Notify when a meeting starts
   */
  static notifyMeetingStarted(meeting: any) {
    const { addMeetingNotification } = useUIStore.getState();
    
    addMeetingNotification({
      id: `${meeting.id}-started-${Date.now()}`,
      meeting_id: meeting.id,
      organization_id: meeting.organization_id,
      team_id: meeting.team_id,
      title: meeting.title,
      type: 'started',
      message: 'Meeting has started. Join now!',
      call_type: meeting.call_type,
      starts_at: meeting.starts_at,
      created_at: new Date().toISOString(),
      read: false,
    });

    this.showBrowserNotification(
      meeting.title,
      'Meeting has started. Join now!',
      meeting.call_type
    );
  }

  /**
   * Notify when a meeting is scheduled
   */
  static notifyMeetingScheduled(meeting: any) {
    const { addMeetingNotification } = useUIStore.getState();
    
    const startTime = new Date(meeting.starts_at);
    const formattedTime = startTime.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    addMeetingNotification({
      id: `${meeting.id}-scheduled-${Date.now()}`,
      meeting_id: meeting.id,
      organization_id: meeting.organization_id,
      team_id: meeting.team_id,
      title: meeting.title,
      type: 'scheduled',
      message: `Scheduled for ${formattedTime}`,
      call_type: meeting.call_type,
      starts_at: meeting.starts_at,
      created_at: new Date().toISOString(),
      read: false,
    });
  }

  /**
   * Request notification permission
   */
  static async requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }
}
