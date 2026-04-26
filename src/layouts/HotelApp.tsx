import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HotelLayout from '../components/hotel/HotelLayout';
import HotelDashboard from '../pages/hotel/HotelDashboard';
import Donate from '../pages/hotel/Donate';
import History from '../pages/hotel/History';
import Requests from '../pages/hotel/Requests';
import HotelSettings from '../pages/hotel/HotelSettings';
import { NavItem, HotelDonation } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useDonations } from '../contexts/DonationContext';
import { apiRequest } from '../lib/api';

const HotelApp: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavItem>(NavItem.DASHBOARD);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { user } = useAuth();
  const { donations, addDonation, editDonation, acceptRequest, rejectRequest, markCompleted, verifyAndComplete } = useDonations();

  React.useEffect(() => {
    if (!user?.id || !navigator.geolocation) return;

    const hotelId = Number(user.id);
    if (!Number.isFinite(hotelId)) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        apiRequest(`/hotels/${hotelId}/location?lat=${lat}&lng=${lng}`, {
          method: 'POST',
        }).catch(() => {
          // Best-effort sync only; app should remain fully usable.
        });
      },
      () => {
        // Location permission denied/unavailable.
      },
      { timeout: 6000, enableHighAccuracy: true, maximumAge: 30000 }
    );
  }, [user?.id]);

  // Filter donations for this hotel
  const myDonations = donations.filter(d => d.hotelId === user?.id);

  const activeRequestsCount = myDonations.filter(d => d.status === 'pending' && d.activeRequest).length;
  const handleNavigate = (tab: NavItem) => { setEditingId(null); setCurrentTab(tab); };

  const handleAddDonation = (donationData: Partial<HotelDonation>) => {
    if (editingId) {
      editDonation(editingId, donationData);
      setEditingId(null);
      setCurrentTab(NavItem.REQUESTS);
    } else {
      addDonation(donationData, user?.id || 'unknown', user?.hotelName || user?.name || 'Unknown Hotel');
    }
  };

  const handleEditDonation = (id: string) => { setEditingId(id); setCurrentTab(NavItem.DONATE); };

  const handleRateDonation = (id: string, rating: number, review?: string) => {
    editDonation(id, { rating, review });
  };

  const renderContent = () => {
    let Content: React.ReactNode;
    switch (currentTab) {
      case NavItem.DASHBOARD: Content = <HotelDashboard donations={myDonations} />; break;
      case NavItem.DONATE:
        const initialData = editingId ? myDonations.find(d => d.id === editingId) : undefined;
        Content = <Donate onSave={handleAddDonation} initialData={initialData} />; break;
      case NavItem.REQUESTS:
        Content = <Requests donations={myDonations} onAccept={acceptRequest} onReject={rejectRequest} onComplete={markCompleted} onEdit={handleEditDonation} onVerifyComplete={verifyAndComplete} />; break;
      case NavItem.HISTORY: Content = <History donations={myDonations} onRate={handleRateDonation} />; break;
      case NavItem.SETTINGS: Content = <HotelSettings />; break;
      default: Content = <HotelDashboard donations={myDonations} />;
    }
    return Content;
  };

  return (
    <HotelLayout activeTab={currentTab} onNavigate={handleNavigate} notificationCount={activeRequestsCount}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </HotelLayout>
  );
};

export default HotelApp;
