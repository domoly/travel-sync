import { memo } from 'react';
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
  Wand2
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

interface ItineraryItemCardProps {
  item: ItineraryItem;
  onToggleComplete: (item: ItineraryItem) => void;
  onEdit: (item: ItineraryItem) => void;
  onDelete: (item: ItineraryItem) => void;
  onGenerateAI?: (location: string) => void;
  formatDate: (dateStr: string) => string;
}

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
  formatDate,
}: ItineraryItemCardProps) {
  const isLodging = item.category === 'lodging';
  const isMultiDay = isLodging && item.endDay && item.endDay !== item.day;
  const isFlight = item.type === 'flight';
  
  // Get the appropriate icon
  const CategoryIcon = isFlight 
    ? Plane 
    : CATEGORY_ICONS[item.category as keyof typeof CATEGORY_ICONS] || MapPin;

  return (
    <div
      className={`bg-white rounded-lg p-4 shadow-sm border ${
        isLodging ? 'border-amber-200 bg-amber-50/30' : 'border-slate-100'
      } ${item.completed ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          {/* Complete checkbox */}
          <button
            onClick={() => onToggleComplete(item)}
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
            <div className="flex items-center space-x-2">
              <CategoryIcon className={`w-4 h-4 ${isLodging ? 'text-amber-600' : 'text-indigo-500'}`} />
              <span className={`font-medium ${item.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                {item.location}
              </span>
              {isMultiDay && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                  <CalendarDays className="w-3 h-3 mr-1" />
                  {Math.ceil((new Date(item.endDay!).getTime() - new Date(item.day).getTime()) / (1000 * 60 * 60 * 24))} nights
                </span>
              )}
            </div>
            
            {/* Time/details row */}
            <div className="flex items-center space-x-3 mt-1 text-xs text-slate-500">
              {isMultiDay ? (
                <span className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" /> 
                  {formatDate(item.day)} → {formatDate(item.endDay!)}
                  {item.time && ` (Check-in: ${item.time})`}
                </span>
              ) : (
                <>
                  {item.time && (
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" /> {item.time}
                    </span>
                  )}
                </>
              )}
              {isFlight && item.arrivalLocation && (
                <span className="flex items-center">
                  → {item.arrivalLocation} {item.arrivalTime && `at ${item.arrivalTime}`}
                </span>
              )}
              {isFlight && item.flightNumber && (
                <span>{item.airline} {item.flightNumber}</span>
              )}
            </div>
            
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
                className="inline-flex items-center text-xs text-indigo-500 hover:text-indigo-600 mt-1"
              >
                <ExternalLink className="w-3 h-3 mr-1" /> View on Maps
              </a>
            )}
            
            {/* AI Suggestion for Lodging */}
            {isLodging && onGenerateAI && (
              <button
                onClick={() => onGenerateAI(item.location)}
                className="mt-2 inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 hover:from-purple-100 hover:to-indigo-100 border border-purple-200 transition-colors"
              >
                <Wand2 className="w-3 h-3 mr-1.5" />
                Generate plans near this hotel
              </button>
            )}
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onEdit(item)}
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(item)}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
});
