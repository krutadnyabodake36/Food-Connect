import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Users, Utensils, Calendar, Award, Share2, ArrowUpRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const data = [
  { name: 'Mon', food: 40 },
  { name: 'Tue', food: 30 },
  { name: 'Wed', food: 60 },
  { name: 'Thu', food: 45 },
  { name: 'Fri', food: 80 },
  { name: 'Sat', food: 55 },
  { name: 'Sun', food: 70 },
];

const impactStats = [
  { label: 'Total Food Rescued', value: '1,240 kg', icon: Utensils, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  { label: 'People Fed', value: '3,500+', icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
  { label: 'CO2 Saved', value: '850 kg', icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-100' },
  { label: 'Streak', value: '12 Days', icon: Trophy, color: 'text-purple-600', bg: 'bg-purple-100' },
];

const Impact: React.FC = () => {
  return (
    <div className="w-full h-full overflow-y-auto bg-slate-50 pb-24 md:pb-0">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Your Impact</h1>
              <p className="text-slate-500 text-sm mt-1">Making a difference, one meal at a time.</p>
            </div>
            <button className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {impactStats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-3`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Weekly Activity */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-900">Weekly Activity</h3>
              <select className="bg-slate-50 border-none text-xs font-bold text-slate-600 rounded-lg px-3 py-1.5 outline-none">
                <option>This Week</option>
                <option>Last Week</option>
              </select>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorFood" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    cursor={{ stroke: '#059669', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area type="monotone" dataKey="food" stroke="#059669" strokeWidth={3} fillOpacity={1} fill="url(#colorFood)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Badges & Achievements */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-900">Recent Achievements</h3>
              <button className="text-emerald-600 text-xs font-bold hover:underline">View All</button>
            </div>
            
            <div className="space-y-4 flex-1">
              {[
                { title: 'Early Bird', desc: 'Completed 5 pickups before 9 AM', icon: Calendar, color: 'text-orange-500', bg: 'bg-orange-50' },
                { title: 'Super Hero', desc: 'Rescued 100kg of food in a month', icon: Award, color: 'text-blue-500', bg: 'bg-blue-50' },
                { title: 'Community Star', desc: 'Referred 3 new volunteers', icon: Users, color: 'text-purple-500', bg: 'bg-purple-50' },
              ].map((badge, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer group">
                  <div className={`w-12 h-12 ${badge.bg} ${badge.color} rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                    <badge.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 text-sm">{badge.title}</h4>
                    <p className="text-xs text-slate-500">{badge.desc}</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600" />
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Leaderboard Teaser */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <span className="text-yellow-400 font-bold tracking-wide text-sm uppercase">Top 5% Volunteer</span>
              </div>
              <h2 className="text-2xl font-bold mb-2">You're crushing it!</h2>
              <p className="text-slate-300 max-w-md text-sm">You've rescued more food than 95% of volunteers in your area this month. Keep up the great work!</p>
            </div>
            <button className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-100 transition-colors shadow-lg">
              View Leaderboard
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Impact;
