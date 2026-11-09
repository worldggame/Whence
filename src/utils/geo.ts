// Geographic and Chronological Math & Scoring for whence

/**
 * Calculates Haversine distance in kilometers between two coordinates.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Calculates Geography score out of 4,000 points based on distance in kilometers.
 * Under 50km = 4,000 pts (bullseye grace margin for cities/regions).
 * Uses a forgiving exponential curve so regional and continental deductions are much gentler:
 * - 0 - 50 km: 4,000 pts (perfect bullseye)
 * - 250 km (~neighboring region/country): ~3,745 pts
 * - 500 km (~same country): ~3,500 pts
 * - 1,000 km (~neighboring nation): ~3,070 pts
 * - 2,000 km (~continental realm): ~2,360 pts
 * - 3,500 km (~cross-continental): ~1,590 pts
 * - 5,000 km: ~1,070 pts
 * - 8,000 km: ~490 pts
 * - 12,000+ km: 0 pts
 */
export function calculateDistanceScore(distanceKm: number): number {
  if (distanceKm <= 50) return 4000;
  if (distanceKm >= 14000) return 0;

  // Forgiving calibrated exponential decay (tau = 3800 km)
  const score = Math.round(4000 * Math.exp(-(distanceKm - 50) / 3800));
  return Math.max(0, Math.min(4000, score));
}

/**
 * Calculates Chronology score out of 1,000 points.
 * STRICTLY ALL-OR-NOTHING: If the guessed year falls anywhere within the figure's
 * verified lifespan (birthYear <= guessedYear <= deathYear), award 1,000 bonus points.
 * If off even by 1 single year, award 0 points.
 */
export function calculateYearScore(
  guessedYear: number,
  birthYear: number,
  deathYear: number
): { score: number; isWithinLifetime: boolean; diff: number } {
  const isWithinLifetime = guessedYear >= birthYear && guessedYear <= deathYear;

  let diff = 0;
  if (guessedYear < birthYear) {
    diff = birthYear - guessedYear;
  } else if (guessedYear > deathYear) {
    diff = guessedYear - deathYear;
  }

  const score = isWithinLifetime ? 1000 : 0;
  return { score, isWithinLifetime, diff };
}

/**
 * Formats a historical year into standard historical notation (BCE / CE).
 */
export function formatHistoricalYear(year: number): string {
  if (year < 0) {
    return `${Math.abs(year)} BCE`;
  } else if (year === 0) {
    return `1 BCE`;
  } else {
    return `${year} CE`;
  }
}

/**
 * Formats distance with localized thousands separator.
 */
export function formatDistanceKm(km: number): string {
  return `${km.toLocaleString()} km`;
}

export interface ScholarlyRankDef {
  minScore: number;
  maxScore: number;
  title: string;
  subtitle: string;
  badge: string;
  description: string;
}

export const ALL_SCHOLARLY_RANKS: ScholarlyRankDef[] = [
  {
    minScore: 46000,
    maxScore: 50000,
    title: 'Genius',
    subtitle: 'Supreme historical and geographical mastery across space and time.',
    badge: '🧠 Genius',
    description: '46,000 – 50,000 pts · Near-perfect geographical precision and lifetime accuracy across all 10 rounds.',
  },
  {
    minScore: 40000,
    maxScore: 45999,
    title: 'Polymath',
    subtitle: 'Exemplary geographical and chronological knowledge across civilizations.',
    badge: '🏛️ Polymath',
    description: '40,000 – 45,999 pts · Consistently pinpoints regions within a few hundred kilometers and identifies eras.',
  },
  {
    minScore: 32000,
    maxScore: 39999,
    title: 'Cartographer',
    subtitle: 'Solid continental accuracy and sharp chronological recognition.',
    badge: '🧭 Cartographer',
    description: '32,000 – 39,999 pts · Strong intuition for geography, cultural realms, and historical eras.',
  },
  {
    minScore: 24000,
    maxScore: 31999,
    title: 'Scholar',
    subtitle: 'Good historical awareness and continent-level placement.',
    badge: '📜 Scholar',
    description: '24,000 – 31,999 pts · Familiarity with world figures and their general origins.',
  },
  {
    minScore: 15000,
    maxScore: 23999,
    title: 'Novice',
    subtitle: 'Developing familiarity with global historical geography.',
    badge: '🌱 Novice',
    description: '15,000 – 23,999 pts · Beginning to connect historical figures to their places and times.',
  },
  {
    minScore: 0,
    maxScore: 14999,
    title: 'Dunce',
    subtitle: 'Wayward wandering through space and time. Keep exploring!',
    badge: '🧢 Dunce',
    description: '0 – 14,999 pts · Off the map or lost in time. Try again to climb the ladder!',
  },
];

/**
 * Computes scholarly rank based on total score out of 50,000.
 */
export function getScholarlyRank(score: number): ScholarlyRankDef {
  const match = ALL_SCHOLARLY_RANKS.find((r) => score >= r.minScore);
  return match || ALL_SCHOLARLY_RANKS[ALL_SCHOLARLY_RANKS.length - 1];
}
