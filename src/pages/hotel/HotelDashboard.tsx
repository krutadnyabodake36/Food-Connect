import React from 'react';
import { HotelDonation } from '../../types';
import { Package, Utensils, Truck, MapPin } from 'lucide-react';
import WasteInsights from '../../components/hotel/WasteInsights';
import { motion } from 'framer-motion';

interface DashboardProps {
    donations: HotelDonation[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const HotelDashboard: React.FC<DashboardProps> = ({ donations }) => {
  const [nearbyCharities, setNearbyCharities] = React.useState<any[]>([]);
  const [groundingLoading, setGroundingLoading] = React.useState(false);

  const completedDonations = donations.filter(d => d.status === 'completed');
  const rescuedKg = completedDonations.reduce((acc, curr) => acc + curr.weight, 450);
  const mealsServed = Math.floor(rescuedKg * 4);
  const nextPickup = donations.find(d => d.status === 'assigned');
  const recentActivity = [...donations].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);

  const handleLocateCharities = async () => {
    setGroundingLoading(true);
    try {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                // Charity locator disabled (was Gemini-powered)
                setGroundingLoading(false);
            }, () => { setGroundingLoading(false); alert("Could not get location"); });
        }
    } catch (e) { console.error(e); setGroundingLoading(false); }
  }

  const StatCard = ({ title, value, subtext, icon: Icon }: any) => (
    <motion.div 
      variants={itemVariants}
      whileHover={{ scale: 1.02, rotateX: 2, rotateY: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className="glass-panel p-6 rounded-2xl flex items-start justify-between transition-colors cursor-pointer preserve-3d group"
    >
      <div style={{ transform: "translateZ(20px)" }}>
        <p className="text-stone-500 dark:text-stone-400 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-forest-900 dark:text-forest-400">{value}</h3>
        {subtext && <p className="text-stone-400 dark:text-stone-500 text-xs mt-2 font-medium">{subtext}</p>}
      </div>
      <div style={{ transform: "translateZ(30px)" }} className="p-2.5 bg-forest-50 dark:bg-forest-900/40 rounded-xl text-forest-600 dark:text-forest-400 group-hover:scale-110 transition-transform shadow-inner">
        <Icon size={24} />
      </div>
    </motion.div>
  );

  const StatusBadge = ({ status }: { status: string }) => {
    if (status === 'assigned') return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-800"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Assigned</span>;
    if (status === 'completed') return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Completed</span>;
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700"><span className="w-1.5 h-1.5 rounded-full bg-stone-500"></span>Pending</span>;
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold tracking-tight animate-gradient-text">Good afternoon, Partner.</h1>
        <p className="text-stone-500 dark:text-stone-400 mt-1">Here's your impact overview for today.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Food Rescued" value={`${rescuedKg} kg`} subtext="+45 kg this week" icon={Package} />
        <StatCard title="Meals Served" value={mealsServed} subtext="~4 meals per kg" icon={Utensils} />
        <StatCard title="Next Pickup" value={nextPickup ? nextPickup.pickupWindow : "No pending pickups"} subtext={nextPickup ? `Volunteer: ${nextPickup.assignedVolunteer?.name || 'Assigned'}` : "All clear"} icon={Truck} />
      </div>

      <motion.div variants={itemVariants} className="glass-panel rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center">
          <h3 className="font-semibold text-stone-800 dark:text-stone-200">Recent Activity</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-stone-50/50 dark:bg-stone-950/50 text-stone-500 dark:text-stone-400 font-medium">
              <tr><th className="px-6 py-3">Donation</th><th className="px-6 py-3">Weight</th><th className="px-6 py-3">Status</th><th className="px-6 py-3 text-right">Time</th></tr>
            </thead>
            <tbody className="divide-y divide-stone-100/50 dark:divide-stone-800/50">
              {recentActivity.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-stone-400">No recent activity</td></tr>
              ) : (
                recentActivity.map((donation) => (
                  <tr key={donation.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-stone-900 dark:text-stone-200">{donation.title}</div>
                      <div className="flex gap-2 mt-1">{donation.tags.map(tag => (<span key={tag} className="text-[10px] uppercase tracking-wider font-semibold text-stone-500 dark:text-stone-400 bg-stone-100/80 dark:bg-stone-800 backdrop-blur-md px-1.5 py-0.5 rounded shadow-sm">{tag}</span>))}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-stone-600 dark:text-stone-400">{donation.weight} kg</td>
                    <td className="px-6 py-4"><StatusBadge status={donation.status} /></td>
                    <td className="px-6 py-4 text-right text-stone-500 dark:text-stone-400">{donation.timestamp}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* AI Waste Insights */}
      <motion.div variants={itemVariants}>
        <WasteInsights donations={donations} />
      </motion.div>
      
      <motion.div variants={itemVariants} className="glass-panel overflow-hidden relative border border-forest-100 dark:border-forest-800/50 rounded-2xl p-6 group cursor-pointer hover:shadow-2xl hover:shadow-forest-500/10 transition-all duration-300">
        <div className="absolute top-0 right-0 w-64 h-64 bg-forest-400/10 dark:bg-forest-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-700"></div>
        <div className="relative z-10 flex items-start gap-4">
            <div className="p-3 bg-white/80 dark:bg-stone-800/80 backdrop-blur-md rounded-xl text-forest-600 dark:text-forest-400 shadow-lg shadow-forest-500/20 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
              <MapPin size={24} />
            </div>
            <div className="flex-1">
                <h3 className="font-semibold text-lg text-forest-900 dark:text-forest-200">Partner Charity Network</h3>
                <p className="text-forest-700/80 dark:text-forest-400/80 text-sm mt-1 mb-4">Verify nearby distribution centers and food banks.</p>
                {nearbyCharities.length > 0 ? (
                  <div className="grid gap-3 mb-4">
                      {nearbyCharities.map((place, idx) => (
                          <a href={place.uri} target="_blank" rel="noreferrer" key={idx} className="flex items-center justify-between p-3 bg-white/50 dark:bg-stone-800/50 backdrop-blur-sm rounded-lg border border-forest-100 dark:border-forest-800 hover:border-forest-300 dark:hover:border-forest-600 transition-colors shadow-sm cursor-pointer">
                              <span className="font-medium text-forest-800 dark:text-forest-200">{place.name}</span>
                              <span className="text-xs text-forest-500 dark:text-forest-400">View Map &rarr;</span>
                          </a>
                      ))}
                  </div>
                ) : null}
                <button onClick={handleLocateCharities} disabled={groundingLoading} className="text-sm font-bold bg-forest-600 text-white px-5 py-2.5 rounded-xl hover:bg-forest-700 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-forest-600/20">
                  {groundingLoading ? 'Locating...' : 'Find Nearby Partners'}
                </button>
            </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default HotelDashboard;
