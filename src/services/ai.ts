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
  existingItems?: Array<{
    day: string;
    endDay?: string; // For multi-day lodging (check-out date)
    time: string;
    location: string;
    category?: string;
    type?: string;
    notes?: string;
  }>;
}

export async function generateItinerary(params: GenerateItineraryParams): Promise<Partial<ItineraryItem>[]> {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'application/json',
    },
  });

  const interestsText = params.interests.length > 0 
    ? params.interests.join(', ') 
    : 'general sightseeing and local experiences';

  const paceDescription = {
    relaxed: '2-3 activities per day with plenty of free time',
    moderate: '3-4 activities per day with balanced schedule',
    packed: '5-6 activities per day to maximize the trip'
  }[params.pace];

  // Format existing items for the prompt
  // For lodging with endDay, show the full date range so AI doesn't schedule over hotel stays
  const existingItemsText = params.existingItems && params.existingItems.length > 0
    ? `\n\nEXISTING ITINERARY (DO NOT DUPLICATE - plan around these):
${params.existingItems.map(item => {
  const isMultiDayLodging = item.category === 'lodging' && item.endDay && item.endDay !== item.day;
  const dateRange = isMultiDayLodging 
    ? `${item.day} to ${item.endDay} (HOTEL STAY - guest is staying here during these dates)`
    : `${item.day} at ${item.time || 'TBD'}`;
  return `- ${dateRange}: ${item.location}${item.type === 'flight' ? ' (FLIGHT)' : ''} ${item.category ? `[${item.category}]` : ''}`;
}).join('\n')}`
    : '';

  const prompt = `You are a travel planning assistant. Generate a detailed day-by-day itinerary for a trip.

Trip Details:
- Trip Name: ${params.tripName}
- Destination: ${params.destination}
- Start Date: ${params.startDate}
- End Date: ${params.endDate}
- Traveler Interests: ${interestsText}
- Preferred Pace: ${paceDescription}
${params.additionalNotes ? `- Additional Notes: ${params.additionalNotes}` : ''}${existingItemsText}

Generate a JSON array of itinerary items. Each item MUST have ALL of these fields:
- day: date in YYYY-MM-DD format (between ${params.startDate} and ${params.endDate})
- time: time in HH:MM format (24-hour)
- location: specific name of the place (e.g., "Eiffel Tower", "Le Jules Verne Restaurant")
- notes: brief description or tips (1-2 sentences)
- category: one of "sightseeing", "food", "lodging", "nature", "shopping", "transport", "entertainment"
- lat: latitude coordinate as a number (e.g., 48.8584)
- lng: longitude coordinate as a number (e.g., 2.2945)
- placeDescription: full address or area description (e.g., "Champ de Mars, 5 Avenue Anatole France, 75007 Paris, France")

CRITICAL: You MUST include accurate lat and lng coordinates for each location. These are essential for displaying on a map.

Consider:
- Start times appropriate for the activity type (breakfast around 8-9am, dinner around 7-8pm)
- Logical geographic grouping to minimize travel between activities
- Mix of activities based on interests
- Include local food recommendations at real restaurants
- Add practical tips in notes
- Use real, existing places with accurate coordinates
${params.existingItems && params.existingItems.length > 0 ? `- IMPORTANT: Respect existing itinerary items listed above - do NOT create duplicate or conflicting activities
- Schedule new activities around existing flights, hotels, and reservations
- Leave appropriate time gaps before/after flights for airport transit
- If a meal time is already booked, don't add another meal at the same time` : ''}

CRITICAL FORMATTING RULES:
1. Return ONLY a valid JSON array - no markdown, no explanation, no text before or after
2. Start your response with [ and end with ]
3. Do not wrap in code blocks
4. Ensure all strings are properly escaped

Example of correct format:
[{"day":"2024-01-15","time":"09:00","location":"Eiffel Tower","notes":"Book tickets in advance","category":"sightseeing","lat":48.8584,"lng":2.2945,"placeDescription":"Champ de Mars, Paris"}]`;

  try {
    // Check if API key is configured
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env file.');
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('AI Raw Response:', text); // Debug logging
    
    // Clean up the response
    let jsonText = text.trim();
    
    // Remove BOM and other invisible characters
    jsonText = jsonText.replace(/^\uFEFF/, '');
    
    // Remove markdown code blocks (various formats)
    jsonText = jsonText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    
    // Try to extract JSON array if there's extra text before or after
    const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }
    
    // Fix common JSON issues
    // Remove trailing commas before ] or }
    jsonText = jsonText.replace(/,(\s*[\]}])/g, '$1');
    
    // Fix unescaped newlines in strings (replace with space)
    jsonText = jsonText.replace(/([^\\])(\n)(?=[^"]*"[,\]}])/g, '$1 ');
    
    console.log('Cleaned JSON:', jsonText.substring(0, 500)); // Debug logging
    
    let items: Partial<ItineraryItem>[];
    try {
      items = JSON.parse(jsonText);
      console.log('JSON parsed successfully, items count:', items.length);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Raw text:', text);
      console.error('Cleaned text:', jsonText);
      
      // Try one more time with more aggressive cleaning
      try {
        // Remove all control characters except newlines in the structure
        // eslint-disable-next-line no-control-regex
        const aggressiveCleaned = jsonText.replace(/[\x00-\x1F\x7F]/g, ' ');
        items = JSON.parse(aggressiveCleaned);
        console.log('Parsed with aggressive cleaning, items count:', items.length);
      } catch (e2) {
        console.error('Aggressive cleaning also failed:', e2);
        throw new Error('JSON_PARSE_FAILED: The AI returned invalid JSON.');
      }
    }

    // Validate that items is an array
    if (!Array.isArray(items)) {
      console.error('Items is not an array:', typeof items, items);
      throw new Error('AI_INVALID_FORMAT: Expected an array of items.');
    }

    console.log('Processing', items.length, 'items...');
    
    // Validate and clean items
    const processedItems = items.map((item, index) => {
      console.log(`Processing item ${index}:`, item.location);
      return {
        type: 'activity' as const,
        day: item.day || params.startDate,
        time: item.time || '09:00',
        location: item.location || 'Activity',
        notes: item.notes || '',
        category: item.category || 'sightseeing',
        completed: false,
        // Map coordinates - ensure they're numbers
        lat: typeof item.lat === 'number' ? item.lat : (parseFloat(String(item.lat)) || undefined),
        lng: typeof item.lng === 'number' ? item.lng : (parseFloat(String(item.lng)) || undefined),
        placeDescription: item.placeDescription || ''
      };
    });

    console.log('Successfully processed', processedItems.length, 'items');
    return processedItems;
  } catch (error: unknown) {
    console.error('AI generation error:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      const msg = error.message;
      const msgLower = msg.toLowerCase();
      
      // Handle our custom error markers first
      if (msg.startsWith('JSON_PARSE_FAILED:')) {
        throw new Error('Failed to parse AI response. The AI returned invalid data. Please try again.');
      }
      if (msg.startsWith('AI_INVALID_FORMAT:')) {
        throw new Error('AI returned unexpected format. Please try again.');
      }
      
      if (msgLower.includes('api key not valid') || msgLower.includes('api_key_invalid')) {
        throw new Error('Invalid API key. Please get a new key from Google AI Studio.');
      }
      if (msgLower.includes('quota') || msgLower.includes('resource exhausted') || msgLower.includes('429')) {
        throw new Error('API quota exceeded. Please wait a minute and try again.');
      }
      if (msgLower.includes('blocked') || msgLower.includes('safety')) {
        throw new Error('Content was blocked by safety filters. Please try different inputs.');
      }
      if (msgLower.includes('permission') || msgLower.includes('denied') || msgLower.includes('403')) {
        throw new Error('API access denied. Please enable the Generative Language API in Google Cloud Console.');
      }
      // Pass through custom error messages
      if (msg.includes('configured') || msg.includes('VITE_')) {
        throw error;
      }
      
      // Show actual error for debugging - include full message
      console.error('Full error:', msg);
      throw new Error(`Generation failed: ${msg}`);
    }
    
    throw new Error('Failed to generate itinerary. Please check your API key and try again.');
  }
}
