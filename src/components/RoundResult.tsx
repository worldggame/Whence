import React, { useState } from 'react';
import { HistoricalFigure, RoundSubmission } from '../types/game';
import { formatHistoricalYear, formatDistanceKm } from '../utils/geo';
import { MapPin, Clock, ArrowRight, CheckCircle2, XCircle, Eye, EyeOff, Sparkles } from 'lucide-react';

interface RoundResultProps {
  figure: HistoricalFigure;
  submission: RoundSubmission;
  roundNumber: number;
  totalRounds: number;
  cumulativeScore: number;
  onNextRound: () => void;
}

export const RoundResult: React.FC<RoundResultProps> = ({
  figure,
  submission,
  roundNumber,
  totalRounds,
  cumulativeScore,
  onNextRound,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const isLastRound = roundNumber === totalRounds;

  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-end md:justify-start md:items-start p-3 md:p-5 overflow-hidden">
      {/* Minimized Pill Button to restore if user minimized */}
      {isMinimized ? (
        <button
          onClick={() => setIsMinimized(false)}
          className="pointer-events-auto mt-2 md:mt-0 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700 shadow-2xl backdrop-blur-md transition-all hover:scale-105 active:scale-95 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold">
            Round {roundNumber} Score: <strong className="text-amber-400 font-mono">+{submission.totalRoundScore.toLocaleString()}</strong>
          </span>
          <Eye className="w-3.5 h-3.5 text-slate-400 ml-1" />
        </button>
      ) : (
        /* Floating Side Card - position left/top so map and arc remain completely clear and interactive */
        <div className="pointer-events-auto w-full md:w-[390px] lg:w-[420px] max-w-full bg-slate-900/95 border border-slate-700/80 rounded-2xl p-4 shadow-2xl backdrop-blur-md max-h-[85vh] flex flex-col overflow-y-auto animate-in fade-in slide-in-from-bottom-3 md:slide-in-from-left-3 duration-200">
          {/* Header with Unveiled Identity & Minimize Toggle */}
          <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-wider text-amber-400 font-mono font-semibold">
                  Round {roundNumber} of {totalRounds} · Result
                </span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-wide mt-0.5">
                {figure.name}
              </h2>
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                <span>{figure.birthPlace}, {figure.birthCountry}</span>
                <span>·</span>
                <span className="font-mono">
                  {formatHistoricalYear(figure.birthYear)} – {formatHistoricalYear(figure.deathYear)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Round Total Score Badge */}
              <div className="flex flex-col items-end bg-slate-950/80 border border-slate-700/60 rounded-lg px-2.5 py-1 shadow-inner">
                <span className="text-sm font-mono font-bold text-amber-400 tabular-nums">
                  +{submission.totalRoundScore.toLocaleString()}
                </span>
                <span className="text-[8px] text-slate-500 font-mono">/ 5,000 pts</span>
              </div>

              {/* Minimize/Hide Button to freely view map */}
              <button
                onClick={() => setIsMinimized(true)}
                title="Minimize card to inspect map"
                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <EyeOff className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        {/* Score Breakdown Cards */}
        <div className="flex flex-col gap-2.5 my-3">
          {/* 1. Geography Metric */}
          <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                Place of Birth
              </span>
              <span className="text-xs font-mono font-bold text-sky-300 tabular-nums">
                +{submission.distanceScore.toLocaleString()} <span className="text-slate-500 font-normal">/ 4,000</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800/60">
              <div className="flex flex-col">
                <span className="text-slate-500 text-[10px]">Actual</span>
                <span className="text-slate-200 font-medium truncate" title={`${figure.birthPlace}, ${figure.birthCountry}`}>
                  {figure.birthPlace}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-slate-500 text-[10px]">Distance</span>
                <span className="text-amber-300 font-mono font-semibold tabular-nums">
                  {formatDistanceKm(submission.distanceKm)}
                </span>
              </div>
            </div>

            <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-sky-400 h-full rounded-full transition-all duration-700"
                style={{ width: `${(submission.distanceScore / 4000) * 100}%` }}
              />
            </div>
          </div>

          {/* 2. Chronology Metric */}
          <div className={`border rounded-xl p-3 flex flex-col gap-2 ${
            submission.isWithinLifetime
              ? 'bg-emerald-950/25 border-emerald-500/40'
              : 'bg-rose-950/15 border-rose-500/30'
          }`}>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                Era Bonus
              </span>
              <span className={`text-xs font-mono font-bold tabular-nums ${
                submission.isWithinLifetime ? 'text-emerald-400' : 'text-slate-400'
              }`}>
                +{submission.yearScore.toLocaleString()} <span className="text-slate-500 font-normal">/ 1,000</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800/60">
              <div className="flex flex-col">
                <span className="text-slate-500 text-[10px]">Lifespan</span>
                <span className="text-slate-200 font-mono font-medium truncate">
                  {formatHistoricalYear(figure.birthYear)} – {formatHistoricalYear(figure.deathYear)}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-slate-500 text-[10px]">Your Guess</span>
                <span className="text-slate-200 font-mono font-semibold tabular-nums">
                  {formatHistoricalYear(submission.guessedYear)}
                </span>
              </div>
            </div>

            <div className="pt-0.5">
              {submission.isWithinLifetime ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 text-[11px] font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                  Within lifetime (+1,000 pts)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-300 text-[11px] font-medium">
                  <XCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                  Outside lifetime (0 pts)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Biographical Legacy */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 mb-3">
          <p className="text-xs text-slate-300 leading-relaxed font-sans line-clamp-4">
            {figure.shortBio}
          </p>
        </div>

          {/* Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
            <div className="text-xs text-slate-400 font-mono">
              Cumulative: <strong className="text-white text-sm">{cumulativeScore.toLocaleString()}</strong> pts
            </div>

            <button
              onClick={onNextRound}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>{isLastRound ? 'See Final Score' : 'Next Figure'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
