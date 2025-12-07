import { useState, useEffect } from 'react';
import {
  Plus,
  MapPin,
  Clock,
  Plane,
  Check,
  Trash2,
  Edit2,
  X,
  ExternalLink,
  Camera,
  Utensils,
  Home,
  Trees,
  ShoppingBag,
  Car,
  Music,
  Sparkles,
  Loader2
} from 'lucide-react';

import type { Trip, ItineraryItem } from '../types';
import {
  db,
  appId,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot
} from '../config/firebase';
import { generateItinerary, type GenerateItineraryParams } from '../services/ai';

interface ItineraryManagerProps {
  tripId: string;
  trip: Trip;
}

const CATEGORIES = [
  { value: 'sightseeing', label: 'Sightseeing', icon: Camera },
  { value: 'food', label: 'Food & Drink', icon: Utensils },
  { value: 'lodging', label: 'Lodging', icon: Home },
  { value: 'nature', label: 'Nature', icon: Trees },
  { value: 'shopping', label: 'Shopping', icon: ShoppingBag },
  { value: 'transport', label: 'Transport', icon: Car },
  { value: 'entertainment', label: 'Entertainment', icon: Music },
] as const;

const INTERESTS = [
  'History & Culture',
  'Food & Cuisine', 
  'Nature & Outdoors',
  'Art & Museums',
  'Shopping',
  'Nightlife',
  'Adventure & Sports',
  'Relaxation & Spa',
  'Photography',
  'Local Experiences'
];

export function ItineraryManager({ tripId, trip }: ItineraryManagerProps) {
  const [items, setItems] = useState<ItineraryItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI Generation state
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiDestination, setAiDestination] = useState('');
  const [aiInterests, setAiInterests] = useState<string[]>([]);
  const [aiPace, setAiPace] = useState<'relaxed' | 'moderate' | 'packed'>('moderate');
  const [aiNotes, setAiNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedItems, setGeneratedItems] = useState<Partial<ItineraryItem>[]>([]);
  const [aiError, setAiError] = useState('');

  // Form state
  const [formType, setFormType] = useState<'activity' | 'flight'>('activity');
  const [formDay, setFormDay] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formCategory, setFormCategory] = useState<string>('sightseeing');
  const [formGoogleMapsLink, setFormGoogleMapsLink] = useState('');
  // Flight specific
  const [formArrivalLocation, setFormArrivalLocation] = useState('');
  const [formArrivalTime, setFormArrivalTime] = useState('');
  const [formAirline, setFormAirline] = useState('');
  const [formFlightNumber, setFormFlightNumber] = useState('');

  useEffect(() => {
    const itineraryRef = collection(db, 'artifacts', appId, 'public', 'data', 'trips', tripId, 'itinerary');
    const unsubscribe = onSnapshot(itineraryRef, (snapshot) => {
      const itineraryItems = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as ItineraryItem
      );
      // Sort by day and time
      itineraryItems.sort((a, b) => {
        if (a.day !== b.day) return a.day.localeCompare(b.day);
        return a.time.localeCompare(b.time);
      });
      setItems(itineraryItems);
    });
    return () => unsubscribe();
  }, [tripId]);

  const resetForm = () => {
    setFormType('activity');
    setFormDay('');
    setFormTime('');
    setFormLocation('');
    setFormNotes('');
    setFormCategory('sightseeing');
    setFormGoogleMapsLink('');
    setFormArrivalLocation('');
    setFormArrivalTime('');
    setFormAirline('');
    setFormFlightNumber('');
    setEditingItem(null);
  };

  const openAddModal = () => {
    resetForm();
    // Default to trip start date if available
    if (trip.startDate) {
      setFormDay(trip.startDate);
    }
    setShowAddModal(true);
  };

  const openEditModal = (item: ItineraryItem) => {
    setEditingItem(item);
    setFormType(item.type);
    setFormDay(item.day);
    setFormTime(item.time);
    setFormLocation(item.location);
    setFormNotes(item.notes || '');
    setFormCategory(item.category || 'sightseeing');
    setFormGoogleMapsLink(item.googleMapsLink || '');
    setFormArrivalLocation(item.arrivalLocation || '');
    setFormArrivalTime(item.arrivalTime || '');
    setFormAirline(item.airline || '');
    setFormFlightNumber(item.flightNumber || '');
    setShowAddModal(true);
  };

  const handleSubmit = async () => {
    if (!formDay || !formLocation) return;

    setIsSubmitting(true);
    try {
      const itemData: Partial<ItineraryItem> = {
        type: formType,
        day: formDay,
        time: formTime,
        location: formLocation,
        notes: formNotes,
        completed: editingItem?.completed || false,
      };

      if (formType === 'activity') {
        itemData.category = formCategory as ItineraryItem['category'];
        itemData.googleMapsLink = formGoogleMapsLink;
      } else {
        itemData.arrivalLocation = formArrivalLocation;
        itemData.arrivalTime = formArrivalTime;
        itemData.airline = formAirline;
        itemData.flightNumber = formFlightNumber;
      }

      if (editingItem) {
        await updateDoc(
          doc(db, 'artifacts', appId, 'public', 'data', 'trips', tripId, 'itinerary', editingItem.id),
          itemData
        );
      } else {
        await addDoc(
          collection(db, 'artifacts', appId, 'public', 'data', 'trips', tripId, 'itinerary'),
          itemData
        );
      }

      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Failed to save item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleComplete = async (item: ItineraryItem) => {
    try {
      await updateDoc(
        doc(db, 'artifacts', appId, 'public', 'data', 'trips', tripId, 'itinerary', item.id),
        { completed: !item.completed }
      );
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const deleteItem = async (item: ItineraryItem) => {
    if (!confirm('Delete this item?')) return;
    try {
      await deleteDoc(
        doc(db, 'artifacts', appId, 'public', 'data', 'trips', tripId, 'itinerary', item.id)
      );
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  // AI Generation functions
  const toggleInterest = (interest: string) => {
    setAiInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleGenerateItinerary = async () => {
    if (!aiDestination.trim()) {
      setAiError('Please enter a destination');
      return;
    }
    if (!trip.startDate || !trip.endDate) {
      setAiError('Trip dates are required. Please set start and end dates.');
      return;
    }

    setAiError('');
    setIsGenerating(true);
    setGeneratedItems([]);

    try {
      const params: GenerateItineraryParams = {
        tripName: trip.name,
        startDate: trip.startDate,
        endDate: trip.endDate,
        destination: aiDestination,
        interests: aiInterests,
        pace: aiPace,
        additionalNotes: aiNotes
      };

      const items = await generateItinerary(params);
      setGeneratedItems(items);
    } catch (error) {
      console.error('AI generation error:', error);
      setAiError(error instanceof Error ? error.message : 'Failed to generate itinerary');
    } finally {
      setIsGenerating(false);
    }
  };

  const addGeneratedItems = async () => {
    setIsSubmitting(true);
    try {
      for (const item of generatedItems) {
        await addDoc(
          collection(db, 'artifacts', appId, 'public', 'data', 'trips', tripId, 'itinerary'),
          item
        );
      }
      setShowAIModal(false);
      setGeneratedItems([]);
      setAiDestination('');
      setAiInterests([]);
      setAiNotes('');
    } catch (error) {
      console.error('Error adding items:', error);
      setAiError('Failed to add items. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group items by day
  const itemsByDay = items.reduce((acc, item) => {
    if (!acc[item.day]) acc[item.day] = [];
    acc[item.day].push(item);
    return acc;
  }, {} as Record<string, ItineraryItem[]>);

  const sortedDays = Object.keys(itemsByDay).sort();

  const getCategoryIcon = (category?: string) => {
    const cat = CATEGORIES.find(c => c.value === category);
    return cat ? cat.icon : MapPin;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-slate-700">Itinerary</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowAIModal(true)}
            className="flex items-center px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 text-sm font-medium transition-all shadow-sm"
          >
            <Sparkles className="w-4 h-4 mr-1" /> Generate with AI
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4 mr-1" /> Add Item
          </button>
        </div>
      </div>

      {/* Empty State */}
      {items.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
          <MapPin className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p className="text-slate-400 mb-4">No items in your itinerary yet</p>
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
          >
            Add your first item
          </button>
        </div>
      )}

      {/* Itinerary List */}
      {sortedDays.map((day) => (
        <div key={day} className="mb-6">
          <h3 className="text-sm font-semibold text-indigo-600 mb-2 sticky top-0 bg-slate-50 py-2">
            {formatDate(day)}
          </h3>
          <div className="space-y-2">
            {itemsByDay[day].map((item) => {
              const CategoryIcon = item.type === 'flight' ? Plane : getCategoryIcon(item.category);
              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-lg p-4 shadow-sm border border-slate-100 ${
                    item.completed ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <button
                        onClick={() => toggleComplete(item)}
                        className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          item.completed
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-slate-300 hover:border-indigo-400'
                        }`}
                      >
                        {item.completed && <Check className="w-3 h-3" />}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <CategoryIcon className="w-4 h-4 text-indigo-500" />
                          <span className={`font-medium ${item.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                            {item.location}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3 mt-1 text-xs text-slate-500">
                          {item.time && (
                            <span className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" /> {item.time}
                            </span>
                          )}
                          {item.type === 'flight' && item.arrivalLocation && (
                            <span className="flex items-center">
                              → {item.arrivalLocation} {item.arrivalTime && `at ${item.arrivalTime}`}
                            </span>
                          )}
                          {item.type === 'flight' && item.flightNumber && (
                            <span>{item.airline} {item.flightNumber}</span>
                          )}
                        </div>
                        {item.notes && (
                          <p className="text-xs text-slate-500 mt-1">{item.notes}</p>
                        )}
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
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteItem(item)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingItem ? 'Edit Item' : 'Add to Itinerary'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Type Toggle */}
            <div className="flex space-x-2 mb-4">
              <button
                onClick={() => setFormType('activity')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  formType === 'activity'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <MapPin className="w-4 h-4 inline mr-1" /> Activity
              </button>
              <button
                onClick={() => setFormType('flight')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  formType === 'flight'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Plane className="w-4 h-4 inline mr-1" /> Flight
              </button>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Date *</label>
                <input
                  type="date"
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                  value={formDay}
                  onChange={(e) => setFormDay(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">
                  {formType === 'flight' ? 'Departure Time' : 'Time'}
                </label>
                <input
                  type="time"
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                />
              </div>
            </div>

            {/* Location */}
            <div className="mb-3">
              <label className="text-xs text-slate-500 mb-1 block">
                {formType === 'flight' ? 'Departure Airport/City *' : 'Location *'}
              </label>
              <input
                type="text"
                className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                placeholder={formType === 'flight' ? 'e.g., JFK New York' : 'e.g., Eiffel Tower'}
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
              />
            </div>

            {/* Activity-specific fields */}
            {formType === 'activity' && (
              <>
                <div className="mb-3">
                  <label className="text-xs text-slate-500 mb-1 block">Category</label>
                  <select
                    className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
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
                    placeholder="https://maps.google.com/..."
                    value={formGoogleMapsLink}
                    onChange={(e) => setFormGoogleMapsLink(e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Flight-specific fields */}
            {formType === 'flight' && (
              <>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Arrival Airport/City</label>
                    <input
                      type="text"
                      className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                      placeholder="e.g., LAX Los Angeles"
                      value={formArrivalLocation}
                      onChange={(e) => setFormArrivalLocation(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Arrival Time</label>
                    <input
                      type="time"
                      className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                      value={formArrivalTime}
                      onChange={(e) => setFormArrivalTime(e.target.value)}
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
                      value={formAirline}
                      onChange={(e) => setFormAirline(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Flight Number</label>
                    <input
                      type="text"
                      className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                      placeholder="e.g., DL123"
                      value={formFlightNumber}
                      onChange={(e) => setFormFlightNumber(e.target.value)}
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
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                disabled={isSubmitting || !formDay || !formLocation}
              >
                {isSubmitting ? 'Saving...' : editingItem ? 'Save Changes' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Generation Modal */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold">AI Itinerary Generator</h2>
              </div>
              <button
                onClick={() => {
                  setShowAIModal(false);
                  setGeneratedItems([]);
                  setAiError('');
                }}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!generatedItems.length ? (
              <>
                <p className="text-sm text-slate-500 mb-4">
                  Let AI create a personalized itinerary for your trip to help you get started.
                </p>

                {aiError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                    {aiError}
                  </div>
                )}

                {/* Destination */}
                <div className="mb-4">
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    Where are you going? *
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 border border-slate-300 rounded-lg"
                    placeholder="e.g., Paris, France"
                    value={aiDestination}
                    onChange={(e) => setAiDestination(e.target.value)}
                    disabled={isGenerating}
                  />
                </div>

                {/* Trip Dates Info */}
                <div className="mb-4 p-3 bg-slate-50 rounded-lg text-sm">
                  <span className="text-slate-500">Trip dates: </span>
                  <span className="font-medium text-slate-700">
                    {trip.startDate || 'Not set'} → {trip.endDate || 'Not set'}
                  </span>
                </div>

                {/* Interests */}
                <div className="mb-4">
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    What are you interested in?
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {INTERESTS.map((interest) => (
                      <button
                        key={interest}
                        onClick={() => toggleInterest(interest)}
                        disabled={isGenerating}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          aiInterests.includes(interest)
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pace */}
                <div className="mb-4">
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Trip pace
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['relaxed', 'moderate', 'packed'] as const).map((pace) => (
                      <button
                        key={pace}
                        onClick={() => setAiPace(pace)}
                        disabled={isGenerating}
                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                          aiPace === pace
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {pace.charAt(0).toUpperCase() + pace.slice(1)}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {aiPace === 'relaxed' && '2-3 activities per day'}
                    {aiPace === 'moderate' && '3-4 activities per day'}
                    {aiPace === 'packed' && '5-6 activities per day'}
                  </p>
                </div>

                {/* Additional Notes */}
                <div className="mb-4">
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    Anything else to consider?
                  </label>
                  <textarea
                    className="w-full p-2 border border-slate-300 rounded-lg text-sm resize-none"
                    rows={2}
                    placeholder="e.g., traveling with kids, mobility concerns, budget-friendly options..."
                    value={aiNotes}
                    onChange={(e) => setAiNotes(e.target.value)}
                    disabled={isGenerating}
                  />
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerateItinerary}
                  disabled={isGenerating || !aiDestination.trim()}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating your itinerary...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate Itinerary
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                {/* Generated Results */}
                <div className="mb-4">
                  <p className="text-sm text-green-600 font-medium mb-3">
                    ✨ Generated {generatedItems.length} activities for your trip!
                  </p>
                  <div className="max-h-[40vh] overflow-y-auto space-y-2 pr-2">
                    {generatedItems.map((item, index) => (
                      <div key={index} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-800 text-sm">{item.location}</span>
                          <span className="text-xs text-slate-500">{item.time}</span>
                        </div>
                        <div className="text-xs text-indigo-600 mt-1">
                          {formatDate(item.day || '')} • {item.category}
                        </div>
                        {item.notes && (
                          <p className="text-xs text-slate-500 mt-1">{item.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setGeneratedItems([]);
                      setAiError('');
                    }}
                    className="flex-1 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                    disabled={isSubmitting}
                  >
                    Regenerate
                  </button>
                  <button
                    onClick={addGeneratedItems}
                    disabled={isSubmitting}
                    className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Add All to Itinerary
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
