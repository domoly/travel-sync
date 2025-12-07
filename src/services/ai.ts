import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ItineraryItem } from '../types';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

export interface GenerateItineraryParams {
  tripName: string;
  startDate: string;
  endDate: string;
  destination: string;
  interests: string[];
  pace: 'relaxed' | 'moderate' | 'packed';
  additionalNotes?: string;
}

export async function generateItinerary(params: GenerateItineraryParams): Promise<Partial<ItineraryItem>[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const interestsText = params.interests.length > 0 
    ? params.interests.join(', ') 
    : 'general sightseeing and local experiences';

  const paceDescription = {
    relaxed: '2-3 activities per day with plenty of free time',
    moderate: '3-4 activities per day with balanced schedule',
    packed: '5-6 activities per day to maximize the trip'
  }[params.pace];

  const prompt = `You are a travel planning assistant. Generate a detailed day-by-day itinerary for a trip.

Trip Details:
- Trip Name: ${params.tripName}
- Destination: ${params.destination}
- Start Date: ${params.startDate}
- End Date: ${params.endDate}
- Traveler Interests: ${interestsText}
- Preferred Pace: ${paceDescription}
${params.additionalNotes ? `- Additional Notes: ${params.additionalNotes}` : ''}

Generate a JSON array of itinerary items. Each item should have:
- day: date in YYYY-MM-DD format (between ${params.startDate} and ${params.endDate})
- time: time in HH:MM format (24-hour)
- location: name of the place/activity
- notes: brief description or tips
- category: one of "sightseeing", "food", "lodging", "nature", "shopping", "transport", "entertainment"

Consider:
- Start times appropriate for the activity type (breakfast around 8-9am, dinner around 7-8pm)
- Logical geographic grouping to minimize travel
- Mix of activities based on interests
- Include local food recommendations
- Add practical tips in notes

IMPORTANT: Return ONLY valid JSON array, no markdown, no explanation. Example format:
[{"day":"2024-01-15","time":"09:00","location":"Eiffel Tower","notes":"Book tickets in advance","category":"sightseeing"}]`;

  try {
    // Check if API key is configured
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env file.');
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean up the response - remove any markdown code blocks if present
    let jsonText = text.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
    }
    
    const items: Partial<ItineraryItem>[] = JSON.parse(jsonText);
    
    // Validate and clean items
    return items.map(item => ({
      type: 'activity' as const,
      day: item.day || params.startDate,
      time: item.time || '09:00',
      location: item.location || 'Activity',
      notes: item.notes || '',
      category: item.category || 'sightseeing',
      completed: false
    }));
  } catch (error: unknown) {
    console.error('AI generation error:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      
      if (msg.includes('api key not valid') || msg.includes('api_key_invalid')) {
        throw new Error('Invalid API key. Please get a new key from Google AI Studio.');
      }
      if (msg.includes('quota') || msg.includes('resource exhausted') || msg.includes('429')) {
        throw new Error('API quota exceeded. Please wait a minute and try again.');
      }
      if (msg.includes('blocked') || msg.includes('safety')) {
        throw new Error('Content was blocked by safety filters. Please try different inputs.');
      }
      if (msg.includes('json') || msg.includes('parse')) {
        throw new Error('Failed to parse AI response. Please try again.');
      }
      if (msg.includes('permission') || msg.includes('denied') || msg.includes('403')) {
        throw new Error('API access denied. Please enable the Generative Language API in Google Cloud Console.');
      }
      // Pass through custom error messages
      if (error.message.includes('configured') || error.message.includes('VITE_')) {
        throw error;
      }
      
      // Show actual error for debugging
      throw new Error(`API Error: ${error.message}`);
    }
    
    throw new Error('Failed to generate itinerary. Please check your API key and try again.');
  }
}
