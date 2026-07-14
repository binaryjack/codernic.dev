import { createSlice, createSelector } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createNotificationsState } from '@binaryjack/state-factories';

export interface Notification {
  id: string;
  message: string;
  level: 'info' | 'success' | 'error';
  is_read: boolean;
  created_at: number;
}

export interface NotificationsState {
  items: Notification[];
  activeToasts: Notification[];
}

const initialState: NotificationsState = createNotificationsState() as unknown as NotificationsState;

export const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    // Actions for Sagas to intercept
    fetchNotificationsRequest(state) {},
    markAsReadRequest(state) {},
    addNotificationRequest(state, action: PayloadAction<Omit<Notification, 'id' | 'is_read' | 'created_at'>>) {},

    // State mutations
    setNotifications(state, action: PayloadAction<Notification[]>) {
      state.items = action.payload;
    },
    pushNotification(state, action: PayloadAction<Notification>) {
      state.items.unshift(action.payload); // Add to history
      state.activeToasts.push(action.payload); // Add to visible toasts
    },
    removeActiveToast(state, action: PayloadAction<string>) {
      state.activeToasts = state.activeToasts.filter(t => t.id !== action.payload);
    },
    markAllAsRead(state) {
      state.items.forEach(n => n.is_read = true);
    },
    clearAllNotifications(state) {
      state.items = [];
    }
  },
});

export const {
  fetchNotificationsRequest,
  markAsReadRequest,
  addNotificationRequest,
  setNotifications,
  pushNotification,
  removeActiveToast,
  markAllAsRead,
  clearAllNotifications,
} = notificationsSlice.actions;

const selectNotificationsState = (state: { notifications: NotificationsState }) => state.notifications;

export const selectNotificationsHistory = createSelector(
  [selectNotificationsState],
  (state) => state.items
);

export const selectActiveToasts = createSelector(
  [selectNotificationsState],
  (state) => state.activeToasts
);

export const selectUnreadCount = createSelector(
  [selectNotificationsState],
  (state) => state.items.filter(n => !n.is_read).length
);

export default notificationsSlice.reducer;
