export class NotificationsFactory {
  static createDispatchActions() {
    return [
      {
        type: 'notifications/pushNotification',
        payload: {
          id: 'demo-notif-1',
          message: 'System initialization complete.',
          level: 'success',
          is_read: false,
          created_at: Date.now() - 60000
        }
      },
      {
        type: 'notifications/pushNotification',
        payload: {
          id: 'demo-notif-2',
          message: 'High latency detected in vector store.',
          level: 'error',
          is_read: false,
          created_at: Date.now() - 5000
        }
      }
    ];
  }
}
