export interface Trip {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  ownerId: string;
  members: string[];
  joinCode: string;
}

export interface ItineraryItem {
  id: string;
  type: 'activity' | 'flight';
  category?: 'sightseeing' | 'food' | 'lodging' | 'nature' | 'shopping' | 'transport' | 'entertainment';
  day: string;
  endDay?: string; // For multi-day items like lodging (check-out date)
  time: string;
  location: string;
  notes: string;
  completed: boolean;
  // Map & Data Fields
  lat?: number;
  lng?: number;
  googleMapsLink?: string;
  placeDescription?: string;
  // Flight Specifics
  arrivalLocation?: string;
  arrivalTime?: string;
  airline?: string;
  flightNumber?: string;
}

/**
 * Lodging phase indicates where in the stay this item appears:
 * - 'check-in': First day of stay (show check-in time, full card)
 * - 'staying': Intermediate days (simplified "staying at" indicator)
 * - 'check-out': Last day of stay (show check-out reminder at start of day)
 */
export type LodgingPhase = 'check-in' | 'staying' | 'check-out';

/**
 * Extended item for display purposes - wraps ItineraryItem with display metadata
 * for multi-day lodging items that appear on multiple days
 */
export interface DisplayItineraryItem extends ItineraryItem {
  /** For multi-day lodging: which phase of the stay this represents */
  lodgingPhase?: LodgingPhase;
  /** The day this display item appears on (may differ from item.day for staying/check-out) */
  displayDay: string;
  /** Whether this is the "source" item or a virtual copy for another day */
  isVirtual?: boolean;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  payer: string;
  category: string;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
}


