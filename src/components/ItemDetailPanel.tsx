import { memo, useState, useEffect, useMemo } from 'react';
import {
  X,
  Clock,
  ExternalLink,
  Plane,
  MapPin,
  Camera,
  Utensils,
  Home,
  Trees,
  ShoppingBag,
  Car,
  Music,
  CalendarDays,
  Edit2,
  Trash2,
  Star,
  Phone,
  Globe,
  PlaneTakeoff,
  PlaneLanding,
  ChevronUp,
  ChevronDown,
  Navigation
} from 'lucide-react';
import type { ItineraryItem } from '../types';

// Category icon mapping
const CATEGORY_ICONS = {
  sightseeing: Camera,
  food: Utensils,
  lodging: Home,
  nature: Trees,
  shopping: ShoppingBag,
  transport: Car,
  entertainment: Music,
} as const;

const CATEGORY_COLORS: Record<string, string> = {
  sightseeing: '#8B5CF6',
  food: '#F97316',
  lodging: '#F59E0B',
  nature: '#22C55E',
  shopping: '#EC4899',
  transport: '#6366F1',
  entertainment: '#EAB308',
  flight: '#0EA5E9',
};

interface ItemDetailPanelProps {
  item: ItineraryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (item: ItineraryItem) => void;
  onDelete?: (item: ItineraryItem) => void;
  formatDate: (dateStr: string) => string;
}

// Helper to parse stored place details
function parseStoredPlaceDetails(description: string | undefined): {
  rating?: number;
  totalRatings?: number;
  address?: string;
  phone?: string;
  website?: string;
  openingHours?: string;
  types?: string[];
} | null {
  if (!description) return null;
  try {
    if (description.startsWith('{')) {
      return JSON.parse(description);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Unified item detail panel - used for both List and Map views
 * Clean, information-focused design
 */
export const ItemDetailPanel = memo(function ItemDetailPanel({
  item,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  formatDate,
}: ItemDetailPanelProps) {
  const [isHoursExpanded, setIsHoursExpanded] = useState(false);

  // Reset state when item changes
  useEffect(() => {
    setIsHoursExpanded(false);
  }, [item?.id]);

  // Parse stored place details
  const details = useMemo(() => parseStoredPlaceDetails(item?.placeDescription), [item?.placeDescription]);

  if (!isOpen || !item) return null;

  const isFlight = item.type === 'flight';
  const isLodging = item.category === 'lodging';
  const isMultiDay = isLodging && item.endDay && item.endDay !== item.day;
  const nights = isMultiDay
    ? Math.ceil((new Date(item.endDay!).getTime() - new Date(item.day).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const CategoryIcon = isFlight
    ? Plane
    : CATEGORY_ICONS[item.category as keyof typeof CATEGORY_ICONS] || MapPin;
  
  const categoryColor = isFlight 
    ? CATEGORY_COLORS.flight 
    : CATEGORY_COLORS[item.category || 'sightseeing'] || '#6366F1';

  // Generate Google Maps URL
  const getMapsUrl = () => {
    if (item.googleMapsLink) return item.googleMapsLink;
    if (item.lat && item.lng) {
      return `https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lng}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location)}`;
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 z-50"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md md:rounded-2xl md:max-h-[80vh]">
        {/* Drag handle (mobile) */}
        <div className="md:hidden flex justify-center py-2">
          <div className="w-10 h-1 bg-slate-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-4 pb-3 pt-1 md:pt-4 border-b border-slate-100">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1 min-w-0">
              <div 
                className="p-2 rounded-xl shrink-0"
                style={{ backgroundColor: `${categoryColor}15` }}
              >
                <CategoryIcon className="w-5 h-5" style={{ color: categoryColor }} />
              </div>
              <div className="min-w-0 flex-1">
                {isFlight ? (
                  <>
                    <p className="text-xs font-medium uppercase tracking-wide" style={{ color: categoryColor }}>
                      Flight
                    </p>
                    <h3 className="font-bold text-lg text-slate-800 truncate">
                      {item.airline} {item.flightNumber}
                    </h3>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-medium uppercase tracking-wide capitalize" style={{ color: categoryColor }}>
                      {item.category || 'Activity'}
                    </p>
                    <h3 className="font-bold text-lg text-slate-800">{item.location}</h3>
                  </>
                )}
                
                {/* Rating */}
                {details?.rating && (
                  <div className="flex items-center space-x-2 mt-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-semibold text-sm">{details.rating}</span>
                    {details.totalRatings && (
                      <span className="text-xs text-slate-500">({details.totalRatings.toLocaleString()})</span>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-1 shrink-0">
              <button
                onClick={() => onEdit(item)}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              {onDelete && (
                <button
                  onClick={() => onDelete(item)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Flight Route */}
          {isFlight && (
            <div className="p-4 border-b border-slate-100">
              <div className="flex items-center justify-between bg-slate-50 rounded-xl p-4">
                {/* Departure */}
                <div className="text-center">
                  <PlaneTakeoff className="w-5 h-5 text-sky-500 mx-auto mb-1" />
                  <p className="font-bold text-xl text-slate-800">
                    {item.departureAirportCode || item.location?.slice(0, 3).toUpperCase()}
                  </p>
                  <p className="text-xs text-slate-500 max-w-[80px] truncate">
                    {item.departureAirportName || item.location}
                  </p>
                  {item.time && (
                    <p className="text-sm font-semibold text-sky-600 mt-1">{item.time}</p>
                  )}
                </div>

                {/* Arrow */}
                <div className="flex-1 flex items-center justify-center px-2">
                  <div className="h-px bg-slate-300 flex-1" />
                  <div className="mx-2 p-1.5 bg-sky-100 rounded-full">
                    <Plane className="w-4 h-4 text-sky-600" />
                  </div>
                  <div className="h-px bg-slate-300 flex-1" />
                </div>

                {/* Arrival */}
                <div className="text-center">
                  <PlaneLanding className="w-5 h-5 text-sky-500 mx-auto mb-1" />
                  <p className="font-bold text-xl text-slate-800">
                    {item.arrivalAirportCode || item.arrivalLocation?.slice(0, 3).toUpperCase()}
                  </p>
                  <p className="text-xs text-slate-500 max-w-[80px] truncate">
                    {item.arrivalAirportName || item.arrivalLocation}
                  </p>
                  {item.arrivalTime && (
                    <p className="text-sm font-semibold text-sky-600 mt-1">{item.arrivalTime}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Date & Time */}
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center space-x-3 text-slate-700">
              <CalendarDays className="w-5 h-5 text-slate-400" />
              <div>
                <p className="font-medium">
                  {formatDate(item.day)}
                  {isMultiDay && ` → ${formatDate(item.endDay!)}`}
                </p>
                {isMultiDay && (
                  <p className="text-sm text-slate-500">{nights} {nights === 1 ? 'night' : 'nights'}</p>
                )}
              </div>
            </div>
            {item.time && !isFlight && (
              <div className="flex items-center space-x-3 text-slate-700 mt-2">
                <Clock className="w-5 h-5 text-slate-400" />
                <p className="font-medium">{item.time}</p>
              </div>
            )}
          </div>

          {/* Place Details */}
          {details && (
            <div className="p-4 border-b border-slate-100 space-y-3">
              {/* Address */}
              {details.address && (
                <div className="flex items-start space-x-2">
                  <Navigation className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <span className="text-sm text-slate-600">{details.address}</span>
                </div>
              )}

              {/* Phone */}
              {details.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <a href={`tel:${details.phone}`} className="text-sm text-indigo-600 hover:underline">
                    {details.phone}
                  </a>
                </div>
              )}

              {/* Website */}
              {details.website && (
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-slate-400" />
                  <a 
                    href={details.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-indigo-600 hover:underline truncate max-w-[250px]"
                  >
                    {details.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                  </a>
                </div>
              )}

              {/* Opening Hours */}
              {details.openingHours && (
                <div>
                  <button
                    onClick={() => setIsHoursExpanded(!isHoursExpanded)}
                    className="flex items-center space-x-2 text-sm text-slate-600 hover:text-slate-800"
                  >
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>Opening Hours</span>
                    {isHoursExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  {isHoursExpanded && (
                    <div className="mt-2 ml-6 text-xs text-slate-500 whitespace-pre-line">
                      {details.openingHours}
                    </div>
                  )}
                </div>
              )}

              {/* Place Types */}
              {details.types && details.types.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {details.types.slice(0, 5).map((type, i) => (
                    <span 
                      key={i} 
                      className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs"
                    >
                      {type.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {item.notes && (
            <div className="p-4 border-b border-slate-100">
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{item.notes}</p>
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 safe-area-bottom">
          <a
            href={getMapsUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            <ExternalLink className="w-4 h-4 mr-1.5" />
            Open in Google Maps
          </a>
        </div>
      </div>
    </>
  );
});
