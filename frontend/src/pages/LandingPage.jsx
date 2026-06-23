import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, GitBranch, LayoutDashboard, Calendar, Users, BarChart3, ShieldCheck } from 'lucide-react';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-darkbg dark:text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="glass-panel glass-border-b sticky top-0 z-50 flex items-center justify-between px-6 py-4 md:px-12">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 text-white font-bold text-xl shadow-lg shadow-primary-600/30">
            D
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary-600 to-accent bg-clip-text text-transparent">
            DevFlow
          </span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
          <a href="#features" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Features</a>
          <a href="#tech" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Tech Stack</a>
        </nav>
        <div>
          <Link
            to="/login"
            className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4.5 py-2 text-sm font-medium text-white shadow-md hover:bg-primary-700 transition-all hover:translate-y-[-1px]"
          >
            Launch App
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden px-6 pt-20 pb-16 md:px-12 md:pt-32 md:pb-24 text-center">
          <div className="absolute top-[-20%] left-[50%] translate-x-[-50%] h-[500px] w-[500px] rounded-full bg-primary-500/10 blur-[100px] pointer-events-none"></div>
          <div className="absolute bottom-[-10%] right-[10%] h-[300px] w-[300px] rounded-full bg-accent-500/10 blur-[80px] pointer-events-none"></div>

          <div className="mx-auto max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 px-3.5 py-1 text-xs font-semibold text-primary-600 dark:text-primary-400 backdrop-blur-md mb-6">
              <span className="flex h-2 w-2 rounded-full bg-primary-600 animate-pulse"></span>
              Phase 1 Live - GitHub OAuth Connected
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl bg-gradient-to-b from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent leading-tight mb-6">
              GitHub Integrated Sprint & <br />Project Management
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
              DevFlow combines repository monitoring, sprints, Kanban boards, and productivity analytics. Streamline your team's workflow and synchronize directly with GitHub.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/login"
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-primary-600/20 hover:bg-primary-700 transition-all hover:translate-y-[-1px]"
              >
                Get Started Free
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href="#features"
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 px-8 py-3.5 text-base font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                Learn More
              </a>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section id="features" className="px-6 py-20 md:px-12 border-t border-slate-200/50 dark:border-slate-800/50 bg-slate-100/50 dark:bg-slate-900/20">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight mb-4">Everything you need to deliver faster</h2>
              <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
                A developers-first dashboard to coordinate sprints, visualize task progress, and map commits to issues.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {/* Feature 1 */}
              <div className="glass-panel rounded-xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400">
                  <GitBranch className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold">GitHub Synchronization</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  Map Git repositories, commits, and pull requests directly to project tasks. Auto-update progress.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="glass-panel rounded-xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400">
                  <LayoutDashboard className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold">Sprint Boards</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  Manage tasks via interactive Kanban boards. Track velocity, burndown curves, and sprint milestones.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="glass-panel rounded-xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold">Productivity Analytics</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  View pull request trends, commit frequencies, and individual developer contribution insights.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Tech Stack Banner */}
        <section id="tech" className="px-6 py-16 md:px-12 border-t border-slate-200/50 dark:border-slate-800/50">
          <div className="mx-auto max-w-6xl text-center">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-8">
              Built with production-grade technologies
            </h3>
            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 text-sm font-semibold text-slate-400 dark:text-slate-500">
              <span className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">React 19</span>
              <span className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Vite</span>
              <span className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Tailwind CSS</span>
              <span className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Node.js</span>
              <span className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Express</span>
              <span className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">MongoDB</span>
              <span className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">JWT & OAuth</span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="glass-panel glass-border-t py-8 px-6 text-center text-xs text-slate-500 dark:text-slate-400 md:px-12">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} DevFlow. All rights reserved.</p>
          <p className="flex items-center gap-1">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Stateless JWT Authentication Secured
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
