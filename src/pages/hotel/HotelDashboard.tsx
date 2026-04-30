import React from 'react';
import { HotelDonation } from '../../types';
import { Package, Utensils, Truck, MapPin } from 'lucide-react';
import WasteInsights from '../../components/hotel/WasteInsights';
import { motion } from 'framer-motion';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { findNearbyCharities } from '../../services/geminiService';

interface DashboardProps {
    donations: HotelDonation[];
}

interface NearbyCharity {
  name: string;
  uri?: string;
  latitude?: number;
  longitude?: number;
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
  const { user } = useAuth();
  const [nearbyCharities, setNearbyCharities] = React.useState<NearbyCharity[]>([]);
  const [groundingLoading, setGroundingLoading] = React.useState(false);
  const [nearbyError, setNearbyError] = React.useState<string | null>(null);
  const now = Date.now();

  const completedDonations = donations.filter(d => d.status === 'completed');
  const rescuedKg = completedDonations.reduce((acc, curr) => acc + curr.weight, 0);
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const weeklyRescuedKg = completedDonations
    .filter(d => (d.createdAt ? new Date(d.createdAt).getTime() : 0) >= weekAgo)
    .reduce((acc, curr) => acc + curr.weight, 0);
  const mealsServed = Math.floor(rescuedKg * 4);
  const nextPickup = donations.find(d => d.status === 'assigned');
  const greetingHour = new Date(now).getHours();
  const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 17 ? 'Good afternoon' : 'Good evening';
  const restaurantName = user?.hotelName || user?.name || 'Partner';
  const recentActivity = [...donations].sort((a, b) => new Date(b.createdAt || b.timestamp).getTime() - new Date(a.createdAt || a.timestamp).getTime()).slice(0, 5);

  const handleLocateCharities = async () => {
    setGroundingLoading(true);
    setNearbyError(null);
    console.log('[Dashboard] 📍 Locating nearby charities...');
    
    try {
      if (!("geolocation" in navigator)) {
        throw new Error("Geolocation is not supported by your browser");
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          console.log(`[Dashboard] 🗺️ Coordinates obtained: ${latitude}, ${longitude}`);
          
          try {
            const results = await findNearbyCharities(latitude, longitude);
            console.log(`[Dashboard] 🏢 Found ${results.length} charities`);
            
            if (results.length === 0) {
              setNearbyError("No partners found in your immediate vicinity.");
            } else {
              setNearbyCharities(results);
            }
          } catch (apiErr: any) {
            console.error('[Dashboard] ❌ Gemini Maps error:', apiErr);
            setNearbyError("Failed to search nearby partners. Please try again.");
          } finally {
            setGroundingLoading(false);
          }
        },
        (geoErr) => {
          console.error('[Dashboard] ❌ Geolocation error:', geoErr);
          let msg = "Could not get your location.";
          if (geoErr.code === 1) msg = "Location access denied. Please enable it in browser settings.";
          setNearbyError(msg);
          setGroundingLoading(false);
        },
        { timeout: 10000 }
      );
    } catch (err: any) {
      console.error('[Dashboard] ❌ Setup error:', err);
      setNearbyError(err.message || "An unexpected error occurred.");
      setGroundingLoading(false);
    }
  };

  const StatCard = ({ title, value, subtext, icon: Icon }: any) => (
    <motion.div 
      variants={itemVariants}
      whileHover={{ scale: 1.02, rotateX: 2, rotateY: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className="relative overflow-hidden rounded-3xl border border-emerald-500/25 bg-stone-950/90 p-6 flex items-start justify-between transition-colors cursor-pointer preserve-3d group shadow-2xl shadow-emerald-900/10"
    >
      <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-emerald-400/10 blur-2xl group-hover:scale-125 transition-transform duration-500" />
      <div style={{ transform: "translateZ(20px)" }}>
        <p className="text-stone-400 text-xs font-bold mb-2 tracking-[0.2em] uppercase">{title}</p>
        <h3 className="text-4xl leading-none font-black text-emerald-300 tabular-nums">{value}</h3>
        {subtext && <p className="text-stone-500 text-[11px] mt-3 font-semibold">{subtext}</p>}
      </div>
      <div style={{ transform: "translateZ(30px)" }} className="p-3.5 bg-emerald-900/40 rounded-2xl text-emerald-300 group-hover:scale-110 transition-transform shadow-inner border border-emerald-400/15">
        <Icon size={24} />
      </div>
    </motion.div>
  );

  const StatusBadge = ({ status }: { status: string }) => {
    if (status === 'assigned') return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-900/30 text-amber-400 border border-amber-800/50"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>Assigned</span>;
    if (status === 'completed') return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-900/30 text-emerald-400 border border-emerald-800/50"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Completed</span>;
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-stone-800 text-stone-400 border border-stone-700"><span className="w-1.5 h-1.5 rounded-full bg-stone-500"></span>Pending</span>;
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 animate-mesh-bg p-6 lg:p-10 rounded-[2.5rem] my-4 shadow-2xl border border-white/10"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight animate-gradient-text">{greeting}, {restaurantName}.</h1>
        <p className="text-stone-500 dark:text-stone-400 mt-2 font-medium">Live impact network updates synced currently.</p>
      </motion.div>


      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Rescued" value={rescuedKg.toFixed(1)} subtext={`+${weeklyRescuedKg.toFixed(1)} this week`} icon={Package} />
        <StatCard title="Meals Served" value={mealsServed} subtext="Converted from all tracked units" icon={Utensils} />
        <StatCard title="Next Pickup" value={nextPickup ? nextPickup.pickupWindow : "None"} subtext={nextPickup ? `Volunteer: ${nextPickup.assignedVolunteer?.name || 'Assigned'}` : "All clear"} icon={Truck} />
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
                    <td className="px-6 py-4 font-medium text-stone-600 dark:text-stone-400">{donation.weight} {donation.quantityUnit || 'kg'}</td>
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
                        <span className="text-xs text-forest-500 dark:text-forest-400">Open in Maps/Site &rarr;</span>
                          </a>
                      ))}
                  </div>
                ) : null}
                {nearbyError && (
                  <p className="text-xs text-amber-700 dark:text-amber-400 mb-3 bg-amber-50/70 dark:bg-amber-900/20 rounded-lg px-3 py-2 border border-amber-200/50 dark:border-amber-700/40">
                    {nearbyError}
                  </p>
                )}
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
