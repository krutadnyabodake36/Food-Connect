import React, { useEffect, useState } from 'react';
import { Check, RefreshCw } from 'lucide-react';

const SyncIndicator: React.FC = () => {
  const [synced, setSynced] = useState(true);

  useEffect(() => {
    // Show syncing state briefly when donations update
    const handleStorageChange = () => {
      setSynced(false);
      setTimeout(() => setSynced(true), 500);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/50">
      {synced ? (
        <>
          <Check size={14} className="text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Synced</span>
        </>
      ) : (
        <>
          <RefreshCw size={14} className="text-emerald-600 dark:text-emerald-400 animate-spin" />
          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Syncing...</span>
        </>
      )}
    </div>
  );
};

export default SyncIndicator;
