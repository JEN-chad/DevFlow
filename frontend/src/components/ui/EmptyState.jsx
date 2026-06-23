import React from 'react';
import {
  FolderKanban, GitBranch, ClipboardList, Calendar,
  Activity, BarChart3, Settings, Plus
} from 'lucide-react';

const ICON_MAP = {
  projects: FolderKanban,
  repos: GitBranch,
  tasks: ClipboardList,
  sprints: Calendar,
  activity: Activity,
  analytics: BarChart3,
  settings: Settings,
  default: FolderKanban,
};

/**
 * Premium Empty State Component
 *
 * @param {string}   icon      - Key from ICON_MAP or a custom JSX element
 * @param {string}   title     - Main empty state heading
 * @param {string}   message   - Sub-text describing the empty state
 * @param {string}   ctaLabel  - CTA button text
 * @param {function} onCta     - CTA button click handler
 * @param {string}   ctaHref   - Optional link href instead of button
 * @param {string}   variant   - 'default' | 'subtle' | 'dashed'
 */
const EmptyState = ({
  icon = 'default',
  title = 'Nothing here yet',
  message = 'Get started by creating your first item.',
  ctaLabel,
  onCta,
  ctaHref,
  variant = 'default',
  children,
  className = '',
}) => {
  const IconComponent = typeof icon === 'string' ? (ICON_MAP[icon] || ICON_MAP.default) : null;

  const containerClass = {
    default: 'border border-dashed border-slate-300 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/10 rounded-2xl',
    subtle:  'bg-transparent rounded-2xl',
    dashed:  'border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl',
  }[variant];

  return (
    <div className={`flex flex-col items-center justify-center text-center px-8 py-16 ${containerClass} ${className}`}>
      {/* Icon container with layered glow */}
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-primary-500/10 blur-xl scale-150 opacity-60" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          {typeof icon === 'string' ? (
            <IconComponent className="h-7 w-7 text-slate-400 dark:text-slate-500" />
          ) : (
            icon
          )}
        </div>
      </div>

      {/* Text */}
      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="max-w-xs text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
        {message}
      </p>

      {/* CTA */}
      {ctaLabel && (onCta || ctaHref) && (
        ctaHref ? (
          <a
            href={ctaHref}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white px-5 py-2.5 text-sm font-semibold shadow-md shadow-primary-600/20 transition-all hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" />
            {ctaLabel}
          </a>
        ) : (
          <button
            onClick={onCta}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white px-5 py-2.5 text-sm font-semibold shadow-md shadow-primary-600/20 transition-all hover:-translate-y-0.5 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            {ctaLabel}
          </button>
        )
      )}

      {children}
    </div>
  );
};

export default EmptyState;
