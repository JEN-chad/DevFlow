import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NotificationCenter } from '../components/NotificationCenter';
import {
  LayoutDashboard,
  FolderKanban,
  GitBranch,
  Calendar,
  Settings,
  Bell,
  LogOut,
  ChevronDown,
  User as UserIcon,
  Sun,
  Moon,
  Menu,
  X,
  ClipboardList,
  Activity as ActivityIcon
} from 'lucide-react';

export const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  // Sync theme class with body element
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  const navigation = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Projects', href: '/dashboard/projects', icon: FolderKanban },
    { name: 'Sprints', href: '/dashboard/sprints', icon: Calendar },
    { name: 'Tasks (Kanban)', href: '/dashboard/tasks', icon: ClipboardList },
    { name: 'Repositories', href: '/dashboard/repositories', icon: GitBranch },
    { name: 'Activity Feed', href: '/dashboard/activity', icon: ActivityIcon },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-darkbg dark:text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 dark:bg-slate-950/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Component */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col glass-panel glass-border-r transition-transform md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:sticky md:h-screen`}
      >
        <div className="flex h-16 items-center justify-between px-6 glass-border-b">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white font-bold text-lg shadow-md shadow-primary-600/30">
              D
            </div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-primary-600 to-accent bg-clip-text text-transparent">
              DevFlow
            </span>
          </Link>
          <button
            type="button"
            className="rounded-lg p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Main Navigation Links */}
        <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3.5 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-600/10'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                <item.icon className="h-4.5 w-4.5 shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer with Session Information */}
        <div className="p-4 glass-border-t">
          <div className="flex items-center justify-between rounded-lg bg-slate-200/50 dark:bg-slate-800/40 p-3">
            <div className="flex items-center gap-2.5 overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt="avatar" className="h-8 w-8 rounded-full object-cover border border-slate-300 dark:border-slate-700" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400 font-semibold text-xs">
                  {user?.username?.substring(0, 2).toUpperCase() || 'U'}
                </div>
              )}
              <div className="flex flex-col text-left overflow-hidden">
                <span className="truncate text-xs font-semibold">{user?.username}</span>
                <span className="text-[10px] text-primary-500 font-bold tracking-wider">{user?.role}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="glass-panel glass-border-b flex h-16 items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="rounded-lg p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:flex items-center text-xs font-medium text-slate-500">
              Pages / <span className="text-slate-800 dark:text-slate-200 ml-1 capitalize">{location.pathname.split('/').pop() || 'Overview'}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Dark Mode toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>

            {/* Notification Center */}
            <NotificationCenter />

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-1.5 rounded-lg p-1 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors focus:outline-none"
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt="profile" className="h-8 w-8 rounded-full border border-slate-300 dark:border-slate-700" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400 font-semibold text-xs">
                    {user?.username?.substring(0, 2).toUpperCase() || 'U'}
                  </div>
                )}
                <ChevronDown className="h-4 w-4 text-slate-500 shrink-0" />
              </button>

              {profileDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setProfileDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2.5 w-48 origin-top-right rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 shadow-lg ring-1 ring-black/5 z-20">
                    <div className="px-3 py-2 text-xs border-b border-slate-100 dark:border-slate-800">
                      <p className="font-semibold text-slate-950 dark:text-slate-50">{user?.username}</p>
                      <p className="text-slate-500 dark:text-slate-400 truncate">{user?.email || 'No email synced'}</p>
                    </div>
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        navigate('/dashboard/settings');
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
                    >
                      <UserIcon className="h-4 w-4" />
                      Profile Settings
                    </button>
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleLogout();
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 text-left transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
