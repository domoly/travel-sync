import { useMemo } from 'react';
import { db, appId, collection, doc } from '../config/firebase';

/**
 * Hook that provides Firebase path helpers for a trip
 * Eliminates repetitive path construction and typos
 */
export function useFirebasePaths(tripId: string) {
  return useMemo(() => ({
    // Collection references
    tripRef: doc(db, 'artifacts', appId, 'public', 'data', 'trips', tripId),
    itineraryCollection: collection(db, 'artifacts', appId, 'public', 'data', 'trips', tripId, 'itinerary'),
    expensesCollection: collection(db, 'artifacts', appId, 'public', 'data', 'trips', tripId, 'expenses'),
    tasksCollection: collection(db, 'artifacts', appId, 'public', 'data', 'trips', tripId, 'tasks'),
    
    // Document reference helpers
    itineraryDoc: (itemId: string) => 
      doc(db, 'artifacts', appId, 'public', 'data', 'trips', tripId, 'itinerary', itemId),
    expenseDoc: (expenseId: string) => 
      doc(db, 'artifacts', appId, 'public', 'data', 'trips', tripId, 'expenses', expenseId),
    taskDoc: (taskId: string) => 
      doc(db, 'artifacts', appId, 'public', 'data', 'trips', tripId, 'tasks', taskId),
  }), [tripId]);
}

// Static path helpers for use outside of React components
export const firebasePaths = {
  tripsCollection: () => collection(db, 'artifacts', appId, 'public', 'data', 'trips'),
  tripDoc: (tripId: string) => doc(db, 'artifacts', appId, 'public', 'data', 'trips', tripId),
  itineraryCollection: (tripId: string) => 
    collection(db, 'artifacts', appId, 'public', 'data', 'trips', tripId, 'itinerary'),
  itineraryDoc: (tripId: string, itemId: string) => 
    doc(db, 'artifacts', appId, 'public', 'data', 'trips', tripId, 'itinerary', itemId),
};
