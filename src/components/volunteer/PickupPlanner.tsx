import React, { useState } from 'react';
import { Route, Loader2, MapPin, Clock, Lightbulb, X, Zap } from 'lucide-react';
import { planPickupRoute, PickupPlan } from '../../lib/openrouter';
import { VolunteerDonation } from '../../types';

interface PickupPlannerProps {
  donations: VolunteerDonation[];
  userLat: number;
  userLng: number;
  onSelectDonation: (id: string) => void;
  onClose: () => void;
}

const PickupPlanner: React.FC<PickupPlannerProps> = ({ donations, userLat, userLng, onSelectDonation, onClose }) => {
  const [plan, setPlan] = useState<PickupPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePlan = async () => {
    if (donations.length < 2) {
      setError('Need at least 2 donations to plan a route.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const donationData = donations.map(d => ({
        id: d.id,
        title: d.title,
        weight: d.weight,
        tags: d.tags,
        lat: d.lat,
        lng: d.lng,
        isUrgent: d.isUrgent,
        pickupWindow: d.pickupWindow,
      }));
      const result = await planPickupRoute(donationData, userLat, userLng);
      setPlan(result);
    } catch (err: any) {
      setError(err.message || 'Failed to plan route');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl overflow-hidden max-h-[70vh] flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-blue-100 dark:bg-blue-800/50 rounded-xl flex items-center justify-center">
            <Route size={18} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm">AI Pickup Planner</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">{donations.length} donations available</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {!plan && !loading && (
          <div className="text-center py-4">
            <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">
              AI will analyze locations, urgency, and food type to suggest the most efficient pickup route.
            </p>
            {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
            <button
              onClick={handlePlan}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2 mx-auto"
            >
              <Zap size={16} />
              Optimize Route
            </button>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Loader2 size={28} className="animate-spin text-blue-600 dark:text-blue-400" />
            <p className="text-sm text-stone-600 dark:text-stone-400 font-medium">Planning optimal route...</p>
          </div>
        )}

        {plan && (
          <div className="space-y-3">
            {/* Route Steps */}
            {plan.route.map((stop, i) => (
              <button
                key={stop.donationId}
                onClick={() => onSelectDonation(stop.donationId)}
                className="w-full text-left flex items-start gap-3 p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-100 dark:border-stone-700/50 hover:border-blue-200 dark:hover:border-blue-800 transition-colors group"
              >
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800/50 rounded-full flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-sm flex-shrink-0">
                  {stop.order}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-900 dark:text-stone-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors truncate">
                    {stop.title}
                  </p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{stop.reason}</p>
                </div>
                <MapPin size={14} className="text-stone-400 mt-1 flex-shrink-0" />
              </button>
            ))}

            {/* Summary */}
            <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/40">
              <Clock size={16} className="text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                Estimated: {plan.totalEstimatedMinutes} min total
              </span>
            </div>

            {/* AI Tip */}
            {plan.tip && (
              <div className="flex items-start gap-2.5 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800/40">
                <Lightbulb size={16} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 dark:text-amber-300">{plan.tip}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PickupPlanner;
