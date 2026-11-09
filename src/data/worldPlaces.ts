// World countries and major historical and modern cities with geographic coordinates for dynamic zoom-based cartographic rendering

export interface WorldPlace {
  name: string;
  lat: number;
  lng: number;
  type: 'country' | 'capital' | 'city';
  country?: string;
  minZoom: number; // Zoom threshold at which this label appears
}

// Major countries and regions with center coordinates
export const WORLD_COUNTRIES: WorldPlace[] = [
  { name: 'Greece', lat: 39.0742, lng: 21.8243, type: 'country', minZoom: 220 },
  { name: 'Italy', lat: 41.8719, lng: 12.5674, type: 'country', minZoom: 220 },
  { name: 'France', lat: 46.2276, lng: 2.2137, type: 'country', minZoom: 220 },
  { name: 'Spain', lat: 40.4637, lng: -3.7492, type: 'country', minZoom: 220 },
  { name: 'United Kingdom', lat: 55.3781, lng: -3.436, type: 'country', minZoom: 220 },
  { name: 'Germany', lat: 51.1657, lng: 10.4515, type: 'country', minZoom: 220 },
  { name: 'Egypt', lat: 26.8206, lng: 30.8025, type: 'country', minZoom: 200 },
  { name: 'Turkey', lat: 38.9637, lng: 35.2433, type: 'country', minZoom: 220 },
  { name: 'Iran (Persia)', lat: 32.4279, lng: 53.688, type: 'country', minZoom: 200 },
  { name: 'Iraq (Mesopotamia)', lat: 33.2232, lng: 43.6793, type: 'country', minZoom: 240 },
  { name: 'China', lat: 35.8617, lng: 104.1954, type: 'country', minZoom: 180 },
  { name: 'India', lat: 20.5937, lng: 78.9629, type: 'country', minZoom: 180 },
  { name: 'Japan', lat: 36.2048, lng: 138.2529, type: 'country', minZoom: 220 },
  { name: 'Morocco', lat: 31.7917, lng: -7.0926, type: 'country', minZoom: 220 },
  { name: 'Algeria', lat: 28.0339, lng: 1.6596, type: 'country', minZoom: 200 },
  { name: 'Switzerland', lat: 46.8182, lng: 8.2275, type: 'country', minZoom: 260 },
  { name: 'Netherlands', lat: 52.1326, lng: 5.2913, type: 'country', minZoom: 280 },
  { name: 'Russia', lat: 61.524, lng: 105.3188, type: 'country', minZoom: 160 },
  { name: 'United States', lat: 37.0902, lng: -95.7129, type: 'country', minZoom: 180 },
  { name: 'Mexico', lat: 23.6345, lng: -102.5528, type: 'country', minZoom: 200 },
  { name: 'Brazil', lat: -14.235, lng: -51.9253, type: 'country', minZoom: 180 },
  { name: 'Argentina', lat: -38.4161, lng: -63.6167, type: 'country', minZoom: 200 },
  { name: 'Australia', lat: -25.2744, lng: 133.7751, type: 'country', minZoom: 180 },
  { name: 'South Africa', lat: -30.5595, lng: 22.9375, type: 'country', minZoom: 200 },
  { name: 'Saudi Arabia', lat: 23.8859, lng: 45.0792, type: 'country', minZoom: 200 },
  { name: 'Czech Republic', lat: 49.8175, lng: 15.473, type: 'country', minZoom: 280 },
  { name: 'Austria', lat: 47.5162, lng: 14.5501, type: 'country', minZoom: 280 },
  { name: 'Poland', lat: 51.9194, lng: 19.1451, type: 'country', minZoom: 240 },
  { name: 'Sweden', lat: 60.1282, lng: 18.6435, type: 'country', minZoom: 220 },
  { name: 'Norway', lat: 60.472, lng: 8.4689, type: 'country', minZoom: 240 },
  { name: 'Uzbekistan', lat: 41.3775, lng: 64.5853, type: 'country', minZoom: 240 },
  { name: 'Afghanistan', lat: 33.9391, lng: 67.71, type: 'country', minZoom: 240 },
];

// Major historical & modern cities, cultural capitals, and birthplaces
export const WORLD_CITIES: WorldPlace[] = [
  // Mediterranean & Classical Antiquity
  { name: 'Alexandria', lat: 31.2001, lng: 29.9187, type: 'city', country: 'Egypt', minZoom: 320 },
  { name: 'Athens', lat: 37.9838, lng: 23.7275, type: 'capital', country: 'Greece', minZoom: 280 },
  { name: 'Rome', lat: 41.9028, lng: 12.4964, type: 'capital', country: 'Italy', minZoom: 280 },
  { name: 'Syracuse', lat: 37.0755, lng: 15.2866, type: 'city', country: 'Italy', minZoom: 400 },
  { name: 'Thessaloniki', lat: 40.6401, lng: 22.9444, type: 'city', country: 'Greece', minZoom: 360 },
  { name: 'Sparta', lat: 37.0733, lng: 22.4297, type: 'city', country: 'Greece', minZoom: 450 },
  { name: 'Carthage / Tunis', lat: 36.8065, lng: 10.1815, type: 'capital', country: 'Tunisia', minZoom: 320 },
  { name: 'Jerusalem', lat: 31.7683, lng: 35.2137, type: 'capital', country: 'Israel', minZoom: 320 },
  { name: 'Constantinople / Istanbul', lat: 41.0082, lng: 28.9784, type: 'city', country: 'Turkey', minZoom: 280 },

  // Western & Central Europe
  { name: 'Paris', lat: 48.8566, lng: 2.3522, type: 'capital', country: 'France', minZoom: 280 },
  { name: 'London', lat: 51.5074, lng: -0.1278, type: 'capital', country: 'UK', minZoom: 280 },
  { name: 'Florence', lat: 43.7696, lng: 11.2558, type: 'city', country: 'Italy', minZoom: 340 },
  { name: 'Geneva', lat: 46.2044, lng: 6.1432, type: 'city', country: 'Switzerland', minZoom: 340 },
  { name: 'Amsterdam', lat: 52.3676, lng: 4.9041, type: 'capital', country: 'Netherlands', minZoom: 300 },
  { name: 'Venice', lat: 45.4408, lng: 12.3155, type: 'city', country: 'Italy', minZoom: 380 },
  { name: 'Madrid', lat: 40.4168, lng: -3.7038, type: 'capital', country: 'Spain', minZoom: 280 },
  { name: 'Berlin', lat: 52.52, lng: 13.405, type: 'capital', country: 'Germany', minZoom: 280 },
  { name: 'Vienna', lat: 48.2082, lng: 16.3738, type: 'capital', country: 'Austria', minZoom: 300 },
  { name: 'Prague', lat: 50.0755, lng: 14.4378, type: 'capital', country: 'Czechia', minZoom: 320 },
  { name: 'Lisbon', lat: 38.7223, lng: -9.1393, type: 'capital', country: 'Portugal', minZoom: 300 },
  { name: 'Dublin', lat: 53.3498, lng: -6.2603, type: 'capital', country: 'Ireland', minZoom: 320 },
  { name: 'Edinburgh', lat: 55.9533, lng: -3.1883, type: 'city', country: 'UK', minZoom: 350 },
  { name: 'Zurich', lat: 47.3769, lng: 8.5417, type: 'city', country: 'Switzerland', minZoom: 380 },
  { name: 'Copenhagen', lat: 55.6761, lng: 12.5683, type: 'capital', country: 'Denmark', minZoom: 320 },
  { name: 'Stockholm', lat: 59.3293, lng: 18.0686, type: 'capital', country: 'Sweden', minZoom: 320 },

  // Middle East & Central Asia
  { name: 'Baghdad', lat: 33.3152, lng: 44.3661, type: 'capital', country: 'Iraq', minZoom: 280 },
  { name: 'Damascus', lat: 33.5138, lng: 36.2765, type: 'capital', country: 'Syria', minZoom: 320 },
  { name: 'Cairo', lat: 30.0444, lng: 31.2357, type: 'capital', country: 'Egypt', minZoom: 280 },
  { name: 'Tehran', lat: 35.6892, lng: 51.389, type: 'capital', country: 'Iran', minZoom: 280 },
  { name: 'Isfahan', lat: 32.6546, lng: 51.668, type: 'city', country: 'Iran', minZoom: 360 },
  { name: 'Samarkand', lat: 39.627, lng: 66.975, type: 'city', country: 'Uzbekistan', minZoom: 340 },
  { name: 'Bukhara', lat: 39.7747, lng: 64.4286, type: 'city', country: 'Uzbekistan', minZoom: 380 },
  { name: 'Balkh', lat: 36.7588, lng: 66.8972, type: 'city', country: 'Afghanistan', minZoom: 400 },
  { name: 'Tangier', lat: 35.7595, lng: -5.834, type: 'city', country: 'Morocco', minZoom: 340 },
  { name: 'Mecca', lat: 21.3891, lng: 39.8579, type: 'city', country: 'Saudi Arabia', minZoom: 340 },

  // Asia & Pacific
  { name: 'Beijing', lat: 39.9042, lng: 116.4074, type: 'capital', country: 'China', minZoom: 240 },
  { name: 'Kyoto', lat: 35.0116, lng: 135.7681, type: 'city', country: 'Japan', minZoom: 320 },
  { name: 'Tokyo', lat: 35.6762, lng: 139.6503, type: 'capital', country: 'Japan', minZoom: 260 },
  { name: 'Qufu', lat: 35.5975, lng: 116.9856, type: 'city', country: 'China', minZoom: 420 },
  { name: 'Xi’an', lat: 34.3416, lng: 108.9398, type: 'city', country: 'China', minZoom: 320 },
  { name: 'Shanghai', lat: 31.2304, lng: 121.4737, type: 'city', country: 'China', minZoom: 280 },
  { name: 'Delhi', lat: 28.6139, lng: 77.209, type: 'capital', country: 'India', minZoom: 260 },
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639, type: 'city', country: 'India', minZoom: 300 },
  { name: 'Mumbai', lat: 19.076, lng: 72.8777, type: 'city', country: 'India', minZoom: 280 },
  { name: 'Varanasi', lat: 25.3176, lng: 82.9739, type: 'city', country: 'India', minZoom: 380 },
  { name: 'Seoul', lat: 37.5665, lng: 126.978, type: 'capital', country: 'South Korea', minZoom: 280 },
  { name: 'Bangkok', lat: 13.7563, lng: 100.5018, type: 'capital', country: 'Thailand', minZoom: 300 },
  { name: 'Singapore', lat: 1.3521, lng: 103.8198, type: 'capital', country: 'Singapore', minZoom: 300 },
  { name: 'Sydney', lat: -33.8688, lng: 151.2093, type: 'city', country: 'Australia', minZoom: 280 },

  // Americas
  { name: 'New York City', lat: 40.7128, lng: -74.006, type: 'city', country: 'USA', minZoom: 260 },
  { name: 'Washington D.C.', lat: 38.9072, lng: -77.0369, type: 'capital', country: 'USA', minZoom: 280 },
  { name: 'Boston', lat: 42.3601, lng: -71.0589, type: 'city', country: 'USA', minZoom: 340 },
  { name: 'Mexico City', lat: 19.4326, lng: -99.1332, type: 'capital', country: 'Mexico', minZoom: 260 },
  { name: 'Havana', lat: 23.1136, lng: -82.3666, type: 'capital', country: 'Cuba', minZoom: 320 },
  { name: 'Bogotá', lat: 4.711, lng: -74.0721, type: 'capital', country: 'Colombia', minZoom: 280 },
  { name: 'Lima', lat: -12.0464, lng: -77.0428, type: 'capital', country: 'Peru', minZoom: 280 },
  { name: 'Buenos Aires', lat: -34.6037, lng: -58.3816, type: 'capital', country: 'Argentina', minZoom: 280 },
  { name: 'Rio de Janeiro', lat: -22.9068, lng: -43.1729, type: 'city', country: 'Brazil', minZoom: 280 },

  // Africa
  { name: 'Algiers', lat: 36.7538, lng: 3.0588, type: 'capital', country: 'Algeria', minZoom: 300 },
  { name: 'Nairobi', lat: -1.2921, lng: 36.8219, type: 'capital', country: 'Kenya', minZoom: 300 },
  { name: 'Cape Town', lat: -33.9249, lng: 18.4241, type: 'city', country: 'South Africa', minZoom: 300 },
  { name: 'Timbuktu', lat: 16.7666, lng: -3.0026, type: 'city', country: 'Mali', minZoom: 380 },
  { name: 'Addis Ababa', lat: 9.03, lng: 38.74, type: 'capital', country: 'Ethiopia', minZoom: 320 },
];
