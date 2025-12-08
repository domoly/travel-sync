import { memo, useState, useCallback, useEffect } from 'react';
import {
  X,
  Sparkles,
  Check,
  Loader2
} from 'lucide-react';
import type { Trip, ItineraryItem } from '../types';
import { generateItinerary, type GenerateItineraryParams } from '../services/ai';

// Available interests for AI generation
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

interface AIGenerationModalProps {
  isOpen: boolean;
  trip: Trip;
  existingItems: ItineraryItem[];
  initialDestination?: string;
  onClose: () => void;
  onAddItems: (items: Partial<ItineraryItem>[]) => Promise<void>;
  formatDate: (dateStr: string) => string;
}

export const AIGenerationModal = memo(function AIGenerationModal({
  isOpen,
  trip,
  existingItems,
  initialDestination = '',
  onClose,
  onAddItems,
  formatDate,
}: AIGenerationModalProps) {
  // AI Generation state
  const [destination, setDestination] = useState(initialDestination);
  const [interests, setInterests] = useState<string[]>([]);
  const [pace, setPace] = useState<'relaxed' | 'moderate' | 'packed'>('moderate');
  const [notes, setNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedItems, setGeneratedItems] = useState<Partial<ItineraryItem>[]>([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync initialDestination prop when modal opens
  useEffect(() => {
    if (isOpen && initialDestination) {
      setDestination(initialDestination);
    }
  }, [isOpen, initialDestination]);

  // Toggle interest selection
  const toggleInterest = useCallback((interest: string) => {
    setInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  }, []);

  // Generate itinerary
  const handleGenerate = useCallback(async () => {
    if (!destination.trim()) {
      setError('Please enter a destination');
      return;
    }
    if (!trip.startDate || !trip.endDate) {
      setError('Trip dates are required. Please set start and end dates.');
      return;
    }

    setError('');
    setIsGenerating(true);
    setGeneratedItems([]);

    try {
      // Include existing items so AI can plan around them
      // Include endDay for multi-day lodging so AI doesn't schedule over hotel stays
      const existingItemsData = existingItems.map(item => ({
        day: item.day,
        endDay: item.endDay, // For multi-day lodging (check-out date)
        time: item.time,
        location: item.location,
        category: item.category,
        type: item.type,
        notes: item.notes
      }));

      const params: GenerateItineraryParams = {
        tripName: trip.name,
        startDate: trip.startDate,
        endDate: trip.endDate,
        destination: destination,
        interests: interests,
        pace: pace,
        additionalNotes: notes,
        existingItems: existingItemsData.length > 0 ? existingItemsData : undefined
      };

      const items = await generateItinerary(params);
      setGeneratedItems(items);
    } catch (err) {
      console.error('AI generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate itinerary');
    } finally {
      setIsGenerating(false);
    }
  }, [destination, trip, interests, pace, notes, existingItems]);

  // Close and reset
  const handleClose = useCallback(() => {
    setDestination('');
    setInterests([]);
    setPace('moderate');
    setNotes('');
    setGeneratedItems([]);
    setError('');
    onClose();
  }, [onClose]);

  // Add generated items to itinerary
  const handleAddItems = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await onAddItems(generatedItems);
      // Close after successful add (handleClose will reset state)
      handleClose();
    } catch (err) {
      console.error('Error adding items:', err);
      setError('Failed to add items. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [generatedItems, onAddItems, handleClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold">AI Itinerary Generator</h2>
          </div>
          <button
            onClick={handleClose}
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

            {existingItems.length > 0 && (
              <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-sm">
                <p className="text-indigo-700 font-medium flex items-center">
                  <Check className="w-4 h-4 mr-2" />
                  {existingItems.length} existing item{existingItems.length !== 1 ? 's' : ''} will be respected
                </p>
                <p className="text-indigo-600 text-xs mt-1">
                  AI will plan around your existing flights, reservations, and activities.
                </p>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                {error}
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
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
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
                      interests.includes(interest)
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
                {(['relaxed', 'moderate', 'packed'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPace(p)}
                    disabled={isGenerating}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      pace === p
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {pace === 'relaxed' && '2-3 activities per day'}
                {pace === 'moderate' && '3-4 activities per day'}
                {pace === 'packed' && '5-6 activities per day'}
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
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isGenerating}
              />
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !destination.trim()}
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

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setGeneratedItems([]);
                  setError('');
                }}
                className="flex-1 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                disabled={isSubmitting}
              >
                Regenerate
              </button>
              <button
                onClick={handleAddItems}
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
  );
});
