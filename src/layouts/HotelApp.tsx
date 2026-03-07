import React, { useState } from 'react';
import HotelLayout from '../components/hotel/HotelLayout';
import HotelDashboard from '../pages/hotel/HotelDashboard';
import Donate from '../pages/hotel/Donate';
import History from '../pages/hotel/History';
import Requests from '../pages/hotel/Requests';
import HotelSettings from '../pages/hotel/HotelSettings';
import { NavItem, HotelDonation } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useDonations } from '../contexts/DonationContext';

const HotelApp: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavItem>(NavItem.DASHBOARD);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { user } = useAuth();
  const { donations, addDonation, editDonation, acceptRequest, rejectRequest, markCompleted, verifyAndComplete } = useDonations();

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
    switch (currentTab) {
      case NavItem.DASHBOARD: return <HotelDashboard donations={myDonations} />;
      case NavItem.DONATE:
        const initialData = editingId ? myDonations.find(d => d.id === editingId) : undefined;
        return <Donate onSave={handleAddDonation} initialData={initialData} />;
      case NavItem.REQUESTS:
        return <Requests donations={myDonations} onAccept={acceptRequest} onReject={rejectRequest} onComplete={markCompleted} onEdit={handleEditDonation} onVerifyComplete={verifyAndComplete} />;
      case NavItem.HISTORY: return <History donations={myDonations} onRate={handleRateDonation} />;
      case NavItem.SETTINGS: return <HotelSettings />;
      default: return <HotelDashboard donations={myDonations} />;
    }
  };

  return (
    <HotelLayout activeTab={currentTab} onNavigate={handleNavigate} notificationCount={activeRequestsCount}>
      {renderContent()}
    </HotelLayout>
  );
};

export default HotelApp;
