import { useState, useCallback } from 'react';
import type { ItineraryItem } from '../types';
import { extractCoordsFromGoogleMapsUrl, geocodeAddress } from '../services/geocoding';

// Form state interface - consolidates all 14+ separate useState calls
export interface ItineraryFormState {
  type: 'activity' | 'flight';
  day: string;
  endDay: string;
  time: string;
  location: string;
  notes: string;
  category: string;
  googleMapsLink: string;
  lat: string;
  lng: string;
  // Flight specific
  arrivalLocation: string;
  arrivalTime: string;
  airline: string;
  flightNumber: string;
}

const INITIAL_FORM_STATE: ItineraryFormState = {
  type: 'activity',
  day: '',
  endDay: '',
  time: '',
  location: '',
  notes: '',
  category: 'sightseeing',
  googleMapsLink: '',
  lat: '',
  lng: '',
  arrivalLocation: '',
  arrivalTime: '',
  airline: '',
  flightNumber: '',
};

interface UseItineraryFormReturn {
  form: ItineraryFormState;
  editingItem: ItineraryItem | null;
  isGeocoding: boolean;
  // Form actions
  setField: <K extends keyof ItineraryFormState>(field: K, value: ItineraryFormState[K]) => void;
  setFields: (fields: Partial<ItineraryFormState>) => void;
  resetForm: (defaultDay?: string) => void;
  populateFromItem: (item: ItineraryItem) => void;
  handleGoogleMapsLinkChange: (url: string) => void;
  handleGeocodeLocation: (apiKey: string) => Promise<void>;
  // Convert form to item data
  toItemData: () => Partial<ItineraryItem>;
  // Validation
  isValid: boolean;
}

/**
 * Hook for managing itinerary form state
 * Consolidates 14+ useState calls into a single, manageable hook
 */
export function useItineraryForm(): UseItineraryFormReturn {
  const [form, setForm] = useState<ItineraryFormState>(INITIAL_FORM_STATE);
  const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Set single field
  const setField = useCallback(<K extends keyof ItineraryFormState>(
    field: K, 
    value: ItineraryFormState[K]
  ) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  // Set multiple fields at once
  const setFields = useCallback((fields: Partial<ItineraryFormState>) => {
    setForm(prev => ({ ...prev, ...fields }));
  }, []);

  // Reset form to initial state
  const resetForm = useCallback((defaultDay?: string) => {
    setForm({
      ...INITIAL_FORM_STATE,
      day: defaultDay || '',
    });
    setEditingItem(null);
  }, []);

  // Populate form from existing item (for editing)
  const populateFromItem = useCallback((item: ItineraryItem) => {
    setEditingItem(item);
    setForm({
      type: item.type,
      day: item.day,
      endDay: item.endDay || '',
      time: item.time,
      location: item.location,
      notes: item.notes || '',
      category: item.category || 'sightseeing',
      googleMapsLink: item.googleMapsLink || '',
      lat: item.lat?.toString() || '',
      lng: item.lng?.toString() || '',
      arrivalLocation: item.arrivalLocation || '',
      arrivalTime: item.arrivalTime || '',
      airline: item.airline || '',
      flightNumber: item.flightNumber || '',
    });
  }, []);

  // Handle Google Maps link change with coordinate extraction
  const handleGoogleMapsLinkChange = useCallback((url: string) => {
    setForm(prev => {
      const coords = extractCoordsFromGoogleMapsUrl(url);
      return {
        ...prev,
        googleMapsLink: url,
        ...(coords ? { lat: coords.lat.toString(), lng: coords.lng.toString() } : {}),
      };
    });
  }, []);

  // Geocode location to get coordinates
  const handleGeocodeLocation = useCallback(async (apiKey: string) => {
    if (!form.location || !apiKey) return;
    
    setIsGeocoding(true);
    try {
      const result = await geocodeAddress(form.location, apiKey);
      if (result) {
        setForm(prev => ({
          ...prev,
          lat: result.lat.toString(),
          lng: result.lng.toString(),
        }));
      } else {
        alert('Could not find coordinates for this location. Try being more specific.');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      alert('Failed to geocode location. Please try again.');
    } finally {
      setIsGeocoding(false);
    }
  }, [form.location]);

  // Convert form state to item data for Firebase
  const toItemData = useCallback((): Partial<ItineraryItem> => {
    const itemData: Partial<ItineraryItem> = {
      type: form.type,
      day: form.day,
      time: form.time,
      location: form.location,
      notes: form.notes,
      completed: editingItem?.completed || false,
    };

    // Add coordinates if provided
    if (form.lat && form.lng) {
      itemData.lat = parseFloat(form.lat);
      itemData.lng = parseFloat(form.lng);
    }

    if (form.type === 'activity') {
      itemData.category = form.category as ItineraryItem['category'];
      itemData.googleMapsLink = form.googleMapsLink;
      
      // Add endDay for lodging (multi-day stays)
      if (form.category === 'lodging' && form.endDay) {
        itemData.endDay = form.endDay;
      } else {
        itemData.endDay = undefined;
      }
    } else {
      // Flight
      itemData.arrivalLocation = form.arrivalLocation;
      itemData.arrivalTime = form.arrivalTime;
      itemData.airline = form.airline;
      itemData.flightNumber = form.flightNumber;
    }

    return itemData;
  }, [form, editingItem]);

  // Form validation
  const isValid = Boolean(form.day && form.location);

  return {
    form,
    editingItem,
    isGeocoding,
    setField,
    setFields,
    resetForm,
    populateFromItem,
    handleGoogleMapsLinkChange,
    handleGeocodeLocation,
    toItemData,
    isValid,
  };
}
