import React from 'react';
import { Settings } from 'lucide-react';

export const SettingsPage = () => {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Configure your profile, notification targets, and integrations.</p>
      </div>

      <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center">
        <Settings className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-600 mb-4" />
        <h3 className="text-base font-semibold">Settings are limited</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Profile updates and webhook management will be fully unlocked in later phases.</p>
      </div>
    </div>
  );
};

export default SettingsPage;
