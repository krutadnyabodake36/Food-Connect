import React from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  Trophy, 
  TrendingUp, 
  Users, 
  Clock, 
  ArrowRight, 
  Package, 
  MapPin,
  Calendar
} from 'lucide-react';
import { User } from '../types';

interface DashboardProps {
  user: User;
  onNavigate: (view: 'map' | 'dashboard') => void;
}

const data = [
  { name: 'Mon', meals: 40 },
  { name: 'Tue', meals: 30 },
  { name: 'Wed', meals: 20 },
  { name: 'Thu', meals: 27 },
  { name: 'Fri', meals: 18 },
  { name: 'Sat', meals: 23 },
  { name: 'Sun', meals: 34 },
];

const Dashboard: React.FC<DashboardProps> = ({ user, onNavigate }) => {
  return (
    <div className="w-full h-full overflow-y-auto bg-slate-50 pb-24 pt-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Welcome Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Welcome back, {user.name.split(' ')[0]}! 👋
            </h1>
            <p className="text-slate-500 mt-1">
              Here's what's happening with your food rescue mission today.
            </p>
          </div>
          <button 
            onClick={() => onNavigate('map')}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/30 hover:bg-emerald-700 transition-all"
          >
            <MapPin className="w-5 h-5" />
            Find Donations
          </button>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Total Meals Saved" 
            value="1,248" 
            trend="+12%" 
            icon={<Package className="w-6 h-6 text-emerald-600" />} 
            color="emerald"
          />
          <StatCard 
            title="Hours Volunteered" 
            value="48.5" 
            trend="+2.4h" 
            icon={<Clock className="w-6 h-6 text-blue-600" />} 
            color="blue"
          />
          <StatCard 
            title="Impact Score" 
            value="850" 
            trend="Top 5%" 
            icon={<Trophy className="w-6 h-6 text-amber-500" />} 
            color="amber"
          />
          <StatCard 
            title="Community Reach" 
            value="12" 
            trend="New" 
            icon={<Users className="w-6 h-6 text-purple-600" />} 
            color="purple"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Chart Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900">Weekly Impact</h2>
              <select className="bg-slate-50 border-none text-sm font-medium text-slate-600 rounded-lg px-3 py-1 focus:ring-0 cursor-pointer hover:bg-slate-100 transition-colors">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>This Year</option>
              </select>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorMeals" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }} 
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{ stroke: '#10b981', strokeWidth: 2 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="meals" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorMeals)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900">Recent Activity</h2>
              <button className="text-sm font-medium text-emerald-600 hover:text-emerald-700">View All</button>
            </div>
            <div className="space-y-4">
              <ActivityItem 
                title="Picked up from Hilton"
                time="2 hours ago"
                desc="50 meals rescued"
                icon={<Package className="w-4 h-4 text-emerald-600" />}
                bg="bg-emerald-50"
              />
              <ActivityItem 
                title="New Badge Earned"
                time="Yesterday"
                desc="Silver Volunteer"
                icon={<Trophy className="w-4 h-4 text-amber-500" />}
                bg="bg-amber-50"
              />
              <ActivityItem 
                title="Community Event"
                time="2 days ago"
                desc="Food Drive at Central Park"
                icon={<Calendar className="w-4 h-4 text-blue-600" />}
                bg="bg-blue-50"
              />
              <ActivityItem 
                title="Profile Updated"
                time="3 days ago"
                desc="Added new vehicle details"
                icon={<Users className="w-4 h-4 text-purple-600" />}
                bg="bg-purple-50"
              />
            </div>
          </motion.div>
        </div>

        {/* Quick Actions Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-white relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Ready to make a difference?</h2>
              <p className="text-slate-300 max-w-xl">
                There are 15+ active donation requests in your area right now. 
                Start your route and help us reach our daily goal!
              </p>
            </div>
            <button 
              onClick={() => onNavigate('map')}
              className="px-6 py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-100 transition-colors flex items-center gap-2"
            >
              Start Now
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

const StatCard = ({ title, value, trend, icon, color }: any) => {
  const colorStyles = {
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  const trendStyles = {
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <motion.div 
      whileHover={{ y: -2 }}
      className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${colorStyles[color as keyof typeof colorStyles]}`}>
          {icon}
        </div>
        <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trendStyles[color as keyof typeof trendStyles]}`}>
          <TrendingUp className="w-3 h-3" />
          {trend}
        </span>
      </div>
      <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
    </motion.div>
  );
};

const ActivityItem = ({ title, time, desc, icon, bg }: any) => (
  <div className="flex items-start gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer group">
    <div className={`p-2.5 rounded-xl ${bg} group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-0.5">
        <h4 className="text-sm font-bold text-slate-900 truncate">{title}</h4>
        <span className="text-xs text-slate-400 whitespace-nowrap">{time}</span>
      </div>
      <p className="text-xs text-slate-500 truncate">{desc}</p>
    </div>
  </div>
);

export default Dashboard;
