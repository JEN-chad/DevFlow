import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { ArrowLeft, GitBranch, ShieldCheck, Zap, Users, BarChart3, CheckCircle } from 'lucide-react';

const FEATURES = [
  { icon: GitBranch,  text: 'GitHub OAuth — instant repository access' },
  { icon: Zap,        text: 'Real-time sprint collaboration via Socket.io' },
  { icon: BarChart3,  text: 'Sprint analytics, velocity & PR tracking' },
  { icon: Users,      text: 'Role-based access for your entire team' },
];

export const LoginPage = () => {
  const { loginWithGitHub } = useAuth();
  const [connecting, setConnecting] = useState(false);

  const handleLogin = () => {
    setConnecting(true);
    loginWithGitHub();
  };

  return (
    <div className="relative min-h-screen flex overflow-hidden" style={{ background: 'var(--bg-page)' }}>
      {/* ─── LEFT PANEL — Product Showcase ─── */}
      <div className="hidden lg:flex flex-col flex-1 relative bg-gradient-to-br from-blue-700 via-blue-600 to-violet-700 p-12 overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='m0 40l40-40h-8l-32 32zm0-32l8-8H0z'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        {/* Orb glow effects */}
        <div className="absolute top-1/4 right-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 h-48 w-48 rounded-full bg-violet-300/20 blur-3xl" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2.5 mb-16">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm text-white font-black text-base border border-white/30">D</div>
          <span className="text-xl font-bold text-white tracking-tight">DevFlow</span>
        </div>

        {/* Main content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <div className="mb-10">
            <h1 className="text-4xl font-black text-white leading-tight mb-4">
              Your GitHub-integrated<br />sprint command center
            </h1>
            <p className="text-blue-100 text-lg leading-relaxed max-w-sm">
              Connect repositories, plan sprints, and track every commit and PR — all in one real-time workspace.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-3.5 mb-12">
            {FEATURES.map(f => (
              <div key={f.text} className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 border border-white/20 shrink-0">
                  <f.icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm text-blue-100 font-medium">{f.text}</span>
              </div>
            ))}
          </div>

          {/* Mini product UI mockup */}
          <div className="rounded-2xl overflow-hidden border border-white/20 bg-white/10 backdrop-blur-sm">
            <div className="px-4 py-2.5 border-b border-white/10 flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-white/40" />
              <div className="h-2.5 w-2.5 rounded-full bg-white/40" />
              <div className="h-2.5 w-2.5 rounded-full bg-white/40" />
              <span className="ml-2 text-[10px] text-blue-200 font-mono">app.devflow.io/dashboard</span>
            </div>
            <div className="p-4 space-y-2">
              {[
                { label: 'Active Sprint', value: 'Sprint 12', tag: 'ACTIVE', tagColor: 'bg-emerald-400/20 text-emerald-200' },
                { label: 'Open Tasks', value: '28', tag: '↓6 today', tagColor: 'bg-white/20 text-blue-100' },
                { label: 'PRs Merged', value: '15', tag: 'This week', tagColor: 'bg-white/20 text-blue-100' },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between rounded-lg bg-white/10 px-3 py-2">
                  <span className="text-[11px] text-blue-200">{row.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{row.value}</span>
                    <span className={`text-[9px] font-bold rounded px-1.5 py-0.5 ${row.tagColor}`}>{row.tag}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center gap-2 text-sm text-blue-200">
          <ShieldCheck className="h-4 w-4 text-emerald-300" />
          Enterprise-grade security · JWT + GitHub OAuth
        </div>
      </div>

      {/* ─── RIGHT PANEL — Auth Card ─── */}
      <div className="flex flex-1 lg:max-w-md flex-col items-center justify-center p-8 relative">
        {/* Back button */}
        <Link
          to="/"
          className="absolute top-6 left-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        {/* Background orb */}
        <div className="absolute top-1/4 right-0 h-96 w-96 rounded-full bg-blue-500/5 dark:bg-blue-500/8 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-0 h-64 w-64 rounded-full bg-violet-500/5 dark:bg-violet-500/8 blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white font-black text-base shadow-lg shadow-blue-600/30">D</div>
            <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">DevFlow</span>
          </div>

          {/* Card */}
          <div className="rounded-2xl p-8 animate-scaleIn"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
            }}
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                Welcome back
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Sign in with your GitHub account to access your workspace.
              </p>
            </div>

            {/* GitHub OAuth button */}
            <button
              onClick={handleLogin}
              disabled={connecting}
              className="w-full flex items-center justify-center gap-3 rounded-xl px-5 py-3.5 text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
              style={{
                background: '#24292F',
                color: 'white',
                boxShadow: connecting ? 'none' : '0 4px 16px rgba(36, 41, 47, 0.4)',
              }}
            >
              {connecting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <svg className="h-5 w-5 fill-white" viewBox="0 0 24 24">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
              )}
              {connecting ? 'Connecting to GitHub...' : 'Continue with GitHub'}
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" style={{ borderColor: 'var(--border-default)' }} />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 text-xs text-slate-400" style={{ background: 'var(--bg-surface)' }}>
                  What you'll get
                </span>
              </div>
            </div>

            {/* Feature list */}
            <div className="space-y-2.5">
              {[
                'Access all GitHub repositories',
                'Create and manage sprints',
                'Real-time Kanban collaboration',
                'Analytics & velocity tracking',
              ].map(f => (
                <div key={f} className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                  {f}
                </div>
              ))}
            </div>

            {/* Security note */}
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
              Read-only repo access · Never stores your password
            </div>
          </div>

          {/* Terms */}
          <p className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
            By signing in, you agree to DevFlow's usage terms.<br />
            Your GitHub token is encrypted at rest.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
