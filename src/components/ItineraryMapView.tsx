import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  Polyline
} from '@react-google-maps/api';
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Camera,
  Utensils,
  Home,
  Trees,
  ShoppingBag,
  Car,
  Music,
  Loader2,
  AlertCircle
} from 'lucide-react';

import type { ItineraryItem } from '../types';
import { ItemDetailPanel } from './ItemDetailPanel';

// Define libraries outside component to prevent reloading
const MAPS_LIBRARIES: ("places")[] = ["places"];

interface ItineraryMapViewProps {
  items: ItineraryItem[];
  tripStartDate?: string;
  tripEndDate?: string;
  onEdit: (item: ItineraryItem) => void;
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
};

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  sightseeing: Camera,
  food: Utensils,
  lodging: Home,
  nature: Trees,
  shopping: ShoppingBag,
  transport: Car,
  entertainment: Music,
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
  onEdit,
  onGeocodeItems,
  isGeocoding = false,
  googleMapsApiKey,
}: ItineraryMapViewProps) {
  const [selectedItem, setSelectedItem] = useState<ItineraryItem | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | 'all'>('all');
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey,
    id: 'google-map-script',
    libraries: MAPS_LIBRARIES,
  });

  // Handle marker click
  const handleMarkerClick = useCallback((item: ItineraryItem) => {
    setSelectedItem(item);
    setShowDetailPanel(true);
    
    // Pan to the selected location
    if (map && item.lat && item.lng) {
      map.panTo({ lat: item.lat, lng: item.lng });
    }
  }, [map]);

  // Handle closing the detail panel
  const handleCloseDetailPanel = useCallback(() => {
    setShowDetailPanel(false);
    setSelectedItem(null);
  }, []);

  // Handle editing from detail panel
  const handleEdit = useCallback((item: ItineraryItem) => {
    handleCloseDetailPanel();
    onEdit(item);
  }, [handleCloseDetailPanel, onEdit]);

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

  // Items with coordinates (exclude flights from map display)
  const mappableItems = useMemo(() => {
    return filteredItems.filter((item) => item.lat && item.lng && item.type !== 'flight');
  }, [filteredItems]);

  // Points for map bounds - all mappable items (flights already excluded)
  const boundsPoints = useMemo(() => {
    return mappableItems.map((item) => ({ lat: item.lat!, lng: item.lng! }));
  }, [mappableItems]);


  // Calculate map center based on activity density
  const mapCenter = useMemo(() => {
    if (boundsPoints.length === 0) return defaultCenter;
    
    const lats = boundsPoints.map((p) => p.lat);
    const lngs = boundsPoints.map((p) => p.lng);
    
    return {
      lat: lats.reduce((a, b) => a + b, 0) / lats.length,
      lng: lngs.reduce((a, b) => a + b, 0) / lngs.length,
    };
  }, [boundsPoints]);

  // Path for polyline - only used for single day view
  const path = useMemo(() => {
    // Only show connecting lines when viewing a specific day
    if (selectedDay === 'all') return [];
    
    return mappableItems
      .sort((a, b) => {
        if (a.day !== b.day) return a.day.localeCompare(b.day);
        return a.time.localeCompare(b.time);
      })
      .map((item) => ({ lat: item.lat!, lng: item.lng! }));
  }, [mappableItems, selectedDay]);

  // Fit bounds when items change - focus on activity area, not flights
  useEffect(() => {
    if (map && boundsPoints.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      boundsPoints.forEach((point) => {
        bounds.extend(point);
      });
      map.fitBounds(bounds, { top: 50, right: 50, bottom: 120, left: 50 });
    }
  }, [map, boundsPoints]);

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
    return CATEGORY_ICONS[item.category || 'sightseeing'] || MapPin;
  };

  const getCategoryColor = (item: ItineraryItem) => {
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

  // Mobile-optimized map options
  const mobileMapOptions: google.maps.MapOptions = {
    ...mapOptions,
    zoomControl: window.innerWidth > 768,
    fullscreenControl: window.innerWidth > 768,
    gestureHandling: 'greedy', // Better touch handling on mobile
  };

  return (
    <div className="flex flex-col h-full">
      {/* Map Container */}
      <div className="flex-1 relative rounded-xl md:rounded-xl overflow-hidden shadow-lg border border-slate-200 min-h-[300px] md:min-h-[400px]">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={mapCenter}
          zoom={12}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={mobileMapOptions}
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

          {/* Markers for locations */}
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
              onClick={() => handleMarkerClick(item)}
            />
          ))}

        </GoogleMap>

        {/* Detail Panel */}
        <ItemDetailPanel
          item={selectedItem}
          isOpen={showDetailPanel}
          onClose={handleCloseDetailPanel}
          onEdit={handleEdit}
          formatDate={formatDate}
        />

        {/* Items without coordinates warning - mobile optimized */}
        {filteredItems.length > 0 && mappableItems.length < filteredItems.length && (
          <div className="absolute top-2 left-2 right-2 md:top-4 md:left-4 md:right-4 bg-amber-50 border border-amber-200 rounded-lg p-2 md:p-3 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <p className="text-xs text-amber-700 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="hidden md:inline">{filteredItems.length - mappableItems.length} item(s) cannot be shown on map (missing coordinates)</span>
                <span className="md:hidden">{filteredItems.length - mappableItems.length} missing location(s)</span>
              </p>
              {onGeocodeItems && (
                <button
                  onClick={() => {
                    const itemsToGeocode = filteredItems.filter(item => !item.lat || !item.lng);
                    onGeocodeItems(itemsToGeocode);
                  }}
                  disabled={isGeocoding}
                  className="w-full md:w-auto px-3 py-1.5 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center whitespace-nowrap"
                >
                  {isGeocoding ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                      Detecting...
                    </>
                  ) : (
                    <>
                      <MapPin className="w-3 h-3 mr-1.5" />
                      Auto-detect
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Legend - Hidden on mobile, visible on tablet and up */}
        <div className="hidden md:block absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-slate-200">
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

      {/* Timeline Navigation - Mobile optimized */}
      <div className="mt-3 md:mt-4 bg-white rounded-xl shadow-sm border border-slate-200 p-3 md:p-4">
        <div className="flex items-center justify-between mb-2 md:mb-3">
          <button
            onClick={() => navigateDay('prev')}
            disabled={selectedDay === 'all'}
            className="p-2 md:p-2 rounded-lg hover:bg-slate-100 active:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors touch-manipulation"
          >
            <ChevronLeft className="w-5 h-5 md:w-5 md:h-5 text-slate-600" />
          </button>

          <div className="text-center flex-1 min-w-0 px-2">
            <p className="font-semibold text-slate-800 text-sm md:text-base truncate">
              {selectedDay === 'all' ? 'All Days' : formatDate(selectedDay)}
            </p>
            <p className="text-xs text-slate-500">
              {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
              {mappableItems.length < filteredItems.length && (
                <span className="hidden md:inline"> ({mappableItems.length} on map)</span>
              )}
            </p>
          </div>

          <button
            onClick={() => navigateDay('next')}
            disabled={selectedDay === allTripDays[allTripDays.length - 1]}
            className="p-2 md:p-2 rounded-lg hover:bg-slate-100 active:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors touch-manipulation"
          >
            <ChevronRight className="w-5 h-5 md:w-5 md:h-5 text-slate-600" />
          </button>
        </div>

        {/* Day Pills - Touch-friendly scrolling */}
        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1 snap-x snap-mandatory">
          <button
            onClick={() => setSelectedDay('all')}
            className={`px-3 py-2 md:py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors snap-start touch-manipulation ${
              selectedDay === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 active:bg-slate-300'
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
                className={`px-3 py-2 md:py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors snap-start touch-manipulation ${
                  selectedDay === day
                    ? 'bg-indigo-600 text-white'
                    : hasItems
                    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 active:bg-slate-300'
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

        {/* Day Items List - Improved for mobile (excludes flights) */}
        {selectedDay !== 'all' && filteredItems.filter(i => i.type !== 'flight').length > 0 && (
          <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-slate-100">
            <div className="space-y-1.5 md:space-y-2 max-h-32 md:max-h-40 overflow-y-auto">
              {filteredItems
                .filter((item) => item.type !== 'flight')
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((item, index) => {
                  const IconComponent = getCategoryIcon(item);
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.lat && item.lng) {
                          handleMarkerClick(item);
                          map?.setZoom(15);
                        }
                      }}
                      className={`w-full flex items-center space-x-2 md:space-x-3 p-2 rounded-lg text-left transition-colors touch-manipulation ${
                        item.lat && item.lng
                          ? 'hover:bg-slate-50 active:bg-slate-100 cursor-pointer'
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
                            <span className="ml-2 text-amber-500 text-[11px]">No location</span>
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
