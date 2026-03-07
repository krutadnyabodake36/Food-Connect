import React, { useState } from 'react';
import { Donation, Volunteer } from '../types';
import { Clock, MapPin, User, Check, X, Phone, ShieldCheck, CheckCircle2, Loader2, Pencil, Calendar, Navigation, AlertTriangle } from 'lucide-react';
import LiveMap from '../components/LiveMap';

interface RequestsProps {
  donations: Donation[];
  onAccept: (donationId: string) => void;
  onReject: (donationId: string) => void;
  onComplete: (donationId: string) => void;
  onEdit: (donationId: string) => void;
}

const Requests: React.FC<RequestsProps> = ({ donations, onAccept, onReject, onComplete, onEdit }) => {
  const activeDonations = donations.filter(d => d.status !== 'completed');

  const StatusBadge = ({ status }: { status: 'pending' | 'assigned' | 'completed' }) => {
    if (status === 'assigned') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-800">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Assigned
        </span>
      );
    }
    if (status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Completed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700">
        <span className="w-1.5 h-1.5 rounded-full bg-stone-500"></span>
        Pending
      </span>
    );
  };

  if (activeDonations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-stone-500 dark:text-stone-400">
        <div className="bg-stone-100 dark:bg-stone-800 p-4 rounded-full mb-4">
          <CheckCircle2 size={32} />
        </div>
        <p className="text-lg font-medium text-stone-900 dark:text-stone-100">No active requests</p>
        <p className="max-w-xs text-center mt-2">Post a new donation to start receiving requests from volunteers.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">My Donations</h1>
        <p className="text-stone-500 dark:text-stone-400 mt-1">Manage pickups and volunteer assignments.</p>
      </div>

      <div className="grid gap-6">
        {activeDonations.map(donation => (
          <div key={donation.id} className={`bg-white dark:bg-stone-900 border rounded-xl overflow-hidden shadow-sm transition-all ${donation.isUrgent ? 'border-amber-400 dark:border-amber-600 ring-1 ring-amber-400/30' : 'border-stone-200 dark:border-stone-800 hover:border-forest-200 dark:hover:border-forest-800'}`}>
            
            {/* Donation Header */}
            <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex flex-col md:flex-row justify-between items-start gap-4">
              <div className="flex gap-4 w-full">
                 {donation.imageUrl ? (
                     <img src={donation.imageUrl} alt={donation.title} className="w-20 h-20 rounded-lg object-cover bg-stone-100 dark:bg-stone-800 flex-shrink-0" />
                 ) : (
                     <div className="w-20 h-20 bg-stone-100 dark:bg-stone-800 rounded-lg flex items-center justify-center text-stone-400 flex-shrink-0">
                        <User size={24} />
                     </div>
                 )}
                 <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <div>
                            {donation.isUrgent && (
                                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-500 mb-1.5 animate-pulse">
                                    <AlertTriangle size={14} className="fill-current" />
                                    URGENT PICKUP
                                </div>
                            )}
                            <h3 className="font-semibold text-lg text-stone-900 dark:text-stone-100">{donation.title}</h3>
                            <div className="flex flex-wrap gap-2 mt-1 text-sm text-stone-500 dark:text-stone-400">
                                <span className="flex items-center gap-1"><Clock size={14} /> {donation.timestamp}</span>
                                <span className="flex items-center gap-1"><Calendar size={14} /> Pickup: {donation.pickupWindow}</span>
                            </div>
                        </div>
                        <StatusBadge status={donation.status} />
                    </div>
                    
                    <div className="mt-3 flex flex-wrap gap-2">
                        {donation.tags.map(tag => (
                            <span key={tag} className="px-2 py-0.5 rounded text-xs font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                                {tag}
                            </span>
                        ))}
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                            {donation.weight} kg
                        </span>
                    </div>
                 </div>
              </div>
              
              <div className="flex gap-2 self-end md:self-start">
                  <button 
                    onClick={() => onEdit(donation.id)}
                    className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
                    title="Edit Donation"
                  >
                      <Pencil size={18} />
                  </button>
              </div>
            </div>

            {/* Active Request Section */}
            {donation.status === 'pending' && donation.activeRequest && (
                <div className="bg-forest-50 dark:bg-forest-900/20 p-6 border-b border-forest-100 dark:border-forest-800/50">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-forest-100 dark:bg-forest-800 flex items-center justify-center text-forest-600 dark:text-forest-400 flex-shrink-0">
                            <User size={24} />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-medium text-stone-900 dark:text-stone-100 flex items-center gap-2">
                                        {donation.activeRequest.name}
                                        <span className="flex items-center text-xs font-normal text-stone-500 dark:text-stone-400 bg-white dark:bg-stone-800 px-1.5 py-0.5 rounded-full border border-stone-200 dark:border-stone-700">
                                            <ShieldCheck size={12} className="mr-1 text-forest-500" /> Verified
                                        </span>
                                    </h4>
                                    <div className="flex items-center gap-3 mt-1 text-sm text-stone-600 dark:text-stone-400">
                                        <span className="flex items-center gap-1">⭐ {donation.activeRequest.rating}</span>
                                        <span className="flex items-center gap-1"><MapPin size={14} /> {donation.activeRequest.distanceKm} km away</span>
                                        <span className="flex items-center gap-1"><Clock size={14} /> ETA {donation.activeRequest.etaMinutes} mins</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => onReject(donation.id)}
                                        className="px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-1"
                                    >
                                        <X size={16} /> Decline
                                    </button>
                                    <button 
                                        onClick={() => onAccept(donation.id)}
                                        className="px-3 py-1.5 text-sm font-medium text-white bg-forest-600 hover:bg-forest-700 rounded-lg shadow-sm transition-colors flex items-center gap-1"
                                    >
                                        <Check size={16} /> Accept
                                    </button>
                                </div>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center gap-2 text-stone-600 dark:text-stone-400">
                                    <div className="w-8 text-center text-xs uppercase tracking-wider text-stone-400">Vehicle</div>
                                    <div className="font-medium text-stone-900 dark:text-stone-200">{donation.activeRequest.vehicle}</div>
                                </div>
                                <div className="flex items-center gap-2 text-stone-600 dark:text-stone-400">
                                    <div className="w-8 text-center text-xs uppercase tracking-wider text-stone-400">Trips</div>
                                    <div className="font-medium text-stone-900 dark:text-stone-200">{donation.activeRequest.completedTrips} completed</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Waiting State */}
            {donation.status === 'pending' && !donation.activeRequest && (
                <div className="p-4 bg-stone-50 dark:bg-stone-800/50 flex items-center justify-center gap-2 text-stone-500 dark:text-stone-400 text-sm italic">
                    <Loader2 size={16} className="animate-spin" /> Waiting for volunteers to accept...
                </div>
            )}

            {/* Assigned / Tracking State */}
            {donation.status === 'assigned' && donation.assignedVolunteer && (
                <div className="bg-stone-50 dark:bg-stone-800/30">
                    <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-stone-500 dark:text-stone-300">
                                <User size={20} />
                            </div>
                            <div>
                                <div className="font-medium text-stone-900 dark:text-stone-100">{donation.assignedVolunteer.name}</div>
                                <div className="text-xs text-stone-500 dark:text-stone-400">{donation.assignedVolunteer.phone}</div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                             <button className="p-2 text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg shadow-sm">
                                <Phone size={16} />
                             </button>
                             <button 
                                onClick={() => onComplete(donation.id)}
                                className="px-3 py-1.5 text-sm font-medium text-forest-700 dark:text-forest-400 bg-forest-50 dark:bg-forest-900/30 border border-forest-100 dark:border-forest-800 rounded-lg hover:bg-forest-100 dark:hover:bg-forest-900/50 transition-colors"
                             >
                                Mark Handover Complete
                             </button>
                        </div>
                    </div>
                    
                    {/* Live Map Integration */}
                    {donation.tracking && donation.tracking.active && (
                        <div className="h-48 w-full relative bg-stone-200 dark:bg-stone-800">
                            <div className="absolute top-4 left-4 z-10 bg-white/90 dark:bg-stone-900/90 backdrop-blur px-3 py-1.5 rounded-lg shadow-sm border border-stone-200 dark:border-stone-700 text-xs font-medium flex items-center gap-2">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-forest-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-forest-500"></span>
                                </span>
                                Live Tracking
                            </div>
                            
                            {/* Use the LiveMap component */}
                            <LiveMap 
                                tracking={donation.tracking}
                            />
                            
                            <div className="absolute bottom-0 left-0 right-0 bg-white/90 dark:bg-stone-900/90 backdrop-blur border-t border-stone-200 dark:border-stone-800 p-3 flex justify-between items-center text-xs">
                                <div className="flex items-center gap-2">
                                    <Navigation size={14} className="text-forest-600" />
                                    <span className="text-stone-600 dark:text-stone-400">
                                        {donation.tracking.status === 'on_route' ? 'On the way to pickup' : 'Arrived at destination'}
                                    </span>
                                </div>
                                <div className="font-medium text-stone-900 dark:text-stone-100">
                                    ETA: {donation.assignedVolunteer.etaMinutes} mins
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Requests;
