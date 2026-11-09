import React, { useState, useEffect } from 'react';
import { HistoricalFigure, RoundSubmission, GameView } from './types/game';
import { DEFAULT_FIGURES, getDailyPack } from './data/figures';
import { calculateHaversineDistance, calculateDistanceScore, calculateYearScore } from './utils/geo';
import { sound } from './utils/audio';
import { AnthropeumMap } from './components/AnthropeumMap';
import { PortraitCard } from './components/PortraitCard';
import { TimelineSlider } from './components/TimelineSlider';
import { RoundResult } from './components/RoundResult';
import { FinalScorecard } from './components/FinalScorecard';
import { CuratorModal } from './components/CuratorModal';
import {
  getEasternDateKey,
  formatEasternDateDisplay,
  formatDateKey,
  resolveGameRosterForDate,
} from './utils/date';
import { WhenceLogo } from './components/WhenceLogo';
import {
  Volume2,
  VolumeX,
  HelpCircle,
  Play,
  Lightbulb,
} from 'lucide-react';

import BUNDLED_SCHEDULES from './data/schedules.json';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export default function App() {
  // Figure library and active daily roster
  const [allFigures, setAllFigures] = useState<HistoricalFigure[]>(() => {
    const saved = localStorage.getItem('whence_custom_figures');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return [...DEFAULT_FIGURES, ...parsed];
      } catch {
        return DEFAULT_FIGURES;
      }
    }
    return DEFAULT_FIGURES;
  });

  // Active date key (YYYY-MM-DD) - synchronized to Eastern Time (America/New_York)
  const [activeDateKey, setActiveDateKey] = useState<string>(() => getEasternDateKey());

  // Server sync status: 'connected' (live backend) | 'static' (GitHub Pages / offline mode) | 'syncing'
  const [serverSyncStatus, setServerSyncStatus] = useState<'connected' | 'static' | 'syncing'>('syncing');

  // Calendar schedules map: merges bundled repository schedules with saved edits
  const [calendarSchedules, setCalendarSchedules] = useState<Record<string, HistoricalFigure[]>>(() => {
    const baseSchedules = (BUNDLED_SCHEDULES as Record<string, HistoricalFigure[]>) || {};
    let localSchedules: Record<string, HistoricalFigure[]> = {};
    const saved = localStorage.getItem('whence_calendar_schedules');
    if (saved) {
      try {
        localSchedules = JSON.parse(saved);
      } catch {
        // Fall back
      }
    }
    const merged = { ...baseSchedules, ...localSchedules };
    const today = getEasternDateKey();
    if (!merged[today] || merged[today].length === 0) {
      merged[today] = getDailyPack(today);
    }
    return merged;
  });

  // Current active roster dynamically computed from activeDateKey
  // If a game hasn't been programmed for this date, it defaults to the previous day's game
  const activeRoster = resolveGameRosterForDate(activeDateKey, calendarSchedules);

  // Game Flow State
  const [view, setView] = useState<GameView>('TITLE');
  const [currentRoundIndex, setCurrentRoundIndex] = useState<number>(0);
  const [submissions, setSubmissions] = useState<RoundSubmission[]>([]);

  // Current Round Guess State
  const [currentPin, setCurrentPin] = useState<{ lat: number; lng: number } | null>(null);
  const [currentYearGuess, setCurrentYearGuess] = useState<number>(1500);

  // 2 Hints Per Day State
  const [hintsRemaining, setHintsRemaining] = useState<number>(2);
  const [revealedClueIds, setRevealedClueIds] = useState<Set<string>>(new Set());

  // Audio mute state
  const [isMuted, setIsMuted] = useState<boolean>(sound.isMuted());

  // Modals state
  const [isCuratorOpen, setIsCuratorOpen] = useState<boolean>(false);
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);

  // Curator console accessed via #admin, ?admin, or /admin in the URL
  useEffect(() => {
    const checkAdminRoute = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      if (
        path === '/admin' ||
        path.endsWith('/admin') ||
        path.endsWith('/admin/') ||
        hash === '#admin' ||
        hash.startsWith('#admin') ||
        search.includes('admin')
      ) {
        setIsCuratorOpen(true);
      }
    };

    checkAdminRoute();
    window.addEventListener('popstate', checkAdminRoute);
    window.addEventListener('hashchange', checkAdminRoute);
    return () => {
      window.removeEventListener('popstate', checkAdminRoute);
      window.removeEventListener('hashchange', checkAdminRoute);
    };
  }, []);

  // Midnight Eastern Time rollover: automatically updates to the next day's prescheduled game at midnight ET
  useEffect(() => {
    const checkEasternRollover = () => {
      const todayEastern = getEasternDateKey();
      // If we are not currently curating a specific date in Curator Modal, track today's Eastern date
      if (!isCuratorOpen) {
        setActiveDateKey((prevKey) => {
          if (prevKey !== todayEastern) {
            // New day in Eastern Time arrived! Refresh schedules from server to get freshly pre-scheduled figures
            fetch('/api/schedules')
              .then((res) => (res.ok ? res.json() : null))
              .then((data) => {
                if (data && data.schedules) {
                  setCalendarSchedules((schedules) => {
                    const merged = { ...schedules, ...data.schedules };
                    localStorage.setItem('whence_calendar_schedules', JSON.stringify(merged));
                    return merged;
                  });
                }
              })
              .catch(() => {});
            return todayEastern;
          }
          return prevKey;
        });
      }
    };

    checkEasternRollover();
    const interval = setInterval(checkEasternRollover, 5000);
    return () => clearInterval(interval);
  }, [isCuratorOpen]);

  const handleCloseCurator = () => {
    setIsCuratorOpen(false);
    if (window.location.hash.toLowerCase().includes('admin')) {
      window.history.pushState({}, '', window.location.pathname + window.location.search);
    } else if (window.location.search.toLowerCase().includes('admin')) {
      window.history.pushState({}, '', window.location.pathname);
    } else if (window.location.pathname.toLowerCase().includes('/admin')) {
      const cleanPath = window.location.pathname.replace(/\/admin\/?$/i, '') || '/';
      window.history.pushState({}, '', cleanPath);
    }
  };

  // Fetch server-side calendar schedules on initial load
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/schedules`)
      .then((res) => {
        if (res.ok) {
          setServerSyncStatus('connected');
          return res.json();
        }
        setServerSyncStatus('static');
        return null;
      })
      .then((data) => {
        if (data && data.schedules) {
          setCalendarSchedules((prev) => {
            const merged = { ...prev, ...data.schedules };
            localStorage.setItem('whence_calendar_schedules', JSON.stringify(merged));
            return merged;
          });
        }
      })
      .catch((err) => {
        console.info('Running in Static Repository / Offline mode:', err);
        setServerSyncStatus('static');
      });

    fetch(`${API_BASE_URL}/api/custom-figures`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.customFigures && Array.isArray(data.customFigures)) {
          setAllFigures((prev) => {
            const idSet = new Set(prev.map((f) => f.id));
            const fresh = data.customFigures.filter((f: HistoricalFigure) => !idSet.has(f.id));
            return [...fresh, ...prev];
          });
        }
      })
      .catch(() => {});
  }, []);

  // Update roster for a specific calendar date (pre-making games) & save server-side
  const handleUpdateRosterForDate = (dateKey: string, newRoster: HistoricalFigure[]) => {
    // 1. Optimistic local update
    setCalendarSchedules((prev) => {
      const updated = { ...prev, [dateKey]: newRoster };
      localStorage.setItem('whence_calendar_schedules', JSON.stringify(updated));
      return updated;
    });

    // 2. Persist to server API if server backend is available
    fetch(`${API_BASE_URL}/api/schedules/${dateKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roster: newRoster, passcode: 'curator2026' }),
    })
      .then((res) => {
        if (res.ok) {
          setServerSyncStatus('connected');
        } else {
          setServerSyncStatus('static');
        }
      })
      .catch((err) => {
        console.warn('Backend server not reachable (changes saved locally in browser):', err);
        setServerSyncStatus('static');
      });
  };

  // Add or update custom figure & save server-side
  const handleAddCustomFigure = (fig: HistoricalFigure) => {
    setAllFigures((prev) => {
      const idx = prev.findIndex((f) => f.id === fig.id);
      const updated = idx >= 0 ? prev.map((f) => (f.id === fig.id ? fig : f)) : [fig, ...prev];
      const customOnly = updated.filter((f) => f.id.startsWith('custom_') || f.id.startsWith('curated_'));
      localStorage.setItem('whence_custom_figures', JSON.stringify(customOnly));
      return updated;
    });

    // Save to server if available
    fetch(`${API_BASE_URL}/api/custom-figures`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ figure: fig, passcode: 'curator2026' }),
    }).catch(() => {});
  };

  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  // Start new game
  const handleStartGame = () => {
    if (!isCuratorOpen) {
      const todayEastern = getEasternDateKey();
      if (activeDateKey !== todayEastern) {
        setActiveDateKey(todayEastern);
      }
    }
    setCurrentRoundIndex(0);
    setSubmissions([]);
    setCurrentPin(null);
    setCurrentYearGuess(1500);
    setHintsRemaining(2);
    setRevealedClueIds(new Set());
    setView('PLAYING');
  };

  // Current active figure with fail-safe fallback
  const currentFigure = activeRoster[currentRoundIndex] || activeRoster[0] || DEFAULT_FIGURES[0];

  // Use a hint for the current figure
  const handleUseHint = () => {
    if (!currentFigure || hintsRemaining <= 0 || revealedClueIds.has(currentFigure.id)) return;
    setHintsRemaining((prev) => prev - 1);
    setRevealedClueIds((prev) => new Set(prev).add(currentFigure.id));
    sound.playTick();
  };

  // Submit guess for current round
  const handleSubmitRound = () => {
    if (!currentPin) return;

    // 1. Calculate Geography Distance & Score (out of 4,000)
    const distanceKm = calculateHaversineDistance(
      currentPin.lat,
      currentPin.lng,
      currentFigure.latitude,
      currentFigure.longitude
    );
    const distanceScore = calculateDistanceScore(distanceKm);

    // 2. Calculate Chronology Score (out of 1,000 - STRICTLY ALL OR NOTHING)
    const { score: yearScore, isWithinLifetime } = calculateYearScore(
      currentYearGuess,
      currentFigure.birthYear,
      currentFigure.deathYear
    );

    const totalRoundScore = distanceScore + yearScore;

    const submission: RoundSubmission = {
      figureId: currentFigure.id,
      guessedLat: currentPin.lat,
      guessedLng: currentPin.lng,
      distanceKm,
      distanceScore,
      guessedYear: currentYearGuess,
      isWithinLifetime,
      yearScore,
      totalRoundScore,
    };

    setSubmissions((prev) => [...prev, submission]);
    sound.playReveal();
    if (yearScore > 0 && distanceScore > 3000) {
      setTimeout(() => sound.playSuccess(), 400);
    }
    setView('REVEAL');
  };

  // Next round or summary
  const handleNextRound = () => {
    if (currentRoundIndex + 1 < activeRoster.length) {
      setCurrentRoundIndex((prev) => prev + 1);
      setCurrentPin(null);
      setCurrentYearGuess(1500);
      setView('PLAYING');
    } else {
      setView('SUMMARY');
    }
  };

  const cumulativeScore = submissions.reduce((acc, s) => acc + s.totalRoundScore, 0);
  const currentSubmission = submissions[submissions.length - 1];

  // Max possible points earned so far from completed rounds
  const maxPossiblePoints = submissions.length * 5000;

  return (
    <div className="fixed inset-0 w-full h-full h-[100dvh] max-h-[100dvh] overflow-hidden bg-[#070b14] text-slate-100 flex flex-col select-none overscroll-none">
      {/* Sleek Minimalist Top Navigation Bar (No Curator Link) */}
      <header className="h-11 px-4 lg:px-6 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md flex items-center justify-between gap-4 shrink-0 z-30">
        {/* Zone 1: Simple Refined Logo */}
        <button
          onClick={() => setView('TITLE')}
          className="hover:opacity-90 transition-opacity"
        >
          <WhenceLogo size="sm" />
        </button>

        {/* Zone 2: Status & Points Display (e.g. 2315/5000) */}
        {view === 'PLAYING' || view === 'REVEAL' ? (
          <div className="flex items-center gap-2.5 text-xs font-mono">
            <span className="text-slate-400">
              Round <strong className="text-white">{currentRoundIndex + 1}</strong>/10
            </span>
            <span className="text-slate-700">·</span>
            <span className="text-amber-400 font-bold tabular-nums">
              {cumulativeScore.toLocaleString()} / {maxPossiblePoints.toLocaleString()} pts
            </span>
            <span className="text-slate-700 hidden sm:inline">·</span>
            <span className="text-slate-400 hidden sm:flex items-center gap-1 font-sans text-[11px]">
              <Lightbulb className="w-3 h-3 text-amber-400" />
              Hints: <strong className="text-white font-mono">{hintsRemaining}</strong>/2
            </span>
          </div>
        ) : null}

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsRulesOpen(true)}
            title="Rules"
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            onClick={handleToggleMute}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {view === 'TITLE' && (
            <button
              onClick={handleStartGame}
              className="px-3.5 py-1 text-xs font-bold text-slate-950 bg-amber-500 rounded-lg hover:bg-amber-400 transition-all shadow-md whitespace-nowrap"
            >
              Start Game
            </button>
          )}
        </div>
      </header>

      {/* Main Fullscreen Viewport */}
      <main className="flex-1 relative w-full h-full min-h-0 overflow-hidden flex flex-col">
        {/* VIEW 1: TITLE SCREEN */}
        {view === 'TITLE' && (
          <div className="flex-1 w-full min-h-0 flex flex-col items-center justify-center text-center max-w-lg mx-auto p-4 overflow-y-auto no-scrollbar animate-in fade-in duration-300">
            <div className="mb-2 sm:mb-3 flex items-center justify-center">
              <WhenceLogo size="lg" />
            </div>

            {/* Tagline */}
            <p className="text-base sm:text-lg text-slate-200 font-medium leading-relaxed">
              guess whence the people in the pictures
            </p>

            {/* Today's Day & Midnight Eastern Reset Notice */}
            <div className="mt-2 sm:mt-3 text-center">
              <p className="text-sm text-slate-300 font-medium">
                Today is {formatEasternDateDisplay()}.
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Resets daily at midnight Eastern Time.
              </p>
            </div>

            {/* Simple Instructions on How to Play */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 sm:p-5 max-w-md w-full my-3 sm:my-6 text-left space-y-2.5 sm:space-y-3">
              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <div className="text-xs font-bold text-white">Place of Birth</div>
                  <div className="text-[11px] text-slate-400 leading-relaxed">
                    Drop a pin on the map where they were born. Closer guesses earn up to 4,000 points.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <div className="text-xs font-bold text-white">Lifetime Era</div>
                  <div className="text-[11px] text-slate-400 leading-relaxed">
                    Guess a year they were alive. If you are within their lifetime, you earn 1,000 bonus points.
                  </div>
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between font-mono">
                <span>10 rounds per game</span>
                <span>·</span>
                <span>2 hints total per day</span>
              </div>
            </div>

            {/* Start Button */}
            <div>
              <button
                onClick={handleStartGame}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start Game</span>
              </button>
            </div>

            {/* Bottom Right Corner: Inspired by Anthropeum */}
            <div className="sm:absolute sm:bottom-3 sm:right-4 mt-3 sm:mt-0 text-[11px] text-slate-500 font-sans z-20 pointer-events-auto">
              Inspired by{' '}
              <a
                href="https://anthropeum.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-amber-400 underline underline-offset-2 transition-colors"
              >
                Anthropeum
              </a>
            </div>
          </div>
        )}

        {/* VIEW 2 & 3: FULLSCREEN MAP GAMEPLAY */}
        {(view === 'PLAYING' || view === 'REVEAL') && (
          <div className="absolute inset-0 w-full h-full overflow-hidden">
            {/* Full-Bleed Map Canvas */}
            <AnthropeumMap
              pin={currentPin}
              onPinChange={view === 'PLAYING' ? setCurrentPin : undefined}
              targetPin={
                view === 'REVEAL'
                  ? {
                      lat: currentFigure.latitude,
                      lng: currentFigure.longitude,
                      name: `${currentFigure.birthPlace}, ${currentFigure.birthCountry}`,
                    }
                  : null
              }
              isRevealMode={view === 'REVEAL'}
              interactive={view === 'PLAYING'}
            />

            {/* Floating Top-Left Portrait HUD (Active during guessing) */}
            {view === 'PLAYING' && (
              <div className="absolute top-2.5 sm:top-4 left-2.5 sm:left-4 z-20 max-w-[calc(100vw-5rem)] sm:max-w-[320px]">
                <PortraitCard
                  figure={currentFigure}
                  isRevealMode={false}
                  hintsRemaining={hintsRemaining}
                  isClueRevealed={revealedClueIds.has(currentFigure.id)}
                  onUseHint={handleUseHint}
                />
              </div>
            )}

            {/* Floating Bottom HUD: Responsive Mobile & Desktop Timeline Slider */}
            {view === 'PLAYING' && (
              <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 right-2 sm:right-4 z-20 flex justify-center pointer-events-none pb-[env(safe-area-inset-bottom)]">
                <div className="w-full max-w-3xl pointer-events-auto">
                  <TimelineSlider
                    year={currentYearGuess}
                    onChange={setCurrentYearGuess}
                    onSubmit={handleSubmitRound}
                    canSubmit={!!currentPin}
                  />
                </div>
              </div>
            )}

            {/* REVEAL OVERLAY CARD */}
            {view === 'REVEAL' && currentSubmission && (
              <RoundResult
                figure={currentFigure}
                submission={currentSubmission}
                roundNumber={currentRoundIndex + 1}
                totalRounds={activeRoster.length}
                cumulativeScore={cumulativeScore}
                onNextRound={handleNextRound}
              />
            )}
          </div>
        )}

        {/* VIEW 4: FINAL SCORECARD (Strictly No-Scroll Fullscreen Fit) */}
        {view === 'SUMMARY' && (
          <div className="flex-1 w-full h-full min-h-0 overflow-hidden p-3 sm:p-5 flex items-center justify-center">
            <FinalScorecard
              figures={activeRoster}
              submissions={submissions}
              totalScore={cumulativeScore}
              onPlayAgain={handleStartGame}
            />
          </div>
        )}
      </main>

      {/* Curator Administration Drawer Modal (Accessible via /admin in URL or Curator button) */}
      <CuratorModal
        isOpen={isCuratorOpen}
        onClose={handleCloseCurator}
        currentDateKey={activeDateKey}
        onSelectDate={setActiveDateKey}
        calendarSchedules={calendarSchedules}
        onUpdateRosterForDate={handleUpdateRosterForDate}
        onAddCustomFigure={handleAddCustomFigure}
        serverSyncStatus={serverSyncStatus}
      />

      {/* Rules Modal */}
      {isRulesOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <span>How to Play</span>
              </h3>
              <button
                onClick={() => setIsRulesOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300 leading-relaxed font-sans">
              <p className="text-slate-200 font-medium">
                guess whence the people in the pictures
              </p>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <div className="font-semibold text-sky-400">1. Place of Birth (Max 4,000 pts)</div>
                <p className="text-slate-400 text-[11px]">
                  Drop a pin on the map where they were born (drag to adjust). Within 50 km awards 4,000 points, with a forgiving curve for regional proximity.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <div className="font-semibold text-amber-400">2. Lifetime Era (1,000 pts)</div>
                <p className="text-slate-400 text-[11px]">
                  Guess any year during their lifetime for +1,000 pts.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <div className="font-semibold text-emerald-400">3. Clues (2 Hints Total)</div>
                <p className="text-slate-400 text-[11px]">
                  You have 2 hints for the entire 10-round game.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setIsRulesOpen(false)}
                className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
