/**
 * Flight lookup service with airport database and flight API integration
 */

// Major airport database with coordinates
export const AIRPORTS: Record<string, {
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
}> = {
  // United States
  'JFK': { name: 'John F. Kennedy International', city: 'New York', country: 'US', lat: 40.6413, lng: -73.7781 },
  'LAX': { name: 'Los Angeles International', city: 'Los Angeles', country: 'US', lat: 33.9425, lng: -118.4081 },
  'ORD': { name: "O'Hare International", city: 'Chicago', country: 'US', lat: 41.9742, lng: -87.9073 },
  'DFW': { name: 'Dallas/Fort Worth International', city: 'Dallas', country: 'US', lat: 32.8998, lng: -97.0403 },
  'DEN': { name: 'Denver International', city: 'Denver', country: 'US', lat: 39.8561, lng: -104.6737 },
  'ATL': { name: 'Hartsfield-Jackson Atlanta International', city: 'Atlanta', country: 'US', lat: 33.6407, lng: -84.4277 },
  'SFO': { name: 'San Francisco International', city: 'San Francisco', country: 'US', lat: 37.6213, lng: -122.3790 },
  'SEA': { name: 'Seattle-Tacoma International', city: 'Seattle', country: 'US', lat: 47.4502, lng: -122.3088 },
  'MIA': { name: 'Miami International', city: 'Miami', country: 'US', lat: 25.7959, lng: -80.2870 },
  'BOS': { name: 'Boston Logan International', city: 'Boston', country: 'US', lat: 42.3656, lng: -71.0096 },
  'EWR': { name: 'Newark Liberty International', city: 'Newark', country: 'US', lat: 40.6895, lng: -74.1745 },
  'LGA': { name: 'LaGuardia', city: 'New York', country: 'US', lat: 40.7769, lng: -73.8740 },
  'IAD': { name: 'Washington Dulles International', city: 'Washington', country: 'US', lat: 38.9531, lng: -77.4565 },
  'DCA': { name: 'Ronald Reagan Washington National', city: 'Washington', country: 'US', lat: 38.8512, lng: -77.0402 },
  'PHX': { name: 'Phoenix Sky Harbor International', city: 'Phoenix', country: 'US', lat: 33.4373, lng: -112.0078 },
  'IAH': { name: 'George Bush Intercontinental', city: 'Houston', country: 'US', lat: 29.9902, lng: -95.3368 },
  'LAS': { name: 'Harry Reid International', city: 'Las Vegas', country: 'US', lat: 36.0840, lng: -115.1537 },
  'MCO': { name: 'Orlando International', city: 'Orlando', country: 'US', lat: 28.4312, lng: -81.3081 },
  'MSP': { name: 'Minneapolis-St. Paul International', city: 'Minneapolis', country: 'US', lat: 44.8848, lng: -93.2223 },
  'DTW': { name: 'Detroit Metropolitan', city: 'Detroit', country: 'US', lat: 42.2162, lng: -83.3554 },
  'PHL': { name: 'Philadelphia International', city: 'Philadelphia', country: 'US', lat: 39.8744, lng: -75.2424 },
  'CLT': { name: 'Charlotte Douglas International', city: 'Charlotte', country: 'US', lat: 35.2140, lng: -80.9431 },
  'SAN': { name: 'San Diego International', city: 'San Diego', country: 'US', lat: 32.7338, lng: -117.1933 },
  'TPA': { name: 'Tampa International', city: 'Tampa', country: 'US', lat: 27.9756, lng: -82.5333 },
  'PDX': { name: 'Portland International', city: 'Portland', country: 'US', lat: 45.5898, lng: -122.5951 },
  'HNL': { name: 'Daniel K. Inouye International', city: 'Honolulu', country: 'US', lat: 21.3187, lng: -157.9225 },
  
  // Europe
  'LHR': { name: 'Heathrow', city: 'London', country: 'UK', lat: 51.4700, lng: -0.4543 },
  'LGW': { name: 'Gatwick', city: 'London', country: 'UK', lat: 51.1537, lng: -0.1821 },
  'STN': { name: 'Stansted', city: 'London', country: 'UK', lat: 51.8860, lng: 0.2389 },
  'CDG': { name: 'Charles de Gaulle', city: 'Paris', country: 'FR', lat: 49.0097, lng: 2.5479 },
  'ORY': { name: 'Orly', city: 'Paris', country: 'FR', lat: 48.7262, lng: 2.3652 },
  'FRA': { name: 'Frankfurt', city: 'Frankfurt', country: 'DE', lat: 50.0379, lng: 8.5622 },
  'MUC': { name: 'Munich', city: 'Munich', country: 'DE', lat: 48.3537, lng: 11.7750 },
  'AMS': { name: 'Schiphol', city: 'Amsterdam', country: 'NL', lat: 52.3105, lng: 4.7683 },
  'MAD': { name: 'Adolfo Suárez Madrid-Barajas', city: 'Madrid', country: 'ES', lat: 40.4983, lng: -3.5676 },
  'BCN': { name: 'Barcelona-El Prat', city: 'Barcelona', country: 'ES', lat: 41.2974, lng: 2.0833 },
  'FCO': { name: 'Leonardo da Vinci-Fiumicino', city: 'Rome', country: 'IT', lat: 41.8003, lng: 12.2389 },
  'MXP': { name: 'Milan Malpensa', city: 'Milan', country: 'IT', lat: 45.6306, lng: 8.7281 },
  'ZRH': { name: 'Zurich', city: 'Zurich', country: 'CH', lat: 47.4582, lng: 8.5555 },
  'VIE': { name: 'Vienna International', city: 'Vienna', country: 'AT', lat: 48.1103, lng: 16.5697 },
  'CPH': { name: 'Copenhagen', city: 'Copenhagen', country: 'DK', lat: 55.6180, lng: 12.6508 },
  'OSL': { name: 'Oslo Gardermoen', city: 'Oslo', country: 'NO', lat: 60.1976, lng: 11.1004 },
  'ARN': { name: 'Stockholm Arlanda', city: 'Stockholm', country: 'SE', lat: 59.6498, lng: 17.9238 },
  'HEL': { name: 'Helsinki-Vantaa', city: 'Helsinki', country: 'FI', lat: 60.3172, lng: 24.9633 },
  'DUB': { name: 'Dublin', city: 'Dublin', country: 'IE', lat: 53.4264, lng: -6.2499 },
  'LIS': { name: 'Lisbon Portela', city: 'Lisbon', country: 'PT', lat: 38.7813, lng: -9.1359 },
  'ATH': { name: 'Athens International', city: 'Athens', country: 'GR', lat: 37.9364, lng: 23.9445 },
  'IST': { name: 'Istanbul', city: 'Istanbul', country: 'TR', lat: 41.2753, lng: 28.7519 },
  
  // Asia
  'NRT': { name: 'Narita International', city: 'Tokyo', country: 'JP', lat: 35.7720, lng: 140.3929 },
  'HND': { name: 'Haneda', city: 'Tokyo', country: 'JP', lat: 35.5494, lng: 139.7798 },
  'KIX': { name: 'Kansai International', city: 'Osaka', country: 'JP', lat: 34.4347, lng: 135.2441 },
  'ICN': { name: 'Incheon International', city: 'Seoul', country: 'KR', lat: 37.4602, lng: 126.4407 },
  'PEK': { name: 'Beijing Capital International', city: 'Beijing', country: 'CN', lat: 40.0799, lng: 116.6031 },
  'PVG': { name: 'Shanghai Pudong International', city: 'Shanghai', country: 'CN', lat: 31.1443, lng: 121.8083 },
  'HKG': { name: 'Hong Kong International', city: 'Hong Kong', country: 'HK', lat: 22.3080, lng: 113.9185 },
  'SIN': { name: 'Singapore Changi', city: 'Singapore', country: 'SG', lat: 1.3644, lng: 103.9915 },
  'BKK': { name: 'Suvarnabhumi', city: 'Bangkok', country: 'TH', lat: 13.6900, lng: 100.7501 },
  'KUL': { name: 'Kuala Lumpur International', city: 'Kuala Lumpur', country: 'MY', lat: 2.7456, lng: 101.7072 },
  'DEL': { name: 'Indira Gandhi International', city: 'Delhi', country: 'IN', lat: 28.5562, lng: 77.1000 },
  'BOM': { name: 'Chhatrapati Shivaji Maharaj International', city: 'Mumbai', country: 'IN', lat: 19.0896, lng: 72.8656 },
  'DXB': { name: 'Dubai International', city: 'Dubai', country: 'AE', lat: 25.2528, lng: 55.3644 },
  'AUH': { name: 'Abu Dhabi International', city: 'Abu Dhabi', country: 'AE', lat: 24.4331, lng: 54.6511 },
  'DOH': { name: 'Hamad International', city: 'Doha', country: 'QA', lat: 25.2609, lng: 51.6138 },
  'TLV': { name: 'Ben Gurion', city: 'Tel Aviv', country: 'IL', lat: 32.0055, lng: 34.8854 },
  
  // Oceania
  'SYD': { name: 'Sydney Kingsford Smith', city: 'Sydney', country: 'AU', lat: -33.9399, lng: 151.1753 },
  'MEL': { name: 'Melbourne', city: 'Melbourne', country: 'AU', lat: -37.6690, lng: 144.8410 },
  'BNE': { name: 'Brisbane', city: 'Brisbane', country: 'AU', lat: -27.3942, lng: 153.1218 },
  'AKL': { name: 'Auckland', city: 'Auckland', country: 'NZ', lat: -37.0082, lng: 174.7850 },
  
  // Americas (non-US)
  'YYZ': { name: 'Toronto Pearson International', city: 'Toronto', country: 'CA', lat: 43.6777, lng: -79.6248 },
  'YVR': { name: 'Vancouver International', city: 'Vancouver', country: 'CA', lat: 49.1967, lng: -123.1815 },
  'YUL': { name: 'Montréal-Trudeau International', city: 'Montreal', country: 'CA', lat: 45.4706, lng: -73.7408 },
  'MEX': { name: 'Benito Juárez International', city: 'Mexico City', country: 'MX', lat: 19.4363, lng: -99.0721 },
  'CUN': { name: 'Cancún International', city: 'Cancún', country: 'MX', lat: 21.0365, lng: -86.8771 },
  'GRU': { name: 'São Paulo-Guarulhos International', city: 'São Paulo', country: 'BR', lat: -23.4356, lng: -46.4731 },
  'GIG': { name: 'Rio de Janeiro-Galeão International', city: 'Rio de Janeiro', country: 'BR', lat: -22.8099, lng: -43.2506 },
  'EZE': { name: 'Ministro Pistarini International', city: 'Buenos Aires', country: 'AR', lat: -34.8222, lng: -58.5358 },
  'SCL': { name: 'Arturo Merino Benítez International', city: 'Santiago', country: 'CL', lat: -33.3930, lng: -70.7858 },
  'BOG': { name: 'El Dorado International', city: 'Bogotá', country: 'CO', lat: 4.7016, lng: -74.1469 },
  'LIM': { name: 'Jorge Chávez International', city: 'Lima', country: 'PE', lat: -12.0219, lng: -77.1143 },
  
  // Africa
  'JNB': { name: "O.R. Tambo International", city: 'Johannesburg', country: 'ZA', lat: -26.1392, lng: 28.2460 },
  'CPT': { name: 'Cape Town International', city: 'Cape Town', country: 'ZA', lat: -33.9715, lng: 18.6021 },
  'CAI': { name: 'Cairo International', city: 'Cairo', country: 'EG', lat: 30.1219, lng: 31.4056 },
  'CMN': { name: 'Mohammed V International', city: 'Casablanca', country: 'MA', lat: 33.3675, lng: -7.5898 },
  'NBO': { name: 'Jomo Kenyatta International', city: 'Nairobi', country: 'KE', lat: -1.3192, lng: 36.9278 },
};

// Airline codes for validation
export const AIRLINES: Record<string, string> = {
  // US Airlines
  'AA': 'American Airlines',
  'DL': 'Delta Air Lines',
  'UA': 'United Airlines',
  'WN': 'Southwest Airlines',
  'B6': 'JetBlue Airways',
  'AS': 'Alaska Airlines',
  'NK': 'Spirit Airlines',
  'F9': 'Frontier Airlines',
  'G4': 'Allegiant Air',
  'HA': 'Hawaiian Airlines',
  
  // European Airlines
  'BA': 'British Airways',
  'AF': 'Air France',
  'LH': 'Lufthansa',
  'KL': 'KLM Royal Dutch Airlines',
  'IB': 'Iberia',
  'AZ': 'ITA Airways',
  'SK': 'SAS Scandinavian Airlines',
  'LX': 'Swiss International Air Lines',
  'OS': 'Austrian Airlines',
  'AY': 'Finnair',
  'EI': 'Aer Lingus',
  'TP': 'TAP Air Portugal',
  'U2': 'easyJet',
  'FR': 'Ryanair',
  'VY': 'Vueling',
  'TK': 'Turkish Airlines',
  
  // Asian Airlines
  'NH': 'All Nippon Airways',
  'JL': 'Japan Airlines',
  'KE': 'Korean Air',
  'OZ': 'Asiana Airlines',
  'CA': 'Air China',
  'MU': 'China Eastern Airlines',
  'CZ': 'China Southern Airlines',
  'CX': 'Cathay Pacific',
  'SQ': 'Singapore Airlines',
  'TG': 'Thai Airways',
  'MH': 'Malaysia Airlines',
  'AI': 'Air India',
  'EK': 'Emirates',
  'EY': 'Etihad Airways',
  'QR': 'Qatar Airways',
  'LY': 'El Al Israel Airlines',
  
  // Oceania
  'QF': 'Qantas',
  'VA': 'Virgin Australia',
  'NZ': 'Air New Zealand',
  
  // Americas
  'AC': 'Air Canada',
  'WS': 'WestJet',
  'AM': 'Aeroméxico',
  'LA': 'LATAM Airlines',
  'G3': 'Gol Linhas Aéreas',
  'AD': 'Azul Brazilian Airlines',
  'AR': 'Aerolíneas Argentinas',
  'AV': 'Avianca',
  'CM': 'Copa Airlines',
};

export interface FlightInfo {
  airline: string;
  airlineCode: string;
  flightNumber: string;
  departureAirport: string;
  departureAirportCode: string;
  departureCity: string;
  departureLat: number;
  departureLng: number;
  arrivalAirport: string;
  arrivalAirportCode: string;
  arrivalCity: string;
  arrivalLat: number;
  arrivalLng: number;
  departureTime?: string;
  arrivalTime?: string;
  status?: 'scheduled' | 'active' | 'landed' | 'cancelled' | 'diverted';
  validated: boolean;
  validationSource: 'database' | 'api' | 'none';
}

/**
 * Parse airline code from flight number (e.g., "UA123" -> "UA")
 */
export function parseAirlineCode(flightNumber: string): string | null {
  const match = flightNumber.trim().toUpperCase().match(/^([A-Z]{2})\d+/);
  return match ? match[1] : null;
}

/**
 * Parse flight number digits (e.g., "UA123" -> "123")
 */
export function parseFlightDigits(flightNumber: string): string | null {
  const match = flightNumber.trim().toUpperCase().match(/^[A-Z]{2}(\d+)/);
  return match ? match[1] : null;
}

/**
 * Get airline name from code
 */
export function getAirlineName(code: string): string | null {
  return AIRLINES[code.toUpperCase()] || null;
}

/**
 * Find airport by IATA code
 */
export function getAirport(code: string): typeof AIRPORTS[string] | null {
  return AIRPORTS[code.toUpperCase()] || null;
}

/**
 * Search airports by partial match (code, name, or city)
 */
export function searchAirports(query: string): Array<{ code: string } & typeof AIRPORTS[string]> {
  const q = query.toLowerCase().trim();
  if (q.length < 2) return [];
  
  return Object.entries(AIRPORTS)
    .filter(([code, airport]) => 
      code.toLowerCase().includes(q) ||
      airport.name.toLowerCase().includes(q) ||
      airport.city.toLowerCase().includes(q)
    )
    .map(([code, airport]) => ({ code, ...airport }))
    .slice(0, 10);
}

/**
 * Extract airport code from location string
 * Handles formats like: "JFK", "JFK New York", "New York (JFK)", "John F. Kennedy International"
 */
export function extractAirportCode(location: string): string | null {
  if (!location) return null;
  
  const text = location.trim().toUpperCase();
  
  // Direct 3-letter code
  if (/^[A-Z]{3}$/.test(text) && AIRPORTS[text]) {
    return text;
  }
  
  // Code at start: "JFK New York"
  const startMatch = text.match(/^([A-Z]{3})\b/);
  if (startMatch && AIRPORTS[startMatch[1]]) {
    return startMatch[1];
  }
  
  // Code in parentheses: "New York (JFK)"
  const parenMatch = text.match(/\(([A-Z]{3})\)/);
  if (parenMatch && AIRPORTS[parenMatch[1]]) {
    return parenMatch[1];
  }
  
  // Search by city or airport name
  const lowerText = location.toLowerCase();
  for (const [code, airport] of Object.entries(AIRPORTS)) {
    if (airport.city.toLowerCase() === lowerText || 
        airport.name.toLowerCase().includes(lowerText)) {
      return code;
    }
  }
  
  return null;
}

/**
 * Validate and enrich flight information using the database
 */
export function validateFlightFromDatabase(
  flightNumber: string,
  departureLocation: string,
  arrivalLocation: string
): FlightInfo | null {
  const airlineCode = parseAirlineCode(flightNumber);
  const flightDigits = parseFlightDigits(flightNumber);
  
  if (!airlineCode || !flightDigits) {
    return null;
  }
  
  const airline = getAirlineName(airlineCode);
  const departureCode = extractAirportCode(departureLocation);
  const arrivalCode = extractAirportCode(arrivalLocation);
  
  const departureAirport = departureCode ? getAirport(departureCode) : null;
  const arrivalAirport = arrivalCode ? getAirport(arrivalCode) : null;
  
  // Need at least airline and one airport to provide useful info
  if (!airline && !departureAirport && !arrivalAirport) {
    return null;
  }
  
  return {
    airline: airline || airlineCode,
    airlineCode,
    flightNumber: `${airlineCode}${flightDigits}`,
    departureAirport: departureAirport?.name || departureLocation,
    departureAirportCode: departureCode || '',
    departureCity: departureAirport?.city || '',
    departureLat: departureAirport?.lat || 0,
    departureLng: departureAirport?.lng || 0,
    arrivalAirport: arrivalAirport?.name || arrivalLocation,
    arrivalAirportCode: arrivalCode || '',
    arrivalCity: arrivalAirport?.city || '',
    arrivalLat: arrivalAirport?.lat || 0,
    arrivalLng: arrivalAirport?.lng || 0,
    validated: !!(airline && departureAirport && arrivalAirport),
    validationSource: 'database',
  };
}

/**
 * Lookup flight using AeroDataBox API (requires API key)
 * API docs: https://rapidapi.com/aedbx-aedbx/api/aerodatabox
 */
export async function lookupFlightFromAPI(
  flightNumber: string,
  date: string,
  apiKey: string
): Promise<FlightInfo | null> {
  if (!apiKey) return null;
  
  const airlineCode = parseAirlineCode(flightNumber);
  const flightDigits = parseFlightDigits(flightNumber);
  
  if (!airlineCode || !flightDigits) {
    return null;
  }
  
  try {
    const response = await fetch(
      `https://aerodatabox.p.rapidapi.com/flights/number/${airlineCode}${flightDigits}/${date}`,
      {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com',
        },
      }
    );
    
    if (!response.ok) {
      console.error('Flight API error:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      return null;
    }
    
    const flight = data[0];
    const departure = flight.departure || {};
    const arrival = flight.arrival || {};
    
    return {
      airline: flight.airline?.name || AIRLINES[airlineCode] || airlineCode,
      airlineCode,
      flightNumber: `${airlineCode}${flightDigits}`,
      departureAirport: departure.airport?.name || '',
      departureAirportCode: departure.airport?.iata || '',
      departureCity: departure.airport?.municipalityName || '',
      departureLat: departure.airport?.location?.lat || 0,
      departureLng: departure.airport?.location?.lon || 0,
      arrivalAirport: arrival.airport?.name || '',
      arrivalAirportCode: arrival.airport?.iata || '',
      arrivalCity: arrival.airport?.municipalityName || '',
      arrivalLat: arrival.airport?.location?.lat || 0,
      arrivalLng: arrival.airport?.location?.lon || 0,
      departureTime: departure.scheduledTimeLocal?.split(' ')[1]?.substring(0, 5),
      arrivalTime: arrival.scheduledTimeLocal?.split(' ')[1]?.substring(0, 5),
      status: flight.status?.toLowerCase() as FlightInfo['status'],
      validated: true,
      validationSource: 'api',
    };
  } catch (error) {
    console.error('Flight API lookup failed:', error);
    return null;
  }
}

/**
 * Main function to lookup and validate flight information
 * Tries API first (if key provided), falls back to database
 */
export async function lookupFlight(
  flightNumber: string,
  departureLocation: string,
  arrivalLocation: string,
  date: string,
  apiKey?: string
): Promise<FlightInfo | null> {
  // Try API first if key is provided
  if (apiKey) {
    const apiResult = await lookupFlightFromAPI(flightNumber, date, apiKey);
    if (apiResult) {
      return apiResult;
    }
  }
  
  // Fall back to database validation
  return validateFlightFromDatabase(flightNumber, departureLocation, arrivalLocation);
}
