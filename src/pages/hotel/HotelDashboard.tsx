import React from 'react';
import { HotelDonation } from '../../types';
import { Package, Utensils, Truck, MapPin } from 'lucide-react';
import WasteInsights from '../../components/hotel/WasteInsights';

interface DashboardProps {
    donations: HotelDonation[];
}

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

  const StatusBadge = ({ status }: { status: string }) => {
    if (status === 'assigned') return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-800"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Assigned</span>;
    if (status === 'completed') return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Completed</span>;
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700"><span className="w-1.5 h-1.5 rounded-full bg-stone-500"></span>Pending</span>;
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100 tracking-tight">Good afternoon, Partner.</h1>
        <p className="text-stone-500 dark:text-stone-400 mt-1">Here's your impact overview for today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Food Rescued" value={`${rescuedKg} kg`} subtext="+45 kg this week" icon={Package} />
        <StatCard title="Meals Served" value={mealsServed} subtext="~4 meals per kg" icon={Utensils} />
        <StatCard title="Next Pickup" value={nextPickup ? nextPickup.pickupWindow : "No pending pickups"} subtext={nextPickup ? `Volunteer: ${nextPickup.assignedVolunteer?.name || 'Assigned'}` : "All clear"} icon={Truck} />
      </div>

      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center">
          <h3 className="font-semibold text-stone-800 dark:text-stone-200">Recent Activity</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-stone-50 dark:bg-stone-950 text-stone-500 dark:text-stone-400 font-medium">
              <tr><th className="px-6 py-3">Donation</th><th className="px-6 py-3">Weight</th><th className="px-6 py-3">Status</th><th className="px-6 py-3 text-right">Time</th></tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {recentActivity.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-stone-400">No recent activity</td></tr>
              ) : (
                recentActivity.map((donation) => (
                  <tr key={donation.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-stone-900 dark:text-stone-200">{donation.title}</div>
                      <div className="flex gap-2 mt-1">{donation.tags.map(tag => (<span key={tag} className="text-xs text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded">{tag}</span>))}</div>
                    </td>
                    <td className="px-6 py-4 text-stone-600 dark:text-stone-400">{donation.weight} kg</td>
                    <td className="px-6 py-4"><StatusBadge status={donation.status} /></td>
                    <td className="px-6 py-4 text-right text-stone-500 dark:text-stone-400">{donation.timestamp}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Waste Insights */}
      <WasteInsights donations={donations} />
      
       <div className="bg-forest-50 dark:bg-forest-900/20 border border-forest-100 dark:border-forest-800/50 rounded-xl p-6">
          <div className="flex items-start gap-4">
             <div className="p-3 bg-white dark:bg-stone-800 rounded-full text-forest-600 dark:text-forest-400 shadow-sm"><MapPin size={24} /></div>
             <div className="flex-1">
                 <h3 className="font-semibold text-forest-900 dark:text-forest-200">Partner Charity Network</h3>
                 <p className="text-forest-700 dark:text-forest-400 text-sm mt-1 mb-4">Verify nearby distribution centers and food banks.</p>
                 {nearbyCharities.length > 0 ? (
                    <div className="grid gap-3 mb-4">
                        {nearbyCharities.map((place, idx) => (
                            <a href={place.uri} target="_blank" rel="noreferrer" key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-stone-800 rounded-lg border border-forest-100 dark:border-forest-800 hover:border-forest-300 transition-colors">
                                <span className="font-medium text-forest-800 dark:text-forest-200">{place.name}</span>
                                <span className="text-xs text-forest-500 dark:text-forest-400">View Map &rarr;</span>
                            </a>
                        ))}
                    </div>
                 ) : null}
                 <button onClick={handleLocateCharities} disabled={groundingLoading} className="text-sm font-medium bg-forest-600 text-white px-4 py-2 rounded-lg hover:bg-forest-700 transition-colors disabled:opacity-50">
                    {groundingLoading ? 'Locating...' : 'Find Nearby Partners'}
                 </button>
             </div>
          </div>
       </div>
    </div>
  );
};

export default HotelDashboard;
