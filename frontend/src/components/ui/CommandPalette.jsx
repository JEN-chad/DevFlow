import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, FolderKanban, ClipboardList, GitBranch, Calendar, ArrowRight, Keyboard } from 'lucide-react';

/**
 * Command Palette — Ctrl+K global search
 * Searches from already-fetched TanStack Query cache data.
 *
 * Usage:
 * const { CommandPalette, openPalette } = useCommandPalette(cachedData);
 * <CommandPalette />
 * <button onClick={openPalette}>Search</button>
 */
export const useCommandPalette = (data = {}) => {
  const [open, setOpen] = useState(false);

  const openPalette = useCallback(() => setOpen(true), []);
  const closePalette = useCallback(() => setOpen(false), []);

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const CommandPaletteComponent = () => (
    open ? <CommandPaletteInner data={data} onClose={closePalette} /> : null
  );

  return { CommandPalette: CommandPaletteComponent, openPalette, closePalette, isOpen: open };
};

/* ─────────────────────────────────────────
   COMMAND PALETTE INNER COMPONENT
   ───────────────────────────────────────── */

const RESULT_TYPES = {
  project:    { icon: FolderKanban, label: 'Project',     color: 'text-violet-500',  href: (id) => `/dashboard/projects/${id}` },
  task:       { icon: ClipboardList, label: 'Task',       color: 'text-blue-500',    href: (id) => `/dashboard/tasks` },
  repository: { icon: GitBranch,    label: 'Repository',  color: 'text-emerald-500', href: (id) => `/dashboard/repositories/${id}` },
  sprint:     { icon: Calendar,     label: 'Sprint',      color: 'text-amber-500',   href: (id) => `/dashboard/sprints/${id}` },
};

const CommandPaletteInner = ({ data, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Build flat search results from cached data
  const allResults = [];
  if (data.projects) {
    data.projects.forEach(p => allResults.push({ type: 'project', id: p._id, label: p.name, sub: p.description || 'Project workspace' }));
  }
  if (data.tasks) {
    data.tasks.forEach(t => allResults.push({ type: 'task', id: t._id, label: t.title, sub: `${t.status} • ${t.priority}` }));
  }
  if (data.repositories) {
    data.repositories.forEach(r => allResults.push({ type: 'repository', id: r._id, label: r.name, sub: r.url || 'Repository' }));
  }
  if (data.sprints) {
    data.sprints.forEach(s => allResults.push({ type: 'sprint', id: s._id, label: s.name, sub: `${s.status} sprint` }));
  }

  const filtered = query.length < 1
    ? allResults.slice(0, 8)
    : allResults.filter(r =>
        r.label.toLowerCase().includes(query.toLowerCase()) ||
        r.sub?.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx(i => Math.min(i + 1, filtered.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx(i => Math.max(i - 1, 0));
    }
    if (e.key === 'Enter' && filtered[selectedIdx]) {
      const r = filtered[selectedIdx];
      const config = RESULT_TYPES[r.type];
      window.location.href = config.href(r.id);
      onClose();
    }
  };

  return createPortal(
    <div
      className="command-overlay fixed inset-0 z-[200] flex items-start justify-center pt-[12vh] px-4"
      style={{ background: 'rgba(2, 6, 23, 0.65)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="command-modal w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700"
        style={{ background: 'var(--bg-surface)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <Search className="h-4.5 w-4.5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIdx(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search tasks, projects, repos, sprints..."
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded">
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-slate-400 dark:text-slate-500">
              {query ? `No results for "${query}"` : 'Start typing to search...'}
            </div>
          ) : (
            <div className="py-1.5">
              {filtered.map((result, idx) => {
                const config = RESULT_TYPES[result.type];
                const Icon = config.icon;
                const isSelected = idx === selectedIdx;
                return (
                  <a
                    key={`${result.type}-${result.id}`}
                    href={config.href(result.id)}
                    onClick={onClose}
                    onMouseEnter={() => setSelectedIdx(idx)}
                    className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                      isSelected
                        ? 'bg-primary-50 dark:bg-primary-950/30'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className={`flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 ${config.color}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{result.label}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{result.sub}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">{config.label}</span>
                      {isSelected && <ArrowRight className="h-3.5 w-3.5 text-primary-500" />}
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold">↑↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold">↵</kbd>
              open
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
            <Keyboard className="h-3 w-3" />
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold">Ctrl K</kbd>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default useCommandPalette;
