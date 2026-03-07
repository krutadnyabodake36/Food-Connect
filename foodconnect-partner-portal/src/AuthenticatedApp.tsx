import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Dashboard from '../pages/Dashboard';
import Donate from '../pages/Donate';
import History from '../pages/History';
import Requests from '../pages/Requests';
import { NavItem, Donation, Volunteer } from '../types';
import { useAuth } from './contexts/AuthContext';

// Initial Mock Data
const INITIAL_DONATIONS: Donation[] = [
    { 
        id: '1', hotelId: 'mock_hotel_id', title: 'Lunch Buffet Leftovers', weight: 12, tags: ['Rice', 'Curry'], 
        status: 'completed', timestamp: '2 hours ago', pickupWindow: '14:00 - 16:00',
        imageUrl: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=400'
    },
    { 
        id: '2', hotelId: 'mock_hotel_id', title: 'Breakfast Pastries', weight: 5, tags: ['Bread', 'Dessert'], 
        status: 'assigned', timestamp: 'Today, 10:00 AM', pickupWindow: '10:00 - 12:00',
        assignedVolunteer: { 
            id: 'v1', 
            name: 'Vikram Singh', 
            rating: 4.8, 
            distanceKm: 2.3, 
            etaMinutes: 12, 
            vehicle: 'Tata Ace',
            location: 'Connaught Place Area',
            availability: 'Mon-Sat, 9 AM - 6 PM',
            completedTrips: 142,
            joinedDate: 'Mar 2023',
            phone: '+91 98765 43210'
        },
        tracking: {
            active: true,
            currentLocation: { lat: 28.6139, lng: 77.2090, address: "Connaught Place, Outer Circle" },
            destination: { lat: 28.6448, lng: 77.2167, address: "Little Hearts Orphanage" },
            progress: 35,
            status: 'on_route',
            lastUpdated: 'Just now'
        }
    }
];

const AuthenticatedApp: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavItem>(NavItem.DASHBOARD);
  const [donations, setDonations] = useState<Donation[]>(INITIAL_DONATIONS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const { user, hotelProfile } = useAuth();

  // Theme Management
  useEffect(() => {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  // Simulation Loop for Tracking
  useEffect(() => {
    const interval = setInterval(() => {
        setDonations(prevDonations => prevDonations.map(d => {
            if (d.status === 'assigned' && d.tracking && d.tracking.active) {
                // Simulate movement
                let newProgress = d.tracking.progress + 1;
                let newStatus = d.tracking.status;

                if (newProgress >= 100) {
                    newProgress = 100;
                    newStatus = 'arrived';
                }

                return {
                    ...d,
                    tracking: {
                        ...d.tracking,
                        progress: newProgress,
                        status: newStatus,
                        lastUpdated: 'Live'
                    }
                };
            }
            return d;
        }));
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, []);

  // Computed property for notification badge
  const activeRequestsCount = donations.filter(d => d.status === 'pending' && d.activeRequest).length;

  const handleNavigate = (tab: NavItem) => {
    setEditingId(null);
    setCurrentTab(tab);
  };

  const handleAddDonation = (donationData: Partial<Donation>) => {
      if (editingId) {
          setDonations(prev => prev.map(d => d.id === editingId ? { ...d, ...donationData } : d));
          setEditingId(null);
          setCurrentTab(NavItem.REQUESTS);
      } else {
          const newId = Math.random().toString(36).substr(2, 9);
          const newDonation: Donation = {
              id: newId,
              hotelId: user?.uid || 'unknown',
              title: donationData.title || 'Untitled Donation',
              weight: donationData.weight || 0,
              tags: donationData.tags || [],
              status: 'pending',
              timestamp: 'Just now',
              pickupWindow: donationData.pickupWindow || 'Anytime',
              imageUrl: donationData.imageUrl,
              ...donationData
          } as Donation;

          setDonations(prev => [newDonation, ...prev]);

          // SIMULATION: Automatically get a volunteer request after 3 seconds
          setTimeout(() => {
              simulateIncomingRequest(newId);
          }, 3000);
      }
  };

  const handleEditDonation = (id: string) => {
      setEditingId(id);
      setCurrentTab(NavItem.DONATE);
  };

  const handleRateDonation = (id: string, rating: number, review?: string) => {
      setDonations(prev => prev.map(d => d.id === id ? { ...d, rating, review } : d));
  };

  const simulateIncomingRequest = (donationId: string) => {
      const mockVolunteer: Volunteer = {
          id: 'v_' + Math.random().toString(36),
          name: 'Rahul Kumar',
          rating: 4.9,
          distanceKm: 3.5,
          etaMinutes: 15,
          vehicle: 'E-Rickshaw',
          location: 'South Extension',
          availability: 'Daily, 8 AM - 8 PM',
          completedTrips: 89,
          joinedDate: 'Jan 2024',
          phone: '+91 99887 76655'
      };

      setDonations(prev => prev.map(d => {
          if (d.id === donationId && d.status === 'pending') {
              return { ...d, activeRequest: mockVolunteer };
          }
          return d;
      }));
  };

  const handleAcceptRequest = (donationId: string) => {
      setDonations(prev => prev.map(d => {
          if (d.id === donationId && d.activeRequest) {
              return { 
                  ...d, 
                  status: 'assigned', 
                  assignedVolunteer: d.activeRequest,
                  activeRequest: undefined,
                  // Initialize tracking when assigned
                  tracking: {
                      active: true,
                      currentLocation: { lat: 28.6139, lng: 77.2090, address: "Current Location" },
                      destination: { lat: 28.6448, lng: 77.2167, address: "Community Shelter" },
                      progress: 5,
                      status: 'on_route',
                      lastUpdated: 'Just now'
                  }
              };
          }
          return d;
      }));
  };

  const handleRejectRequest = (donationId: string) => {
      setDonations(prev => prev.map(d => {
          if (d.id === donationId) {
              return { ...d, activeRequest: undefined }; // Remove request, wait for next (simulated)
          }
          return d;
      }));
  };

  const handleCompleteDonation = (donationId: string) => {
      setDonations(prev => prev.map(d => {
          if (d.id === donationId) {
              return { ...d, status: 'completed', tracking: { ...d.tracking!, active: false, status: 'arrived', progress: 100 } };
          }
          return d;
      }));
  };

  const renderContent = () => {
    switch (currentTab) {
      case NavItem.DASHBOARD:
        return <Dashboard donations={donations} />;
      case NavItem.DONATE:
        const initialData = editingId ? donations.find(d => d.id === editingId) : undefined;
        return <Donate onSave={handleAddDonation} initialData={initialData} />;
      case NavItem.REQUESTS:
        return <Requests 
            donations={donations} 
            onAccept={handleAcceptRequest}
            onReject={handleRejectRequest}
            onComplete={handleCompleteDonation}
            onEdit={handleEditDonation}
        />;
      case NavItem.HISTORY:
        return <History donations={donations} onRate={handleRateDonation} />;
      case NavItem.SETTINGS:
        return (
          <div className="p-8 text-stone-500 flex flex-col items-center justify-center h-[50vh]">
            <h2 className="text-lg font-medium text-stone-900 dark:text-stone-100 mb-2">Settings</h2>
            <div className="bg-white dark:bg-stone-800 p-6 rounded-lg shadow-sm w-full max-w-md">
                <h3 className="text-md font-semibold mb-4">Hotel Profile</h3>
                <div className="space-y-2">
                    <p><span className="font-medium">Name:</span> {hotelProfile?.hotelName}</p>
                    <p><span className="font-medium">Address:</span> {hotelProfile?.address}</p>
                    <p><span className="font-medium">Manager:</span> {hotelProfile?.managerNumber}</p>
                    <p><span className="font-medium">License:</span> {hotelProfile?.licenseNumber}</p>
                </div>
            </div>
          </div>
        );
      default:
        return <Dashboard donations={donations} />;
    }
  };

  return (
    <Layout 
        activeTab={currentTab} 
        onNavigate={handleNavigate} 
        notificationCount={activeRequestsCount}
        currentTheme={theme}
        toggleTheme={toggleTheme}
    >
      {renderContent()}
    </Layout>
  );
};

export default AuthenticatedApp;
