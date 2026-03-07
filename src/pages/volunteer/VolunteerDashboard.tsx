import React from 'react';
import { BarChart3, Utensils, Clock, Leaf, Award, TrendingUp, ArrowRight, MapPin, Package, Truck } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';

const weeklyData = [
  { day: 'Mon', meals: 12 }, { day: 'Tue', meals: 8 }, { day: 'Wed', meals: 15 },
  { day: 'Thu', meals: 6 }, { day: 'Fri', meals: 20 }, { day: 'Sat', meals: 18 }, { day: 'Sun', meals: 10 },
];

const recentActivity = [
  { id: '1', title: 'Picked up Veg Biryani', from: 'Green Leaf Bistro', time: '2h ago', plates: 8, icon: '🍛' },
  { id: '2', title: 'Delivered Pastries', from: 'Café Delight', time: '5h ago', plates: 12, icon: '🥐' },
  { id: '3', title: 'Rescued Dal & Bread', from: 'Spice Route Banquet', time: '1d ago', plates: 25, icon: '🍲' },
  { id: '4', title: 'Collected Sandwiches', from: 'Urban Bites', time: '2d ago', plates: 6, icon: '🥪' },
];

interface VolunteerDashboardProps {
  onGoToMap: () => void;
  availableCount?: number;
}

const VolunteerDashboard: React.FC<VolunteerDashboardProps> = ({ onGoToMap, availableCount = 4 }) => {
  const { user } = useAuth();

  const StatCard = ({ title, value, subtext, icon: Icon }: any) => (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 rounded-xl flex items-start justify-between hover:border-forest-200 dark:hover:border-forest-800 transition-colors shadow-sm">
      <div>
        <p className="text-stone-500 dark:text-stone-400 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-forest-900 dark:text-forest-400">{value}</h3>
        {subtext && <p className="text-stone-400 dark:text-stone-500 text-xs mt-2 font-medium">{subtext}</p>}
      </div>
      <div className="p-2 bg-stone-50 dark:bg-stone-800 rounded-lg text-forest-700 dark:text-forest-400">
        <Icon size={20} />
      </div>
    </div>
  );

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100 tracking-tight">Good afternoon, {user?.name || 'Volunteer'}.</h1>
        <p className="text-stone-500 dark:text-stone-400 mt-1">Here's your impact overview for today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Meals Rescued This Week" value="89" subtext="+12 from last week" icon={Utensils} />
        <StatCard title="Hours Volunteered" value="24.5h" subtext="Avg 3.5h per day" icon={Clock} />
        <StatCard title="Nearby Donations" value={`${availableCount} active`} subtext="Dadar, Mumbai area" icon={Package} />
      </div>

      <button onClick={onGoToMap} className="w-full bg-forest-50 dark:bg-forest-900/20 border border-forest-100 dark:border-forest-800 rounded-xl p-5 flex items-center gap-4 group hover:border-forest-200 dark:hover:border-forest-700 transition-all active:scale-[0.99]">
        <div className="p-3 bg-white dark:bg-stone-900 rounded-xl text-forest-600 dark:text-forest-400 shadow-sm border border-forest-100 dark:border-forest-800">
          <MapPin size={24} />
        </div>
        <div className="flex-1 text-left">
          <h3 className="font-semibold text-forest-900 dark:text-forest-300">{availableCount} donation{availableCount !== 1 ? 's' : ''} ready for pickup</h3>
          <p className="text-sm text-forest-700 dark:text-forest-400 mt-0.5">Open the rescue map to browse and accept pickups nearby.</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-forest-600 flex items-center justify-center text-white shadow-sm group-hover:bg-forest-700 transition-colors">
          <ArrowRight size={18} />
        </div>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-2">
              <BarChart3 size={18} className="text-forest-600 dark:text-forest-400" /> Weekly Impact
            </h3>
            <span className="text-xs font-bold text-forest-700 dark:text-forest-400 bg-forest-50 dark:bg-forest-900/30 px-2.5 py-1 rounded-lg flex items-center gap-1 border border-forest-100 dark:border-forest-800">
              <TrendingUp size={12} /> +23%
            </span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="colorMeals" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34ab72" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#34ab72" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#a8a29e', fontWeight: 600 }} />
              <YAxis hide />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e7e5e4', fontSize: '13px', fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }} />
              <Area type="monotone" dataKey="meals" stroke="#34ab72" strokeWidth={2.5} fill="url(#colorMeals)" dot={{ r: 4, fill: '#34ab72', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, fill: '#34ab72', strokeWidth: 3, stroke: '#fff' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center">
            <h3 className="font-semibold text-stone-800 dark:text-stone-200">Recent Activity</h3>
          </div>
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {recentActivity.map(a => (
              <div key={a.id} className="flex items-center gap-3.5 px-6 py-3.5 hover:bg-stone-50/50 dark:hover:bg-stone-800/50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 flex items-center justify-center text-lg">
                  {a.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-stone-900 dark:text-stone-100 text-sm truncate">{a.title}</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">{a.from} · {a.time}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-forest-700 dark:text-forest-400">{a.plates}</span>
                  <p className="text-[10px] text-stone-400 font-medium">plates</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolunteerDashboard;
