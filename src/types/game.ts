export type FigureCategory = 'philosophy' | 'literature' | 'science' | 'politics' | 'art' | 'other';

export type PortraitMedium = 'oil_painting' | 'sculpture' | 'engraving' | 'photograph' | 'manuscript';

export interface HistoricalFigure {
  id: string;
  name: string;
  category: FigureCategory;
  medium: PortraitMedium;
  portraitUrl: string;
  portraitFallbackSvg?: string; // High-contrast stylized silhouette fallback
  birthPlace: string;
  birthCountry: string;
  latitude: number;
  longitude: number;
  birthYear: number; // Negative for BCE (e.g. -384 for 384 BCE)
  deathYear: number;
  shortBio: string;
  famousQuoteOrWork: string;
  clue?: string; // Optional subtle clue that hints at thought domain without giving away identity
}

export interface RoundSubmission {
  figureId: string;
  guessedLat: number;
  guessedLng: number;
  distanceKm: number;
  distanceScore: number; // 0 to 4000
  guessedYear: number;
  isWithinLifetime: boolean;
  yearScore: number;     // 1000 (all) or 0 (nothing)
  totalRoundScore: number; // 0 to 5000
}

export type GameView = 'TITLE' | 'PLAYING' | 'REVEAL' | 'SUMMARY';

export interface CuratorPack {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  figureIds: string[]; // Exactly 10 figure IDs
}
