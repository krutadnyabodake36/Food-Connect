import React, { useState, useEffect, useRef } from 'react';
import { motion, PanInfo, useAnimation, useMotionValue, useTransform } from 'framer-motion';
import { Clock, ChevronRight, ArrowLeft, Weight, MapPin, SearchX, Timer, Navigation, Phone, CheckCircle2, Utensils } from 'lucide-react';
import { DonationSheetProps } from '../types';

const SHEET_MARGIN = 20;

const DonationSheet: React.FC<DonationSheetProps> = ({ donations, selectedId, onCloseDetail, onSelectDonation, onAcceptPickup, isNavigating }) => {
  const [viewState, setViewState] = useState<'collapsed' | 'expanded' | 'detail'>('collapsed');
  const [loading, setLoading] = useState(true);
  const controls = useAnimation();
  
  // Slider State
  const [claimQuantity, setClaimQuantity] = useState<number>(0);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const slideX = useMotionValue(0);
  const slideRef = useRef<HTMLDivElement>(null);
  const sliderWidth = useMotionValue(0);

  const selectedDonation = donations.find(d => d.id === selectedId);

  // Simulate initial data loading
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Sync state with props
  useEffect(() => {
    if (selectedDonation) {
      setViewState('detail');
      setClaimQuantity(Math.floor(selectedDonation.quantity / 2));
      setIsConfirmed(false);
      slideX.set(0);
    } else {
      if (viewState === 'detail') setViewState('collapsed'); 
    }
  }, [selectedDonation]);

  // Handle Sheet Animation
  useEffect(() => {
    const screenHeight = window.innerHeight;
    // Lower the collapsed state slightly to show more map
    const collapsedY = screenHeight - 260; 
    const expandedY = SHEET_MARGIN + 120; // Adjusted for taller top bar
    const detailY = SHEET_MARGIN + 60;

    if (viewState === 'collapsed') controls.start({ y: collapsedY });
    else if (viewState === 'expanded') controls.start({ y: expandedY });
    else if (viewState === 'detail') controls.start({ y: detailY });
  }, [viewState, controls]);

  const onDragEnd = (event: any, info: PanInfo) => {
    const threshold = 50;
    const { offset, velocity } = info;

    if (viewState === 'detail') {
      if (offset.y > 150) onCloseDetail();
      else setViewState('detail'); 
      return;
    }

    if (offset.y < -threshold || velocity.y < -500) setViewState('expanded');
    else if (offset.y > threshold || velocity.y > 500) setViewState('collapsed');
  };

  // Slider Logic
  useEffect(() => {
     if (slideRef.current) sliderWidth.set(slideRef.current.offsetWidth - 56);
  }, [slideRef, viewState]);

  const handleSliderDragEnd = () => {
    const currentX = slideX.get();
    const max = sliderWidth.get();
    
    if (currentX > max * 0.7) {
        slideX.set(max);
        setIsConfirmed(true);
        setTimeout(() => {
            onAcceptPickup(selectedId!);
        }, 500);
    } else {
        slideX.set(0);
    }
  };

  const slideBgOpacity = useTransform(slideX, [0, 200], [0.1, 1]);
  const slideTextOpacity = useTransform(slideX, [0, 150], [1, 0]);

  // --- Sub-components for Cleaner Code ---
  
  const SkeletonCard = () => (
    <div className="w-[280px] bg-white border border-slate-100 rounded-2xl p-4 shrink-0 shadow-sm">
       <div className="w-full h-32 bg-slate-100 rounded-xl animate-pulse mb-4" />
       <div className="h-5 bg-slate-100 rounded w-3/4 animate-pulse mb-2" />
       <div className="h-4 bg-slate-100 rounded w-1/2 animate-pulse" />
    </div>
  );

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center h-64 w-full text-center p-6">
        <div className="bg-slate-50 p-6 rounded-full mb-4">
            <SearchX className="w-10 h-10 text-slate-300" />
        </div>
        <h3 className="font-bold text-slate-900 text-lg mb-1">No donations found</h3>
        <p className="text-slate-500 max-w-xs mx-auto">Try adjusting your filters or search a different area to find food rescue opportunities.</p>
    </div>
  );

  return (
    <motion.div
      initial={{ y: window.innerHeight - 200 }}
      animate={controls}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      drag="y"
      dragConstraints={{ top: 0, bottom: window.innerHeight }}
      dragElastic={0.05}
      onDragEnd={onDragEnd}
      className="absolute left-0 right-0 top-0 bottom-0 z-30 bg-white rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden"
      style={{ touchAction: 'none' }} 
    >
      <div className="w-full flex justify-center pt-4 pb-2 cursor-grab active:cursor-grabbing shrink-0 z-10 bg-white">
        <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
      </div>

      <div className="flex-1 overflow-hidden flex flex-col relative h-full">
        
        {/* === DETAIL VIEW === */}
        {selectedDonation && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col h-full px-6 pb-24 overflow-y-auto no-scrollbar"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-white z-10 py-2">
              <button onClick={onCloseDetail} className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors group">
                <ArrowLeft className="w-6 h-6 text-slate-700 group-hover:-translate-x-1 transition-transform" />
              </button>
              <div className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide flex items-center gap-1.5 ${isNavigating ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${isNavigating ? 'bg-blue-600 animate-pulse' : 'bg-emerald-600'}`} />
                {isNavigating ? 'NAVIGATION ACTIVE' : 'AVAILABLE FOR PICKUP'}
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 leading-tight mb-2">{selectedDonation.hotelName}</h2>
              <div className="flex items-center gap-4 text-slate-500 text-sm">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-emerald-600" /> 
                  {selectedDonation.distance} away
                </span>
                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                <span className="flex items-center gap-1">
                  <Utensils className="w-4 h-4 text-emerald-600" />
                  {selectedDonation.foodItem}
                </span>
              </div>
            </div>

            {/* Navigation Mode: Map Directions Placeholder */}
            {isNavigating && (
               <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-8 flex items-center gap-4 shadow-sm">
                  <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                    <Navigation className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 mb-0.5">En Route to Pickup</div>
                    <div className="text-xs text-slate-500">Follow the map route to the location</div>
                  </div>
                  <button className="ml-auto bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-blue-700 transition-colors">
                    Navigate
                  </button>
               </div>
            )}

            <div className="relative w-full aspect-video rounded-3xl overflow-hidden mb-8 shadow-lg group">
                <img src={selectedDonation.imageUrl} alt={selectedDonation.foodItem} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 text-white">
                    <div className="flex flex-wrap gap-2 mb-3">
                         {selectedDonation.tags.map(tag => (
                            <span key={tag} className="px-2.5 py-1 rounded-lg bg-white/20 backdrop-blur-md text-xs font-medium border border-white/30">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col items-center text-center gap-2">
                <div className="p-2 bg-white rounded-full shadow-sm text-emerald-600">
                  <Weight className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Total Weight</div>
                  <div className="text-lg font-bold text-slate-900">{selectedDonation.quantity} kg</div>
                </div>
              </div>
              
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col items-center text-center gap-2">
                <div className="p-2 bg-white rounded-full shadow-sm text-amber-600">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Pickup By</div>
                  <div className="text-lg font-bold text-slate-900">{selectedDonation.pickupTime || selectedDonation.expiryTime}</div>
                </div>
              </div>
            </div>

            {/* Additional Details for Navigation Mode */}
            {isNavigating && (
              <div className="mb-8 p-4 border border-slate-100 rounded-2xl flex justify-between items-center bg-white shadow-sm">
                <div className="flex items-center gap-3 text-slate-700">
                  <div className="p-2 bg-slate-100 rounded-full">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold">Contact Hotel</div>
                    <div className="text-xs text-slate-400">For pickup coordination</div>
                  </div>
                </div>
                <button className="text-emerald-600 text-sm font-bold bg-emerald-50 px-4 py-2 rounded-xl hover:bg-emerald-100 transition-colors">
                  Call Now
                </button>
              </div>
            )}

            {!isNavigating ? (
              <div className="mb-8 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                  <div className="flex justify-between items-end mb-6">
                      <div>
                        <label className="text-sm font-bold text-slate-900 block mb-1">Rescuing Amount</label>
                        <p className="text-xs text-slate-400">Slide to adjust quantity</p>
                      </div>
                      <div className="text-right">
                        <span className="text-3xl font-bold text-emerald-600">{claimQuantity}</span>
                        <span className="text-sm text-slate-400 font-medium ml-1">kg</span>
                      </div>
                  </div>
                  <input 
                      type="range" min={1} max={selectedDonation.quantity} value={claimQuantity}
                      onChange={(e) => setClaimQuantity(Number(e.target.value))}
                      className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600 hover:accent-emerald-500 transition-all"
                  />
                  <div className="flex justify-between mt-2 text-xs text-slate-400 font-medium">
                    <span>1 kg</span>
                    <span>{selectedDonation.quantity} kg</span>
                  </div>
              </div>
            ) : (
              <div className="mb-8 p-5 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-start gap-4">
                <div className="p-2 bg-emerald-100 rounded-full shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-bold text-emerald-900 text-sm mb-1">Pickup Confirmed</h4>
                  <p className="text-xs text-emerald-700 leading-relaxed">
                    You have confirmed to pick up <strong>{claimQuantity} kg</strong>. Please reach the location before {selectedDonation.pickupTime}.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-auto pb-4">
                {!isNavigating ? (
                  <div ref={slideRef} className="relative h-16 bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-between p-1.5 shadow-xl shadow-slate-900/10">
                      <motion.div style={{ opacity: slideTextOpacity }} className="absolute inset-0 flex items-center justify-center text-white/90 font-semibold tracking-wide pointer-events-none text-sm">
                          Slide to Confirm Rescue
                      </motion.div>
                      
                      <motion.div 
                          style={{ opacity: isConfirmed ? 1 : 0 }}
                          className="absolute inset-0 bg-emerald-600 flex items-center justify-center text-white font-bold tracking-wide z-10 transition-opacity duration-300"
                      >
                          Rescued!
                      </motion.div>

                      <motion.div
                          drag="x"
                          dragConstraints={{ left: 0, right: sliderWidth.get() || 200 }}
                          dragElastic={0}
                          dragMomentum={false}
                          onDragEnd={handleSliderDragEnd}
                          style={{ x: slideX }}
                          className="w-14 h-13 bg-white rounded-xl flex items-center justify-center shadow-md relative z-20 cursor-grab active:cursor-grabbing"
                      >
                          {isConfirmed ? <CheckCircle className="text-emerald-600 w-6 h-6" /> : <ChevronRight className="text-slate-900 w-6 h-6" />}
                      </motion.div>
                  </div>
                ) : (
                  <button 
                    onClick={() => alert("Pickup Completed!")}
                    className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Complete Pickup
                  </button>
                )}
            </div>
          </motion.div>
        )}

        {/* === LIST VIEW === */}
        {!selectedDonation && (
          <motion.div className="flex flex-col h-full" animate={{ opacity: 1 }} initial={{ opacity: 1 }}>
            <div className="px-6 pb-4 pt-2 shrink-0 flex justify-between items-end">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Nearby Donations</h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                        {loading ? 'Searching nearby...' : `${donations.length} opportunities found`}
                    </p>
                </div>
                {!loading && <button onClick={() => setViewState(viewState === 'collapsed' ? 'expanded' : 'collapsed')} className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors">
                    {viewState === 'collapsed' ? 'View All' : 'Show Map'}
                </button>}
            </div>

            <div className={`flex-1 ${viewState === 'expanded' ? 'overflow-y-auto' : 'overflow-hidden'}`}>
                <div className={`p-6 pt-2 gap-4 transition-all duration-300 ${viewState === 'collapsed' ? 'flex flex-row overflow-x-auto snap-x no-scrollbar' : 'flex flex-col pb-32'}`}>
                    
                    {loading ? (
                        <>
                           <SkeletonCard />
                           <SkeletonCard />
                           <SkeletonCard />
                        </>
                    ) : donations.length === 0 ? (
                        <EmptyState />
                    ) : (
                        donations.map((donation) => (
                            <div 
                                key={donation.id}
                                onClick={() => onSelectDonation(donation.id)}
                                className={`
                                    relative bg-white border border-slate-100 rounded-2xl p-0 shadow-sm hover:shadow-lg transition-all cursor-pointer overflow-hidden group
                                    ${viewState === 'collapsed' ? 'w-[280px] snap-center shrink-0 flex flex-col' : 'w-full flex h-32'}
                                `}
                            >
                                {/* Rich Card Image with Timer */}
                                <div className={`relative bg-slate-100 ${viewState === 'collapsed' ? 'h-40 w-full' : 'w-32 h-full shrink-0'}`}>
                                    <img src={donation.imageUrl} className="w-full h-full object-cover" alt="" />
                                    {/* Gradient Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                                    
                                    {/* Live Timer Badge */}
                                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-red-600 text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm border border-red-100">
                                        <Timer className="w-3 h-3" />
                                        {donation.expiryTime}
                                    </div>
                                </div>
                                
                                <div className="flex-1 p-4 flex flex-col justify-between">
                                    <div>
                                        <h3 className="font-bold text-slate-900 truncate text-base mb-1 group-hover:text-emerald-600 transition-colors">{donation.hotelName}</h3>
                                        <p className="text-xs text-slate-500 line-clamp-1 mb-3">{donation.foodItem}</p>
                                    </div>
                                    
                                    {/* Info Row */}
                                    <div className="flex items-center justify-between mt-auto">
                                        <div className="flex gap-3 text-slate-600">
                                            <div className="flex items-center gap-1 text-xs font-semibold bg-slate-50 px-2 py-1 rounded-md">
                                                <MapPin className="w-3 h-3 text-emerald-600" /> {donation.distance}
                                            </div>
                                            <div className="flex items-center gap-1 text-xs font-semibold bg-slate-50 px-2 py-1 rounded-md">
                                                <Weight className="w-3 h-3 text-emerald-600" /> {donation.quantity}kg
                                            </div>
                                        </div>
                                        
                                        {viewState !== 'collapsed' && (
                                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                                                <ChevronRight className="w-5 h-5" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
          </motion.div>
        )}
      </div>
      
      {!selectedDonation && viewState === 'expanded' && (
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none" />
      )}
    </motion.div>
  );
};

function CheckCircle({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M20 6 9 17l-5-5" />
        </svg>
    )
}

export default DonationSheet;
