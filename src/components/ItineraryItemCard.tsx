import { memo, useMemo } from 'react';
import {
  Check,
  Trash2,
  Edit2,
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
  Wand2,
  LogOut,
  Moon,
  LogIn,
  ChevronRight,
  PlaneTakeoff,
  PlaneLanding,
  Star
} from 'lucide-react';
import type { ItineraryItem, DisplayItineraryItem } from '../types';

// Helper to parse and format place details for preview
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

// Place details preview component
const PlacePreview = memo(function PlacePreview({ placeDescription }: { placeDescription?: string }) {
  const details = useMemo(() => parsePlaceDescription(placeDescription), [placeDescription]);
  
  if (!details) return null;

  return (
    <div className="flex items-center space-x-3 mt-2 text-xs text-slate-500">
      {details.rating && (
        <span className="flex items-center">
          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 mr-1" />
          {details.rating}
          {details.totalRatings && <span className="text-slate-400 ml-1">({details.totalRatings})</span>}
        </span>
      )}
      {details.address && (
        <span className="truncate max-w-[200px]">{details.address}</span>
      )}
    </div>
  );
});

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

interface ItineraryItemCardProps {
  item: DisplayItineraryItem;
  onToggleComplete: (item: ItineraryItem) => void;
  onEdit: (item: ItineraryItem) => void;
  onDelete: (item: ItineraryItem) => void;
  onGenerateAI?: (location: string) => void;
  onViewDetails?: (item: ItineraryItem) => void;
  formatDate: (dateStr: string) => string;
}

/**
 * Compact lodging card for check-out and staying phases
 */
const LodgingPhaseCard = memo(function LodgingPhaseCard({
  item,
  onEdit,
  onViewDetails,
  formatDate,
}: {
  item: DisplayItineraryItem;
  onEdit: (item: ItineraryItem) => void;
  onViewDetails?: (item: ItineraryItem) => void;
  formatDate: (dateStr: string) => string;
}) {
  const isCheckOut = item.lodgingPhase === 'check-out';
  
  const PhaseIcon = isCheckOut ? LogOut : Moon;
  const phaseLabel = isCheckOut ? 'Check-out' : 'Staying tonight';
  const bgColor = isCheckOut 
    ? 'bg-orange-50 border-orange-200 hover:border-orange-300' 
    : 'bg-indigo-50 border-indigo-200 hover:border-indigo-300';
  const iconColor = isCheckOut ? 'text-orange-500' : 'text-indigo-500';
  const labelColor = isCheckOut ? 'text-orange-700' : 'text-indigo-700';
  
  const handleCardClick = () => {
    if (onViewDetails) {
      onViewDetails(item);
    }
  };
  
  return (
    <div 
      className={`rounded-lg px-3 py-2 border ${bgColor} flex items-center justify-between cursor-pointer transition-all`}
      onClick={handleCardClick}
    >
      <div className="flex items-center space-x-2">
        <PhaseIcon className={`w-4 h-4 ${iconColor}`} />
        <span className={`text-sm font-medium ${labelColor}`}>
          {phaseLabel}
        </span>
        <span className="text-sm text-slate-600">
          @ {item.location}
        </span>
        {isCheckOut && (
          <span className="text-xs text-slate-400">
            (stayed since {formatDate(item.day)})
          </span>
        )}
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onEdit(item); }}
        className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-white rounded transition-colors"
        title="Edit stay details"
      >
        <Edit2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
});

/**
 * Flight card with distinctive visual design
 */
const FlightCard = memo(function FlightCard({
  item,
  onToggleComplete,
  onEdit,
  onDelete,
  onViewDetails,
}: {
  item: DisplayItineraryItem;
  onToggleComplete: (item: ItineraryItem) => void;
  onEdit: (item: ItineraryItem) => void;
  onDelete: (item: ItineraryItem) => void;
  onViewDetails?: (item: ItineraryItem) => void;
}) {
  const handleCardClick = () => {
    if (onViewDetails) {
      onViewDetails(item);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`bg-gradient-to-r from-sky-50 to-blue-50 rounded-xl p-4 border-2 border-sky-200 shadow-sm cursor-pointer hover:shadow-md hover:border-sky-300 transition-all ${
        item.completed ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-start space-x-3 flex-1">
          {/* Complete checkbox */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleComplete(item); }}
            className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
              item.completed
                ? 'bg-green-500 border-green-500 text-white'
                : 'border-sky-300 hover:border-sky-500'
            }`}
          >
            {item.completed && <Check className="w-3 h-3" />}
          </button>
          
          <div className="flex-1">
            {/* Flight header */}
            <div className="flex items-center space-x-2 mb-2">
              <Plane className="w-5 h-5 text-sky-600" />
              {item.airline && item.flightNumber && (
                <span className="font-bold text-sky-800">
                  {item.airline} {item.flightNumber}
                </span>
              )}
            </div>
            
            {/* Flight route */}
            <div className="flex items-center space-x-2 bg-white/60 rounded-lg p-3">
              {/* Departure */}
              <div className="text-center min-w-[70px]">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <PlaneTakeoff className="w-4 h-4 text-sky-500" />
                </div>
                <p className="font-bold text-lg text-slate-800">
                  {item.departureAirportCode || item.location?.slice(0, 3).toUpperCase() || '---'}
                </p>
                <p className="text-xs text-slate-500 truncate max-w-[80px]">
                  {item.departureAirportName || item.location || 'Departure'}
                </p>
                {item.time && (
                  <p className="text-sm font-medium text-sky-700 mt-1">{item.time}</p>
                )}
              </div>
              
              {/* Arrow */}
              <div className="flex-1 flex items-center justify-center px-2">
                <div className="h-px bg-sky-300 flex-1" />
                <ChevronRight className="w-5 h-5 text-sky-400 mx-1" />
                <div className="h-px bg-sky-300 flex-1" />
              </div>
              
              {/* Arrival */}
              <div className="text-center min-w-[70px]">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <PlaneLanding className="w-4 h-4 text-sky-500" />
                </div>
                <p className="font-bold text-lg text-slate-800">
                  {item.arrivalAirportCode || item.arrivalLocation?.slice(0, 3).toUpperCase() || '---'}
                </p>
                <p className="text-xs text-slate-500 truncate max-w-[80px]">
                  {item.arrivalAirportName || item.arrivalLocation || 'Arrival'}
                </p>
                {item.arrivalTime && (
                  <p className="text-sm font-medium text-sky-700 mt-1">{item.arrivalTime}</p>
                )}
              </div>
            </div>
            
            {/* Notes */}
            {item.notes && (
              <p className="text-xs text-slate-500 mt-2">{item.notes}</p>
            )}
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex flex-col items-center space-y-1 ml-2">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(item); }}
            className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-100 rounded transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(item); }}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
});

/**
 * Memoized card component for a single itinerary item
 * Only re-renders when its specific item changes
 */
export const ItineraryItemCard = memo(function ItineraryItemCard({
  item,
  onToggleComplete,
  onEdit,
  onDelete,
  onGenerateAI,
  onViewDetails,
  formatDate,
}: ItineraryItemCardProps) {
  const isLodging = item.category === 'lodging';
  const isMultiDay = isLodging && item.endDay && item.endDay !== item.day;
  const isFlight = item.type === 'flight';
  const lodgingPhase = item.lodgingPhase;
  
  // For staying and check-out phases, render a compact card
  if (lodgingPhase === 'staying' || lodgingPhase === 'check-out') {
    return (
      <LodgingPhaseCard 
        item={item} 
        onEdit={onEdit}
        onViewDetails={onViewDetails}
        formatDate={formatDate} 
      />
    );
  }

  // For flights, render the distinctive flight card
  if (isFlight) {
    return (
      <FlightCard
        item={item}
        onToggleComplete={onToggleComplete}
        onEdit={onEdit}
        onDelete={onDelete}
        onViewDetails={onViewDetails}
      />
    );
  }
  
  // Get the appropriate icon
  const CategoryIcon = lodgingPhase === 'check-in' 
    ? LogIn 
    : CATEGORY_ICONS[item.category as keyof typeof CATEGORY_ICONS] || MapPin;

  // Calculate nights for multi-day lodging
  const nights = isMultiDay 
    ? Math.ceil((new Date(item.endDay!).getTime() - new Date(item.day).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const handleCardClick = () => {
    if (onViewDetails) {
      onViewDetails(item);
    }
  };

  // Lodging check-in card with distinctive amber styling
  if (isLodging && lodgingPhase === 'check-in') {
    return (
      <div
        onClick={handleCardClick}
        className={`bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border-2 border-amber-300 shadow-sm cursor-pointer hover:shadow-md hover:border-amber-400 transition-all ${
          item.completed ? 'opacity-60' : ''
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            {/* Complete checkbox */}
            <button
              onClick={(e) => { e.stopPropagation(); onToggleComplete(item); }}
              className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                item.completed
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'border-amber-400 hover:border-amber-600'
              }`}
            >
              {item.completed && <Check className="w-3 h-3" />}
            </button>
            
            <div className="flex-1">
              {/* Header with icon */}
              <div className="flex items-center space-x-2 mb-2">
                <div className="p-1.5 bg-amber-200 rounded-lg">
                  <Home className="w-4 h-4 text-amber-700" />
                </div>
                <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                  Check-in
                </span>
                {isMultiDay && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-200 text-amber-800">
                    <CalendarDays className="w-3 h-3 mr-1" />
                    {nights} {nights === 1 ? 'night' : 'nights'}
                  </span>
                )}
              </div>
              
              {/* Location name */}
              <p className={`font-semibold text-lg ${item.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                {item.location}
              </p>
              
              {/* Stay details */}
              <div className="flex items-center space-x-3 mt-2 text-sm text-amber-800">
                <span className="flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-1" /> 
                  {formatDate(item.day)}
                  {isMultiDay && ` → ${formatDate(item.endDay!)}`}
                  {item.time && ` at ${item.time}`}
                </span>
              </div>

              {/* Place info preview */}
              <PlacePreview placeDescription={item.placeDescription} />
              
              {/* Notes */}
              {item.notes && (
                <p className="text-sm text-slate-600 mt-2">{item.notes}</p>
              )}
              
              {/* Maps link */}
              {item.googleMapsLink && (
                <a
                  href={item.googleMapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center text-xs text-amber-700 hover:text-amber-800 mt-2"
                >
                  <ExternalLink className="w-3 h-3 mr-1" /> View on Maps
                </a>
              )}
              
              {/* AI Suggestion */}
              {onGenerateAI && (
                <button
                  onClick={(e) => { e.stopPropagation(); onGenerateAI(item.location); }}
                  className="mt-3 inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 hover:from-purple-200 hover:to-indigo-200 border border-purple-200 transition-colors"
                >
                  <Wand2 className="w-3 h-3 mr-1.5" />
                  Generate plans nearby
                </button>
              )}
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex flex-col items-center space-y-1">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(item); }}
              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-100 rounded transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            {!item.isVirtual && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(item); }}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Regular activity card
  return (
    <div
      onClick={handleCardClick}
      className={`bg-white rounded-lg p-4 shadow-sm border border-slate-200 cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all ${
        item.completed ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          {/* Complete checkbox */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleComplete(item); }}
            className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
              item.completed
                ? 'bg-green-500 border-green-500 text-white'
                : 'border-slate-300 hover:border-indigo-400'
            }`}
          >
            {item.completed && <Check className="w-3 h-3" />}
          </button>
          
          <div className="flex-1">
            {/* Title row */}
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <CategoryIcon className="w-4 h-4 text-indigo-500" />
              <span className={`font-medium ${item.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                {item.location}
              </span>
            </div>
            
            {/* Time row */}
            <div className="flex items-center space-x-3 mt-1 text-xs text-slate-500 flex-wrap gap-y-1">
              {item.time && (
                <span className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" /> {item.time}
                </span>
              )}
            </div>

            {/* Place info preview */}
            <PlacePreview placeDescription={item.placeDescription} />
            
            {/* Notes */}
            {item.notes && (
              <p className="text-xs text-slate-500 mt-1">{item.notes}</p>
            )}
            
            {/* Maps link */}
            {item.googleMapsLink && (
              <a
                href={item.googleMapsLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center text-xs text-indigo-500 hover:text-indigo-600 mt-1"
              >
                <ExternalLink className="w-3 h-3 mr-1" /> View on Maps
              </a>
            )}
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center space-x-1">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(item); }}
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(item); }}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
});
