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


