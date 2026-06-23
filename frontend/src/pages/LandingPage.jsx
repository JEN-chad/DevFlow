import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, GitBranch, LayoutDashboard, Calendar, Users,
  BarChart3, ShieldCheck, CheckCircle, Zap, Code2, GitMerge,
  GitPullRequest, Activity, Star, TrendingUp, Play, ChevronRight,
  Menu, X,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

/* ── demo chart data ── */
const DEMO_COMMITS = [
  { day: 'Mon', commits: 4 }, { day: 'Tue', commits: 8 }, { day: 'Wed', commits: 5 },
  { day: 'Thu', commits: 12 }, { day: 'Fri', commits: 9 }, { day: 'Sat', commits: 3 },
  { day: 'Sun', commits: 7 },
];

/* ── mini kanban for hero ── */
const MINI_TASKS = {
  TODO: [
    { title: 'Design system tokens', priority: 'HIGH', points: 5 },
    { title: 'Auth middleware', priority: 'CRITICAL', points: 8 },
  ],
  IN_PROGRESS: [
    { title: 'GitHub OAuth flow', priority: 'HIGH', points: 5 },
    { title: 'Dashboard charts', priority: 'MEDIUM', points: 3 },
  ],
  DONE: [
    { title: 'Database schemas', priority: 'LOW', points: 2 },
    { title: 'Sprint API routes', priority: 'MEDIUM', points: 3 },
  ],
};

const PRIORITY_COLORS = {
  CRITICAL: 'border-l-red-500',
  HIGH: 'border-l-orange-500',
  MEDIUM: 'border-l-amber-500',
  LOW: 'border-l-slate-400',
};

const PRIORITY_DOT = {
  CRITICAL: 'bg-red-500',
  HIGH: 'bg-orange-500',
  MEDIUM: 'bg-amber-500',
  LOW: 'bg-slate-400',
};

const MiniKanban = () => (
  <div className="grid grid-cols-3 gap-2 p-3">
    {Object.entries(MINI_TASKS).map(([col, tasks]) => (
      <div key={col} className="rounded-lg bg-slate-50/80 dark:bg-slate-800/60 p-2 space-y-1.5">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">{col.replace('_', ' ')}</p>
        {tasks.map((t, i) => (
          <div key={i} className={`rounded-md bg-white dark:bg-slate-900 border-l-2 ${PRIORITY_COLORS[t.priority]} p-2 shadow-sm`}>
            <p className="text-[9px] font-semibold text-slate-700 dark:text-slate-200 leading-tight line-clamp-2">{t.title}</p>
            <div className="mt-1.5 flex items-center justify-between">
              <span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOT[t.priority]}`} />
              <span className="text-[8px] font-bold text-slate-400">{t.points}SP</span>
            </div>
          </div>
        ))}
      </div>
    ))}
  </div>
);

/* ── comparison data ── */
const COMPARISON = [
  { feature: 'GitHub Integration',       devflow: true,  jira: false, github: true,  trello: false },
  { feature: 'Sprint Planning',          devflow: true,  jira: true,  github: false, trello: false },
  { feature: 'Kanban Board',             devflow: true,  jira: true,  github: true,  trello: true  },
  { feature: 'Real-time Collaboration',  devflow: true,  jira: true,  github: false, trello: false },
  { feature: 'Commit Tracking',          devflow: true,  jira: false, github: true,  trello: false },
  { feature: 'PR Monitoring',            devflow: true,  jira: false, github: true,  trello: false },
  { feature: 'Sprint Analytics',         devflow: true,  jira: true,  github: false, trello: false },
  { feature: 'Activity Feed',            devflow: true,  jira: true,  github: true,  trello: false },
  { feature: 'Free to Use',              devflow: true,  jira: false, github: false, trello: true  },
];

const Check = () => <CheckCircle className="h-4 w-4 text-emerald-500 mx-auto" />;
const Dash  = () => <span className="block h-0.5 w-4 bg-slate-300 dark:bg-slate-700 mx-auto rounded" />;

/* ── testimonials ── */
const TESTIMONIALS = [
  {
    name: 'Aisha Mensah',
    role: 'Engineering Manager',
    company: 'TechScale',
    avatar: 'AM',
    color: 'from-blue-500 to-violet-500',
    quote: 'DevFlow replaced three separate tools for us. Having GitHub, sprints, and analytics in one place transformed our delivery velocity.',
  },
  {
    name: 'Lucas Ferreira',
    role: 'Senior Developer',
    company: 'CodeBase Co.',
    avatar: 'LF',
    color: 'from-emerald-500 to-teal-500',
    quote: 'The real-time Kanban board with GitHub commit linking is exactly what we\'ve been missing. Our standups are now 10 minutes shorter.',
  },
  {
    name: 'Priya Sharma',
    role: 'CTO & Co-Founder',
    company: 'LaunchPad',
    avatar: 'PS',
    color: 'from-orange-500 to-pink-500',
    quote: 'We evaluated Linear, Jira, and GitHub Projects. DevFlow was the only platform that felt built specifically for dev teams from day one.',
  },
];

/* ── features ── */
const FEATURES = [
  { icon: GitBranch,      title: 'GitHub Sync',          desc: 'Auto-import repos, track commits and PRs. Link code changes directly to sprint tasks.' },
  { icon: LayoutDashboard, title: 'Sprint Boards',        desc: 'Full Agile sprint management with velocity tracking, burndown charts, and goal setting.' },
  { icon: Activity,       title: 'Real-time Updates',    desc: 'Socket.io powered live collaboration. See your team\'s activity the moment it happens.' },
  { icon: BarChart3,      title: 'Analytics Suite',      desc: 'Sprint velocity, team productivity, commit frequency, and PR trend charts.' },
  { icon: Users,          title: 'Role-based Access',    desc: 'Fine-grained permissions across Owner, Scrum Master, Developer, and Viewer roles.' },
  { icon: ShieldCheck,    title: 'Enterprise Security',  desc: 'JWT + refresh tokens, Helmet security headers, rate limiting, and OAuth encryption.' },
];

/* ── workflow steps ── */
const STEPS = [
  { num: '01', title: 'Connect GitHub',        desc: 'OAuth with GitHub in one click. Import all your repositories automatically.' },
  { num: '02', title: 'Create a Project',      desc: 'Set up your workspace and invite your engineering team with role assignments.' },
  { num: '03', title: 'Plan your Sprint',      desc: 'Set sprint goals, assign story points, and build your backlog.' },
  { num: '04', title: 'Assign & Track Tasks',  desc: 'Move tickets across the Kanban board with drag-and-drop. See real-time updates.' },
  { num: '05', title: 'Monitor GitHub Activity', desc: 'Commits, pull requests, and issues automatically appear in your activity feed.' },
  { num: '06', title: 'Ship Faster',           desc: 'Use analytics to eliminate bottlenecks and improve sprint velocity over time.' },
];

/* ═════════════════════════════════════════
   LANDING PAGE
   ═════════════════════════════════════════ */
export const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1220] text-slate-900 dark:text-slate-100 flex flex-col">

      {/* ─────────────── NAVBAR ─────────────── */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'shadow-md' : ''
      }`}
        style={{
          background: scrolled ? 'rgba(248, 250, 252, 0.95)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(226,232,240,0.8)' : '1px solid transparent',
        }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white font-black text-sm shadow-md shadow-blue-600/30">
                D
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">DevFlow</span>
            </div>

            {/* Center Nav */}
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
              <a href="#features"    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">How it Works</a>
              <a href="#compare"     className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Compare</a>
              <a href="#testimonials" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Testimonials</a>
            </nav>

            {/* CTA */}
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="hidden sm:block text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/login"
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 text-sm font-semibold shadow-md shadow-blue-600/25 transition-all hover:-translate-y-0.5 active:scale-95"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>

              {/* Mobile menu button */}
              <button
                className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden px-4 pb-4 pt-2 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-slideDown">
            {['features', 'how-it-works', 'compare', 'testimonials'].map(id => (
              <a key={id} href={`#${id}`} onClick={() => setMobileMenuOpen(false)}
                className="block py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 capitalize hover:text-blue-600 dark:hover:text-blue-400">
                {id.replace('-', ' ')}
              </a>
            ))}
            <Link to="/login" className="block mt-2 w-full text-center rounded-lg bg-blue-600 text-white py-2.5 text-sm font-semibold">
              Get Started Free
            </Link>
          </div>
        )}
      </header>

      <main className="flex-1">

        {/* ─────────────── HERO ─────────────── */}
        <section className="relative overflow-hidden hero-gradient px-4 sm:px-6 lg:px-8 pt-20 pb-16 md:pt-28 md:pb-24">
          {/* Decorative orbs */}
          <div className="absolute top-0 left-1/4 h-[600px] w-[600px] rounded-full bg-blue-500/6 dark:bg-blue-500/8 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-violet-500/6 dark:bg-violet-500/8 blur-[100px] pointer-events-none" />

          <div className="mx-auto max-w-7xl relative">
            <div className="text-center max-w-4xl mx-auto mb-16">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 shadow-sm mb-8">
                <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                GitHub OAuth · Real-time Collaboration · Sprint Analytics
              </div>

              {/* Headline */}
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.05] mb-6">
                <span className="gradient-text-page-title">Manage Sprints,</span>
                <br />
                <span className="gradient-text-page-title">Repositories &</span>
                <br />
                <span className="gradient-text-primary">Pull Requests</span>
              </h1>

              <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                DevFlow connects GitHub, sprint planning, Kanban workflows, and team collaboration into one unified platform built for modern engineering teams.
              </p>

              {/* CTA row */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/login"
                  className="w-full sm:w-auto flex items-center justify-center gap-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 text-base font-bold shadow-xl shadow-blue-600/25 transition-all hover:-translate-y-0.5 active:scale-95"
                >
                  <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                  </svg>
                  Start with GitHub
                </Link>
                <a
                  href="#how-it-works"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 px-8 py-4 text-base font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  <Play className="h-4.5 w-4.5" />
                  See How It Works
                </a>
              </div>
            </div>

            {/* Product Showcase — Browser Mockup */}
            <div className="relative max-w-5xl mx-auto animate-float">
              <div className="browser-mockup">
                {/* Browser chrome */}
                <div className="flex items-center gap-1.5 px-4 py-3 bg-slate-100 dark:bg-slate-800">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400" />
                  <div className="h-3 w-3 rounded-full bg-emerald-400" />
                  <div className="flex-1 ml-3 rounded-md bg-white dark:bg-slate-700 px-3 py-1 text-xs text-slate-400 dark:text-slate-500 font-mono">
                    app.devflow.io/dashboard/tasks
                  </div>
                </div>
                {/* Kanban preview */}
                <div className="bg-slate-50 dark:bg-slate-900 p-4">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">Sprint Board</p>
                      <p className="text-[10px] text-slate-400">Sprint 12 — 14 tasks remaining</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-semibold text-slate-400">3 active</span>
                    </div>
                  </div>
                  <MiniKanban />
                </div>
              </div>

              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 animate-bounce hidden md:block">
                <div className="flex items-center gap-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 shadow-lg">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">PR #42 merged</span>
                </div>
              </div>
              <div className="absolute -bottom-4 -left-6 hidden md:block" style={{ animationDelay: '1s' }}>
                <div className="flex items-center gap-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 shadow-lg">
                  <GitBranch className="h-3.5 w-3.5 text-blue-500" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">5 new commits</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─────────────── TECH STRIP ─────────────── */}
        <section className="border-y border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 py-8 px-4 overflow-hidden">
          <div className="mx-auto max-w-5xl text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-6">
              Built with production-grade technologies
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm font-semibold text-slate-400 dark:text-slate-500">
              {['React 19', 'Node.js', 'MongoDB', 'Socket.io', 'Express.js', 'JWT OAuth', 'Tailwind CSS', 'Recharts'].map(tech => (
                <span key={tech} className="logo-strip-item hover:text-slate-700 dark:hover:text-slate-300 transition-colors">{tech}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ─────────────── HOW IT WORKS ─────────────── */}
        <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="text-center mb-16">
              <p className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-3">Workflow</p>
              <h2 className="text-4xl font-black tracking-tight gradient-text-page-title mb-4">From GitHub to Shipped in 6 Steps</h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
                DevFlow guides your team from repository connection to sprint completion with complete GitHub visibility at every stage.
              </p>
            </div>

            <div className="relative">
              {/* Connector line */}
              <div className="absolute left-[22px] top-6 bottom-6 w-px bg-gradient-to-b from-blue-500 via-violet-500 to-emerald-500 opacity-20 hidden sm:block" />
              <div className="space-y-8">
                {STEPS.map((step, idx) => (
                  <div key={step.num} className="flex gap-6 group animate-slideUp" style={{ animationDelay: `${idx * 80}ms` }}>
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-white text-sm font-black shadow-lg shadow-blue-600/20 z-10">
                      {String(idx + 1).padStart(2, '0')}
                    </div>
                    <div className="pt-1.5 pb-4">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">{step.title}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─────────────── FEATURES ─────────────── */}
        <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50/80 dark:bg-slate-900/30 border-y border-slate-200 dark:border-slate-800">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <p className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-3">Features</p>
              <h2 className="text-4xl font-black tracking-tight gradient-text-page-title mb-4">Everything Dev Teams Need</h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
                Purpose-built for software engineering teams. Not a generic project manager.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feat, idx) => (
                <div
                  key={feat.title}
                  className="group relative rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 hover:-translate-y-1 hover:shadow-xl hover:border-blue-200 dark:hover:border-blue-900/50 transition-all duration-200 animate-slideUp"
                  style={{ animationDelay: `${idx * 80}ms` }}
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                    <feat.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">{feat.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─────────────── ANALYTICS PREVIEW ─────────────── */}
        <section className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <p className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-3">Analytics</p>
              <h2 className="text-4xl font-black tracking-tight gradient-text-page-title mb-4">Real Insights, Not Vanity Metrics</h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
                Sprint velocity, commit frequency, PR trends, and team productivity — all in one dashboard.
              </p>
            </div>

            {/* Browser mockup with chart */}
            <div className="browser-mockup">
              <div className="flex items-center gap-1.5 px-4 py-3 bg-slate-100 dark:bg-slate-800">
                <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <div className="flex-1 ml-2 rounded bg-white dark:bg-slate-700 px-2 py-0.5 text-xs text-slate-400 font-mono">
                  app.devflow.io/dashboard
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 p-6">
                {/* Mini KPI row */}
                <div className="grid grid-cols-4 gap-3 mb-6">
                  {[
                    { label: 'Active Projects', value: '4', delta: '+2 this week', color: 'text-blue-600' },
                    { label: 'Open Tasks', value: '28', delta: '↓ 6 closed today', color: 'text-amber-600' },
                    { label: 'Sprint Velocity', value: '87%', delta: '↑ 12% vs last', color: 'text-emerald-600' },
                    { label: 'PRs Merged', value: '15', delta: 'this sprint', color: 'text-violet-600' },
                  ].map(card => (
                    <div key={card.label} className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">{card.label}</p>
                      <p className={`text-xl font-black ${card.color}`}>{card.value}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">{card.delta}</p>
                    </div>
                  ))}
                </div>
                {/* Commit chart */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">Commit Activity — Last 7 Days</p>
                  <ResponsiveContainer width="100%" height={140}>
                    <AreaChart data={DEMO_COMMITS} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="commitGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ background: '#1E293B', border: 'none', borderRadius: '8px', fontSize: '11px', color: '#F8FAFC' }}
                        itemStyle={{ color: '#60A5FA' }}
                      />
                      <Area type="monotone" dataKey="commits" stroke="#3B82F6" strokeWidth={2} fill="url(#commitGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─────────────── COMPARISON ─────────────── */}
        <section id="compare" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50/80 dark:bg-slate-900/30 border-y border-slate-200 dark:border-slate-800">
          <div className="mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <p className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-3">Compare</p>
              <h2 className="text-4xl font-black tracking-tight gradient-text-page-title mb-4">DevFlow vs The Alternatives</h2>
            </div>

            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg">
              {/* Table header */}
              <div className="grid grid-cols-5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                <div className="px-5 py-4 text-sm font-bold text-slate-700 dark:text-slate-300">Feature</div>
                {[
                  { name: 'DevFlow', highlight: true },
                  { name: 'Jira', highlight: false },
                  { name: 'GitHub', highlight: false },
                  { name: 'Trello', highlight: false },
                ].map(tool => (
                  <div key={tool.name} className={`px-3 py-4 text-center text-sm font-bold ${
                    tool.highlight ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'
                  }`}>
                    {tool.name}
                    {tool.highlight && <span className="ml-1 text-[10px] align-middle bg-blue-600 text-white rounded px-1 py-0.5">us</span>}
                  </div>
                ))}
              </div>
              {/* Rows */}
              {COMPARISON.map((row, idx) => (
                <div key={row.feature} className={`grid grid-cols-5 ${idx % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/20'} border-b border-slate-100 dark:border-slate-800 last:border-0`}>
                  <div className="px-5 py-3.5 text-sm text-slate-600 dark:text-slate-400 font-medium">{row.feature}</div>
                  <div className="py-3.5 text-center bg-blue-50/30 dark:bg-blue-950/10">{row.devflow ? <Check /> : <Dash />}</div>
                  <div className="py-3.5 text-center">{row.jira ? <Check /> : <Dash />}</div>
                  <div className="py-3.5 text-center">{row.github ? <Check /> : <Dash />}</div>
                  <div className="py-3.5 text-center">{row.trello ? <Check /> : <Dash />}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─────────────── TESTIMONIALS ─────────────── */}
        <section id="testimonials" className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <p className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-3">Testimonials</p>
              <h2 className="text-4xl font-black tracking-tight gradient-text-page-title mb-4">Teams Ship Faster With DevFlow</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {TESTIMONIALS.map((t, idx) => (
                <div
                  key={t.name}
                  className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:-translate-y-1 hover:shadow-xl transition-all duration-200 animate-slideUp"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  {/* Stars */}
                  <div className="flex gap-0.5 mb-4">
                    {[0,1,2,3,4].map(i => <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
                  </div>
                  <blockquote className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                    "{t.quote}"
                  </blockquote>
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${t.color} text-white text-xs font-bold shrink-0`}>
                      {t.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{t.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{t.role} · {t.company}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─────────────── CTA ─────────────── */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-violet-700" />
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />

          <div className="relative mx-auto max-w-3xl text-center">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
              Build Better Software<br />With Complete GitHub Visibility
            </h2>
            <p className="text-lg text-blue-100 mb-10 max-w-xl mx-auto">
              Join engineering teams who replaced 3 tools with one. Connect your GitHub in 30 seconds.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/login"
                className="flex items-center justify-center gap-2.5 rounded-xl bg-white text-blue-700 font-bold px-8 py-4 text-base shadow-xl hover:-translate-y-0.5 transition-all active:scale-95"
              >
                <svg className="h-5 w-5 fill-current text-gray-900" viewBox="0 0 24 24">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
                Start Free — Connect GitHub
              </Link>
              <a
                href="#features"
                className="flex items-center justify-center gap-2 rounded-xl border-2 border-white/30 text-white font-semibold px-8 py-4 text-base hover:bg-white/10 transition-all"
              >
                Explore Features
                <ChevronRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* ─────────────── FOOTER ─────────────── */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-10 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white font-black text-xs shadow-md">D</div>
              <span className="text-sm font-bold text-slate-900 dark:text-white">DevFlow</span>
              <span className="text-xs text-slate-400">© {new Date().getFullYear()}</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-slate-400 dark:text-slate-500">
              <Link to="/login" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">Sign In</Link>
              <a href="#features" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">Features</a>
              <a href="#compare" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">Compare</a>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              JWT + GitHub OAuth Secured
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
