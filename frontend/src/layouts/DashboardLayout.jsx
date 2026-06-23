import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NotificationCenter } from '../components/NotificationCenter';
import useCommandPalette from '../components/ui/CommandPalette';
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
  Activity as ActivityIcon,
  GitPullRequest,
  GitCommit,
  BarChart3,
  Users,
  ChevronRight,
  Search,
  RefreshCw,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';

/* ─────────────────────────────────────────
   NAVIGATION GROUPS
   ───────────────────────────────────────── */
const NAV_GROUPS = [
  {
    label: 'Workspace',
    items: [
      { name: 'Overview',      href: '/dashboard',              icon: LayoutDashboard, exact: true },
      { name: 'Projects',      href: '/dashboard/projects',     icon: FolderKanban },
      { name: 'Repositories',  href: '/dashboard/repositories', icon: GitBranch },
    ],
  },
  {
    label: 'Planning',
    items: [
      { name: 'Sprints',       href: '/dashboard/sprints',      icon: Calendar },
      { name: 'Kanban Board',  href: '/dashboard/tasks',        icon: ClipboardList },
    ],
  },
  {
    label: 'Development',
    items: [
      { name: 'Activity Feed', href: '/dashboard/activity',     icon: ActivityIcon },
    ],
  },
  {
    label: 'Administration',
    items: [
      { name: 'Settings',      href: '/dashboard/settings',     icon: Settings },
    ],
  },
];

/* ─────────────────────────────────────────
   BREADCRUMB HELPER
   ───────────────────────────────────────── */
const getBreadcrumbs = (pathname) => {
  const segments = pathname.replace('/dashboard', '').split('/').filter(Boolean);
  const crumbMap = {
    projects: 'Projects',
    repositories: 'Repositories',
    sprints: 'Sprints',
    tasks: 'Kanban Board',
    activity: 'Activity Feed',
    settings: 'Settings',
    insights: 'Insights',
    dashboard: 'Dashboard',
  };
  if (segments.length === 0) return [{ label: 'Overview', href: '/dashboard' }];
  return [
    { label: 'Dashboard', href: '/dashboard' },
    ...segments.map((seg, idx) => ({
      label: crumbMap[seg] || (seg.length === 24 ? '...' : seg),
      href: '/dashboard/' + segments.slice(0, idx + 1).join('/'),
    })),
  ];
};

/* ─────────────────────────────────────────
   SIDEBAR NAV ITEM
   ───────────────────────────────────────── */
const NavItem = ({ item, isActive, collapsed, onClick }) => {
  return (
    <Link
      to={item.href}
      onClick={onClick}
      title={collapsed ? item.name : undefined}
      className={`nav-item group relative ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`}
    >
      <item.icon className={`shrink-0 ${collapsed ? 'h-5 w-5' : 'h-4 w-4'}`} />
      {!collapsed && <span className="truncate">{item.name}</span>}
      {/* Active left border accent */}
      {isActive && !collapsed && (
        <span className="absolute right-2 h-1.5 w-1.5 rounded-full bg-white/60" />
      )}
      {/* Tooltip for collapsed mode */}
      {collapsed && (
        <div className="pointer-events-none absolute left-full ml-2 px-2.5 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-700 text-white text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg">
          {item.name}
        </div>
      )}
    </Link>
  );
};

/* ─────────────────────────────────────────
   MAIN LAYOUT
   ───────────────────────────────────────── */
export const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('devflow-theme') !== 'light';
  });

  // Command palette
  const { CommandPalette, openPalette } = useCommandPalette({});

  // Sync theme
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      localStorage.setItem('devflow-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      localStorage.setItem('devflow-theme', 'light');
    }
  }, [darkMode]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.href;
    return location.pathname.startsWith(item.href);
  };

  const breadcrumbs = getBreadcrumbs(location.pathname);
  const sidebarWidth = sidebarCollapsed ? 'w-16' : 'w-64';

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-page)', color: 'var(--text-primary)' }}>
      <CommandPalette />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 modal-overlay md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─── SIDEBAR ─── */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col transition-all duration-300 ease-spring
          ${sidebarWidth}
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:sticky md:h-screen`}
        style={{
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-default)',
          boxShadow: '4px 0 24px rgba(0,0,0,0.05)',
        }}
      >
        {/* Logo */}
        <div className={`flex h-14 items-center shrink-0 px-4 ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}
          style={{ borderBottom: '1px solid var(--border-default)' }}
        >
          {!sidebarCollapsed ? (
            <Link to="/dashboard" className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white font-black text-sm shadow-md shadow-blue-600/30">
                D
              </div>
              <div className="min-w-0">
                <span className="block text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate">DevFlow</span>
                <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-medium">Sprint Management</span>
              </div>
            </Link>
          ) : (
            <Link to="/dashboard">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white font-black text-sm shadow-md shadow-blue-600/30">
                D
              </div>
            </Link>
          )}

          {!sidebarCollapsed && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-0.5">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-2">
              {!sidebarCollapsed && (
                <p className="nav-group-label">{group.label}</p>
              )}
              {sidebarCollapsed && <div className="my-2 border-t border-slate-100 dark:border-slate-800/50" />}
              {group.items.map((item) => (
                <NavItem
                  key={item.name}
                  item={item}
                  isActive={isActive(item)}
                  collapsed={sidebarCollapsed}
                  onClick={() => setSidebarOpen(false)}
                />
              ))}
            </div>
          ))}
        </nav>

        {/* Collapse toggle (desktop) + User info */}
        <div className="shrink-0" style={{ borderTop: '1px solid var(--border-default)' }}>
          {/* Collapse button */}
          <button
            onClick={() => setSidebarCollapsed(c => !c)}
            className="hidden md:flex w-full items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            {sidebarCollapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <>
                <PanelLeftClose className="h-4 w-4" />
                <span>Collapse</span>
              </>
            )}
          </button>

          {/* User profile */}
          {!sidebarCollapsed ? (
            <div className="px-3 py-3">
              <div className="flex items-center gap-2.5 rounded-lg p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                {user?.avatar ? (
                  <img src={user.avatar} alt="avatar" className="h-7 w-7 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700 shrink-0" />
                ) : (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-white text-[10px] font-bold">
                    {user?.username?.substring(0, 2).toUpperCase() || 'U'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{user?.username}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{user?.role || 'Member'}</p>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-1 rounded text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-3">
              {user?.avatar ? (
                <img src={user.avatar} alt="avatar" className="h-7 w-7 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700" />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-white text-[10px] font-bold">
                  {user?.username?.substring(0, 2).toUpperCase() || 'U'}
                </div>
              )}
              <button onClick={handleLogout} title="Sign out" className="p-1 rounded text-slate-400 hover:text-red-500 transition-colors">
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ─── MAIN PANEL ─── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* ─── HEADER ─── */}
        <header
          className="sticky top-0 z-30 flex h-14 items-center justify-between px-4 md:px-6 gap-4"
          style={{
            background: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-default)',
          }}
        >
          {/* Left — mobile menu + breadcrumbs */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-4.5 w-4.5" />
            </button>

            {/* Breadcrumbs */}
            <nav className="hidden sm:flex items-center gap-1 text-xs min-w-0">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={crumb.href}>
                  {idx > 0 && <ChevronRight className="h-3 w-3 text-slate-300 dark:text-slate-600 shrink-0" />}
                  {idx === breadcrumbs.length - 1 ? (
                    <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[120px]">{crumb.label}</span>
                  ) : (
                    <Link to={crumb.href} className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors truncate max-w-[80px]">
                      {crumb.label}
                    </Link>
                  )}
                </React.Fragment>
              ))}
            </nav>
          </div>

          {/* Center — search bar */}
          <button
            onClick={openPalette}
            className="hidden md:flex flex-1 max-w-xs items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-400 dark:text-slate-500 transition-all hover:bg-slate-100 dark:hover:bg-slate-800"
            style={{ border: '1px solid var(--border-default)' }}
          >
            <Search className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1 text-left">Search anything...</span>
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold rounded bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-400">
              ⌘K
            </kbd>
          </button>

          {/* Right — controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Mobile search */}
            <button
              onClick={openPalette}
              className="md:hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Search className="h-4.5 w-4.5" />
            </button>

            {/* Theme toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
              title={darkMode ? 'Light mode' : 'Dark mode'}
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Notifications */}
            <NotificationCenter />

            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-1.5 rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt="profile" className="h-7 w-7 rounded-full ring-2 ring-slate-200 dark:ring-slate-700 object-cover" />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-white text-[10px] font-bold">
                    {user?.username?.substring(0, 2).toUpperCase() || 'U'}
                  </div>
                )}
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              </button>

              {profileDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setProfileDropdownOpen(false)} />
                  <div
                    className="absolute right-0 top-full mt-2 w-52 rounded-xl shadow-xl z-20 overflow-hidden animate-slideDown"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
                  >
                    {/* User info header */}
                    <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <div className="flex items-center gap-2.5">
                        {user?.avatar ? (
                          <img src={user.avatar} alt="profile" className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-white text-xs font-bold">
                            {user?.username?.substring(0, 2).toUpperCase() || 'U'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user?.username}</p>
                          <p className="text-xs text-slate-400 truncate">{user?.email || user?.role || 'GitHub User'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-1">
                      <button
                        onClick={() => { setProfileDropdownOpen(false); navigate('/dashboard/settings'); }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                      >
                        <UserIcon className="h-4 w-4 text-slate-400" />
                        Profile Settings
                      </button>
                      <button
                        onClick={() => { setProfileDropdownOpen(false); handleLogout(); }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-left"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* ─── CONTENT ─── */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 animate-fadeIn">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
