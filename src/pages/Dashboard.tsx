import { useState, useEffect, useRef } from 'react';
import { Plane, Plus, Upload } from 'lucide-react';
import type { User } from 'firebase/auth';

import type { Trip } from '../types';
import { TripCard } from '../components/TripCard';
import {
  db,
  appId,
  collection,
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  writeBatch
} from '../config/firebase';

interface DashboardProps {
  user: User;
  onOpenTrip: (id: string) => void;
}

export function Dashboard({ user, onOpenTrip }: DashboardProps) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [newTripName, setNewTripName] = useState('');
  const [newTripStart, setNewTripStart] = useState('');
  const [newTripEnd, setNewTripEnd] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [createError, setCreateError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    const tripsRef = collection(db, 'artifacts', appId, 'public', 'data', 'trips');
    const unsubscribe = onSnapshot(
      tripsRef,
      (snapshot) => {
        const allTrips = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Trip
        );
        const myTrips = allTrips.filter(
          (t) => t.ownerId === user.uid || (t.members && t.members.includes(user.uid))
        );
        setTrips(myTrips);
      },
      (error) => console.error('Error fetching trips:', error)
    );

    return () => unsubscribe();
  }, [user]);

  const handleCreateTrip = async () => {
    setCreateError('');
    
    if (!newTripName.trim()) {
      setCreateError('Please enter a trip name');
      return;
    }
    
    setIsCreating(true);
    try {
      const newTrip: Partial<Trip> = {
        name: newTripName.trim(),
        startDate: newTripStart,
        endDate: newTripEnd,
        ownerId: user.uid,
        members: [user.uid],
        joinCode: Math.random().toString(36).substring(2, 8).toUpperCase()
      };
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'trips'), newTrip);
      setShowCreateModal(false);
      setNewTripName('');
      setNewTripStart('');
      setNewTripEnd('');
      setCreateError('');
    } catch (e) {
      console.error('Error creating trip', e);
      setCreateError('Failed to create trip. Please check your connection and try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const fetchDocAndJoin = (docId: string) => {
    const unsub = onSnapshot(
      doc(db, 'artifacts', appId, 'public', 'data', 'trips', docId),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as Trip;
          const members = data.members || [];
          if (!members.includes(user.uid)) {
            updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'trips', docId), {
              members: [...members, user.uid]
            });
          }
        }
        unsub();
        setShowJoinModal(false);
        setJoinCodeInput('');
      },
      () => {
        alert('Trip not found.');
        unsub();
      }
    );
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!data.trip || !data.itinerary) throw new Error('Invalid format');

        // Create new Trip
        const newTripRef = await addDoc(
          collection(db, 'artifacts', appId, 'public', 'data', 'trips'),
          {
            ...data.trip,
            name: `${data.trip.name} (Restored)`,
            ownerId: user.uid,
            members: [user.uid],
            joinCode: Math.random().toString(36).substring(2, 8).toUpperCase()
          }
        );

        const batch = writeBatch(db);

        // Restore Itinerary
        data.itinerary.forEach((item: any) => {
          const ref = doc(
            collection(db, 'artifacts', appId, 'public', 'data', 'trips', newTripRef.id, 'itinerary')
          );
          batch.set(ref, item);
        });

        // Restore Expenses
        if (data.expenses) {
          data.expenses.forEach((item: any) => {
            const ref = doc(
              collection(db, 'artifacts', appId, 'public', 'data', 'trips', newTripRef.id, 'expenses')
            );
            batch.set(ref, item);
          });
        }

        // Restore Tasks
        if (data.tasks) {
          data.tasks.forEach((item: any) => {
            const ref = doc(
              collection(db, 'artifacts', appId, 'public', 'data', 'trips', newTripRef.id, 'tasks')
            );
            batch.set(ref, item);
          });
        }

        await batch.commit();
        alert('Trip restored successfully!');
      } catch (err) {
        console.error(err);
        alert('Failed to import trip. Check file format.');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <header className="flex justify-between items-center mb-8 pt-4">
        <div className="flex items-center space-x-2">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Plane className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">TravelSync</h1>
        </div>
        <div className="flex space-x-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".json"
            onChange={handleFileImport}
          />
          <button
            onClick={handleImportClick}
            className="px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 font-medium text-sm transition-colors flex items-center"
            title="Import from Backup"
          >
            <Upload className="w-4 h-4 mr-2" /> Import
          </button>
          <button
            onClick={() => setShowJoinModal(true)}
            className="px-4 py-2 text-indigo-600 bg-white border border-indigo-100 rounded-lg hover:bg-indigo-50 font-medium text-sm transition-colors"
          >
            Join Trip
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm shadow-sm transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-1" /> New Trip
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trips.map((trip) => (
          <TripCard
            key={trip.id}
            trip={trip}
            isOwner={trip.ownerId === user.uid}
            onClick={() => onOpenTrip(trip.id)}
          />
        ))}

        {trips.length === 0 && (
          <div className="col-span-full text-center py-20 bg-white rounded-xl border border-dashed border-slate-300 text-slate-400">
            <Plane className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No trips yet. Create one or Import a backup!</p>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Plan a New Trip</h2>
            
            {createError && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                {createError}
              </div>
            )}
            
            <input
              className={`w-full p-3 border rounded-lg mb-3 focus:ring-2 focus:ring-indigo-500 outline-none ${
                createError && !newTripName.trim() ? 'border-red-300 bg-red-50' : 'border-slate-300'
              }`}
              placeholder="Trip Name (e.g., Summer in Italy)"
              value={newTripName}
              onChange={(e) => {
                setNewTripName(e.target.value);
                if (createError) setCreateError('');
              }}
              disabled={isCreating}
            />
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Start Date</label>
                <input
                  type="date"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                  value={newTripStart}
                  onChange={(e) => setNewTripStart(e.target.value)}
                  disabled={isCreating}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">End Date</label>
                <input
                  type="date"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                  value={newTripEnd}
                  onChange={(e) => setNewTripEnd(e.target.value)}
                  disabled={isCreating}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateError('');
                }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50"
                disabled={isCreating}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTrip}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  'Create Trip'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Join a Trip</h2>
            <p className="text-sm text-slate-500 mb-3">
              Enter the Trip ID shared by the organizer.
            </p>
            <input
              className="w-full p-3 border border-slate-300 rounded-lg mb-4 focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
              placeholder="Paste Trip ID here..."
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value)}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowJoinModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => fetchDocAndJoin(joinCodeInput)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

