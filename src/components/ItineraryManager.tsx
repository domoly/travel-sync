import { useState, useCallback, useEffect, useImperativeHandle, forwardRef } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import {
  MapPin,
  List,
  Map as MapIcon,
  Loader2
} from 'lucide-react';

import type { Trip, ItineraryItem } from '../types';
import { useItineraryItems, useItineraryForm, usePlaceEnrichment } from '../hooks';
import { geocodeAddress } from '../services/geocoding';
import { enrichItemWithPlaceDetails, formatPlaceDetailsForStorage } from '../services/places';

import { ItineraryItemCard } from './ItineraryItemCard';
import { ItineraryMapView } from './ItineraryMapView';
import { AddEditItemModal } from './AddEditItemModal';
import { AIGenerationModal } from './AIGenerationModal';
import { ItemDetailPanel } from './ItemDetailPanel';

// Google Maps API Key
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Libraries to load - defined outside component to prevent reloading
const GOOGLE_MAPS_LIBRARIES: ("places")[] = ["places"];

interface ItineraryManagerProps {
  tripId: string;
  trip: Trip;
}

// Methods exposed to parent via ref
export interface ItineraryManagerHandle {
  openAddModal: () => void;
  openAIModal: () => void;
}

/**
 * Refactored ItineraryManager - now ~300 lines instead of 1140!
 * Uses custom hooks for state management and extracted components for UI.
 */
export const ItineraryManager = forwardRef<ItineraryManagerHandle, ItineraryManagerProps>(function ItineraryManager({ tripId, trip }, ref) {
  // Load Google Maps API with Places library immediately on page load
  const { isLoaded: isMapsApiLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    id: 'google-map-script',
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  // Log when Maps API is ready (for debugging)
  useEffect(() => {
    if (isMapsApiLoaded) {
      console.log('✅ Google Maps API with Places loaded');
    }
  }, [isMapsApiLoaded]);

  // Use custom hooks for data and form management
  const {
    items,
    isLoading,
    itemsByDay,
    sortedDays,
    addItem,
    updateItem,
    deleteItem,
    toggleComplete,
    addItemsBatch,
    updateItemsBatch,
  } = useItineraryItems(tripId);

  // Automatically enrich items with Google Places data
  usePlaceEnrichment({
    items,
    apiKey: GOOGLE_MAPS_API_KEY,
    onUpdateItem: updateItem,
    enabled: isMapsApiLoaded && !!GOOGLE_MAPS_API_KEY,
  });

  const {
    form,
    editingItem,
    isGeocoding,
    isLookingUpFlight,
    setField,
    resetForm,
    populateFromItem,
    handleGoogleMapsLinkChange,
    handleGeocodeLocation,
    handleFlightLookup,
    toItemData,
    isValid,
  } = useItineraryForm();

  // UI state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItineraryItem | null>(null);
  const [aiDestination, setAiDestination] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [isBatchGeocoding, setIsBatchGeocoding] = useState(false);

  // Memoized date formatter
  const formatDate = useCallback((dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }, []);

  // Open add modal with default date
  const openAddModal = useCallback(() => {
    resetForm(trip.startDate);
    setShowAddModal(true);
  }, [resetForm, trip.startDate]);

  // Open edit modal with item data
  const openEditModal = useCallback((item: ItineraryItem) => {
    populateFromItem(item);
    setShowAddModal(true);
  }, [populateFromItem]);

  // Close add/edit modal
  const closeAddModal = useCallback(() => {
    setShowAddModal(false);
    resetForm();
  }, [resetForm]);

  // Open detail view for an item
  const openDetailModal = useCallback((item: ItineraryItem) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  }, []);

  // Close detail modal
  const closeDetailModal = useCallback(() => {
    setShowDetailModal(false);
    setSelectedItem(null);
  }, []);

  // Transition from detail view to edit
  const editFromDetail = useCallback((item: ItineraryItem) => {
    closeDetailModal();
    openEditModal(item);
  }, [closeDetailModal, openEditModal]);

  // Submit form (add or update) with place enrichment
  const handleSubmit = useCallback(async () => {
    if (!isValid) return;

    setIsSubmitting(true);
    try {
      const itemData = toItemData();
      
      // Try to enrich with place details if we have a Google Maps link
      if (GOOGLE_MAPS_API_KEY && itemData.googleMapsLink && itemData.type !== 'flight') {
        console.log('🔍 Starting place enrichment for:', itemData.googleMapsLink);
        try {
          const placeDetails = await enrichItemWithPlaceDetails(
            itemData.googleMapsLink,
            itemData.location || '',
            GOOGLE_MAPS_API_KEY,
            itemData.lat && itemData.lng ? { lat: itemData.lat, lng: itemData.lng } : undefined
          );
          
          if (placeDetails) {
            console.log('✅ Place enrichment successful:', placeDetails);
            // Store enriched data with timestamp
            itemData.placeDescription = formatPlaceDetailsForStorage(placeDetails);
            itemData.placeDataFetchedAt = Date.now();
            
            // Update coordinates if we got them from Places API and don't have them yet
            if (!itemData.lat && placeDetails.lat) {
              itemData.lat = placeDetails.lat;
            }
            if (!itemData.lng && placeDetails.lng) {
              itemData.lng = placeDetails.lng;
            }
          } else {
            console.log('ℹ️ No place details found');
            // Mark as attempted so we don't keep retrying
            itemData.placeDataFetchedAt = Date.now();
          }
        } catch (placeError) {
          console.error('❌ Place enrichment error:', placeError);
          // Continue without enrichment - not a critical error
        }
      }
      
      if (editingItem) {
        await updateItem(editingItem.id, itemData);
      } else {
        await addItem(itemData);
      }
      
      closeAddModal();
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Failed to save item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [isValid, toItemData, editingItem, updateItem, addItem, closeAddModal]);

  // Handle delete with confirmation (already in hook, but wrapper for UI)
  const handleDelete = useCallback(async (item: ItineraryItem) => {
    try {
      await deleteItem(item.id);
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  }, [deleteItem]);

  // Open AI modal (optionally with pre-filled destination)
  const openAIModal = useCallback((destination?: string) => {
    setAiDestination(destination || '');
    setShowAIModal(true);
  }, []);

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    openAddModal,
    openAIModal: () => openAIModal(),
  }), [openAddModal, openAIModal]);

  // Close AI modal
  const closeAIModal = useCallback(() => {
    setShowAIModal(false);
    setAiDestination('');
  }, []);

  // Add AI-generated items using batch write (FAST!)
  const handleAddAIItems = useCallback(async (newItems: Partial<ItineraryItem>[]) => {
    await addItemsBatch(newItems);
  }, [addItemsBatch]);

  // Handle geocode location from form
  const handleGeocode = useCallback(() => {
    handleGeocodeLocation(GOOGLE_MAPS_API_KEY);
  }, [handleGeocodeLocation]);

  // Batch geocode for map view
  const handleBatchGeocode = useCallback(async (itemsToGeocode: ItineraryItem[]) => {
    if (!GOOGLE_MAPS_API_KEY || itemsToGeocode.length === 0) return;

    setIsBatchGeocoding(true);
    let successCount = 0;
    let failCount = 0;
    const updates: Array<{ id: string; data: Partial<ItineraryItem> }> = [];

    try {
      for (const item of itemsToGeocode) {
        if (!item.location) {
          failCount++;
          continue;
        }

        try {
          const result = await geocodeAddress(item.location, GOOGLE_MAPS_API_KEY);
          if (result) {
            updates.push({
              id: item.id,
              data: { lat: result.lat, lng: result.lng }
            });
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          console.error(`Failed to geocode "${item.location}":`, error);
          failCount++;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Batch update all geocoded items at once
      if (updates.length > 0) {
        await updateItemsBatch(updates);
      }

      if (successCount > 0) {
        alert(`Successfully geocoded ${successCount} item(s)${failCount > 0 ? `. ${failCount} item(s) could not be found.` : '.'}`);
      } else {
        alert('Could not find coordinates for any items. Try editing them with more specific location names.');
      }
    } catch (error) {
      console.error('Batch geocoding error:', error);
      alert('An error occurred while geocoding. Please try again.');
    } finally {
      setIsBatchGeocoding(false);
    }
  }, [updateItemsBatch]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mr-2" />
        <span className="text-slate-500">Loading itinerary...</span>
      </div>
    );
  }

  return (
    <div className={viewMode === 'map' ? 'h-[calc(100vh-200px)] flex flex-col' : 'pb-20'}>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-3">
          <h2 className="text-lg font-semibold text-slate-700">Itinerary</h2>
          {/* View Toggle */}
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <List className="w-3.5 h-3.5 mr-1" /> List
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'map'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5 mr-1" /> Map
            </button>
          </div>
        </div>
      </div>

      {/* Map View */}
      {viewMode === 'map' && (
        <div className="flex-1 min-h-0">
          {GOOGLE_MAPS_API_KEY ? (
            <ItineraryMapView
              items={items}
              tripStartDate={trip.startDate}
              tripEndDate={trip.endDate}
              onEdit={openEditModal}
              onGeocodeItems={handleBatchGeocode}
              isGeocoding={isBatchGeocoding}
              googleMapsApiKey={GOOGLE_MAPS_API_KEY}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full bg-white rounded-xl border border-dashed border-slate-300 p-8">
              <MapIcon className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-slate-600 font-medium mb-2">Google Maps API Key Required</p>
              <p className="text-slate-400 text-sm text-center max-w-md">
                To use the map view, add your Google Maps API key to your environment variables as{' '}
                <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">VITE_GOOGLE_MAPS_API_KEY</code>
              </p>
            </div>
          )}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <>
          {/* Empty State */}
          {items.length === 0 && (
            <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-400 mb-4">No items in your itinerary yet</p>
              <button
                onClick={openAddModal}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
              >
                Add your first item
              </button>
            </div>
          )}

          {/* Itinerary List - Now using memoized components */}
          {sortedDays.map((day) => (
            <div key={day} className="mb-6">
              <h3 className="text-sm font-semibold text-indigo-600 mb-2 sticky top-0 bg-slate-50 py-2">
                {formatDate(day)}
              </h3>
              <div className="space-y-2">
                {itemsByDay[day].map((item) => (
                  <ItineraryItemCard
                    key={`${item.id}-${item.displayDay}`}
                    item={item}
                    onToggleComplete={toggleComplete}
                    onEdit={openEditModal}
                    onDelete={handleDelete}
                    onGenerateAI={openAIModal}
                    onViewDetails={openDetailModal}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {/* Add/Edit Modal */}
      <AddEditItemModal
        isOpen={showAddModal}
        isEditing={!!editingItem}
        form={form}
        isSubmitting={isSubmitting}
        isGeocoding={isGeocoding}
        isLookingUpFlight={isLookingUpFlight}
        isValid={isValid}
        hasGoogleMapsKey={!!GOOGLE_MAPS_API_KEY}
        onClose={closeAddModal}
        onSubmit={handleSubmit}
        onSetField={setField}
        onGoogleMapsLinkChange={handleGoogleMapsLinkChange}
        onGeocodeLocation={handleGeocode}
        onFlightLookup={handleFlightLookup}
      />

      {/* AI Generation Modal */}
      <AIGenerationModal
        isOpen={showAIModal}
        trip={trip}
        existingItems={items}
        initialDestination={aiDestination}
        onClose={closeAIModal}
        onAddItems={handleAddAIItems}
        formatDate={formatDate}
      />

      {/* Item Detail Panel */}
      <ItemDetailPanel
        item={selectedItem}
        isOpen={showDetailModal}
        onClose={closeDetailModal}
        onEdit={editFromDetail}
        onDelete={handleDelete}
        formatDate={formatDate}
      />
    </div>
  );
});
