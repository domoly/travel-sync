import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import type { User } from 'firebase/auth';
import { Plane } from 'lucide-react';

import { Dashboard } from './pages/Dashboard';
import { TripView } from './pages/TripView';
import {
  auth,
  signInAnonymously,
  onAuthStateChanged
} from './config/firebase';

// App version - update this with each deployment
const APP_VERSION = '1.1.0';

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
