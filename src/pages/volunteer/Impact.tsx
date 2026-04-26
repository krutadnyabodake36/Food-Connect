import React, { useMemo } from 'react';
import { Leaf, Droplets, Zap, TrendingUp, Award, Heart, Trophy, CheckCircle } from 'lucide-react';
import { useDonations } from '../../contexts/DonationContext';
import { useAuth } from '../../contexts/AuthContext';

const Impact: React.FC = () => {
  const { user } = useAuth();
  const { donations } = useDonations();

  const impact = useMemo(() => {
    const mineCompleted = donations.filter(
      (d) => d.status === 'completed' && d.assignedVolunteer?.id === user?.id,
    );

    const mineThisWeek = mineCompleted.filter((d) => {
      if (!d.createdAt) return false;
      const ageMs = Date.now() - new Date(d.createdAt).getTime();
      return ageMs <= 7 * 24 * 60 * 60 * 1000;
    });

    const rescuedKg = mineCompleted.reduce((sum, d) => sum + (d.weight || 0), 0);
    const weeklyKg = mineThisWeek.reduce((sum, d) => sum + (d.weight || 0), 0);
    const peopleFed = Math.round(rescuedKg * 2.2);
    const weeklyPeople = Math.round(weeklyKg * 2.2);
    const co2Saved = rescuedKg * 0.9;
    const waterSaved = Math.round(rescuedKg * 240);
    const energySaved = rescuedKg * 1.6;

    const score = Math.min(100, Math.round(rescuedKg * 2 + mineCompleted.length * 4));
    const scoreLabel = score >= 85 ? 'A+' : score >= 70 ? 'A' : score >= 55 ? 'B+' : score >= 40 ? 'B' : 'C';
    const rankText = score >= 85 ? 'top 10%' : score >= 70 ? 'top 20%' : score >= 55 ? 'top 35%' : 'growing';

    const milestones = [
      { label: 'First Rescue', done: mineCompleted.length >= 1, icon: '🌱', progress: Math.min(100, mineCompleted.length * 100) },
      { label: '10 Meals Saved', done: peopleFed >= 10, icon: '🍽️', progress: Math.min(100, Math.round((peopleFed / 10) * 100)) },
      { label: '50 Meals Saved', done: peopleFed >= 50, icon: '⭐', progress: Math.min(100, Math.round((peopleFed / 50) * 100)) },
      { label: '100 Kg Rescued', done: rescuedKg >= 100, icon: '🏆', progress: Math.min(100, Math.round((rescuedKg / 100) * 100)) },
      { label: '500 Meals Legend', done: peopleFed >= 500, icon: '👑', progress: Math.min(100, Math.round((peopleFed / 500) * 100)) },
    ];

    return {
      rescuedKg,
      weeklyKg,
      peopleFed,
      weeklyPeople,
      co2Saved,
      waterSaved,
      energySaved,
      score,
      scoreLabel,
      rankText,
      milestones,
      streakDays: Math.min(14, mineThisWeek.length),
    };
  }, [donations, user?.id]);

  const impacts = [
    { icon: Heart, label: 'People Fed', value: `${impact.peopleFed}`, change: `+${impact.weeklyPeople} this week`, badgeColor: 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800', iconBg: 'bg-rose-50 dark:bg-rose-900/30', iconColor: 'text-rose-600 dark:text-rose-400' },
    { icon: Leaf, label: 'CO₂ Saved', value: `${impact.co2Saved.toFixed(1)} kg`, change: `+${(impact.weeklyKg * 0.9).toFixed(1)} kg`, badgeColor: 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800', iconBg: 'bg-green-50 dark:bg-green-900/30', iconColor: 'text-green-600 dark:text-green-400' },
    { icon: Droplets, label: 'Water Conserved', value: `${impact.waterSaved.toLocaleString()} L`, change: `+${Math.round(impact.weeklyKg * 240).toLocaleString()} L`, badgeColor: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800', iconBg: 'bg-blue-50 dark:bg-blue-900/30', iconColor: 'text-blue-600 dark:text-blue-400' },
    { icon: Zap, label: 'Energy Saved', value: `${impact.energySaved.toFixed(1)} kWh`, change: `+${(impact.weeklyKg * 1.6).toFixed(1)} kWh`, badgeColor: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800', iconBg: 'bg-amber-50 dark:bg-amber-900/30', iconColor: 'text-amber-600 dark:text-amber-400' },
  ];

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100 tracking-tight">Your Impact</h1>
        <p className="text-stone-500 dark:text-stone-400 mt-1">See how your contributions are making a difference.</p>
      </div>

      <div className="bg-forest-50 dark:bg-forest-900/20 border border-forest-100 dark:border-forest-800 rounded-xl p-6 flex items-center gap-5">
        <div className="p-3 bg-white dark:bg-stone-900 rounded-full text-forest-600 dark:text-forest-400 shadow-sm border border-forest-100 dark:border-forest-800">
          <Award size={28} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-forest-900 dark:text-forest-300">Impact Score</h3>
          <p className="text-forest-700 dark:text-forest-400 text-sm mt-0.5">Based on your completed pickups and rescued food volume.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-4xl font-bold text-forest-800 dark:text-forest-300">{impact.scoreLabel}</span>
          <span className="text-xs font-bold text-forest-600 dark:text-forest-400 bg-white dark:bg-stone-900 border border-forest-200 dark:border-forest-800 px-2 py-1 rounded-lg flex items-center gap-1">
            <TrendingUp size={12} /> {impact.rankText}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {impacts.map((item, idx) => (
          <div key={idx} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 shadow-sm hover:border-forest-200 dark:hover:border-forest-800 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-lg ${item.iconBg} flex items-center justify-center`}>
                <item.icon size={18} className={item.iconColor} />
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${item.badgeColor}`}>{item.change}</span>
            </div>
            <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">{item.value}</p>
            <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
            <h3 className="font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-2"><Trophy size={18} className="text-forest-600 dark:text-forest-400" /> Milestones</h3>
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400">{impact.milestones.filter(m => m.done).length} / {impact.milestones.length} completed</span>
          </div>
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {impact.milestones.map((m, idx) => (
              <div key={idx} className="flex items-center gap-4 px-6 py-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${m.done ? 'bg-forest-50 dark:bg-forest-900/30 border border-forest-100 dark:border-forest-800' : 'bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700'}`}>
                  {m.icon}
                </div>
                <div className="flex-1">
                  <span className={`text-sm font-medium ${m.done ? 'text-stone-900 dark:text-stone-100' : 'text-stone-500 dark:text-stone-400'}`}>{m.label}</span>
                  {!m.done && (
                    <div className="mt-1.5 h-1.5 bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden">
                      <div className="h-full bg-forest-500 rounded-full" style={{ width: `${m.progress}%` }} />
                    </div>
                  )}
                </div>
                {m.done ? <CheckCircle size={20} className="text-forest-600 dark:text-forest-400" /> : <span className="text-xs font-bold text-stone-400">{m.progress}%</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-5">
            <div className="text-3xl mb-3">🔥</div>
            <p className="font-bold text-stone-900 dark:text-stone-100 text-lg">{impact.streakDays}-Day Activity Streak</p>
            <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">Calculated from your completed pickups in the last 7 days.</p>
          </div>
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-3">Environmental Impact</p>
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-sm text-stone-600 dark:text-stone-400">Trees equivalent</span><span className="text-sm font-bold text-forest-800 dark:text-forest-400">{(impact.co2Saved / 20).toFixed(1)} trees</span></div>
              <div className="flex justify-between"><span className="text-sm text-stone-600 dark:text-stone-400">Cars off road</span><span className="text-sm font-bold text-forest-800 dark:text-forest-400">{(impact.co2Saved / 8).toFixed(1)} hrs</span></div>
              <div className="flex justify-between"><span className="text-sm text-stone-600 dark:text-stone-400">Landfill saved</span><span className="text-sm font-bold text-forest-800 dark:text-forest-400">{impact.rescuedKg.toFixed(1)} kg</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Impact;
