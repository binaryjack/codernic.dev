import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectNotificationsHistory, selectUnreadCount, markAsReadRequest, clearAllNotifications } from '../../../entities/notifications/model/notifications-slice';
import { Dropdown, Button } from '@ai-agencee/ui';
import { useTestId } from '@ai-agencee/ui';

// A simple Bell icon since it might not be in shared/icons
const IconBell = ({ size = 16, className = '' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
  </svg>
);

export function NotificationBell() {
  
  const { rootId, getTestId } = useTestId('notification-bell', typeof dataTestId !== 'undefined' ? dataTestId : undefined);
const dispatch = useDispatch();
  const unreadCount = useSelector(selectUnreadCount);
  const history = useSelector(selectNotificationsHistory);

  const handleToggle = (isOpen: boolean) => {
    if (isOpen && unreadCount > 0) {
      dispatch(markAsReadRequest());
    }
  };

  const levelColors: Record<string, string> = {
    info: 'text-blue-400',
    success: 'text-green-400',
    error: 'text-red-400',
  };

  const trigger = (
    <Button 
      variant="ghost"
      size="icon"
      className="relative text-zinc-400 hover:text-white"
      title="Notifications"
      data-testid="notification-bell-button"
    >
      <IconBell size={16} className={unreadCount > 0 ? 'animate-pulse text-amber-400' : ''} />
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-zinc-950"></span>
      )}
    </Button>
  );

  return (
    <Dropdown 
      trigger={trigger} 
      width="w-80" 
      contentClassName="flex flex-col max-h-[400px] !p-0"
      onOpenChange={handleToggle}
      data-testid="notification-dropdown"
    >
      <div className="px-3 py-2 border-b border-zinc-800 bg-zinc-950/50 flex items-center justify-between">
        <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Notifications</span>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <span className="text-[10px] text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full">{unreadCount} unread</span>
          )}
          {history.length > 0 && (
            <Button data-testid={getTestId('button')} 
              variant="ghost" 
              size="sm" 
              className="text-[10px] h-5 px-1.5 py-0 text-zinc-500 hover:text-red-400 uppercase tracking-wider" 
              onClick={(e) => { e.stopPropagation(); dispatch(clearAllNotifications()); }}
            >
              Clear All
            </Button>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-1 flex flex-col gap-1 min-h-[100px]">
        {history.length === 0 ? (
          <div className="p-4 text-center text-xs text-zinc-500 italic">No notifications yet.</div>
        ) : (
          history.map(notif => (
            <div key={notif.id} className={`p-2 rounded text-xs transition-colors ${notif.is_read ? 'bg-transparent hover:bg-zinc-800/50' : 'bg-zinc-800/30 border-l-2 border-amber-500'}`}>
              <div className="flex items-start gap-2">
                <span className={`shrink-0 mt-0.5 font-bold ${levelColors[notif.level] || 'text-zinc-400'}`}>
                  {notif.level === 'info' ? 'i' : notif.level === 'success' ? '✓' : '!'}
                </span>
                <div className="flex-1">
                  <p className={`text-zinc-300 ${!notif.is_read ? 'font-medium' : ''}`}>{notif.message}</p>
                  <span className="text-[10px] text-zinc-500 mt-1 block">
                    {new Date(notif.created_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Dropdown>
  );
}
