import { Calendar, Users } from 'lucide-react';
import type { Trip } from '../types';

interface TripCardProps {
  trip: Trip;
  isOwner: boolean;
  onClick: () => void;
}

export function TripCard({ trip, isOwner, onClick }: TripCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow cursor-pointer group"
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-bold text-lg text-slate-800 group-hover:text-indigo-600 transition-colors">
          {trip.name}
        </h3>
        {isOwner && (
          <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
            Owner
          </span>
        )}
      </div>

      <div className="space-y-2 text-slate-500 text-sm mb-4">
        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-2" />
          <span>
            {trip.startDate
              ? new Date(trip.startDate).toLocaleDateString()
              : 'No date'}
          </span>
        </div>
        <div className="flex items-center">
          <Users className="w-4 h-4 mr-2" />
          <span>{trip.members?.length || 1} Travelers</span>
        </div>
      </div>
    </div>
  );
}

