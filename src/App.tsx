import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import type { User } from 'firebase/auth';
import { Plane } from 'lucide-react';

import { Dashboard } from './pages/Dashboard';
import { TripView } from './pages/TripView';
import {
  auth,
  signInAnonymously,
  onAuthStateChanged,
  db,
  appId,
  doc,
  updateDoc,
  onSnapshot
} from './config/firebase';

// App version - update this with each deployment
const APP_VERSION = '1.3.0';

// Wrapper component for Dashboard with navigation
function DashboardRoute({ user }: { user: User }) {
  const navigate = useNavigate();

  return (
    <Dashboard
      user={user}
      onOpenTrip={(tripId) => navigate(`/trip/${tripId}`)}
    />
  );
}

// Wrapper component for TripView with navigation and params
function TripViewRoute({ user }: { user: User }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) {
    navigate('/');
    return null;
  }

  return (
    <TripView
      user={user}
      tripId={id}
      onBack={() => navigate('/')}
    />
  );
}

// Wrapper component for joining a trip via shareable link
function JoinTripRoute({ user }: { user: User }) {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'joining' | 'success' | 'error'>('joining');

  useEffect(() => {
    if (!tripId) {
      navigate('/');
      return;
    }

    const tripRef = doc(db, 'artifacts', appId, 'public', 'data', 'trips', tripId);
    
    const unsub = onSnapshot(
      tripRef,
      async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const members = data.members || [];
          
          if (!members.includes(user.uid)) {
            try {
              await updateDoc(tripRef, {
                members: [...members, user.uid]
              });
            } catch (error) {
              console.error('Error joining trip:', error);
            }
          }
          
          setStatus('success');
          // Navigate to the trip after a brief moment
          setTimeout(() => navigate(`/trip/${tripId}`), 500);
        } else {
          setStatus('error');
        }
        unsub();
      },
      (error) => {
        console.error('Error fetching trip:', error);
        setStatus('error');
        unsub();
      }
    );

    return () => unsub();
  }, [tripId, user.uid, navigate]);

  if (status === 'joining') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 text-slate-600">
        <div className="animate-spin mb-4">
          <Plane className="w-8 h-8 text-indigo-600" />
        </div>
        <p className="text-lg font-medium">Joining trip...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 text-slate-600">
        <div className="text-red-500 mb-4">
          <Plane className="w-8 h-8" />
        </div>
        <p className="text-lg font-medium mb-2">Trip not found</p>
        <p className="text-sm text-slate-400 mb-4">This link may be invalid or the trip may have been deleted.</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-50 text-slate-600">
      <div className="text-green-500 mb-4">
        <Plane className="w-8 h-8" />
      </div>
      <p className="text-lg font-medium">Successfully joined! Redirecting...</p>
    </div>
  );
}

// Main App with auth handling
function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error('Auth failed:', error);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 text-slate-400">
        <div className="animate-spin mr-2">
          <Plane className="w-6 h-6" />
        </div>
        Loading TravelSync...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4 text-center">
        Authentication Error. Please refresh.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      <Routes>
        <Route path="/" element={<DashboardRoute user={user} />} />
        <Route path="/trip/:id" element={<TripViewRoute user={user} />} />
        <Route path="/join/:tripId" element={<JoinTripRoute user={user} />} />
      </Routes>
      
      {/* Version indicator */}
      <div className="fixed bottom-2 left-2 text-xs text-slate-400 bg-white/80 px-2 py-1 rounded shadow-sm">
        v{APP_VERSION}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
