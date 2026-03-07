import React, { useState } from 'react';
import { HotelDonation } from '../../types';
import { Clock, User, Check, X, Phone, ShieldCheck, CheckCircle2, Loader2, Pencil, Calendar, Navigation, AlertTriangle, KeyRound } from 'lucide-react';
import LiveMap from '../../components/hotel/LiveMap';

interface RequestsProps {
  donations: HotelDonation[];
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onComplete: (id: string) => void;
  onEdit: (id: string) => void;
  onVerifyComplete?: (id: string, code: string) => boolean;
}

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    assigned: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-800',
    completed: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800',
    pending: 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700',
  };
  const dotColors: Record<string, string> = { assigned: 'bg-amber-500', completed: 'bg-emerald-500', pending: 'bg-stone-500' };
  const labels: Record<string, string> = { assigned: 'Assigned', completed: 'Completed', pending: 'Pending' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status] || styles.pending}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColors[status] || dotColors.pending}`}></span>
      {labels[status] || 'Pending'}
    </span>
  );
};

// OTP Input Component
const OtpVerify = ({ donationId, onVerify }: { donationId: string; onVerify: (id: string, code: string) => boolean }) => {
  const [digits, setDigits] = useState(['', '', '', '']);
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);
    setError(false);

    // Auto-focus next input
    if (value && index < 3) {
      const next = document.getElementById(`otp-${donationId}-${index + 1}`);
      next?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      const prev = document.getElementById(`otp-${donationId}-${index - 1}`);
      prev?.focus();
    }
  };

  const handleVerify = () => {
    const code = digits.join('');
    if (code.length !== 4) { setError(true); return; }
    const result = onVerify(donationId, code);
    if (result) {
      setSuccess(true);
    } else {
      setError(true);
      setDigits(['', '', '', '']);
      // Focus first input
      setTimeout(() => document.getElementById(`otp-${donationId}-0`)?.focus(), 100);
    }
  };

  if (success) {
    return (
      <div className="bg-forest-50 dark:bg-forest-900/20 border border-forest-200 dark:border-forest-800 rounded-xl p-4 text-center animate-in fade-in duration-300">
        <CheckCircle2 size={28} className="text-forest-600 dark:text-forest-400 mx-auto mb-2" />
        <p className="font-bold text-forest-800 dark:text-forest-300">Verified & Completed!</p>
        <p className="text-sm text-forest-600 dark:text-forest-400 mt-1">The pickup has been confirmed.</p>
      </div>
    );
  }

  return (
    <div className="bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <KeyRound size={16} className="text-forest-600 dark:text-forest-400" />
        <p className="font-semibold text-sm text-stone-900 dark:text-stone-100">Enter Volunteer's Pickup Code</p>
      </div>
      <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">Ask the volunteer for their 4-digit code to confirm the pickup.</p>

      <div className="flex items-center justify-center gap-3 mb-4">
        {digits.map((digit, i) => (
          <input
            key={i}
            id={`otp-${donationId}-${i}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            className={`w-14 h-16 text-center text-2xl font-bold rounded-xl border-2 bg-white dark:bg-stone-900 transition-all focus:outline-none focus:ring-2 focus:ring-forest-500/30 ${
              error
                ? 'border-red-400 dark:border-red-500 text-red-600 dark:text-red-400 shake'
                : 'border-stone-300 dark:border-stone-600 text-stone-900 dark:text-stone-100 focus:border-forest-500'
            }`}
          />
        ))}
      </div>

      {error && (
        <p className="text-center text-sm text-red-500 font-medium mb-3 animate-in fade-in">
          ❌ Incorrect code. Please try again.
        </p>
      )}

      <button
        onClick={handleVerify}
        disabled={digits.some(d => !d)}
        className="w-full py-3 bg-forest-700 hover:bg-forest-800 disabled:bg-stone-300 disabled:dark:bg-stone-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
      >
        <ShieldCheck size={18} /> Verify & Complete
      </button>
    </div>
  );
};

const Requests: React.FC<RequestsProps> = ({ donations, onAccept, onReject, onComplete, onEdit, onVerifyComplete }) => {
  const active = donations.filter(d => d.status !== 'completed');

  if (active.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-stone-500 dark:text-stone-400">
        <div className="bg-stone-100 dark:bg-stone-800 p-4 rounded-full mb-4"><CheckCircle2 size={32} /></div>
        <p className="text-lg font-medium text-stone-900 dark:text-stone-100">No active donations</p>
        <p className="max-w-xs text-center mt-2">Post a new donation to start receiving requests.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">My Donations</h1>
        <p className="text-stone-500 dark:text-stone-400 mt-1">Manage pickups and volunteer assignments.</p>
      </div>
      <div className="grid gap-6">
        {active.map(d => (
          <div key={d.id} className={`bg-white dark:bg-stone-900 border rounded-xl overflow-hidden shadow-sm ${d.isUrgent ? 'border-amber-400 ring-1 ring-amber-400/30' : 'border-stone-200 dark:border-stone-800'}`}>
            {/* Header */}
            <div className="p-6 border-b border-stone-100 dark:border-stone-800">
              <div className="flex gap-4">
                {d.imageUrl ? <img src={d.imageUrl} alt="" className="w-20 h-20 rounded-lg object-cover flex-shrink-0" /> : <div className="w-20 h-20 bg-stone-100 dark:bg-stone-800 rounded-lg flex items-center justify-center"><User size={24} /></div>}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      {d.isUrgent && <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 mb-1 animate-pulse"><AlertTriangle size={14} />URGENT</div>}
                      <h3 className="font-semibold text-lg text-stone-900 dark:text-stone-100">{d.title}</h3>
                      <div className="flex gap-2 mt-1 text-sm text-stone-500">
                        <span className="flex items-center gap-1"><Clock size={14} />{d.timestamp}</span>
                        <span className="flex items-center gap-1"><Calendar size={14} />Pickup: {d.pickupWindow}</span>
                      </div>
                    </div>
                    <StatusBadge status={d.status} />
                  </div>
                  <div className="mt-2 flex gap-2">
                    {d.tags.map(t => <span key={t} className="px-2 py-0.5 text-xs bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded">{t}</span>)}
                    <span className="px-2 py-0.5 text-xs bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded">{d.weight} kg</span>
                  </div>
                </div>
                <button onClick={() => onEdit(d.id)} className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg self-start"><Pencil size={18} /></button>
              </div>
            </div>

            {/* Active Request */}
            {d.status === 'pending' && d.activeRequest && (
              <div className="bg-forest-50 dark:bg-forest-900/20 p-6 border-b border-forest-100 dark:border-forest-800/50">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-forest-100 flex items-center justify-center text-forest-600"><User size={24} /></div>
                  <div className="flex-1">
                    <h4 className="font-medium text-stone-900 dark:text-stone-100 flex items-center gap-2">
                      {d.activeRequest.name}
                      <span className="text-xs bg-white dark:bg-stone-800 px-1.5 py-0.5 rounded-full border border-stone-200 dark:border-stone-700 flex items-center"><ShieldCheck size={12} className="mr-1 text-forest-500" />Verified</span>
                    </h4>
                    <div className="flex gap-3 mt-1 text-sm text-stone-500">
                      <span>⭐ {d.activeRequest.rating}</span>
                      <span>{d.activeRequest.distanceKm} km</span>
                      <span>ETA {d.activeRequest.etaMinutes} min</span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => onReject(d.id)} className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1"><X size={16} />Decline</button>
                      <button onClick={() => onAccept(d.id)} className="px-3 py-1.5 text-sm font-medium text-white bg-forest-600 hover:bg-forest-700 rounded-lg flex items-center gap-1"><Check size={16} />Accept</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {d.status === 'pending' && !d.activeRequest && (
              <div className="p-4 bg-stone-50 dark:bg-stone-800/50 flex items-center justify-center gap-2 text-stone-500 text-sm italic"><Loader2 size={16} className="animate-spin" />Waiting for volunteers...</div>
            )}

            {/* Tracking + OTP Verification */}
            {d.status === 'assigned' && d.assignedVolunteer && (
              <div className="bg-stone-50 dark:bg-stone-800/30">
                <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center"><User size={20} /></div>
                    <div>
                      <div className="font-medium text-stone-900 dark:text-stone-100">{d.assignedVolunteer.name}</div>
                      <div className="text-xs text-stone-500">{d.assignedVolunteer.phone}</div>
                    </div>
                  </div>
                  <button className="p-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg shadow-sm"><Phone size={16} /></button>
                </div>
                {d.tracking?.active && (
                  <div className="h-48 w-full relative">
                    <div className="absolute top-4 left-4 z-10 bg-white/90 dark:bg-stone-900/90 backdrop-blur px-3 py-1.5 rounded-lg shadow-sm border text-xs font-medium flex items-center gap-2">
                      <span className="relative flex h-2 w-2"><span className="animate-ping absolute h-full w-full rounded-full bg-forest-400 opacity-75"></span><span className="relative h-2 w-2 rounded-full bg-forest-500"></span></span>
                      Live Tracking
                    </div>
                    <LiveMap tracking={d.tracking} />
                    <div className="absolute bottom-0 inset-x-0 bg-white/90 dark:bg-stone-900/90 backdrop-blur border-t p-3 flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2"><Navigation size={14} className="text-forest-600" />{d.tracking.status === 'on_route' ? 'On the way' : 'Arrived'}</div>
                      <div className="font-medium">ETA: {d.assignedVolunteer.etaMinutes} mins</div>
                    </div>
                  </div>
                )}
                {/* OTP Verification Section */}
                <div className="p-4">
                  {onVerifyComplete ? (
                    <OtpVerify donationId={d.id} onVerify={onVerifyComplete} />
                  ) : (
                    <button onClick={() => onComplete(d.id)} className="w-full px-3 py-2.5 text-sm font-medium text-forest-700 bg-forest-50 border border-forest-100 rounded-lg hover:bg-forest-100">Mark Complete</button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Requests;
