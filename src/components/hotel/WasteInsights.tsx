import React, { useState } from 'react';
import { Brain, Loader2, Lightbulb, RefreshCw } from 'lucide-react';
import { WasteInsight } from '../../lib/openrouter';
import { HotelDonation } from '../../types';
import { apiRequest } from '../../lib/api';

interface WasteInsightsProps {
  donations: HotelDonation[];
}

const buildFallbackInsights = (donations: HotelDonation[]): WasteInsight => {
  const completed = donations.filter(d => d.status === 'completed');
  const pending = donations.filter(d => d.status === 'pending');
  const totalWeight = donations.reduce((acc, d) => acc + (d.weight || 0), 0);
  const completedWeight = completed.reduce((acc, d) => acc + (d.weight || 0), 0);
  const completionRate = donations.length ? Math.round((completed.length / donations.length) * 100) : 0;
  const urgentCount = donations.filter(d => d.isUrgent).length;
  const topTagMap = new Map<string, number>();
  donations.forEach(d => d.tags.forEach(t => topTagMap.set(t, (topTagMap.get(t) || 0) + 1)));
  const topTag = [...topTagMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'Mixed';

  return {
    summary: `You have ${completed.length} completed pickups out of ${donations.length} donations with ${completionRate}% completion efficiency.`,
    insights: [
      {
        title: 'Completion Efficiency',
        description: `${completionRate}% of your donations are being completed. Prioritize faster volunteer assignment for pending items (${pending.length} currently open).`,
        icon: '📈',
      },
      {
        title: 'Top Donation Pattern',
        description: `Your most frequent category is ${topTag}. Preparing this category in standardized batches can reduce handling time.`,
        icon: '🍱',
      },
      {
        title: 'Waste Reduction Impact',
        description: `You listed ${totalWeight.toFixed(1)} kg and successfully rescued ${completedWeight.toFixed(1)} kg so far. Keep posting early to improve pickup success.`,
        icon: '♻️',
      },
      {
        title: 'Urgency Handling',
        description: urgentCount > 0
          ? `${urgentCount} urgent donations were posted. Add tighter pickup windows for urgent items to improve matching speed.`
          : 'No urgent donations detected recently. Use urgent flag for highly perishable food to improve rescue priority.',
        icon: '⏱️',
      },
    ],
  };
};

const WasteInsights: React.FC<WasteInsightsProps> = ({ donations }) => {
  const [insights, setInsights] = useState<WasteInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLiveAI, setIsLiveAI] = useState(false);

  const handleAnalyze = async () => {
    if (donations.length === 0) {
      setError('No donation history to analyze yet.');
      return;
    }

    setLoading(true);
    setError(null);
    setIsLiveAI(false);
    
    try {
      const history = donations.map(d => ({
        title: d.title,
        weight: d.weight,
        status: d.status,
        timestamp: d.timestamp || '',
        tags: d.tags,
      }));

      const result = await apiRequest<WasteInsight>('/ai/waste-insights', {
        method: 'POST',
        body: JSON.stringify({ donationHistory: history }),
      });

      setInsights(result);
      setIsLiveAI(true);
    } catch (err: any) {
      // Always show smart fallback insights even if API fails
      console.warn('Live AI unavailable, using fallback insights:', err);
      const fallback = buildFallbackInsights(donations);
      setInsights(fallback);
      setError('Generated smart insights from your donation data');
    } finally {
      setLoading(false);
    }
  };

  if (!insights && !loading) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-violet-200/50 dark:border-violet-800/50 bg-stone-950/90 p-5 shadow-xl shadow-violet-900/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.12),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(34,197,94,0.08),transparent_30%)]" />
        <div className="relative z-10 flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-violet-600/20 border border-violet-400/20 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/10">
            <Brain size={24} className="text-violet-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-stone-100">AI Waste Insights</h3>
              <span className="text-[10px] uppercase tracking-[0.2em] text-violet-300/80 bg-violet-500/10 border border-violet-400/15 rounded-full px-2 py-0.5">
                {isLiveAI ? 'Live AI' : 'Smart Mode'}
              </span>
            </div>
            <p className="text-sm font-medium text-stone-400">Analyze your donation patterns</p>
          </div>
        </div>
        {error && <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">{error}</p>}
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="relative z-10 w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-70 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-violet-900/20"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Lightbulb size={16} />
              Generate Insights
            </>
          )}
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
    <div className="relative overflow-hidden rounded-2xl border border-violet-200/50 dark:border-violet-800/50 bg-stone-950/90 p-5 shadow-xl shadow-violet-900/10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.12),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(34,197,94,0.08),transparent_30%)]" />
      <div className="relative z-10 flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-violet-600/20 border border-violet-400/20 rounded-xl shadow-inner">
            <Brain size={20} className="text-violet-300" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-stone-100">AI Waste Insights</h3>
            <p className="text-sm text-stone-400">{isLiveAI ? 'Live AI response' : 'Smart fallback available'}</p>
          </div>
        </div>
        <button onClick={handleAnalyze} className="p-2.5 text-violet-200 hover:text-white bg-violet-600/20 hover:bg-violet-600/30 border border-violet-400/15 transition-all rounded-xl shadow-sm active:scale-95">
          <RefreshCw size={16} />
        </button>
      </div>

      {error && (
        <p className="relative z-10 text-xs text-amber-200 mb-4 bg-amber-500/10 rounded-lg px-3 py-2 border border-amber-400/20">
          {error}
        </p>
      )}

      {insights?.summary && (
        <p className="relative z-10 text-sm text-stone-200 mb-4 bg-white/5 rounded-lg px-3 py-2 border border-white/10">
          {insights.summary}
        </p>
      )}

      <div className="relative z-10 space-y-3">
        {insights?.insights.map((insight, i) => (
          <div key={i} className="flex items-start gap-4 bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
            <span className="text-2xl shrink-0 mt-0.5 filter drop-shadow-sm">{insight.icon}</span>
            <div className="min-w-0">
              <p className="text-[15px] font-bold text-stone-100 leading-tight">{insight.title}</p>
              <p className="text-xs font-medium text-stone-300 mt-1.5 leading-relaxed">{insight.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WasteInsights;
