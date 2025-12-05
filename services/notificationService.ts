import type { Notification } from '../types';

// Mock DB
let MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    type: 'alert',
    messageKey: 'notification_alert_message',
    messageParams: { severity: 'high', pestName: 'Fall Armyworm' },
    timestamp: Date.now() - 3600000, // 1 hour ago
    isRead: false,
    link: { view: 'alerts' },
  },
  {
    id: 'notif-2',
    type: 'reservation',
    messageKey: 'notification_reservation_message',
    messageParams: { product: 'Mancozeb 80WP', code: 'MVNO-ABCF' },
    timestamp: Date.now() - 2 * 86400000, // 2 days ago
    isRead: false,
  },
  {
    id: 'notif-3',
    type: 'case_update',
    messageKey: 'notification_case_update_message',
    messageParams: { diagnosisLabel: 'Gray Leaf Spot' },
    timestamp: Date.now() - 3 * 86400000, // 3 days ago
    isRead: true,
  },
    {
    id: 'notif-4',
    type: 'group_buy',
    messageKey: 'notification_group_buy_message',
    messageParams: { product: 'Pyrethrin Concentrate' },
    timestamp: Date.now() - 5 * 86400000, // 5 days ago
    isRead: true,
  },
];

export const notificationService = {
  async getNotifications(): Promise<Notification[]> {
    return new Promise(resolve => {
      setTimeout(() => {
        // Return a copy sorted by timestamp
        resolve([...MOCK_NOTIFICATIONS].sort((a, b) => b.timestamp - a.timestamp));
      }, 300);
    });
  },

  async markAsRead(notificationId: string): Promise<boolean> {
    return new Promise(resolve => {
      setTimeout(() => {
        const index = MOCK_NOTIFICATIONS.findIndex(n => n.id === notificationId);
        if (index > -1) {
          MOCK_NOTIFICATIONS[index].isRead = true;
          resolve(true);
        }
        resolve(false);
      }, 100);
    });
  },

  async markAllAsRead(): Promise<boolean> {
     return new Promise(resolve => {
      setTimeout(() => {
        MOCK_NOTIFICATIONS.forEach(n => n.isRead = true);
        resolve(true);
      }, 100);
    });
  },
  
  async addNotification(params: Omit<Notification, 'id' | 'timestamp' | 'isRead'>): Promise<Notification> {
    return new Promise(resolve => {
        setTimeout(() => {
            const newNotif: Notification = {
                ...params,
                id: `notif-${Date.now()}`,
                timestamp: Date.now(),
                isRead: false,
            };
            MOCK_NOTIFICATIONS.unshift(newNotif);
            resolve(newNotif);
        }, 100);
    });
  }
};