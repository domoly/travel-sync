import { Calendar, Users, Trash2, Download } from 'lucide-react';
import type { Trip } from '../types';

interface TripCardProps {
  trip: Trip;
  isOwner: boolean;
  onClick: () => void;
  onDelete?: () => void;
  onExport?: () => void;
}

export function TripCard({ trip, isOwner, onClick, onDelete, onExport }: TripCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (onDelete) {
      onDelete();
    }
  };

  const handleExport = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (onExport) {
      onExport();
    }
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow cursor-pointer group relative"
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-bold text-lg text-slate-800 group-hover:text-indigo-600 transition-colors pr-2">
          {trip.name}
        </h3>
        <div className="flex items-center space-x-1">
          {isOwner && (
            <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full mr-1">
              Owner
            </span>
          )}
          {onExport && (
            <button
              onClick={handleExport}
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
              title="Export trip backup"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
          {isOwner && onDelete && (
            <button
              onClick={handleDelete}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
              title="Delete trip"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
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

