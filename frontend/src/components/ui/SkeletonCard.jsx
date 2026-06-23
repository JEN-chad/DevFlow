import React from 'react';

/* ─────────────────────────────────────────
   SKELETON PRIMITIVES
   ───────────────────────────────────────── */

export const SkeletonBox = ({ className = '', style }) => (
  <div className={`skeleton rounded ${className}`} style={style} />
);

export const SkeletonText = ({ width = 'w-full', height = 'h-3.5', className = '' }) => (
  <div className={`skeleton rounded ${height} ${width} ${className}`} />
);

export const SkeletonAvatar = ({ size = 'h-8 w-8', rounded = 'rounded-full' }) => (
  <div className={`skeleton ${size} ${rounded} shrink-0`} />
);

/* ─────────────────────────────────────────
   STAT CARD SKELETON
   ───────────────────────────────────────── */

export const StatCardSkeleton = ({ count = 4 }) => (
  <div className={`grid gap-4 sm:grid-cols-2 ${count >= 4 ? 'lg:grid-cols-4' : count === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="rounded-xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <SkeletonText width="w-24" height="h-3" />
          <SkeletonBox className="h-9 w-9 rounded-lg" />
        </div>
        <SkeletonText width="w-16" height="h-7" />
        <SkeletonText width="w-20" height="h-3" />
      </div>
    ))}
  </div>
);

/* ─────────────────────────────────────────
   PROJECT CARD SKELETON
   ───────────────────────────────────────── */

export const ProjectCardSkeleton = ({ count = 3 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="rounded-xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <SkeletonBox className="h-10 w-10 rounded-lg" />
          <SkeletonBox className="h-5 w-16 rounded-full" />
        </div>
        <div className="space-y-2">
          <SkeletonText width="w-3/4" height="h-5" />
          <SkeletonText width="w-full" />
          <SkeletonText width="w-5/6" />
        </div>
        <div className="space-y-2 pt-2">
          <div className="flex justify-between">
            <SkeletonText width="w-20" height="h-2.5" />
            <SkeletonText width="w-8" height="h-2.5" />
          </div>
          <SkeletonBox className="h-1.5 w-full rounded-full" />
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <SkeletonAvatar size="h-6 w-6" />
            <SkeletonText width="w-16" height="h-3" />
          </div>
          <SkeletonText width="w-12" height="h-3" />
        </div>
      </div>
    ))}
  </div>
);

/* ─────────────────────────────────────────
   TASK CARD SKELETON
   ───────────────────────────────────────── */

export const TaskCardSkeleton = () => (
  <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
    <div className="flex items-center justify-between">
      <SkeletonBox className="h-4 w-14 rounded-full" />
      <SkeletonAvatar size="h-6 w-6" />
    </div>
    <SkeletonText width="w-full" height="h-4" />
    <SkeletonText width="w-4/5" height="h-4" />
    <SkeletonText width="w-3/5" height="h-3" />
    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
      <SkeletonText width="w-20" height="h-3" />
      <SkeletonBox className="h-4 w-8 rounded" />
    </div>
  </div>
);

/* ─────────────────────────────────────────
   KANBAN BOARD SKELETON
   ───────────────────────────────────────── */

export const KanbanSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 flex-1 min-h-[400px]">
    {Array.from({ length: 5 }).map((_, colIdx) => (
      <div key={colIdx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between h-14">
          <SkeletonText width="w-20" height="h-4" />
          <SkeletonBox className="h-5 w-8 rounded-full" />
        </div>
        <div className="p-3 space-y-3 flex-1">
          {Array.from({ length: colIdx === 2 ? 3 : colIdx === 0 ? 2 : 1 }).map((_, cardIdx) => (
            <TaskCardSkeleton key={cardIdx} />
          ))}
        </div>
      </div>
    ))}
  </div>
);

/* ─────────────────────────────────────────
   CHART CARD SKELETON
   ───────────────────────────────────────── */

export const ChartSkeleton = ({ height = 'h-64' }) => (
  <div className="rounded-xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
    <div className="space-y-1.5">
      <SkeletonText width="w-32" height="h-4" />
      <SkeletonText width="w-48" height="h-3" />
    </div>
    <div className={`${height} skeleton rounded-xl`} />
  </div>
);

/* ─────────────────────────────────────────
   ACTIVITY ITEM SKELETON
   ───────────────────────────────────────── */

export const ActivityItemSkeleton = ({ count = 4 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-start gap-4 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
        <SkeletonBox className="h-9 w-9 rounded-lg shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <SkeletonText width="w-1/3" height="h-4" />
            <SkeletonText width="w-16" height="h-3" />
          </div>
          <SkeletonText width="w-3/4" height="h-4" />
        </div>
      </div>
    ))}
  </div>
);

/* ─────────────────────────────────────────
   SPRINT CARD SKELETON
   ───────────────────────────────────────── */

export const SprintCardSkeleton = ({ count = 3 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="rounded-xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <SkeletonText width="w-28" height="h-5" />
          <SkeletonBox className="h-5 w-16 rounded-full" />
        </div>
        <SkeletonText width="w-5/6" height="h-3.5" />
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <SkeletonText width="w-16" height="h-3" />
            <SkeletonText width="w-8" height="h-3" />
          </div>
          <SkeletonBox className="h-2 w-full rounded-full" />
        </div>
        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          {[0, 1, 2].map(j => (
            <div key={j} className="space-y-1">
              <SkeletonText width="w-full" height="h-5" />
              <SkeletonText width="w-3/4" height="h-2.5" />
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

/* ─────────────────────────────────────────
   TABLE SKELETON
   ───────────────────────────────────────── */

export const TableSkeleton = ({ rows = 5 }) => (
  <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
    {/* Header */}
    <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 grid grid-cols-4 gap-4">
      {[0.4, 0.3, 0.15, 0.15].map((w, i) => (
        <SkeletonText key={i} width="" height="h-3.5" className={`w-${Math.round(w * 100)}`} style={{ width: `${w * 100}%` }} />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="px-5 py-4 border-b border-slate-50 dark:border-slate-800/50 last:border-0 grid grid-cols-4 gap-4 items-center">
        <div className="flex items-center gap-3">
          <SkeletonAvatar size="h-7 w-7" />
          <SkeletonText width="w-3/4" height="h-4" />
        </div>
        <SkeletonText width="w-2/3" height="h-4" />
        <SkeletonBox className="h-5 w-14 rounded-full" />
        <SkeletonText width="w-1/2" height="h-3.5" />
      </div>
    ))}
  </div>
);

export default StatCardSkeleton;
