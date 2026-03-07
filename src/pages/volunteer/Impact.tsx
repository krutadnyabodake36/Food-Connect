import React from 'react';
import { Leaf, Droplets, Zap, TrendingUp, Award, Heart, Trophy, CheckCircle } from 'lucide-react';

const impacts = [
  { icon: Heart, label: 'People Fed', value: '320', change: '+28 this week', badgeColor: 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800', iconBg: 'bg-rose-50 dark:bg-rose-900/30', iconColor: 'text-rose-600 dark:text-rose-400' },
  { icon: Leaf, label: 'CO₂ Saved', value: '45 kg', change: '+3.2 kg', badgeColor: 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800', iconBg: 'bg-green-50 dark:bg-green-900/30', iconColor: 'text-green-600 dark:text-green-400' },
  { icon: Droplets, label: 'Water Conserved', value: '12,000 L', change: '+890 L', badgeColor: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800', iconBg: 'bg-blue-50 dark:bg-blue-900/30', iconColor: 'text-blue-600 dark:text-blue-400' },
  { icon: Zap, label: 'Energy Saved', value: '89 kWh', change: '+6.5 kWh', badgeColor: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800', iconBg: 'bg-amber-50 dark:bg-amber-900/30', iconColor: 'text-amber-600 dark:text-amber-400' },
];

const milestones = [
  { label: 'First Rescue', done: true, icon: '🌱' },
  { label: '10 Meals Saved', done: true, icon: '🍽️' },
  { label: '50 Meals Saved', done: true, icon: '⭐' },
  { label: '100 Hours Volunteering', done: false, icon: '🏆', progress: 65 },
  { label: '500 Meals Legend', done: false, icon: '👑', progress: 18 },
];

const Impact: React.FC = () => {
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
          <p className="text-forest-700 dark:text-forest-400 text-sm mt-0.5">You're in the top 5% of volunteers in Mumbai.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-4xl font-bold text-forest-800 dark:text-forest-300">A+</span>
          <span className="text-xs font-bold text-forest-600 dark:text-forest-400 bg-white dark:bg-stone-900 border border-forest-200 dark:border-forest-800 px-2 py-1 rounded-lg flex items-center gap-1">
            <TrendingUp size={12} /> Top 5%
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
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400">3 / 5 completed</span>
          </div>
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {milestones.map((m, idx) => (
              <div key={idx} className="flex items-center gap-4 px-6 py-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${m.done ? 'bg-forest-50 dark:bg-forest-900/30 border border-forest-100 dark:border-forest-800' : 'bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700'}`}>
                  {m.icon}
                </div>
                <div className="flex-1">
                  <span className={`text-sm font-medium ${m.done ? 'text-stone-900 dark:text-stone-100' : 'text-stone-500 dark:text-stone-400'}`}>{m.label}</span>
                  {!m.done && m.progress !== undefined && (
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
            <p className="font-bold text-stone-900 dark:text-stone-100 text-lg">7-Day Streak!</p>
            <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">You've volunteered every day this week. Keep it up!</p>
          </div>
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-3">Environmental Impact</p>
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-sm text-stone-600 dark:text-stone-400">Trees equivalent</span><span className="text-sm font-bold text-forest-800 dark:text-forest-400">2.3 trees</span></div>
              <div className="flex justify-between"><span className="text-sm text-stone-600 dark:text-stone-400">Cars off road</span><span className="text-sm font-bold text-forest-800 dark:text-forest-400">0.8 hrs</span></div>
              <div className="flex justify-between"><span className="text-sm text-stone-600 dark:text-stone-400">Landfill saved</span><span className="text-sm font-bold text-forest-800 dark:text-forest-400">89 kg</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Impact;
