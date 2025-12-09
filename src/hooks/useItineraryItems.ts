import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  writeBatch,
  doc,
  collection
} from 'firebase/firestore';
import { db, appId } from '../config/firebase';
import { useFirebasePaths } from './useFirebasePaths';
import type { ItineraryItem, DisplayItineraryItem, LodgingPhase } from '../types';

/**
 * Helper to format a Date as YYYY-MM-DD in local timezone (avoids UTC conversion issues)
 */
function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Helper to get all dates between start and end (inclusive of start, exclusive of end for lodging)
 * For lodging: startDate is check-in day, endDate is check-out day
 * We show "staying" on nights you sleep there, and "check-out" on the morning you leave
 */
function getDatesBetween(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(startDate + 'T12:00:00'); // Use noon to avoid any DST edge cases
  const end = new Date(endDate + 'T12:00:00');
  
  while (current <= end) {
    dates.push(formatLocalDate(current));
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

/**
 * Expands multi-day lodging items into display items for each day they span
 */
function expandLodgingItems(items: ItineraryItem[]): DisplayItineraryItem[] {
  const displayItems: DisplayItineraryItem[] = [];
  
  for (const item of items) {
    const isMultiDayLodging = item.category === 'lodging' && item.endDay && item.endDay !== item.day;
    
    if (isMultiDayLodging) {
      const stayDates = getDatesBetween(item.day, item.endDay!);
      
      stayDates.forEach((date, index) => {
        let lodgingPhase: LodgingPhase;
        
        if (index === 0) {
          lodgingPhase = 'check-in';
        } else if (index === stayDates.length - 1) {
          lodgingPhase = 'check-out';
        } else {
          lodgingPhase = 'staying';
        }
        
        displayItems.push({
          ...item,
          displayDay: date,
          lodgingPhase,
          isVirtual: index !== 0, // First day uses the original item
        });
      });
    } else {
      // Non-lodging items or single-day lodging
      displayItems.push({
        ...item,
        displayDay: item.day,
        isVirtual: false,
      });
    }
  }
  
  return displayItems;
}

interface UseItineraryItemsReturn {
  items: ItineraryItem[];
  isLoading: boolean;
  error: string | null;
  // Grouped and sorted data (memoized) - now uses DisplayItineraryItem for multi-day support
  itemsByDay: Record<string, DisplayItineraryItem[]>;
  sortedDays: string[];
  // CRUD operations
  addItem: (item: Partial<ItineraryItem>) => Promise<void>;
  updateItem: (itemId: string, updates: Partial<ItineraryItem>) => Promise<void>;
  deleteItem: (itemId: string) => Promise<boolean>;
  toggleComplete: (item: ItineraryItem) => Promise<void>;
  // Batch operations
  addItemsBatch: (items: Partial<ItineraryItem>[]) => Promise<void>;
  updateItemsBatch: (updates: Array<{ id: string; data: Partial<ItineraryItem> }>) => Promise<void>;
}

/**
 * Hook for managing itinerary items with Firebase
 * Provides memoized data, CRUD operations, and batch writes
 */
export function useItineraryItems(tripId: string): UseItineraryItemsReturn {
  const [items, setItems] = useState<ItineraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const paths = useFirebasePaths(tripId);

  // Subscribe to itinerary changes
  useEffect(() => {
    // Create a flag to handle initial load
    let isFirstLoad = true;
    
    const unsubscribe = onSnapshot(
      paths.itineraryCollection,
      (snapshot) => {
        const itineraryItems = snapshot.docs.map(
          (docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as ItineraryItem
        );
        // Sort by day and time
        itineraryItems.sort((a, b) => {
          if (a.day !== b.day) return a.day.localeCompare(b.day);
          return a.time.localeCompare(b.time);
        });
        setItems(itineraryItems);
        if (isFirstLoad) {
          setIsLoading(false);
          isFirstLoad = false;
        }
      },
      (err) => {
        console.error('Error fetching itinerary:', err);
        setError('Failed to load itinerary');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [paths.itineraryCollection]);

  // Memoized grouping by day with multi-day lodging expansion
  const itemsByDay = useMemo(() => {
    // Expand multi-day lodging items to appear on each day
    const displayItems = expandLodgingItems(items);
    
    // Group by displayDay
    const grouped = displayItems.reduce((acc, item) => {
      if (!acc[item.displayDay]) acc[item.displayDay] = [];
      acc[item.displayDay].push(item);
      return acc;
    }, {} as Record<string, DisplayItineraryItem[]>);
    
    // Sort items within each day:
    // 1. Check-out items first (you're leaving from here in the morning)
    // 2. Check-in items at top (your base for the day), BUT flights landing before check-in come first
    // 3. Regular activities sorted by time
    // 4. Staying items at the end (context for where you're sleeping)
    for (const day of Object.keys(grouped)) {
      const dayItems = grouped[day];
      
      // Find check-in item and its time (if any)
      const checkInItem = dayItems.find(item => item.lodgingPhase === 'check-in');
      const checkInTime = checkInItem?.time || '23:59'; // Default to end of day if no time
      
      grouped[day].sort((a, b) => {
        // Helper to determine sort priority
        const getSortPriority = (item: DisplayItineraryItem): number => {
          // Check-out always first (0)
          if (item.lodgingPhase === 'check-out') return 0;
          
          // Flights landing BEFORE check-in time come next (1)
          // Use arrivalTime for flights if available, otherwise use time
          const isFlight = item.type === 'flight';
          const flightLandingTime = item.arrivalTime || item.time;
          if (isFlight && flightLandingTime < checkInTime) return 1;
          
          // Check-in comes after early flights (2)
          if (item.lodgingPhase === 'check-in') return 2;
          
          // Staying at the very end (4)
          if (item.lodgingPhase === 'staying') return 4;
          
          // Regular activities in the middle (3)
          return 3;
        };
        
        const aPriority = getSortPriority(a);
        const bPriority = getSortPriority(b);
        
        // If same priority, sort by time
        if (aPriority === bPriority) {
          // For flights, use arrival time for sorting
          const aTime = a.type === 'flight' ? (a.arrivalTime || a.time) : a.time;
          const bTime = b.type === 'flight' ? (b.arrivalTime || b.time) : b.time;
          return aTime.localeCompare(bTime);
        }
        
        return aPriority - bPriority;
      });
    }
    
    return grouped;
  }, [items]);

  // Memoized sorted days
  const sortedDays = useMemo(() => {
    return Object.keys(itemsByDay).sort();
  }, [itemsByDay]);

  // Add single item
  const addItem = useCallback(async (item: Partial<ItineraryItem>) => {
    try {
      await addDoc(paths.itineraryCollection, item);
    } catch (err) {
      console.error('Error adding item:', err);
      throw new Error('Failed to add item');
    }
  }, [paths.itineraryCollection]);

  // Update single item
  const updateItem = useCallback(async (itemId: string, updates: Partial<ItineraryItem>) => {
    try {
      await updateDoc(paths.itineraryDoc(itemId), updates);
    } catch (err) {
      console.error('Error updating item:', err);
      throw new Error('Failed to update item');
    }
  }, [paths]);

  // Delete single item (with confirmation)
  const deleteItemFn = useCallback(async (itemId: string): Promise<boolean> => {
    if (!confirm('Delete this item?')) return false;
    try {
      await deleteDoc(paths.itineraryDoc(itemId));
      return true;
    } catch (err) {
      console.error('Error deleting item:', err);
      throw new Error('Failed to delete item');
    }
  }, [paths]);

  // Toggle complete status
  const toggleComplete = useCallback(async (item: ItineraryItem) => {
    try {
      await updateDoc(paths.itineraryDoc(item.id), { 
        completed: !item.completed 
      });
    } catch (err) {
      console.error('Error toggling complete:', err);
      throw new Error('Failed to update item');
    }
  }, [paths]);

  // Batch add items (for AI generation) - MUCH faster than sequential
  const addItemsBatch = useCallback(async (newItems: Partial<ItineraryItem>[]) => {
    if (newItems.length === 0) return;
    
    try {
      const batch = writeBatch(db);
      
      // Get a fresh collection reference for creating new document refs
      const itineraryCol = collection(db, 'artifacts', appId, 'public', 'data', 'trips', tripId, 'itinerary');
      
      newItems.forEach((item) => {
        // Create a new document reference with auto-generated ID
        const docRef = doc(itineraryCol);
        // Ensure completed field is set (defensive - should already be set by AI service)
        const itemWithDefaults = {
          ...item,
          completed: item.completed ?? false,
        };
        batch.set(docRef, itemWithDefaults);
      });
      
      await batch.commit();
    } catch (err) {
      console.error('Error batch adding items:', err);
      throw new Error('Failed to add items');
    }
  }, [tripId]);

  // Batch update items (for geocoding multiple items)
  const updateItemsBatch = useCallback(async (
    updates: Array<{ id: string; data: Partial<ItineraryItem> }>
  ) => {
    if (updates.length === 0) return;
    
    try {
      const batch = writeBatch(db);
      
      updates.forEach(({ id, data }) => {
        batch.update(paths.itineraryDoc(id), data);
      });
      
      await batch.commit();
    } catch (err) {
      console.error('Error batch updating items:', err);
      throw new Error('Failed to update items');
    }
  }, [paths]);

  return {
    items,
    isLoading,
    error,
    itemsByDay,
    sortedDays,
    addItem,
    updateItem,
    deleteItem: deleteItemFn,
    toggleComplete,
    addItemsBatch,
    updateItemsBatch,
  };
}
