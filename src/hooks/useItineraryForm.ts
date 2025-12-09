import { useState, useCallback } from 'react';
import type { ItineraryItem } from '../types';
import { extractCoordsFromGoogleMapsUrl, geocodeAddress } from '../services/geocoding';
import { lookupFlight, parseAirlineCode, getAirlineName, type FlightInfo } from '../services/flight';

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
  // Flight enriched data
  departureAirportCode: string;
  departureAirportName: string;
  arrivalAirportCode: string;
  arrivalAirportName: string;
  arrivalLat: string;
  arrivalLng: string;
  flightValidated: boolean;
  flightValidationSource: 'database' | 'api' | 'none';
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
  // Enriched flight data
  departureAirportCode: '',
  departureAirportName: '',
  arrivalAirportCode: '',
  arrivalAirportName: '',
  arrivalLat: '',
  arrivalLng: '',
  flightValidated: false,
  flightValidationSource: 'none',
};

interface UseItineraryFormReturn {
  form: ItineraryFormState;
  editingItem: ItineraryItem | null;
  isGeocoding: boolean;
  isLookingUpFlight: boolean;
  // Form actions
  setField: <K extends keyof ItineraryFormState>(field: K, value: ItineraryFormState[K]) => void;
  setFields: (fields: Partial<ItineraryFormState>) => void;
  resetForm: (defaultDay?: string) => void;
  populateFromItem: (item: ItineraryItem) => void;
  handleGoogleMapsLinkChange: (url: string) => void;
  handleGeocodeLocation: (apiKey: string) => Promise<void>;
  handleFlightLookup: (flightApiKey?: string) => Promise<FlightInfo | null>;
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
  const [isLookingUpFlight, setIsLookingUpFlight] = useState(false);

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
      // Enriched flight data
      departureAirportCode: item.departureAirportCode || '',
      departureAirportName: item.departureAirportName || '',
      arrivalAirportCode: item.arrivalAirportCode || '',
      arrivalAirportName: item.arrivalAirportName || '',
      arrivalLat: item.arrivalLat?.toString() || '',
      arrivalLng: item.arrivalLng?.toString() || '',
      flightValidated: item.flightValidated || false,
      flightValidationSource: item.flightValidationSource || 'none',
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

  // Lookup flight information and enrich the form
  const handleFlightLookup = useCallback(async (flightApiKey?: string): Promise<FlightInfo | null> => {
    if (!form.flightNumber) {
      alert('Please enter a flight number (e.g., UA123, BA456)');
      return null;
    }

    setIsLookingUpFlight(true);
    try {
      const flightInfo = await lookupFlight(
        form.flightNumber,
        form.location,
        form.arrivalLocation,
        form.day,
        flightApiKey
      );

      if (flightInfo) {
        setForm(prev => ({
          ...prev,
          // Update airline if found
          airline: flightInfo.airline || prev.airline,
          // Update departure info
          location: flightInfo.departureAirportCode 
            ? `${flightInfo.departureAirportCode} ${flightInfo.departureCity || ''}`
            : prev.location,
          lat: flightInfo.departureLat ? flightInfo.departureLat.toString() : prev.lat,
          lng: flightInfo.departureLng ? flightInfo.departureLng.toString() : prev.lng,
          departureAirportCode: flightInfo.departureAirportCode || prev.departureAirportCode,
          departureAirportName: flightInfo.departureAirport || prev.departureAirportName,
          // Update arrival info
          arrivalLocation: flightInfo.arrivalAirportCode
            ? `${flightInfo.arrivalAirportCode} ${flightInfo.arrivalCity || ''}`
            : prev.arrivalLocation,
          arrivalAirportCode: flightInfo.arrivalAirportCode || prev.arrivalAirportCode,
          arrivalAirportName: flightInfo.arrivalAirport || prev.arrivalAirportName,
          arrivalLat: flightInfo.arrivalLat ? flightInfo.arrivalLat.toString() : prev.arrivalLat,
          arrivalLng: flightInfo.arrivalLng ? flightInfo.arrivalLng.toString() : prev.arrivalLng,
          // Update times if from API
          time: flightInfo.departureTime || prev.time,
          arrivalTime: flightInfo.arrivalTime || prev.arrivalTime,
          // Validation status
          flightValidated: flightInfo.validated,
          flightValidationSource: flightInfo.validationSource,
        }));
        return flightInfo;
      } else {
        // Try to at least extract airline from flight number
        const airlineCode = parseAirlineCode(form.flightNumber);
        if (airlineCode) {
          const airlineName = getAirlineName(airlineCode);
          if (airlineName) {
            setForm(prev => ({ ...prev, airline: airlineName }));
          }
        }
        alert('Could not find detailed flight information. Airport codes or flight number may not be recognized. You can still enter details manually.');
        return null;
      }
    } catch (error) {
      console.error('Flight lookup error:', error);
      alert('Failed to lookup flight. Please try again or enter details manually.');
      return null;
    } finally {
      setIsLookingUpFlight(false);
    }
  }, [form.flightNumber, form.location, form.arrivalLocation, form.day]);

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
      // Flight - basic fields
      itemData.arrivalLocation = form.arrivalLocation;
      itemData.arrivalTime = form.arrivalTime;
      itemData.airline = form.airline;
      itemData.flightNumber = form.flightNumber;
      
      // Flight - enriched fields
      if (form.departureAirportCode) {
        itemData.departureAirportCode = form.departureAirportCode;
        itemData.departureAirportName = form.departureAirportName;
      }
      if (form.arrivalAirportCode) {
        itemData.arrivalAirportCode = form.arrivalAirportCode;
        itemData.arrivalAirportName = form.arrivalAirportName;
      }
      if (form.arrivalLat && form.arrivalLng) {
        itemData.arrivalLat = parseFloat(form.arrivalLat);
        itemData.arrivalLng = parseFloat(form.arrivalLng);
      }
      itemData.flightValidated = form.flightValidated;
      itemData.flightValidationSource = form.flightValidationSource;
    }

    return itemData;
  }, [form, editingItem]);

  // Form validation
  const isValid = Boolean(form.day && form.location);

  return {
    form,
    editingItem,
    isGeocoding,
    isLookingUpFlight,
    setField,
    setFields,
    resetForm,
    populateFromItem,
    handleGoogleMapsLinkChange,
    handleGeocodeLocation,
    handleFlightLookup,
    toItemData,
    isValid,
  };
}
