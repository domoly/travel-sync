import { useEffect, useRef, useCallback } from 'react';
import type { ItineraryItem } from '../types';
import { enrichItemWithPlaceDetails, formatPlaceDetailsForStorage } from '../services/places';

// How old data can be before we consider it stale (7 days in milliseconds)
const STALE_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

// Delay between enrichment requests to avoid rate limiting
const ENRICHMENT_DELAY_MS = 500;

interface UsePlaceEnrichmentOptions {
  items: ItineraryItem[];
  apiKey: string;
  onUpdateItem: (itemId: string, data: Partial<ItineraryItem>) => Promise<void>;
  enabled?: boolean;
}

/**
 * Hook that automatically enriches items with Google Places data.
 * 
 * It checks each item for:
 * 1. Has a Google Maps link
 * 2. Is not a flight (flights don't have place data)
 * 3. Either has no placeDescription OR placeDataFetchedAt is stale (> 7 days)
 * 
 * When an item needs enrichment, it fetches the data and updates the item.
 */
export function usePlaceEnrichment({
  items,
  apiKey,
  onUpdateItem,
  enabled = true,
}: UsePlaceEnrichmentOptions) {
  // Track which items we're currently enriching to avoid duplicates
  const enrichingRef = useRef<Set<string>>(new Set());
  // Track which items we've already processed in this session
  const processedRef = useRef<Set<string>>(new Set());

  /**
   * Check if an item needs enrichment
   */
  const needsEnrichment = useCallback((item: ItineraryItem): boolean => {
    // Skip if no Google Maps link
    if (!item.googleMapsLink) return false;
    
    // Skip flights
    if (item.type === 'flight') return false;
    
    // Needs enrichment if no place data
    if (!item.placeDescription) return true;
    
    // Needs enrichment if data is stale
    if (item.placeDataFetchedAt) {
      const age = Date.now() - item.placeDataFetchedAt;
      return age > STALE_THRESHOLD_MS;
    }
    
    // Has placeDescription but no timestamp - consider it needing refresh
    // to add the timestamp for future staleness checks
    return false;
  }, []);

  /**
   * Enrich a single item with place data
   */
  const enrichItem = useCallback(async (item: ItineraryItem) => {
    // Skip if already enriching or processed
    if (enrichingRef.current.has(item.id) || processedRef.current.has(item.id)) {
      return;
    }

    // Mark as enriching
    enrichingRef.current.add(item.id);

    try {
      console.log(`🔍 Auto-enriching item: ${item.location}`);
      
      const placeDetails = await enrichItemWithPlaceDetails(
        item.googleMapsLink,
        item.location,
        apiKey,
        item.lat && item.lng ? { lat: item.lat, lng: item.lng } : undefined
      );

      if (placeDetails) {
        console.log(`✅ Enriched "${item.location}" with place data`);
        
        const updateData: Partial<ItineraryItem> = {
          placeDescription: formatPlaceDetailsForStorage(placeDetails),
          placeDataFetchedAt: Date.now(),
        };

        // Also update coordinates if we got them and don't have them
        if (!item.lat && placeDetails.lat) {
          updateData.lat = placeDetails.lat;
        }
        if (!item.lng && placeDetails.lng) {
          updateData.lng = placeDetails.lng;
        }

        await onUpdateItem(item.id, updateData);
      } else {
        console.log(`ℹ️ No place data found for "${item.location}"`);
        // Still mark as fetched so we don't keep retrying
        await onUpdateItem(item.id, {
          placeDataFetchedAt: Date.now(),
        });
      }
    } catch (error) {
      console.error(`❌ Failed to enrich "${item.location}":`, error);
    } finally {
      enrichingRef.current.delete(item.id);
      processedRef.current.add(item.id);
    }
  }, [apiKey, onUpdateItem]);

  /**
   * Process items that need enrichment
   */
  useEffect(() => {
    if (!enabled || !apiKey) return;

    // Find items needing enrichment
    const itemsToEnrich = items.filter(
      item => needsEnrichment(item) && !processedRef.current.has(item.id)
    );

    if (itemsToEnrich.length === 0) return;

    console.log(`📋 Found ${itemsToEnrich.length} items needing enrichment`);

    // Process items with delay to avoid rate limiting
    let delay = 0;
    itemsToEnrich.forEach(item => {
      setTimeout(() => {
        enrichItem(item);
      }, delay);
      delay += ENRICHMENT_DELAY_MS;
    });
  }, [items, apiKey, enabled, needsEnrichment, enrichItem]);

  // Reset processed items when items list changes significantly
  // (e.g., when switching trips)
  useEffect(() => {
    const currentIds = new Set(items.map(i => i.id));
    const processedIds = Array.from(processedRef.current);
    
    // If most processed items are no longer in the list, reset
    const matchingCount = processedIds.filter(id => currentIds.has(id)).length;
    if (processedIds.length > 0 && matchingCount < processedIds.length / 2) {
      processedRef.current.clear();
    }
  }, [items]);

  return {
    /** Manually trigger enrichment for a specific item */
    enrichItem,
    /** Check if an item needs enrichment */
    needsEnrichment,
  };
}
