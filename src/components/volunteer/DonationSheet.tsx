import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Clock, ChevronDown, ChevronRight, Navigation, CheckCircle2, Minus, Plus, X, MapPin, Timer, Utensils, Send, Loader2, ShieldCheck } from 'lucide-react';
import { DonationSheetProps, VolunteerDonation } from '../../types';
import { getFoodSafetyTips } from '../../lib/openrouter';

const DonationSheet: React.FC<DonationSheetProps> = ({ donations, selectedId, onCloseDetail, onSelectDonation, onAcceptPickup, isNavigating }) => {
  const [sheetView, setSheetView] = useState<'collapsed' | 'expanded' | 'detail'>('collapsed');
  const [quantityToPick, setQuantityToPick] = useState(1);
  const [requestSent, setRequestSent] = useState<Set<string>>(new Set());
  const [sendingRequest, setSendingRequest] = useState(false);
  const [safetyTips, setSafetyTips] = useState<string[]>([]);
  const [showSafetyTips, setShowSafetyTips] = useState(true);
  const [loadingTips, setLoadingTips] = useState(false);

  const selectedDonation = donations.find(d => d.id === selectedId) as any;

  useEffect(() => {
    if (selectedId) { setSheetView('detail'); setQuantityToPick(1); setSendingRequest(false); }
  }, [selectedId]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.velocity.y < -200 || info.offset.y < -50) setSheetView('expanded');
    else if (info.velocity.y > 200 || info.offset.y > 50) setSheetView('collapsed');
  };

  const handleSendRequest = (id: string) => {
    setSendingRequest(true);
    // Small delay to show loading state
    setTimeout(() => {
      onAcceptPickup(id);
      setRequestSent(prev => new Set(prev).add(id));
      setSendingRequest(false);
    }, 800);
  };

  // Fetch safety tips when navigating
  useEffect(() => {
    if (isNavigating && selectedDonation) {
      setLoadingTips(true);
      getFoodSafetyTips(
        selectedDonation.foodItem || selectedDonation.title || '',
        selectedDonation.tags || []
      )
        .then(tips => setSafetyTips(tips))
        .catch(() => setSafetyTips([]))
        .finally(() => setLoadingTips(false));
    } else {
      setSafetyTips([]);
    }
  }, [isNavigating, selectedDonation?.id]);

  // Navigation mode — volunteer is headed to the hotel
  if (isNavigating && selectedDonation) {
    // Get pickup code from extended donation data
    const pickupCode = (selectedDonation as any).pickupCode;

    return (
      <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="absolute bottom-4 left-3 right-3 z-30 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl shadow-stone-900/10 px-5 pb-6 pt-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-forest-50 dark:bg-forest-900/30 border border-forest-100 dark:border-forest-800 flex items-center justify-center">
              <Navigation size={20} className="text-forest-700 dark:text-forest-400" />
            </div>
            <div>
              <p className="font-bold text-stone-900 dark:text-stone-100">Navigating to pickup</p>
              <p className="text-sm text-stone-500 dark:text-stone-400">{selectedDonation.hotelName} · {selectedDonation.distance}</p>
            </div>
          </div>
          <button onClick={onCloseDetail} className="p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-stone-200 transition-colors">
            <X size={16} className="text-stone-500" />
          </button>
        </div>
        <div className="bg-forest-50 dark:bg-forest-900/20 border border-forest-100 dark:border-forest-800 rounded-2xl p-4 mb-4 flex items-center gap-3">
          <div className="relative flex h-3 w-3"><span className="animate-ping absolute h-full w-full rounded-full bg-forest-400 opacity-75"></span><span className="relative h-3 w-3 rounded-full bg-forest-500"></span></div>
          <span className="text-sm font-semibold text-forest-800 dark:text-forest-300">Hotel accepted your request! Head to the pickup point.</span>
        </div>
        {/* OTP Pickup Code */}
        {pickupCode && (
          <div className="bg-stone-900 dark:bg-stone-800 rounded-2xl p-5 mb-4 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-2">Your Pickup Code</p>
            <div className="flex items-center justify-center gap-3">
              {pickupCode.split('').map((digit: string, i: number) => (
                <div key={i} className="w-14 h-16 bg-stone-800 dark:bg-stone-700 border-2 border-forest-500 rounded-xl flex items-center justify-center text-3xl font-bold text-forest-400 shadow-lg shadow-forest-500/10">
                  {digit}
                </div>
              ))}
            </div>
            <p className="text-xs text-stone-400 mt-3">Show this code to the hotel staff to confirm your pickup</p>
          </div>
        )}
        {/* Food Safety Tips */}
        {(loadingTips || safetyTips.length > 0) && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 rounded-2xl overflow-hidden mb-4">
            <button onClick={() => setShowSafetyTips(!showSafetyTips)} className="w-full flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-semibold text-blue-800 dark:text-blue-300">Food Safety Tips</span>
              </div>
              <ChevronDown size={14} className={`text-blue-500 transition-transform ${showSafetyTips ? 'rotate-180' : ''}`} />
            </button>
            {showSafetyTips && (
              <div className="px-4 pb-3 space-y-2">
                {loadingTips ? (
                  <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                    <Loader2 size={12} className="animate-spin" /> Getting tips...
                  </div>
                ) : (
                  safetyTips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-xs text-blue-500 font-bold mt-0.5">{i + 1}.</span>
                      <p className="text-xs text-blue-700 dark:text-blue-300">{tip}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
        <button onClick={onCloseDetail} className="w-full py-3.5 bg-forest-700 hover:bg-forest-800 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-forest-900/20 transition-colors active:scale-[0.98]">
          <CheckCircle2 size={20} /> Close
        </button>
      </motion.div>
    );
  }

  // Detail view
  if (sheetView === 'detail' && selectedDonation) {
    const alreadyRequested = requestSent.has(selectedDonation.id) || selectedDonation.hasActiveRequest;

    return (
      <motion.div initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="absolute bottom-0 left-0 right-0 z-30 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 rounded-t-3xl shadow-2xl shadow-stone-900/15 max-h-[78vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-stone-900 z-10 rounded-t-3xl">
          <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1.5 rounded-full bg-stone-200 dark:bg-stone-700" /></div>
          <div className="px-5 pb-3 flex items-center justify-between">
            <button onClick={() => { onCloseDetail(); setSheetView('collapsed'); }} className="p-2 -ml-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
              <ChevronDown size={22} className="text-stone-400" />
            </button>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700">
              <MapPin size={12} className="text-forest-600 dark:text-forest-400" />{selectedDonation.distance} away
            </div>
          </div>
        </div>
        
        <div className="px-5 pb-8 space-y-5">
          {/* Food image + info */}
          <div className="flex gap-4 items-start">
            <img src={selectedDonation.imageUrl} alt="" className="w-24 h-24 rounded-2xl object-cover shadow-md border border-stone-200 dark:border-stone-700" />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 leading-tight">{selectedDonation.foodItem}</h3>
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-1 font-medium">{selectedDonation.hotelName}</p>
              <div className="flex gap-2 mt-2.5">
                {selectedDonation.tags.map((tag: string) => {
                  const isVeg = tag.toLowerCase() === 'veg';
                  const isNonVeg = tag.toLowerCase() === 'non-veg';
                  return (
                    <span key={tag} className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                      isVeg ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' : isNonVeg ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' : 'bg-stone-50 text-stone-600 border-stone-200 dark:bg-stone-800 dark:text-stone-400 dark:border-stone-700'
                    }`}>
                      {isVeg && '🥬 '}{isNonVeg && '🍗 '}{tag}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl p-3.5 text-center">
              <Utensils size={16} className="text-forest-600 dark:text-forest-400 mx-auto mb-1.5" />
              <p className="text-lg font-bold text-stone-900 dark:text-stone-100">{selectedDonation.quantity}</p>
              <p className="text-[10px] text-stone-500 dark:text-stone-400 font-semibold uppercase tracking-wider">Plates</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-3.5 text-center">
              <Timer size={16} className="text-amber-600 dark:text-amber-400 mx-auto mb-1.5" />
              <p className="text-lg font-bold text-amber-700 dark:text-amber-400">{selectedDonation.expiryTime}</p>
              <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wider">Pickup</p>
            </div>
            <div className="bg-forest-50 dark:bg-forest-900/20 border border-forest-200 dark:border-forest-800 rounded-2xl p-3.5 text-center">
              <Clock size={16} className="text-forest-600 dark:text-forest-400 mx-auto mb-1.5" />
              <p className="text-lg font-bold text-forest-800 dark:text-forest-300">{selectedDonation.pickupTime}</p>
              <p className="text-[10px] text-forest-600 dark:text-forest-400 font-semibold uppercase tracking-wider">Window</p>
            </div>
          </div>

          {/* Quantity selector */}
          <div className="bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl p-5">
            <p className="text-sm font-bold text-stone-800 dark:text-stone-200 mb-4">How many plates to rescue?</p>
            <div className="flex items-center justify-center gap-8">
              <button onClick={() => setQuantityToPick(Math.max(1, quantityToPick - 1))} className="w-12 h-12 rounded-xl bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 flex items-center justify-center shadow-sm hover:bg-stone-100 dark:hover:bg-stone-600 transition-colors active:scale-95">
                <Minus size={18} className="text-stone-600 dark:text-stone-300" />
              </button>
              <div className="text-center">
                <span className="text-4xl font-bold text-forest-800 dark:text-forest-400">{quantityToPick}</span>
                <p className="text-[10px] text-stone-500 font-semibold uppercase tracking-wider mt-0.5">of {selectedDonation.quantity}</p>
              </div>
              <button onClick={() => setQuantityToPick(Math.min(selectedDonation.quantity, quantityToPick + 1))} className="w-12 h-12 rounded-xl bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 flex items-center justify-center shadow-sm hover:bg-stone-100 dark:hover:bg-stone-600 transition-colors active:scale-95">
                <Plus size={18} className="text-stone-600 dark:text-stone-300" />
              </button>
            </div>
            <div className="mt-4 h-2 bg-stone-200 dark:bg-stone-600 rounded-full overflow-hidden">
              <motion.div animate={{ width: `${(quantityToPick / selectedDonation.quantity) * 100}%` }} className="h-full bg-forest-600 rounded-full" transition={{ type: 'spring', stiffness: 300, damping: 25 }} />
            </div>
          </div>

          {/* Request Button */}
          {alreadyRequested ? (
            <div className="bg-forest-50 dark:bg-forest-900/20 border border-forest-200 dark:border-forest-800 rounded-2xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-forest-700 dark:text-forest-400 font-bold">
                <CheckCircle2 size={20} /> Request Sent!
              </div>
              <p className="text-sm text-forest-600 dark:text-forest-400 mt-1">Waiting for the hotel to accept your pickup request...</p>
            </div>
          ) : (
            <button
              onClick={() => handleSendRequest(selectedDonation.id)}
              disabled={sendingRequest}
              className="w-full h-16 bg-gradient-to-r from-forest-700 to-forest-800 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2.5 shadow-lg shadow-forest-900/20 hover:from-forest-800 hover:to-forest-900 transition-all active:scale-[0.98] disabled:opacity-70"
            >
              {sendingRequest ? (
                <><Loader2 size={20} className="animate-spin" /> Sending Request...</>
              ) : (
                <><Send size={20} /> Request Pickup</>
              )}
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  // Collapsed / Expanded list view
  return (
    <motion.div drag="y" dragConstraints={{ top: -300, bottom: 0 }} onDragEnd={handleDragEnd}
      animate={{ height: sheetView === 'expanded' ? '55vh' : 'auto' }}
      className="absolute bottom-0 left-0 right-0 z-30 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 rounded-t-3xl shadow-2xl shadow-stone-900/15 touch-none"
    >
      <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1.5 rounded-full bg-stone-200 dark:bg-stone-700" /></div>
      <div className="px-5 pb-2 flex items-center justify-between">
        <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">{donations.length} donations nearby</h3>
        <span className="text-[10px] font-semibold text-forest-700 dark:text-forest-400 bg-forest-50 dark:bg-forest-900/30 px-2 py-1 rounded-md border border-forest-100 dark:border-forest-800">Dadar area</span>
      </div>
      <div className="overflow-y-auto max-h-[45vh] px-4 pb-6 space-y-1.5">
        {donations.map(d => {
          const requested = requestSent.has(d.id) || (d as any).hasActiveRequest;
          return (
            <button key={d.id} onClick={() => onSelectDonation(d.id)} className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl hover:bg-stone-50 dark:hover:bg-stone-800 border border-transparent hover:border-stone-200 dark:hover:border-stone-700 transition-all text-left active:scale-[0.98]">
              <img src={d.imageUrl} alt="" className="w-16 h-16 rounded-2xl object-cover shadow-sm border border-stone-200 dark:border-stone-700" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-stone-900 dark:text-stone-100 truncate text-sm">{d.foodItem}</p>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 font-medium">{d.hotelName} · {d.distance}</p>
                <div className="flex gap-1.5 mt-1.5">
                  {d.tags.slice(0, 2).map(tag => (
                    <span key={tag} className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      tag.toLowerCase() === 'veg' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : tag.toLowerCase() === 'non-veg' ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                    }`}>{tag}</span>
                  ))}
                  {requested && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-forest-50 text-forest-700 dark:bg-forest-900/30 dark:text-forest-400">Requested</span>}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-forest-700 dark:text-forest-400">{d.quantity}</p>
                <p className="text-[10px] text-stone-400 font-medium">plates</p>
              </div>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default DonationSheet;
