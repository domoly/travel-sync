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
  Navigation,
  CalendarDays
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
      className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${
        isCheckOut 
          ? 'bg-orange-50 hover:bg-orange-100' 
          : 'bg-indigo-50 hover:bg-indigo-100'
      }`}
      onClick={() => onViewDetails?.(item)}
    >
      <PhaseIcon className={`w-4 h-4 ${isCheckOut ? 'text-orange-500' : 'text-indigo-500'}`} />
      <span className={`font-medium ${isCheckOut ? 'text-orange-700' : 'text-indigo-700'}`}>
        {isCheckOut ? 'Check-out' : 'Staying'}
      </span>
      <span className="text-slate-600">@ {item.location}</span>
      {isCheckOut && (
        <span className="text-slate-400 text-xs">(since {formatDate(item.day)})</span>
      )}
    </div>
  );
});

/**
 * Flight card with distinctive sky-blue styling
 */
const FlightCard = memo(function FlightCard({
  item,
  onToggleComplete,
  onViewDetails,
}: {
  item: DisplayItineraryItem;
  onToggleComplete: (item: ItineraryItem) => void;
  onViewDetails?: (item: ItineraryItem) => void;
}) {
  return (
    <div
      onClick={() => onViewDetails?.(item)}
      className={`bg-gradient-to-r from-sky-50 to-blue-50 rounded-xl p-3 border border-sky-200 cursor-pointer hover:border-sky-300 hover:shadow-sm transition-all ${
        item.completed ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start space-x-3">
        {/* Checkbox */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleComplete(item); }}
          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
            item.completed
              ? 'bg-green-500 border-green-500 text-white'
              : 'border-sky-300 hover:border-sky-400'
          }`}
        >
          {item.completed && <Check className="w-3 h-3" />}
        </button>

        <div className="flex-1 min-w-0">
          {/* Flight header */}
          <div className="flex items-center space-x-2">
            <Plane className="w-4 h-4 text-sky-600" />
            <span className="font-semibold text-sky-800">
              {item.airline} {item.flightNumber}
            </span>
          </div>

          {/* Flight route */}
          <div className="flex items-center mt-2 bg-white/60 rounded-lg px-3 py-2">
            <div className="text-center">
              <PlaneTakeoff className="w-4 h-4 text-sky-500 mx-auto" />
              <p className="font-bold text-slate-800">
                {item.departureAirportCode || item.location?.slice(0, 3).toUpperCase()}
              </p>
              {item.time && <p className="text-xs text-sky-600">{item.time}</p>}
            </div>
            
            <div className="flex-1 flex items-center justify-center px-3">
              <div className="h-px bg-sky-300 flex-1" />
              <span className="mx-2 text-sky-400">→</span>
              <div className="h-px bg-sky-300 flex-1" />
            </div>
            
            <div className="text-center">
              <PlaneLanding className="w-4 h-4 text-sky-500 mx-auto" />
              <p className="font-bold text-slate-800">
                {item.arrivalAirportCode || item.arrivalLocation?.slice(0, 3).toUpperCase()}
              </p>
              {item.arrivalTime && <p className="text-xs text-sky-600">{item.arrivalTime}</p>}
            </div>
          </div>

          {/* Notes */}
          {item.notes && (
            <p className="text-xs text-slate-500 mt-2 line-clamp-1">{item.notes}</p>
          )}
        </div>
      </div>
    </div>
  );
});

/**
 * Lodging check-in card with amber styling
 */
const LodgingCheckInCard = memo(function LodgingCheckInCard({
  item,
  onToggleComplete,
  onViewDetails,
  formatDate,
}: {
  item: DisplayItineraryItem;
  onToggleComplete: (item: ItineraryItem) => void;
  onViewDetails?: (item: ItineraryItem) => void;
  formatDate: (dateStr: string) => string;
}) {
  const details = useMemo(() => parsePlaceDescription(item.placeDescription), [item.placeDescription]);
  const isMultiDay = item.endDay && item.endDay !== item.day;
  const nights = isMultiDay
    ? Math.ceil((new Date(item.endDay!).getTime() - new Date(item.day).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

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
      className={`bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 overflow-hidden cursor-pointer hover:border-amber-300 hover:shadow-sm transition-all ${
        item.completed ? 'opacity-60' : ''
      }`}
    >
      <div className="p-3">
        <div className="flex items-start space-x-3">
          {/* Checkbox */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleComplete(item); }}
            className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
              item.completed
                ? 'bg-green-500 border-green-500 text-white'
                : 'border-amber-400 hover:border-amber-500'
            }`}
          >
            {item.completed && <Check className="w-3 h-3" />}
          </button>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center space-x-2">
              <div className="p-1 bg-amber-200 rounded-md">
                <LogIn className="w-3.5 h-3.5 text-amber-700" />
              </div>
              <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                Check-in
              </span>
              {isMultiDay && (
                <span className="flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-200 text-amber-800">
                  <CalendarDays className="w-3 h-3 mr-1" />
                  {nights} {nights === 1 ? 'night' : 'nights'}
                </span>
              )}
            </div>

            {/* Location */}
            <p className={`font-semibold text-lg mt-1 ${item.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
              {item.location}
            </p>

            {/* Meta info */}
            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-amber-700">
              {item.time && (
                <span className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {item.time}
                </span>
              )}
              {details?.rating && (
                <span className="flex items-center">
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 mr-0.5" />
                  {details.rating}
                </span>
              )}
            </div>

            {/* Notes */}
            {item.notes && (
              <p className="text-xs text-slate-600 mt-1.5 line-clamp-1">{item.notes}</p>
            )}
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-amber-100/50 border-t border-amber-200">
        <span className="text-xs text-amber-600">
          {formatDate(item.day)}
          {isMultiDay && ` → ${formatDate(item.endDay!)}`}
        </span>
        <a
          href={getMapsUrl()}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center text-xs text-amber-700 hover:text-amber-800 font-medium"
        >
          <ExternalLink className="w-3 h-3 mr-1" />
          Maps
        </a>
      </div>
    </div>
  );
});

/**
 * Regular activity card - clean, minimal design
 */
const ActivityCard = memo(function ActivityCard({
  item,
  onToggleComplete,
  onViewDetails,
  formatDate,
}: {
  item: DisplayItineraryItem;
  onToggleComplete: (item: ItineraryItem) => void;
  onViewDetails?: (item: ItineraryItem) => void;
  formatDate: (dateStr: string) => string;
}) {
  const details = useMemo(() => parsePlaceDescription(item.placeDescription), [item.placeDescription]);
  const categoryColor = CATEGORY_COLORS[item.category || 'sightseeing'] || '#6366F1';
  const CategoryIcon = CATEGORY_ICONS[item.category as keyof typeof CATEGORY_ICONS] || MapPin;

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

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center space-x-2">
              <div 
                className="p-1 rounded-md shrink-0"
                style={{ backgroundColor: `${categoryColor}15` }}
              >
                <CategoryIcon className="w-3.5 h-3.5" style={{ color: categoryColor }} />
              </div>
              <span className={`font-semibold truncate ${item.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                {item.location}
              </span>
              {details?.rating && (
                <span className="flex items-center text-xs text-slate-500 shrink-0">
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 mr-0.5" />
                  {details.rating}
                </span>
              )}
            </div>

            {/* Meta info */}
            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-slate-500">
              {item.time && (
                <span className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {item.time}
                </span>
              )}
              {details?.address && (
                <span className="flex items-center truncate max-w-[180px]">
                  <Navigation className="w-3 h-3 mr-1 shrink-0" />
                  <span className="truncate">{details.address}</span>
                </span>
              )}
            </div>

            {/* Notes */}
            {item.notes && (
              <p className="text-xs text-slate-500 mt-1.5 line-clamp-1">{item.notes}</p>
            )}
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-t border-slate-100">
        <span className="text-xs text-slate-400">{formatDate(item.day)}</span>
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

/**
 * Main item card component - routes to appropriate card type
 */
export const ItineraryItemCard = memo(function ItineraryItemCard({
  item,
  onToggleComplete,
  onViewDetails,
  formatDate,
}: ItineraryItemCardProps) {
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

  // Flight card
  if (item.type === 'flight') {
    return (
      <FlightCard
        item={item}
        onToggleComplete={onToggleComplete}
        onViewDetails={onViewDetails}
      />
    );
  }

  // Lodging check-in card
  if (item.category === 'lodging' && lodgingPhase === 'check-in') {
    return (
      <LodgingCheckInCard
        item={item}
        onToggleComplete={onToggleComplete}
        onViewDetails={onViewDetails}
        formatDate={formatDate}
      />
    );
  }

  // Regular activity card
  return (
    <ActivityCard
      item={item}
      onToggleComplete={onToggleComplete}
      onViewDetails={onViewDetails}
      formatDate={formatDate}
    />
  );
});
