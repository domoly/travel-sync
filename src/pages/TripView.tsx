import { useState, useEffect } from 'react';
import {
  Map as MapIcon,
  ChevronLeft,
  Share2,
  DollarSign,
  CheckSquare
} from 'lucide-react';
import type { User } from 'firebase/auth';

import type { Trip } from '../types';
import { db, appId, doc, onSnapshot } from '../config/firebase';
import { ItineraryManager } from '../components/ItineraryManager';

interface TripViewProps {
  user: User;
  tripId: string;
  onBack: () => void;
}

// Placeholder components until they are implemented
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ExpenseTracker(_props: { tripId: string; members: string[] }) {
  return <div className="text-slate-400 text-center py-10">Expense Tracker - Coming soon</div>;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function AdminPanel(_props: { tripId: string; trip: Trip }) {
  return <div className="text-slate-400 text-center py-10">Admin Panel - Coming soon</div>;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function TripView({ user: _user, tripId, onBack }: TripViewProps) {
  const [activeTab, setActiveTab] = useState<'itinerary' | 'expenses' | 'admin'>('itinerary');
  const [trip, setTrip] = useState<Trip | null>(null);
  const [copyStatus, setCopyStatus] = useState('Share');

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
        setCopyStatus('Link Copied!');
        setTimeout(() => setCopyStatus('Share'), 2000);
      })
      .catch(() => {
        const textarea = document.createElement('textarea');
        textarea.value = shareLink;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopyStatus('Link Copied!');
        setTimeout(() => setCopyStatus('Share'), 2000);
      });
  };

  if (!trip) {
    return <div className="p-10 text-center text-slate-400">Loading trip details...</div>;
  }

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
          <button
            onClick={copyShareLink}
            className="flex items-center text-xs bg-indigo-700 hover:bg-indigo-500 px-3 py-1.5 rounded-full transition-colors"
          >
            <Share2 className="w-3 h-3 mr-1" /> {copyStatus}
          </button>
        </div>
      </div>

      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto flex">
          <button
            onClick={() => setActiveTab('itinerary')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex justify-center items-center ${
              activeTab === 'itinerary'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <MapIcon className="w-4 h-4 mr-2" /> Itinerary
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex justify-center items-center ${
              activeTab === 'expenses'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <DollarSign className="w-4 h-4 mr-2" /> Expenses
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex justify-center items-center ${
              activeTab === 'admin'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <CheckSquare className="w-4 h-4 mr-2" /> Admin
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50">
        <div className="max-w-5xl mx-auto p-4 h-full">
          {activeTab === 'itinerary' && <ItineraryManager tripId={tripId} trip={trip} />}
          {activeTab === 'expenses' && <ExpenseTracker tripId={tripId} members={trip.members} />}
          {activeTab === 'admin' && <AdminPanel tripId={tripId} trip={trip} />}
        </div>
      </div>
    </div>
  );
}

