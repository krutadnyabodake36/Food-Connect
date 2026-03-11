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
      <div className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 border border-violet-100 dark:border-violet-800/40 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-violet-100 dark:bg-violet-800/50 rounded-xl flex items-center justify-center">
            <Brain size={20} className="text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 dark:text-stone-100 text-sm">AI Waste Insights</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">Analyze your donation patterns</p>
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
      <div className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 border border-violet-100 dark:border-violet-800/40 rounded-xl p-6 flex flex-col items-center justify-center gap-3">
        <Loader2 size={28} className="animate-spin text-violet-600 dark:text-violet-400" />
        <p className="text-sm text-stone-600 dark:text-stone-400 font-medium">Analyzing your donation patterns...</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 border border-violet-100 dark:border-violet-800/40 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain size={18} className="text-violet-600 dark:text-violet-400" />
          <h3 className="font-semibold text-stone-900 dark:text-stone-100 text-sm">AI Waste Insights</h3>
        </div>
        <button onClick={handleAnalyze} className="p-1.5 text-stone-400 hover:text-violet-600 transition-colors rounded-lg hover:bg-white/50">
          <RefreshCw size={14} />
        </button>
      </div>

      {insights?.summary && (
        <p className="text-xs text-stone-600 dark:text-stone-400 mb-4 bg-white/60 dark:bg-stone-800/40 rounded-lg px-3 py-2 border border-violet-100/50 dark:border-violet-800/30">
          {insights.summary}
        </p>
      )}

      <div className="space-y-2.5">
        {insights?.insights.map((insight, i) => (
          <div key={i} className="flex items-start gap-3 bg-white/70 dark:bg-stone-800/50 rounded-lg p-3 border border-stone-100 dark:border-stone-700/50">
            <span className="text-lg flex-shrink-0 mt-0.5">{insight.icon}</span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-stone-900 dark:text-stone-100">{insight.title}</p>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{insight.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WasteInsights;
