import { memo } from 'react';
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
  Star,
  Phone,
  Globe,
  PlaneTakeoff,
  PlaneLanding,
  Building,
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

const CATEGORY_LABELS = {
  sightseeing: 'Sightseeing',
  food: 'Food & Drink',
  lodging: 'Lodging',
  nature: 'Nature',
  shopping: 'Shopping',
  transport: 'Transport',
  entertainment: 'Entertainment',
} as const;

interface ItemDetailModalProps {
  item: ItineraryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (item: ItineraryItem) => void;
  formatDate: (dateStr: string) => string;
}

export const ItemDetailModal = memo(function ItemDetailModal({
  item,
  isOpen,
  onClose,
  onEdit,
  formatDate,
}: ItemDetailModalProps) {
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

  // Parse place details from placeDescription if available
  const placeDetails = item.placeDescription ? parseStoredPlaceDetails(item.placeDescription) : null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className={`p-4 ${
          isFlight ? 'bg-gradient-to-r from-sky-500 to-blue-600' :
          isLodging ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
          'bg-gradient-to-r from-indigo-500 to-purple-600'
        } text-white`}>
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <CategoryIcon className="w-6 h-6" />
              </div>
              <div>
                {isFlight ? (
                  <>
                    <p className="text-sm font-medium opacity-90">Flight</p>
                    <h2 className="text-xl font-bold">
                      {item.airline} {item.flightNumber}
                    </h2>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium opacity-90">
                      {CATEGORY_LABELS[item.category as keyof typeof CATEGORY_LABELS] || 'Activity'}
                    </p>
                    <h2 className="text-xl font-bold">{item.location}</h2>
                  </>
                )}
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => onEdit(item)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <Edit2 className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Flight Route */}
          {isFlight && (
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                {/* Departure */}
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 mb-2">
                    <PlaneTakeoff className="w-5 h-5 text-sky-500" />
                  </div>
                  <p className="font-bold text-2xl text-slate-800">
                    {item.departureAirportCode || item.location?.slice(0, 3).toUpperCase()}
                  </p>
                  <p className="text-sm text-slate-500 max-w-[100px]">
                    {item.departureAirportName || item.location}
                  </p>
                  {item.time && (
                    <p className="text-lg font-semibold text-sky-600 mt-2">{item.time}</p>
                  )}
                </div>

                {/* Arrow */}
                <div className="flex-1 flex items-center justify-center px-4">
                  <div className="h-px bg-slate-300 flex-1" />
                  <div className="mx-3 p-2 bg-sky-100 rounded-full">
                    <Plane className="w-5 h-5 text-sky-600" />
                  </div>
                  <div className="h-px bg-slate-300 flex-1" />
                </div>

                {/* Arrival */}
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 mb-2">
                    <PlaneLanding className="w-5 h-5 text-sky-500" />
                  </div>
                  <p className="font-bold text-2xl text-slate-800">
                    {item.arrivalAirportCode || item.arrivalLocation?.slice(0, 3).toUpperCase()}
                  </p>
                  <p className="text-sm text-slate-500 max-w-[100px]">
                    {item.arrivalAirportName || item.arrivalLocation}
                  </p>
                  {item.arrivalTime && (
                    <p className="text-lg font-semibold text-sky-600 mt-2">{item.arrivalTime}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Date & Time */}
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center space-x-3 text-slate-700">
              <CalendarDays className="w-5 h-5 text-indigo-500" />
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
              <div className="flex items-center space-x-3 text-slate-700 mt-3">
                <Clock className="w-5 h-5 text-indigo-500" />
                <p className="font-medium">{item.time}</p>
              </div>
            )}
          </div>

          {/* Place Details (enriched from Google Places) */}
          {placeDetails && (
            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              <h3 className="font-semibold text-slate-800 flex items-center">
                <Building className="w-4 h-4 mr-2 text-indigo-500" />
                Place Details
              </h3>
              
              {placeDetails.rating && (
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-medium">{placeDetails.rating}</span>
                  {placeDetails.totalRatings && (
                    <span className="text-sm text-slate-500">({placeDetails.totalRatings} reviews)</span>
                  )}
                </div>
              )}

              {placeDetails.address && (
                <div className="flex items-start space-x-2 text-sm text-slate-600">
                  <Navigation className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <span>{placeDetails.address}</span>
                </div>
              )}

              {placeDetails.phone && (
                <div className="flex items-center space-x-2 text-sm">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <a href={`tel:${placeDetails.phone}`} className="text-indigo-600 hover:underline">
                    {placeDetails.phone}
                  </a>
                </div>
              )}

              {placeDetails.website && (
                <div className="flex items-center space-x-2 text-sm">
                  <Globe className="w-4 h-4 text-slate-400" />
                  <a 
                    href={placeDetails.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline truncate max-w-[250px]"
                  >
                    {placeDetails.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}

              {placeDetails.openingHours && (
                <div className="text-sm">
                  <p className="font-medium text-slate-700 mb-1">Hours</p>
                  <p className="text-slate-600 whitespace-pre-line">{placeDetails.openingHours}</p>
                </div>
              )}

              {placeDetails.types && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {placeDetails.types.map((type, i) => (
                    <span key={i} className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs">
                      {type.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {item.notes && (
            <div className="bg-slate-50 rounded-xl p-4">
              <h3 className="font-semibold text-slate-800 mb-2">Notes</h3>
              <p className="text-slate-600 whitespace-pre-wrap">{item.notes}</p>
            </div>
          )}

          {/* Location / Maps Link */}
          {item.googleMapsLink && (
            <a
              href={item.googleMapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center space-x-2 w-full py-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors font-medium"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open in Google Maps</span>
            </a>
          )}

          {/* Coordinates */}
          {item.lat && item.lng && (
            <p className="text-xs text-slate-400 text-center">
              Coordinates: {item.lat.toFixed(6)}, {item.lng.toFixed(6)}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={() => onEdit(item)}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
          >
            Edit Item
          </button>
        </div>
      </div>
    </div>
  );
});

// Helper to parse stored place details from placeDescription field
// Format: JSON stringified object or plain text
function parseStoredPlaceDetails(description: string): {
  rating?: number;
  totalRatings?: number;
  address?: string;
  phone?: string;
  website?: string;
  openingHours?: string;
  types?: string[];
} | null {
  try {
    // Check if it's JSON
    if (description.startsWith('{')) {
      return JSON.parse(description);
    }
    // Plain text - just return it as-is for display elsewhere
    return null;
  } catch {
    return null;
  }
}
