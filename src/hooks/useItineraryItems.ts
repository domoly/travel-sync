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
import type { ItineraryItem } from '../types';

interface UseItineraryItemsReturn {
  items: ItineraryItem[];
  isLoading: boolean;
  error: string | null;
  // Grouped and sorted data (memoized)
  itemsByDay: Record<string, ItineraryItem[]>;
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

  // Memoized grouping by day
  const itemsByDay = useMemo(() => {
    return items.reduce((acc, item) => {
      if (!acc[item.day]) acc[item.day] = [];
      acc[item.day].push(item);
      return acc;
    }, {} as Record<string, ItineraryItem[]>);
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
