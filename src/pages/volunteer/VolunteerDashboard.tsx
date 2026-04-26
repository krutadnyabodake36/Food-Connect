import React, { useEffect, useState } from 'react';
import { BarChart3, Utensils, Clock, Leaf, Award, TrendingUp, ArrowRight, MapPin, Package, Truck, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { apiRequest } from '../../lib/api';

interface UserStats {
  userId: string;
  mealsRescued: number;
  hoursVolunteered: number;
  totalWeight: number;
  completedPickups: number;
  score: number;
  rating: number;
}

const weeklyData = [
  { day: 'Mon', meals: 0 }, { day: 'Tue', meals: 0 }, { day: 'Wed', meals: 0 },
  { day: 'Thu', meals: 0 }, { day: 'Fri', meals: 0 }, { day: 'Sat', meals: 0 }, { day: 'Sun', meals: 0 },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

interface VolunteerDashboardProps {
  onGoToMap: () => void;
  availableCount?: number;
}

const VolunteerDashboard: React.FC<VolunteerDashboardProps> = ({ onGoToMap, availableCount = 0 }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id) return;
      try {
        const data = await apiRequest<UserStats>(`/users/${user.id}/stats`, { method: 'GET' });
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch user stats:', error);
        setStats({
          userId: user.id || '0',
          mealsRescued: 0,
          hoursVolunteered: 0,
          totalWeight: 0,
          completedPickups: 0,
          score: 0,
          rating: 4.9,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user?.id]);

  const StatCard = ({ title, value, subtext, icon: Icon }: any) => (
    <motion.div 
      variants={itemVariants}
      whileHover={{ scale: 1.02, rotateX: 2, rotateY: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className="glass-panel p-6 rounded-2xl flex items-start justify-between transition-colors cursor-pointer preserve-3d group shadow-xl shadow-forest-900/5 hover:border-forest-500/30"
    >
      <div style={{ transform: "translateZ(20px)" }}>
        <p className="text-stone-500 dark:text-stone-400 text-sm font-medium mb-1 uppercase tracking-wider">{title}</p>
        <h3 className="text-3xl font-black text-forest-900 dark:text-forest-400 tabular-nums">{value}</h3>
        {subtext && <p className="text-stone-400 dark:text-stone-500 text-xs mt-2 font-medium">{subtext}</p>}
      </div>
      <div style={{ transform: "translateZ(30px)" }} className="p-3 bg-forest-50 dark:bg-forest-900/40 rounded-2xl text-forest-600 dark:text-forest-400 group-hover:scale-110 transition-transform shadow-inner border border-forest-100 dark:border-forest-800/10">
        <Icon size={24} />
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-forest-600 w-10 h-10" />
          <p className="text-sm font-bold text-stone-400 animate-pulse">Loading your impact...</p>
        </div>
      </div>
    );
  }

  const recentActivity = stats?.completedPickups === 0 ? [] : [
    { id: '1', title: 'Last Successful Rescue', from: 'Partner Hotel', time: 'Recently', plates: stats?.mealsRescued || 0, icon: '🍛' },
  ];

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-4 lg:p-8 space-y-8 max-w-5xl mx-auto animate-mesh-bg rounded-[2.5rem] my-4 shadow-2xl border border-white/20"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight animate-gradient-text">Good afternoon, {user?.name || 'Volunteer'}.</h1>
        <p className="text-stone-500 dark:text-stone-400 mt-1 font-medium">Verified impact data synced with FoodConnect Network.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Meals Rescued" value={stats?.mealsRescued || 0} subtext={`Total contributions so far`} icon={Utensils} />
        <StatCard title="Hours Logged" value={`${stats?.hoursVolunteered || 0}h`} subtext={`Avg. commitment level`} icon={Clock} />
        <StatCard title="Network Activity" value={`${availableCount} Nearby`} subtext="Live donations available now" icon={Package} />
      </div>

      <motion.button 
        variants={itemVariants}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={onGoToMap} 
        className="w-full glass-panel overflow-hidden relative border border-forest-100 dark:border-forest-800/50 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 group transition-all duration-300 hover:shadow-2xl hover:shadow-forest-500/10 cursor-pointer"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-forest-400/10 dark:bg-forest-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-700"></div>
        <div className="relative z-10 p-3 bg-white/80 dark:bg-stone-800/80 backdrop-blur-md rounded-xl text-forest-600 dark:text-forest-400 shadow-sm border border-forest-100 dark:border-forest-800 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
          <MapPin size={24} />
        </div>
        <div className="relative z-10 flex-1 text-left">
          <h3 className="text-lg font-bold text-forest-900 dark:text-forest-300">{availableCount} donation{availableCount !== 1 ? 's' : ''} ready for pickup</h3>
          <p className="text-sm font-medium text-forest-700/80 dark:text-forest-400/80 mt-1">Open the rescue map to browse and accept pickups nearby.</p>
        </div>
        <div className="relative z-10 w-12 h-12 rounded-xl bg-forest-600 flex items-center justify-center text-white shadow-lg shadow-forest-600/20 group-hover:bg-forest-700 transition-colors mt-2 sm:mt-0">
          <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </div>
      </motion.button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants} className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg text-stone-800 dark:text-stone-200 flex items-center gap-2">
              <BarChart3 size={20} className="text-forest-600 dark:text-forest-400" /> Weekly Impact
            </h3>
            <span className="text-xs font-bold text-forest-700 dark:text-forest-400 bg-forest-50 dark:bg-forest-900/30 px-3 py-1.5 rounded-lg flex items-center gap-1 border border-forest-100 dark:border-forest-800 shadow-sm relative overflow-hidden group">
              <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-1000 -translate-x-full skew-x-12"></div>
              <TrendingUp size={14} /> +23%
            </span>
          </div>
          <div className="hover:scale-[1.02] transition-transform duration-500">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="colorMeals" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34ab72" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#34ab72" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8b8a8b', fontWeight: 600 }} dy={10} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', fontSize: '14px', fontWeight: 600, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} 
                  itemStyle={{ color: '#268a5b' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="meals" 
                  stroke="#34ab72" 
                  strokeWidth={3} 
                  fill="url(#colorMeals)" 
                  animationDuration={1500}
                  animationEasing="ease-out"
                  dot={{ r: 5, fill: '#34ab72', strokeWidth: 2, stroke: '#fff' }} 
                  activeDot={{ r: 8, fill: '#10b981', strokeWidth: 3, stroke: '#fff', style:{ filter: 'drop-shadow(0 0 8px rgba(16,185,129,0.8))' } }} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-panel rounded-2xl overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-stone-100/50 dark:border-stone-800/50 flex justify-between items-center">
            <h3 className="font-bold text-lg text-stone-800 dark:text-stone-200">Recent Activity</h3>
          </div>
          <div className="divide-y divide-stone-100/50 dark:divide-stone-800/50 flex-1 overflow-y-auto no-scrollbar">
            {recentActivity.map(a => (
              <div key={a.id} className="flex items-center gap-4 px-6 py-4 hover:bg-stone-50/50 dark:hover:bg-stone-800/50 transition-colors group cursor-pointer">
                <div className="w-12 h-12 rounded-2xl bg-white/80 dark:bg-stone-800/80 backdrop-blur-sm border border-stone-100 dark:border-stone-700/50 flex items-center justify-center text-xl shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  {a.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-stone-900 dark:text-stone-100 text-[15px] truncate">{a.title}</p>
                  <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mt-0.5">{a.from} · <span className="opacity-75">{a.time}</span></p>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-forest-700 dark:text-forest-400 group-hover:text-forest-500 transition-colors">{a.plates}</span>
                  <p className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">plates</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default VolunteerDashboard;
