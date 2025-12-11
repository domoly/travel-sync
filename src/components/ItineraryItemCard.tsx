import { memo, useMemo } from 'react';
import {
  Check,
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
  LogOut,
  Moon,
  LogIn,
  PlaneTakeoff,
  PlaneLanding,
  Star,
  Navigation
} from 'lucide-react';
import type { ItineraryItem, DisplayItineraryItem } from '../types';

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

// Helper to parse place details
function parsePlaceDescription(description: string | undefined): {
  rating?: number;
  totalRatings?: number;
  address?: string;
  phone?: string;
  website?: string;
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

interface ItineraryItemCardProps {
  item: DisplayItineraryItem;
  onToggleComplete: (item: ItineraryItem) => void;
  onEdit?: (item: ItineraryItem) => void;
  onDelete?: (item: ItineraryItem) => void;
  onGenerateAI?: (location: string) => void;
  onViewDetails?: (item: ItineraryItem) => void;
  formatDate: (dateStr: string) => string;
}

/**
 * Compact lodging indicator for staying/check-out phases
 */
const LodgingPhaseCard = memo(function LodgingPhaseCard({
  item,
  onViewDetails,
  formatDate,
}: {
  item: DisplayItineraryItem;
  onViewDetails?: (item: ItineraryItem) => void;
  formatDate: (dateStr: string) => string;
}) {
  const isCheckOut = item.lodgingPhase === 'check-out';
  const PhaseIcon = isCheckOut ? LogOut : Moon;
  
  return (
    <div 
      className="flex items-center space-x-2 px-3 py-2 bg-slate-50 rounded-lg text-sm cursor-pointer hover:bg-slate-100 transition-colors"
      onClick={() => onViewDetails?.(item)}
    >
      <PhaseIcon className={`w-4 h-4 ${isCheckOut ? 'text-orange-500' : 'text-indigo-500'}`} />
      <span className={`font-medium ${isCheckOut ? 'text-orange-700' : 'text-indigo-700'}`}>
        {isCheckOut ? 'Check-out' : 'Staying'}
      </span>
      <span className="text-slate-500">@ {item.location}</span>
      {isCheckOut && (
        <span className="text-slate-400 text-xs">(since {formatDate(item.day)})</span>
      )}
    </div>
  );
});

/**
 * Unified item card - clean, information-focused design
 */
export const ItineraryItemCard = memo(function ItineraryItemCard({
  item,
  onToggleComplete,
  onViewDetails,
  formatDate,
}: ItineraryItemCardProps) {
  const details = useMemo(() => parsePlaceDescription(item.placeDescription), [item.placeDescription]);
  
  const isFlight = item.type === 'flight';
  const isLodging = item.category === 'lodging';
  const lodgingPhase = item.lodgingPhase;
  
  // Compact card for staying/check-out phases
  if (lodgingPhase === 'staying' || lodgingPhase === 'check-out') {
    return (
      <LodgingPhaseCard 
        item={item} 
        onViewDetails={onViewDetails}
        formatDate={formatDate} 
      />
    );
  }

  const isMultiDay = isLodging && item.endDay && item.endDay !== item.day;
  const nights = isMultiDay
    ? Math.ceil((new Date(item.endDay!).getTime() - new Date(item.day).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const CategoryIcon = isFlight 
    ? Plane 
    : lodgingPhase === 'check-in'
      ? LogIn
      : CATEGORY_ICONS[item.category as keyof typeof CATEGORY_ICONS] || MapPin;
  
  const categoryColor = isFlight 
    ? CATEGORY_COLORS.flight 
    : CATEGORY_COLORS[item.category || 'sightseeing'] || '#6366F1';

  // Google Maps URL
  const getMapsUrl = () => {
    if (item.googleMapsLink) return item.googleMapsLink;
    if (item.lat && item.lng) {
      return `https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lng}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location)}`;
  };

  return (
    <div
      onClick={() => onViewDetails?.(item)}
      className={`bg-white rounded-xl border border-slate-200 overflow-hidden cursor-pointer hover:border-slate-300 hover:shadow-sm transition-all ${
        item.completed ? 'opacity-60' : ''
      }`}
    >
      {/* Main content */}
      <div className="p-3">
        <div className="flex items-start space-x-3">
          {/* Checkbox */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleComplete(item); }}
            className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
              item.completed
                ? 'bg-green-500 border-green-500 text-white'
                : 'border-slate-300 hover:border-slate-400'
            }`}
          >
            {item.completed && <Check className="w-3 h-3" />}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header row */}
            <div className="flex items-center space-x-2">
              <div 
                className="p-1 rounded-md shrink-0"
                style={{ backgroundColor: `${categoryColor}15` }}
              >
                <CategoryIcon className="w-3.5 h-3.5" style={{ color: categoryColor }} />
              </div>
              
              {isFlight ? (
                <span className="font-semibold text-slate-800 truncate">
                  {item.airline} {item.flightNumber}
                </span>
              ) : (
                <span className={`font-semibold truncate ${item.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                  {item.location}
                </span>
              )}

              {/* Rating badge */}
              {details?.rating && (
                <span className="flex items-center text-xs text-slate-500 shrink-0">
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 mr-0.5" />
                  {details.rating}
                </span>
              )}
            </div>

            {/* Flight route (compact) */}
            {isFlight && (
              <div className="flex items-center space-x-2 mt-2 text-sm">
                <div className="flex items-center space-x-1">
                  <PlaneTakeoff className="w-3.5 h-3.5 text-sky-500" />
                  <span className="font-medium">{item.departureAirportCode || item.location?.slice(0, 3).toUpperCase()}</span>
                  {item.time && <span className="text-slate-500">{item.time}</span>}
                </div>
                <span className="text-slate-300">→</span>
                <div className="flex items-center space-x-1">
                  <PlaneLanding className="w-3.5 h-3.5 text-sky-500" />
                  <span className="font-medium">{item.arrivalAirportCode || item.arrivalLocation?.slice(0, 3).toUpperCase()}</span>
                  {item.arrivalTime && <span className="text-slate-500">{item.arrivalTime}</span>}
                </div>
              </div>
            )}

            {/* Meta info row */}
            {!isFlight && (
              <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-slate-500">
                {/* Time */}
                {item.time && (
                  <span className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {item.time}
                  </span>
                )}
                
                {/* Multi-day lodging */}
                {isMultiDay && (
                  <span className="flex items-center font-medium text-amber-600">
                    {nights} {nights === 1 ? 'night' : 'nights'}
                  </span>
                )}

                {/* Address preview */}
                {details?.address && (
                  <span className="flex items-center truncate max-w-[180px]">
                    <Navigation className="w-3 h-3 mr-1 shrink-0" />
                    <span className="truncate">{details.address}</span>
                  </span>
                )}
              </div>
            )}

            {/* Notes preview */}
            {item.notes && (
              <p className="text-xs text-slate-500 mt-1.5 line-clamp-1">{item.notes}</p>
            )}
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-t border-slate-100">
        <span className="text-xs text-slate-400">
          {formatDate(item.day)}
          {isMultiDay && ` → ${formatDate(item.endDay!)}`}
        </span>
        
        <a
          href={getMapsUrl()}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center text-xs text-indigo-600 hover:text-indigo-700 font-medium"
        >
          <ExternalLink className="w-3 h-3 mr-1" />
          Maps
        </a>
      </div>
    </div>
  );
});
