import React, { useState } from 'react';
import { Brain, Loader2, Lightbulb, RefreshCw } from 'lucide-react';
import { getWasteInsights, WasteInsight } from '../../lib/openrouter';
import { HotelDonation } from '../../types';

interface WasteInsightsProps {
  donations: HotelDonation[];
}

const WasteInsights: React.FC<WasteInsightsProps> = ({ donations }) => {
  const [insights, setInsights] = useState<WasteInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (donations.length === 0) {
      setError('No donation history to analyze yet.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const history = donations.map(d => ({
        title: d.title,
        weight: d.weight,
        status: d.status,
        timestamp: d.timestamp || '',
        tags: d.tags,
      }));
      const result = await getWasteInsights(history);
      setInsights(result);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze');
    } finally {
      setLoading(false);
    }
  };

  if (!insights && !loading) {
    return (
      <div className="glass-panel animate-mesh-bg border border-violet-200/50 dark:border-violet-800/50 rounded-2xl p-6 relative overflow-hidden group">
        <div className="absolute inset-0 bg-white/40 dark:bg-stone-900/40 backdrop-blur-[2px]"></div>
        <div className="relative z-10 flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-violet-100/80 dark:bg-violet-900/80 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
            <Brain size={24} className="text-violet-700 dark:text-violet-300" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-violet-950 dark:text-violet-100">AI Waste Insights</h3>
            <p className="text-sm font-medium text-violet-700/80 dark:text-violet-300/80">Analyze your donation patterns</p>
          </div>
        </div>
        {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
        <button
          onClick={handleAnalyze}
          className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Lightbulb size={16} />
          Generate Insights
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="glass-panel animate-mesh-bg border border-violet-200/50 dark:border-violet-800/50 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 shadow-xl">
        <div className="p-4 bg-white/50 dark:bg-stone-900/50 rounded-full backdrop-blur-md">
          <Loader2 size={32} className="animate-spin text-violet-600 dark:text-violet-400" />
        </div>
        <p className="text-sm text-violet-900 dark:text-violet-200 font-bold tracking-wide">Analyzing patterns...</p>
      </div>
    );
  }

  return (
    <div className="glass-panel animate-mesh-bg border border-violet-200/50 dark:border-violet-800/50 rounded-2xl p-6 relative overflow-hidden shadow-xl shadow-violet-500/5">
      <div className="absolute inset-0 bg-white/60 dark:bg-stone-900/60 backdrop-blur-md"></div>
      <div className="relative z-10 flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-100 dark:bg-violet-900/50 rounded-lg shadow-inner">
            <Brain size={20} className="text-violet-700 dark:text-violet-300" />
          </div>
          <h3 className="font-bold text-lg text-violet-950 dark:text-violet-100">AI Waste Insights</h3>
        </div>
        <button onClick={handleAnalyze} className="p-2 text-violet-500/70 hover:text-violet-700 bg-white/50 dark:bg-stone-800/50 hover:bg-white dark:hover:bg-stone-800 transition-all rounded-xl shadow-sm active:scale-95">
          <RefreshCw size={16} />
        </button>
      </div>

      {insights?.summary && (
        <p className="text-xs text-stone-600 dark:text-stone-400 mb-4 bg-white/60 dark:bg-stone-800/40 rounded-lg px-3 py-2 border border-violet-100/50 dark:border-violet-800/30">
          {insights.summary}
        </p>
      )}

      <div className="relative z-10 space-y-3">
        {insights?.insights.map((insight, i) => (
          <div key={i} className="flex items-start gap-4 bg-white/80 dark:bg-stone-800/80 backdrop-blur-xl rounded-xl p-4 border border-violet-100 dark:border-violet-800/50 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
            <span className="text-2xl flex-shrink-0 mt-0.5 filter drop-shadow-sm">{insight.icon}</span>
            <div className="min-w-0">
              <p className="text-[15px] font-bold text-stone-900 dark:text-stone-100 leading-tight">{insight.title}</p>
              <p className="text-xs font-medium text-stone-600 dark:text-stone-400 mt-1.5 leading-relaxed">{insight.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WasteInsights;
