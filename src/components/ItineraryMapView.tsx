import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  InfoWindow,
  Polyline
} from '@react-google-maps/api';
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Plane,
  Camera,
  Utensils,
  Home,
  Trees,
  ShoppingBag,
  Car,
  Music,
  Check,
  Loader2,
  AlertCircle
} from 'lucide-react';

import type { ItineraryItem } from '../types';

// Define libraries outside component to prevent reloading
const MAPS_LIBRARIES: ("places")[] = ["places"];

interface ItineraryMapViewProps {
  items: ItineraryItem[];
  tripStartDate?: string;
  tripEndDate?: string;
  onToggleComplete: (item: ItineraryItem) => void;
  onGeocodeItems?: (items: ItineraryItem[]) => Promise<void>;
  isGeocoding?: boolean;
  googleMapsApiKey: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  sightseeing: '#8B5CF6', // violet
  food: '#F97316', // orange
  lodging: '#06B6D4', // cyan
  nature: '#22C55E', // green
  shopping: '#EC4899', // pink
  transport: '#6366F1', // indigo
  entertainment: '#EAB308', // yellow
  flight: '#3B82F6', // blue
};

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  sightseeing: Camera,
  food: Utensils,
  lodging: Home,
  nature: Trees,
  shopping: ShoppingBag,
  transport: Car,
  entertainment: Music,
  flight: Plane,
};

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 40.7128,
  lng: -74.0060, // Default to New York
};

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
  ],
};

export function ItineraryMapView({
  items,
  tripStartDate,
  tripEndDate,
  onToggleComplete,
  onGeocodeItems,
  isGeocoding = false,
  googleMapsApiKey,
}: ItineraryMapViewProps) {
  const [selectedItem, setSelectedItem] = useState<ItineraryItem | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | 'all'>('all');
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey,
    id: 'google-map-script',
    libraries: MAPS_LIBRARIES,
  });

  // Get unique days from items
  const days = useMemo(() => {
    const uniqueDays = [...new Set(items.map((item) => item.day))].sort();
    return uniqueDays;
  }, [items]);

  // Generate all days between trip start and end
  const allTripDays = useMemo(() => {
    if (!tripStartDate || !tripEndDate) return days;
    
    const start = new Date(tripStartDate);
    const end = new Date(tripEndDate);
    const result: string[] = [];
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      result.push(d.toISOString().split('T')[0]);
    }
    return result;
  }, [tripStartDate, tripEndDate, days]);

  // Filter items by selected day
  const filteredItems = useMemo(() => {
    if (selectedDay === 'all') return items;
    return items.filter((item) => item.day === selectedDay);
  }, [items, selectedDay]);

  // Items with coordinates (departure locations)
  const mappableItems = useMemo(() => {
    return filteredItems.filter((item) => item.lat && item.lng);
  }, [filteredItems]);

  // Flight routes (items that have both departure and arrival coordinates)
  const flightRoutes = useMemo(() => {
    return filteredItems
      .filter((item) => 
        item.type === 'flight' && 
        item.lat && item.lng && 
        item.arrivalLat && item.arrivalLng
      )
      .map((item) => ({
        item,
        departure: { lat: item.lat!, lng: item.lng! },
        arrival: { lat: item.arrivalLat!, lng: item.arrivalLng! },
      }));
  }, [filteredItems]);

  // All points to consider for bounds (including flight arrivals)
  const allMapPoints = useMemo(() => {
    const points: Array<{ lat: number; lng: number }> = [];
    
    // Add departure locations
    mappableItems.forEach((item) => {
      points.push({ lat: item.lat!, lng: item.lng! });
    });
    
    // Add flight arrival locations
    flightRoutes.forEach((route) => {
      points.push(route.arrival);
    });
    
    return points;
  }, [mappableItems, flightRoutes]);

  // Calculate map center based on all markers
  const mapCenter = useMemo(() => {
    if (allMapPoints.length === 0) return defaultCenter;
    
    const lats = allMapPoints.map((p) => p.lat);
    const lngs = allMapPoints.map((p) => p.lng);
    
    return {
      lat: lats.reduce((a, b) => a + b, 0) / lats.length,
      lng: lngs.reduce((a, b) => a + b, 0) / lngs.length,
    };
  }, [allMapPoints]);

  // Path for polyline (non-flight items only)
  const path = useMemo(() => {
    return mappableItems
      .filter((item) => item.type !== 'flight') // Exclude flights from the regular path
      .sort((a, b) => {
        if (a.day !== b.day) return a.day.localeCompare(b.day);
        return a.time.localeCompare(b.time);
      })
      .map((item) => ({ lat: item.lat!, lng: item.lng! }));
  }, [mappableItems]);

  // Fit bounds when items change
  useEffect(() => {
    if (map && allMapPoints.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      allMapPoints.forEach((point) => {
        bounds.extend(point);
      });
      map.fitBounds(bounds, { top: 50, right: 50, bottom: 120, left: 50 });
    }
  }, [map, allMapPoints]);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatShortDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    const currentIndex = selectedDay === 'all' ? -1 : allTripDays.indexOf(selectedDay);
    
    if (direction === 'next') {
      if (selectedDay === 'all') {
        setSelectedDay(allTripDays[0]);
      } else if (currentIndex < allTripDays.length - 1) {
        setSelectedDay(allTripDays[currentIndex + 1]);
      }
    } else {
      if (currentIndex <= 0) {
        setSelectedDay('all');
      } else {
        setSelectedDay(allTripDays[currentIndex - 1]);
      }
    }
  };

  const getCategoryIcon = (item: ItineraryItem) => {
    if (item.type === 'flight') return CATEGORY_ICONS.flight;
    return CATEGORY_ICONS[item.category || 'sightseeing'] || MapPin;
  };

  const getCategoryColor = (item: ItineraryItem) => {
    if (item.type === 'flight') return CATEGORY_COLORS.flight;
    return CATEGORY_COLORS[item.category || 'sightseeing'] || '#6366F1';
  };

  // Custom marker icon
  const createMarkerIcon = (item: ItineraryItem) => {
    const color = getCategoryColor(item);
    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: item.completed ? '#94A3B8' : color,
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: 12,
    };
  };

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-50 rounded-xl p-8">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-slate-600 text-center">Failed to load Google Maps</p>
        <p className="text-slate-400 text-sm text-center mt-2">
          Please check your API key and try again
        </p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-50 rounded-xl">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-500">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Map Container */}
      <div className="flex-1 relative rounded-xl overflow-hidden shadow-lg border border-slate-200">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={mapCenter}
          zoom={12}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={mapOptions}
        >
          {/* Polyline connecting non-flight locations */}
          {path.length > 1 && (
            <Polyline
              path={path}
              options={{
                strokeColor: '#6366F1',
                strokeOpacity: 0.6,
                strokeWeight: 3,
                geodesic: true,
              }}
            />
          )}

          {/* Flight route polylines (dashed arc lines) */}
          {flightRoutes.map((route) => (
            <Polyline
              key={`flight-route-${route.item.id}`}
              path={[route.departure, route.arrival]}
              options={{
                strokeColor: CATEGORY_COLORS.flight,
                strokeOpacity: 0.8,
                strokeWeight: 2,
                geodesic: true,
                icons: [{
                  icon: {
                    path: 'M 0,-1 0,1',
                    strokeOpacity: 1,
                    scale: 3,
                  },
                  offset: '0',
                  repeat: '15px',
                }],
              }}
            />
          ))}

          {/* Markers for departure locations */}
          {mappableItems.map((item, index) => (
            <Marker
              key={item.id}
              position={{ lat: item.lat!, lng: item.lng! }}
              icon={createMarkerIcon(item)}
              label={{
                text: String(index + 1),
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 'bold',
              }}
              onClick={() => setSelectedItem(item)}
            />
          ))}

          {/* Markers for flight arrival airports */}
          {flightRoutes.map((route) => (
            <Marker
              key={`arrival-${route.item.id}`}
              position={route.arrival}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: CATEGORY_COLORS.flight,
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
                scale: 10,
              }}
              label={{
                text: route.item.arrivalAirportCode || '✈',
                color: '#ffffff',
                fontSize: '8px',
                fontWeight: 'bold',
              }}
              title={`${route.item.arrivalAirportName || route.item.arrivalLocation} (Arrival)`}
              onClick={() => setSelectedItem(route.item)}
            />
          ))}

          {/* Info Window */}
          {selectedItem && selectedItem.lat && selectedItem.lng && (
            <InfoWindow
              position={{ lat: selectedItem.lat, lng: selectedItem.lng }}
              onCloseClick={() => setSelectedItem(null)}
            >
              <div className="p-2 min-w-[200px] max-w-[280px]">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {(() => {
                      const IconComponent = getCategoryIcon(selectedItem);
                      const color = getCategoryColor(selectedItem);
                      return (
                        <div
                          className="p-1.5 rounded-full"
                          style={{ backgroundColor: `${color}20` }}
                        >
                          <div style={{ color }}>
                            <IconComponent className="w-4 h-4" />
                          </div>
                        </div>
                      );
                    })()}
                    <span className="font-semibold text-slate-800 text-sm">
                      {selectedItem.location}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-xs text-slate-500 mb-2">
                  <span>{formatDate(selectedItem.day)}</span>
                  {selectedItem.time && (
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" /> {selectedItem.time}
                    </span>
                  )}
                </div>

                {selectedItem.notes && (
                  <p className="text-xs text-slate-600 mb-2 line-clamp-2">
                    {selectedItem.notes}
                  </p>
                )}

                <button
                  onClick={() => onToggleComplete(selectedItem)}
                  className={`w-full py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center transition-colors ${
                    selectedItem.completed
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Check className="w-3 h-3 mr-1" />
                  {selectedItem.completed ? 'Completed' : 'Mark as Complete'}
                </button>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>

        {/* Items without coordinates warning */}
        {filteredItems.length > 0 && mappableItems.length < filteredItems.length && (
          <div className="absolute top-4 left-4 right-4 bg-amber-50 border border-amber-200 rounded-lg p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs text-amber-700 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                {filteredItems.length - mappableItems.length} item(s) cannot be shown on map (missing coordinates)
              </p>
              {onGeocodeItems && (
                <button
                  onClick={() => {
                    const itemsToGeocode = filteredItems.filter(item => !item.lat || !item.lng);
                    onGeocodeItems(itemsToGeocode);
                  }}
                  disabled={isGeocoding}
                  className="ml-3 px-3 py-1.5 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center whitespace-nowrap"
                >
                  {isGeocoding ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                      Geocoding...
                    </>
                  ) : (
                    <>
                      <MapPin className="w-3 h-3 mr-1.5" />
                      Auto-detect All
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-slate-200">
          <p className="text-xs font-medium text-slate-600 mb-2">Categories</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {Object.entries(CATEGORY_COLORS).slice(0, 6).map(([category, color]) => (
              <div key={category} className="flex items-center space-x-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-slate-500 capitalize">{category}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline Navigation */}
      <div className="mt-4 bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => navigateDay('prev')}
            disabled={selectedDay === 'all'}
            className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>

          <div className="text-center">
            <p className="font-semibold text-slate-800">
              {selectedDay === 'all' ? 'All Days' : formatDate(selectedDay)}
            </p>
            <p className="text-xs text-slate-500">
              {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
              {mappableItems.length < filteredItems.length && ` (${mappableItems.length} on map)`}
            </p>
          </div>

          <button
            onClick={() => navigateDay('next')}
            disabled={selectedDay === allTripDays[allTripDays.length - 1]}
            className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Day Pills */}
        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedDay('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              selectedDay === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Days
          </button>
          {allTripDays.map((day) => {
            const dayItems = items.filter((item) => item.day === day);
            const hasItems = dayItems.length > 0;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedDay === day
                    ? 'bg-indigo-600 text-white'
                    : hasItems
                    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    : 'bg-slate-50 text-slate-400'
                }`}
              >
                {formatShortDate(day)}
                {hasItems && (
                  <span className="ml-1 text-[10px] opacity-75">({dayItems.length})</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Day Items List */}
        {selectedDay !== 'all' && filteredItems.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {filteredItems
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((item, index) => {
                  const IconComponent = getCategoryIcon(item);
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.lat && item.lng) {
                          setSelectedItem(item);
                          map?.panTo({ lat: item.lat, lng: item.lng });
                          map?.setZoom(15);
                        }
                      }}
                      className={`w-full flex items-center space-x-3 p-2 rounded-lg text-left transition-colors ${
                        item.lat && item.lng
                          ? 'hover:bg-slate-50 cursor-pointer'
                          : 'opacity-50 cursor-not-allowed'
                      } ${selectedItem?.id === item.id ? 'bg-indigo-50' : ''}`}
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: item.completed ? '#94A3B8' : getCategoryColor(item) }}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${item.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                          {item.location}
                        </p>
                        <div className="flex items-center text-xs text-slate-400">
                          {item.time && <span>{item.time}</span>}
                          {!item.lat && !item.lng && (
                            <span className="ml-2 text-amber-500">No location</span>
                          )}
                        </div>
                      </div>
                      <IconComponent className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    </button>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
