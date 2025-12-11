import { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  Share2,
  Settings,
  Plus,
  Sparkles,
  X
} from 'lucide-react';
import type { User } from 'firebase/auth';

import type { Trip } from '../types';
import { db, appId, doc, onSnapshot } from '../config/firebase';
import { ItineraryManager, type ItineraryManagerHandle } from '../components/ItineraryManager';
import { MobileActionMenu, type MenuAction } from '../components/MobileActionMenu';

interface TripViewProps {
  user: User;
  tripId: string;
  onBack: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function AdminPanel(_props: { tripId: string; trip: Trip; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Trip Settings</h2>
          <button
            onClick={_props.onClose}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <p className="text-slate-400 text-center py-10">Admin Panel - Coming soon</p>
        </div>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function TripView({ user: _user, tripId, onBack }: TripViewProps) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const itineraryRef = useRef<ItineraryManagerHandle>(null);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'artifacts', appId, 'public', 'data', 'trips', tripId),
      (docSnap) => {
        if (docSnap.exists()) {
          setTrip({ id: docSnap.id, ...docSnap.data() } as Trip);
        }
      }
    );
    return () => unsub();
  }, [tripId]);

  const copyShareLink = () => {
    const shareLink = `${window.location.origin}/join/${tripId}`;
    navigator.clipboard
      .writeText(shareLink)
      .then(() => {
        alert('Share link copied to clipboard!');
      })
      .catch(() => {
        const textarea = document.createElement('textarea');
        textarea.value = shareLink;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert('Share link copied to clipboard!');
      });
  };

  if (!trip) {
    return <div className="p-10 text-center text-slate-400">Loading trip details...</div>;
  }

  const menuActions: MenuAction[] = [
    {
      label: 'Add Item',
      icon: <Plus className="w-4 h-4" />,
      onClick: () => itineraryRef.current?.openAddModal(),
      variant: 'primary',
    },
    {
      label: 'Generate with AI',
      icon: <Sparkles className="w-4 h-4" />,
      onClick: () => itineraryRef.current?.openAIModal(),
      variant: 'gradient',
    },
    {
      label: 'Share Trip',
      icon: <Share2 className="w-4 h-4" />,
      onClick: copyShareLink,
    },
    {
      label: 'Trip Settings',
      icon: <Settings className="w-4 h-4" />,
      onClick: () => setShowAdminPanel(true),
    },
  ];

  return (
    <div className="flex flex-col h-screen bg-white md:bg-slate-100">
      <div className="bg-indigo-600 text-white p-4 shadow-md z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={onBack}
              className="mr-3 p-1 hover:bg-indigo-500 rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold leading-tight">{trip.name}</h1>
              <div className="text-indigo-200 text-xs flex items-center mt-1 space-x-3">
                <span>
                  {trip.startDate || 'TBD'} to {trip.endDate || 'TBD'}
                </span>
                <span className="w-1 h-1 bg-indigo-400 rounded-full"></span>
                <span>{trip.members?.length || 1} Members</span>
              </div>
            </div>
          </div>
          
          {/* Hamburger menu with Share and Admin options */}
          <MobileActionMenu actions={menuActions} triggerVariant="dark" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50">
        <div className="max-w-5xl mx-auto p-4 h-full">
          <ItineraryManager ref={itineraryRef} tripId={tripId} trip={trip} />
        </div>
      </div>

      {/* Admin Panel Modal */}
      {showAdminPanel && (
        <AdminPanel tripId={tripId} trip={trip} onClose={() => setShowAdminPanel(false)} />
      )}
    </div>
  );
}

