// Geocoding service using Google Maps Geocoding API

const GEOCODING_API_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

export interface GeocodeResult {
  lat: number;
  lng: number;
  formattedAddress: string;
}

/**
 * Geocode an address string to coordinates using Google Maps Geocoding API
 */
export async function geocodeAddress(
  address: string,
  apiKey: string
): Promise<GeocodeResult | null> {
  if (!address || !apiKey) return null;

  try {
    const response = await fetch(
      `${GEOCODING_API_URL}?address=${encodeURIComponent(address)}&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0];
      return {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        formattedAddress: result.formatted_address,
      };
    }

    console.warn('Geocoding returned no results for:', address);
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Extract coordinates from a Google Maps URL
 * Supports various Google Maps URL formats
 */
export function extractCoordsFromGoogleMapsUrl(url: string): { lat: number; lng: number } | null {
  if (!url) return null;

  try {
    // Format: @lat,lng,zoom
    const atPattern = /@(-?\d+\.?\d*),(-?\d+\.?\d*)/;
    let match = url.match(atPattern);
    if (match) {
      return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    }

    // Format: !3d{lat}!4d{lng}
    const bangPattern = /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/;
    match = url.match(bangPattern);
    if (match) {
      return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    }

    // Format: ll=lat,lng
    const llPattern = /ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/;
    match = url.match(llPattern);
    if (match) {
      return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    }

    // Format: q=lat,lng
    const qPattern = /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/;
    match = url.match(qPattern);
    if (match) {
      return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    }

    return null;
  } catch (error) {
    console.error('Error extracting coordinates from URL:', error);
    return null;
  }
}
