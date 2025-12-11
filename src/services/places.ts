// Google Places service using the NEW Places API (2025+)
// Uses google.maps.places.Place instead of deprecated PlacesService

export interface PlaceDetails {
  placeId?: string;
  name?: string;
  rating?: number;
  totalRatings?: number;
  address?: string;
  phone?: string;
  website?: string;
  openingHours?: string;
  types?: string[];
  priceLevel?: number;
  lat?: number;
  lng?: number;
}

/**
 * Wait for Google Maps API with Places library to be loaded
 * The API is loaded by @react-google-maps/api in ItineraryMapView
 */
function waitForGoogleMapsPlaces(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.google?.maps?.places?.Place) {
      resolve();
      return;
    }

    // Wait for it to load (loaded by ItineraryMapView via @react-google-maps/api)
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max
    
    const checkLoaded = () => {
      attempts++;
      if (window.google?.maps?.places?.Place) {
        resolve();
      } else if (attempts >= maxAttempts) {
        reject(new Error('Google Maps Places API not loaded. Make sure to view the map first.'));
      } else {
        setTimeout(checkLoaded, 100);
      }
    };
    checkLoaded();
  });
}

/**
 * Check if URL is a shortened Google Maps URL that can't be parsed client-side
 */
function isShortenedUrl(url: string): boolean {
  return url.includes('maps.app.goo.gl') || url.includes('goo.gl/maps');
}

/**
 * Extract place name from a Google Maps URL
 */
export function extractPlaceNameFromUrl(url: string): string | null {
  if (!url) return null;
  
  try {
    // Format: /place/Place+Name+Here/
    const placeNamePattern = /\/place\/([^/@]+)/;
    const match = url.match(placeNamePattern);
    if (match) {
      // Decode URL encoding and replace + with spaces
      return decodeURIComponent(match[1].replace(/\+/g, ' '));
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Extract a place ID from a Google Maps URL
 */
export function extractPlaceIdFromUrl(url: string): string | null {
  if (!url) return null;
  
  // Shortened URLs can't be parsed - need to search by text instead
  if (isShortenedUrl(url)) {
    console.log('Shortened URL detected - will search by place name instead');
    return null;
  }

  try {
    // Format: data=...!1sChI... (place ID starts with ChI)
    const placeIdPattern = /!1s(ChI[a-zA-Z0-9_-]+)/;
    let match = url.match(placeIdPattern);
    if (match) {
      return match[1];
    }

    // Format: place_id=XXX
    const explicitIdPattern = /place_id=([a-zA-Z0-9_-]+)/;
    match = url.match(explicitIdPattern);
    if (match) {
      return match[1];
    }

    // Format: ftid=0x...:0x... (feature ID) - embedded in URL as !1s0x...
    const ftidEmbeddedPattern = /!1s(0x[a-f0-9]+:0x[a-f0-9]+)/i;
    match = url.match(ftidEmbeddedPattern);
    if (match) {
      console.log('Found embedded ftid:', match[1]);
      return match[1];
    }

    // Format: ftid=0x...:0x... (explicit parameter)
    const ftidPattern = /ftid=(0x[a-f0-9]+:0x[a-f0-9]+)/i;
    match = url.match(ftidPattern);
    if (match) {
      return match[1];
    }

    return null;
  } catch (error) {
    console.error('Error extracting place ID:', error);
    return null;
  }
}

/**
 * Search for a place by text using the NEW Places API
 */
export async function findPlaceByText(
  query: string,
  _apiKey: string,
  _location?: { lat: number; lng: number }
): Promise<string | null> {
  if (!query) return null;

  try {
    await waitForGoogleMapsPlaces();
    
    console.log('🔍 Places API available, searching for:', query);
    
    // Check if new Place class is available
    const { Place } = google.maps.places;
    
    if (!Place) {
      console.error('❌ google.maps.places.Place is not available');
      return null;
    }
    
    // Check if searchByText method exists
    if (typeof (Place as any).searchByText !== 'function') {
      console.error('❌ Place.searchByText method is not available - Places API (New) may not be enabled');
      console.log('Available Place methods:', Object.keys(Place));
      return null;
    }
    
    const request = {
      textQuery: query,
      fields: ['id'],
      maxResultCount: 1,
    };

    console.log('📤 Calling Place.searchByText with:', request);
    const { places } = await (Place as any).searchByText(request);
    
    if (places && places.length > 0) {
      console.log('✅ Found place:', places[0].id);
      return places[0].id;
    }

    console.warn('⚠️ No places found for query:', query);
    return null;
  } catch (error: any) {
    console.error('❌ Error finding place:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      name: error?.name,
      stack: error?.stack,
    });
    
    // Check for specific error types
    if (error?.message?.includes('PERMISSION_DENIED') || error?.message?.includes('REQUEST_DENIED')) {
      console.error('🔐 PERMISSION ERROR: The Places API (New) is not properly configured.');
      console.error('Please ensure:');
      console.error('1. "Places API (New)" is enabled at: https://console.cloud.google.com/apis/library/places-backend.googleapis.com');
      console.error('2. Billing is enabled on your Google Cloud project');
      console.error('3. API key has no restrictions OR includes "Places API (New)"');
    }
    
    return null;
  }
}

/**
 * Get detailed place information using the NEW Places API
 */
export async function getPlaceDetails(
  placeId: string,
  _apiKey: string
): Promise<PlaceDetails | null> {
  if (!placeId) return null;

  try {
    await waitForGoogleMapsPlaces();

    const { Place } = google.maps.places;
    
    // Create a Place instance and fetch details
    const place = new Place({
      id: placeId,
    });

    // Fetch the fields we need
    await place.fetchFields({
      fields: [
        'id',
        'displayName',
        'rating',
        'userRatingCount',
        'formattedAddress',
        'nationalPhoneNumber',
        'websiteURI',
        'regularOpeningHours',
        'types',
        'priceLevel',
        'location',
      ],
    });

    // Format opening hours if available
    let openingHoursText: string | undefined;
    if (place.regularOpeningHours?.weekdayDescriptions) {
      openingHoursText = place.regularOpeningHours.weekdayDescriptions.join('\n');
    }

    const details: PlaceDetails = {
      placeId: place.id ?? undefined,
      name: place.displayName ?? undefined,
      rating: place.rating ?? undefined,
      totalRatings: place.userRatingCount ?? undefined,
      address: place.formattedAddress ?? undefined,
      phone: place.nationalPhoneNumber ?? undefined,
      website: place.websiteURI ?? undefined,
      openingHours: openingHoursText,
      types: place.types?.slice(0, 5),
      priceLevel: place.priceLevel ? Number(place.priceLevel) : undefined,
      lat: place.location?.lat() ?? undefined,
      lng: place.location?.lng() ?? undefined,
    };

    console.log('Fetched place details:', details);
    return details;
  } catch (error) {
    console.error('Error fetching place details:', error);
    return null;
  }
}

/**
 * Convenience function to enrich an item with place details
 */
export async function enrichItemWithPlaceDetails(
  googleMapsLink: string | undefined,
  locationName: string,
  apiKey: string,
  existingCoords?: { lat: number; lng: number }
): Promise<PlaceDetails | null> {
  if (!apiKey) {
    console.warn('No API key provided for place enrichment');
    return null;
  }

  let placeId: string | null = null;
  let searchQuery = locationName;

  // Try to extract place ID from URL first
  if (googleMapsLink) {
    placeId = extractPlaceIdFromUrl(googleMapsLink);
    console.log('Extracted place ID from URL:', placeId);
    
    // If URL is shortened or no ID found, try to extract place name from URL
    if (!placeId) {
      const urlPlaceName = extractPlaceNameFromUrl(googleMapsLink);
      if (urlPlaceName) {
        searchQuery = urlPlaceName;
        console.log('Extracted place name from URL:', urlPlaceName);
      }
    }
  }

  // If no place ID from URL, search by text
  if (!placeId && searchQuery) {
    console.log('Searching for place by name:', searchQuery);
    placeId = await findPlaceByText(searchQuery, apiKey, existingCoords);
  }

  // Get place details if we have an ID
  if (placeId) {
    console.log('Fetching place details for:', placeId);
    return await getPlaceDetails(placeId, apiKey);
  }

  console.warn('Could not find place ID for enrichment');
  return null;
}

/**
 * Format place details as a JSON string for storage
 */
export function formatPlaceDetailsForStorage(details: PlaceDetails): string {
  return JSON.stringify({
    rating: details.rating,
    totalRatings: details.totalRatings,
    address: details.address,
    phone: details.phone,
    website: details.website,
    openingHours: details.openingHours,
    types: details.types,
  });
}

/**
 * Test function to verify Places API is working
 * Call from browser console: testPlacesAPI()
 */
(window as any).testPlacesAPI = async function() {
  console.log('🧪 Testing Places API...');
  
  // Check if Google Maps is loaded
  if (!window.google?.maps) {
    console.error('❌ Google Maps not loaded');
    return;
  }
  
  console.log('✅ Google Maps loaded');
  
  // Check if Places is loaded
  if (!window.google.maps.places) {
    console.error('❌ Places library not loaded');
    return;
  }
  
  console.log('✅ Places library loaded');
  
  // Check if new Place class exists
  const Place = (google.maps.places as any).Place;
  if (!Place) {
    console.error('❌ Place class not available (Places API New not enabled?)');
    return;
  }
  
  console.log('✅ Place class available');
  
  // Check if searchByText exists
  if (typeof Place.searchByText !== 'function') {
    console.error('❌ Place.searchByText not available');
    console.log('Available on Place:', Object.getOwnPropertyNames(Place));
    return;
  }
  
  console.log('✅ Place.searchByText available');
  
  // Try a test search
  try {
    console.log('🔍 Testing search for "Eiffel Tower"...');
    const { places } = await Place.searchByText({
      textQuery: 'Eiffel Tower Paris',
      fields: ['id', 'displayName'],
      maxResultCount: 1,
    });
    
    if (places && places.length > 0) {
      console.log('✅ SUCCESS! Found place:', places[0].displayName, 'ID:', places[0].id);
    } else {
      console.log('⚠️ Search returned no results');
    }
  } catch (error: any) {
    console.error('❌ Search failed:', error.message);
    if (error.message?.includes('PERMISSION') || error.message?.includes('REQUEST_DENIED')) {
      console.error('🔐 This is a PERMISSION error. Check your Google Cloud Console:');
      console.error('   1. Go to: https://console.cloud.google.com/apis/library/places-backend.googleapis.com');
      console.error('   2. Make sure "Places API (New)" is ENABLED');
      console.error('   3. Check billing is active on your project');
    }
  }
};

console.log('💡 TIP: Run testPlacesAPI() in console to test Places API');
