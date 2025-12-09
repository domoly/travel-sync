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

        {/* Location - only for non-flight items */}
        {form.type !== 'flight' && (
          <div className="mb-3">
            <label className="text-xs text-slate-500 mb-1 block">Location *</label>
            <input
              type="text"
              className="w-full p-2 border border-slate-300 rounded-lg text-sm"
              placeholder="e.g., Eiffel Tower"
              value={form.location}
              onChange={(e) => onSetField('location', e.target.value)}
            />
          </div>
        )}

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
            {/* Step 1: Flight Number with prominent lookup */}
            <div className="mb-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700">Step 1: Flight Number</label>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 p-2 border border-slate-300 rounded-lg text-sm font-mono"
                  placeholder="e.g., LY317, UA123, BA456"
                  value={form.flightNumber}
                  onChange={(e) => onSetField('flightNumber', e.target.value.toUpperCase())}
                />
                <button
                  type="button"
                  onClick={onFlightLookup}
                  disabled={isLookingUpFlight || !form.flightNumber}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isLookingUpFlight ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-1" />
                      Lookup
                    </>
                  )}
                </button>
              </div>
              {form.airline && (
                <p className="text-xs text-green-600 mt-2 flex items-center">
                  <Check className="w-3 h-3 mr-1" /> Airline: {form.airline}
                </p>
              )}
            </div>

            {/* Step 2: Airports */}
            <div className="mb-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <label className="text-sm font-medium text-slate-700 mb-2 block">Step 2: Airports</label>
              <p className="text-xs text-slate-500 mb-3">
                Enter airport codes (JFK, LAX, TLV) or city names, then click Lookup again to validate
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                {/* Departure */}
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">From (Departure) *</label>
                  <input
                    type="text"
                    className={`w-full p-2 border rounded-lg text-sm ${
                      form.departureAirportCode ? 'border-green-300 bg-green-50' : 'border-slate-300'
                    }`}
                    placeholder="e.g., JFK or New York"
                    value={form.location}
                    onChange={(e) => onSetField('location', e.target.value.toUpperCase())}
                  />
                  {form.departureAirportCode ? (
                    <p className="text-xs text-green-600 mt-1 flex items-center">
                      <CheckCircle className="w-3 h-3 mr-1" /> {form.departureAirportCode} - {form.departureAirportName}
                    </p>
                  ) : form.location && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" /> Not recognized - try airport code
                    </p>
                  )}
                </div>

                {/* Arrival */}
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">To (Arrival)</label>
                  <input
                    type="text"
                    className={`w-full p-2 border rounded-lg text-sm ${
                      form.arrivalAirportCode ? 'border-green-300 bg-green-50' : 'border-slate-300'
                    }`}
                    placeholder="e.g., TLV or Tel Aviv"
                    value={form.arrivalLocation}
                    onChange={(e) => onSetField('arrivalLocation', e.target.value.toUpperCase())}
                  />
                  {form.arrivalAirportCode ? (
                    <p className="text-xs text-green-600 mt-1 flex items-center">
                      <CheckCircle className="w-3 h-3 mr-1" /> {form.arrivalAirportCode} - {form.arrivalAirportName}
                    </p>
                  ) : form.arrivalLocation && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" /> Not recognized - try airport code
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Step 3: Times */}
            <div className="mb-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <label className="text-sm font-medium text-slate-700 mb-2 block">Step 3: Times (optional)</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Departure Time</label>
                  <input
                    type="time"
                    className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                    value={form.time}
                    onChange={(e) => onSetField('time', e.target.value)}
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
            </div>

            {/* Flight Summary Card */}
            {(form.airline || form.departureAirportCode || form.arrivalAirportCode) && (
              <div className={`mb-3 p-3 rounded-lg border ${
                form.flightValidated 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-center justify-between text-sm">
                  <div className="text-center min-w-[60px]">
                    <p className={`font-bold ${form.flightValidated ? 'text-green-800' : 'text-blue-800'}`}>
                      {form.departureAirportCode || '???'}
                    </p>
                    <p className="text-xs text-slate-600 truncate max-w-[80px]">
                      {form.departureAirportName || form.location || 'Departure'}
                    </p>
                  </div>
                  <div className="flex-1 px-2">
                    <div className="flex items-center justify-center">
                      <div className="h-px bg-slate-300 flex-1" />
                      <div className="mx-2 flex flex-col items-center">
                        <Plane className={`w-4 h-4 ${form.flightValidated ? 'text-green-500' : 'text-blue-500'}`} />
                        <span className="text-xs font-mono font-bold text-slate-700">{form.flightNumber}</span>
                      </div>
                      <div className="h-px bg-slate-300 flex-1" />
                    </div>
                    {form.airline && (
                      <p className="text-xs text-slate-500 text-center">{form.airline}</p>
                    )}
                  </div>
                  <div className="text-center min-w-[60px]">
                    <p className={`font-bold ${form.flightValidated ? 'text-green-800' : 'text-blue-800'}`}>
                      {form.arrivalAirportCode || '???'}
                    </p>
                    <p className="text-xs text-slate-600 truncate max-w-[80px]">
                      {form.arrivalAirportName || form.arrivalLocation || 'Arrival'}
                    </p>
                  </div>
                </div>
                
                {form.flightValidated ? (
                  <p className="text-xs text-green-700 mt-2 text-center flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 mr-1" /> Flight validated - will show on map
                  </p>
                ) : (
                  <p className="text-xs text-blue-700 mt-2 text-center">
                    Enter airport codes and click Lookup to validate
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
