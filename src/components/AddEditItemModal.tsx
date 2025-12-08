import { memo } from 'react';
import {
  X,
  MapPin,
  Plane,
  Check,
  Loader2
} from 'lucide-react';
import type { ItineraryFormState } from '../hooks';

// Category options
const CATEGORIES = [
  { value: 'sightseeing', label: 'Sightseeing' },
  { value: 'food', label: 'Food & Drink' },
  { value: 'lodging', label: 'Lodging' },
  { value: 'nature', label: 'Nature' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'transport', label: 'Transport' },
  { value: 'entertainment', label: 'Entertainment' },
] as const;

interface AddEditItemModalProps {
  isOpen: boolean;
  isEditing: boolean;
  form: ItineraryFormState;
  isSubmitting: boolean;
  isGeocoding: boolean;
  isValid: boolean;
  hasGoogleMapsKey: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onSetField: <K extends keyof ItineraryFormState>(field: K, value: ItineraryFormState[K]) => void;
  onGoogleMapsLinkChange: (url: string) => void;
  onGeocodeLocation: () => void;
}

export const AddEditItemModal = memo(function AddEditItemModal({
  isOpen,
  isEditing,
  form,
  isSubmitting,
  isGeocoding,
  isValid,
  hasGoogleMapsKey,
  onClose,
  onSubmit,
  onSetField,
  onGoogleMapsLinkChange,
  onGeocodeLocation,
}: AddEditItemModalProps) {
  if (!isOpen) return null;

  const isLodging = form.type === 'activity' && form.category === 'lodging';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {isEditing ? 'Edit Item' : 'Add to Itinerary'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Type Toggle */}
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => onSetField('type', 'activity')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              form.type === 'activity'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <MapPin className="w-4 h-4 inline mr-1" /> Activity
          </button>
          <button
            onClick={() => onSetField('type', 'flight')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              form.type === 'flight'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Plane className="w-4 h-4 inline mr-1" /> Flight
          </button>
        </div>

        {/* Date & Time */}
        <div className={`grid gap-3 mb-3 ${isLodging ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {isLodging ? (
            <>
              {/* Lodging: Check-in / Check-out dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Check-in Date *</label>
                  <input
                    type="date"
                    className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                    value={form.day}
                    onChange={(e) => onSetField('day', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Check-out Date</label>
                  <input
                    type="date"
                    className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                    value={form.endDay}
                    min={form.day}
                    onChange={(e) => onSetField('endDay', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Check-in Time</label>
                <input
                  type="time"
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                  value={form.time}
                  onChange={(e) => onSetField('time', e.target.value)}
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Date *</label>
                <input
                  type="date"
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                  value={form.day}
                  onChange={(e) => onSetField('day', e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">
                  {form.type === 'flight' ? 'Departure Time' : 'Time'}
                </label>
                <input
                  type="time"
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                  value={form.time}
                  onChange={(e) => onSetField('time', e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        {/* Location */}
        <div className="mb-3">
          <label className="text-xs text-slate-500 mb-1 block">
            {form.type === 'flight' ? 'Departure Airport/City *' : 'Location *'}
          </label>
          <input
            type="text"
            className="w-full p-2 border border-slate-300 rounded-lg text-sm"
            placeholder={form.type === 'flight' ? 'e.g., JFK New York' : 'e.g., Eiffel Tower'}
            value={form.location}
            onChange={(e) => onSetField('location', e.target.value)}
          />
        </div>

        {/* Activity-specific fields */}
        {form.type === 'activity' && (
          <>
            <div className="mb-3">
              <label className="text-xs text-slate-500 mb-1 block">Category</label>
              <select
                className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                value={form.category}
                onChange={(e) => onSetField('category', e.target.value)}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="mb-3">
              <label className="text-xs text-slate-500 mb-1 block">Google Maps Link</label>
              <input
                type="url"
                className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                placeholder="https://maps.google.com/... (coordinates will be auto-extracted)"
                value={form.googleMapsLink}
                onChange={(e) => onGoogleMapsLinkChange(e.target.value)}
              />
            </div>

            {/* Coordinates */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-slate-500">Coordinates (for map view)</label>
                {hasGoogleMapsKey && form.location && (
                  <button
                    type="button"
                    onClick={onGeocodeLocation}
                    disabled={isGeocoding}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center disabled:opacity-50"
                  >
                    {isGeocoding ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Finding...
                      </>
                    ) : (
                      <>
                        <MapPin className="w-3 h-3 mr-1" />
                        Auto-detect from location
                      </>
                    )}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  step="any"
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="Latitude (e.g., 48.8584)"
                  value={form.lat}
                  onChange={(e) => onSetField('lat', e.target.value)}
                />
                <input
                  type="number"
                  step="any"
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="Longitude (e.g., 2.2945)"
                  value={form.lng}
                  onChange={(e) => onSetField('lng', e.target.value)}
                />
              </div>
              {form.lat && form.lng && (
                <p className="text-xs text-green-600 mt-1 flex items-center">
                  <Check className="w-3 h-3 mr-1" /> Location will appear on map
                </p>
              )}
            </div>
          </>
        )}

        {/* Flight-specific fields */}
        {form.type === 'flight' && (
          <>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Arrival Airport/City</label>
                <input
                  type="text"
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="e.g., LAX Los Angeles"
                  value={form.arrivalLocation}
                  onChange={(e) => onSetField('arrivalLocation', e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Arrival Time</label>
                <input
                  type="time"
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                  value={form.arrivalTime}
                  onChange={(e) => onSetField('arrivalTime', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Airline</label>
                <input
                  type="text"
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="e.g., Delta"
                  value={form.airline}
                  onChange={(e) => onSetField('airline', e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Flight Number</label>
                <input
                  type="text"
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="e.g., DL123"
                  value={form.flightNumber}
                  onChange={(e) => onSetField('flightNumber', e.target.value)}
                />
              </div>
            </div>
          </>
        )}

        {/* Notes */}
        <div className="mb-4">
          <label className="text-xs text-slate-500 mb-1 block">Notes</label>
          <textarea
            className="w-full p-2 border border-slate-300 rounded-lg text-sm resize-none"
            rows={2}
            placeholder="Any additional details..."
            value={form.notes}
            onChange={(e) => onSetField('notes', e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            disabled={isSubmitting || !isValid}
          >
            {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Item'}
          </button>
        </div>
      </div>
    </div>
  );
});
