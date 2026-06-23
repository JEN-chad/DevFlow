import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, Calendar, ClipboardCheck, UserCheck, GitPullRequest, ExternalLink } from 'lucide-react';
import { notificationService } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { formatDistanceToNow } from 'date-fns';

export const NotificationCenter = () => {
  const { socket, isConnected } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'unread'
  const dropdownRef = useRef(null);

  // Fetch notifications initially
  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getNotifications(1, 50);
      if (res.success) {
        setNotifications(res.data);
        setUnreadCount(res.unreadCount);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Listen for real-time notifications via Socket.io
  useEffect(() => {
    if (socket && isConnected) {
      const handleNewNotification = (notification) => {
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);

        // Optional: Play subtle notification sound
        try {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-500.wav');
          audio.volume = 0.2;
          audio.play().catch(() => {});
        } catch (e) {
          // Ignore audio play blockages
        }
      };

      socket.on('notification-received', handleNewNotification);

      return () => {
        socket.off('notification-received', handleNewNotification);
      };
    }
  }, [socket, isConnected]);

  // Handle clicking outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      const updated = await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((notif) => (notif._id === id ? { ...notif, read: true } : notif))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await notificationService.markAllAsRead();
      if (res.success) {
        setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'TASK_ASSIGNED':
        return <UserCheck className="h-4 w-4 text-blue-500" />;
      case 'TASK_COMPLETED':
        return <ClipboardCheck className="h-4 w-4 text-emerald-500" />;
      case 'SPRINT_STARTED':
        return <Calendar className="h-4 w-4 text-amber-500" />;
      case 'PR_OPENED':
        return <GitPullRequest className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4 text-slate-500" />;
    }
  };

  const filteredNotifications = notifications.filter((notif) => {
    if (activeTab === 'unread') return !notif.read;
    return true;
  });

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative rounded-lg p-2 transition-colors ${
          isOpen
            ? 'bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-slate-100'
            : 'text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800'
        }`}
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-md">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Card */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 origin-top-right rounded-xl border border-slate-200 bg-white/95 p-0 shadow-2xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 z-50">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-4 py-3">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-50">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-[11px] font-medium text-primary-600 dark:text-primary-400 hover:underline"
              >
                <Check className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-100 dark:border-slate-800 px-2 py-1.5">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 rounded-md py-1 text-xs font-medium text-center transition-colors ${
                activeTab === 'all'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white'
                  : 'text-slate-500 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab('unread')}
              className={`flex-1 rounded-md py-1 text-xs font-medium text-center transition-colors ${
                activeTab === 'unread'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white'
                  : 'text-slate-500 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Scrollable List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => !notif.read && handleMarkAsRead(notif._id)}
                  className={`flex gap-3 px-4 py-3 transition-colors cursor-pointer ${
                    notif.read
                      ? 'bg-transparent hover:bg-slate-50/50 dark:hover:bg-slate-800/20'
                      : 'bg-primary-50/20 dark:bg-primary-950/10 hover:bg-primary-50/40 dark:hover:bg-primary-950/20'
                  }`}
                >
                  {/* Sender Avatar */}
                  <div className="relative shrink-0">
                    {notif.sender?.avatar ? (
                      <img
                        src={notif.sender.avatar}
                        alt="avatar"
                        className="h-8 w-8 rounded-full border border-slate-200 dark:border-slate-700"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold">
                        {notif.sender?.username?.substring(0, 2).toUpperCase() || 'U'}
                      </div>
                    )}
                    <span className="absolute -bottom-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                      {getNotificationIcon(notif.type)}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <p className="font-semibold text-xs text-slate-850 dark:text-slate-200">
                        {notif.title}
                      </p>
                      {!notif.read && (
                        <span className="h-1.5 w-1.5 rounded-full bg-primary-600 mt-1 shrink-0"></span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-550 dark:text-slate-400 mt-0.5 line-clamp-2">
                      {notif.message}
                    </p>
                    <div className="flex items-center justify-between gap-2 mt-1.5">
                      <span className="text-[9px] text-slate-400">
                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                      </span>
                      {notif.link && (
                        <a
                          href={notif.link}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-0.5 text-[9px] font-semibold text-primary-500 hover:text-primary-600"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                <Bell className="h-8 w-8 text-slate-350 dark:text-slate-600 stroke-[1.5]" />
                <p className="text-xs font-semibold text-slate-850 dark:text-slate-300 mt-2">All caught up!</p>
                <p className="text-[10px] text-slate-400 mt-0.5">No notifications to show here.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
