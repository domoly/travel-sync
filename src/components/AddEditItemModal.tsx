import { memo } from 'react';
import {
  X,
  MapPin,
  Plane,
  Check,
  Loader2,
  Search,
  CheckCircle,
  AlertCircle
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
  isLookingUpFlight: boolean;
  isValid: boolean;
  hasGoogleMapsKey: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onSetField: <K extends keyof ItineraryFormState>(field: K, value: ItineraryFormState[K]) => void;
  onGoogleMapsLinkChange: (url: string) => void;
  onGeocodeLocation: () => void;
  onFlightLookup: () => void;
}

export const AddEditItemModal = memo(function AddEditItemModal({
  isOpen,
  isEditing,
  form,
  isSubmitting,
  isGeocoding,
  isLookingUpFlight,
  isValid,
  hasGoogleMapsKey,
  onClose,
  onSubmit,
  onSetField,
  onGoogleMapsLinkChange,
  onGeocodeLocation,
  onFlightLookup,
}: AddEditItemModalProps) {
  if (!isOpen) return null;

  const isLodging = form.type === 'activity' && form.category === 'lodging';
  const hasFlightData = form.flightValidated || (form.departureAirportCode && form.arrivalAirportCode);

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
            {/* Flight Number & Lookup */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-slate-500">Flight Number</label>
                <button
                  type="button"
                  onClick={onFlightLookup}
                  disabled={isLookingUpFlight || !form.flightNumber}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLookingUpFlight ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Looking up...
                    </>
                  ) : (
                    <>
                      <Search className="w-3 h-3 mr-1" />
                      Lookup Flight Info
                    </>
                  )}
                </button>
              </div>
              <input
                type="text"
                className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                placeholder="e.g., UA123, BA456, DL789"
                value={form.flightNumber}
                onChange={(e) => onSetField('flightNumber', e.target.value.toUpperCase())}
              />
              <p className="text-xs text-slate-400 mt-1">
                Enter flight number to auto-fill airline and airport details
              </p>
            </div>

            {/* Validation Status */}
            {form.flightNumber && (
              <div className={`mb-3 p-2 rounded-lg text-xs flex items-center ${
                form.flightValidated 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {form.flightValidated ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                    Flight validated ({form.flightValidationSource === 'api' ? 'live data' : 'database'})
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
                    Flight not validated - enter details manually or use lookup
                  </>
                )}
              </div>
            )}

            {/* Airline (auto-filled or manual) */}
            <div className="mb-3">
              <label className="text-xs text-slate-500 mb-1 block">Airline</label>
              <input
                type="text"
                className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                placeholder="e.g., United Airlines"
                value={form.airline}
                onChange={(e) => onSetField('airline', e.target.value)}
              />
            </div>

            {/* Arrival Location & Time */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Arrival Airport/City</label>
                <input
                  type="text"
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="e.g., LAX or Los Angeles"
                  value={form.arrivalLocation}
                  onChange={(e) => onSetField('arrivalLocation', e.target.value)}
                />
                {form.arrivalAirportCode && (
                  <p className="text-xs text-green-600 mt-1 flex items-center">
                    <Check className="w-3 h-3 mr-1" /> {form.arrivalAirportCode} - {form.arrivalAirportName}
                  </p>
                )}
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

            {/* Airport Codes Summary */}
            {hasFlightData && (
              <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between text-sm">
                  <div className="text-center">
                    <p className="font-bold text-blue-800">{form.departureAirportCode || '???'}</p>
                    <p className="text-xs text-blue-600">{form.departureAirportName || form.location}</p>
                  </div>
                  <div className="flex-1 px-4">
                    <div className="flex items-center justify-center">
                      <div className="h-px bg-blue-300 flex-1" />
                      <Plane className="w-4 h-4 mx-2 text-blue-500" />
                      <div className="h-px bg-blue-300 flex-1" />
                    </div>
                    {form.airline && (
                      <p className="text-xs text-blue-500 text-center mt-1">{form.airline}</p>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-blue-800">{form.arrivalAirportCode || '???'}</p>
                    <p className="text-xs text-blue-600">{form.arrivalAirportName || form.arrivalLocation}</p>
                  </div>
                </div>
                {form.lat && form.arrivalLat && (
                  <p className="text-xs text-green-600 mt-2 text-center flex items-center justify-center">
                    <MapPin className="w-3 h-3 mr-1" /> Both airports will appear on map
                  </p>
                )}
              </div>
            )}
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
