import React from 'react';
import { AlertTriangle, Flame, TrendingUp, ChevronDown, Circle } from 'lucide-react';

/* ─────────────────────────────────────────
   PRIORITY BADGE
   ───────────────────────────────────────── */

const PRIORITY_CONFIG = {
  CRITICAL: {
    label: 'Critical',
    className: 'priority-critical',
    dot: 'bg-red-500',
    icon: Flame,
  },
  HIGH: {
    label: 'High',
    className: 'priority-high',
    dot: 'bg-orange-500',
    icon: TrendingUp,
  },
  MEDIUM: {
    label: 'Medium',
    className: 'priority-medium',
    dot: 'bg-amber-500',
    icon: null,
  },
  LOW: {
    label: 'Low',
    className: 'priority-low',
    dot: 'bg-slate-400',
    icon: ChevronDown,
  },
};

export const PriorityBadge = ({ priority = 'MEDIUM', showIcon = false, size = 'sm' }) => {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.MEDIUM;
  const Icon = config.icon;

  return (
    <span className={config.className}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot} shrink-0`} />
      {showIcon && Icon && <Icon className="h-3 w-3 shrink-0" />}
      {config.label}
    </span>
  );
};

/* ─────────────────────────────────────────
   STATUS BADGE
   ───────────────────────────────────────── */

const STATUS_CONFIG = {
  BACKLOG: {
    label: 'Backlog',
    className: 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700',
    dot: 'bg-slate-400',
  },
  TODO: {
    label: 'To Do',
    className: 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50',
    dot: 'bg-blue-500',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    className: 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50',
    dot: 'bg-amber-500',
  },
  REVIEW: {
    label: 'Review',
    className: 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900/50',
    dot: 'bg-purple-500',
  },
  DONE: {
    label: 'Done',
    className: 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50',
    dot: 'bg-emerald-500',
  },
};

export const StatusBadge = ({ status = 'TODO', pulse = false }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.TODO;
  return (
    <span className={config.className}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot} ${pulse ? 'animate-pulse' : ''} shrink-0`} />
      {config.label}
    </span>
  );
};

/* ─────────────────────────────────────────
   ROLE BADGE
   ───────────────────────────────────────── */

const ROLE_CONFIG = {
  OWNER: {
    label: 'Owner',
    className: 'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-900/50',
  },
  SCRUM_MASTER: {
    label: 'Scrum Master',
    className: 'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50',
  },
  DEVELOPER: {
    label: 'Developer',
    className: 'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50',
  },
  VIEWER: {
    label: 'Viewer',
    className: 'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700',
  },
};

export const RoleBadge = ({ role = 'DEVELOPER' }) => {
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.DEVELOPER;
  return <span className={config.className}>{config.label}</span>;
};

/* ─────────────────────────────────────────
   SPRINT STATUS BADGE
   ───────────────────────────────────────── */

const SPRINT_STATUS_CONFIG = {
  PLANNED: {
    label: 'Planned',
    className: 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
    dot: 'bg-slate-400',
  },
  ACTIVE: {
    label: 'Active',
    className: 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500 animate-pulse',
  },
  COMPLETED: {
    label: 'Completed',
    className: 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
    dot: 'bg-blue-500',
  },
};

export const SprintStatusBadge = ({ status = 'PLANNED' }) => {
  const config = SPRINT_STATUS_CONFIG[status] || SPRINT_STATUS_CONFIG.PLANNED;
  return (
    <span className={config.className}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot} shrink-0`} />
      {config.label}
    </span>
  );
};

/* ─────────────────────────────────────────
   HEALTH BADGE
   ───────────────────────────────────────── */

export const HealthBadge = ({ health = 'healthy' }) => {
  const configs = {
    healthy: { label: 'Healthy', className: 'health-healthy' },
    'at-risk': { label: 'At Risk', className: 'health-at-risk' },
    delayed: { label: 'Delayed', className: 'health-delayed' },
  };
  const config = configs[health.toLowerCase()] || configs.healthy;
  return (
    <span className={config.className}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {config.label}
    </span>
  );
};

/* ─────────────────────────────────────────
   STORY POINTS BADGE
   ───────────────────────────────────────── */

export const StoryPointsBadge = ({ points }) => {
  if (!points || points === 0) return null;
  return (
    <span className="inline-flex items-center justify-center rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-[10px] font-bold px-1.5 py-0.5 tabular-nums">
      {points} SP
    </span>
  );
};

export default PriorityBadge;
