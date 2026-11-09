import React, { useEffect } from 'react';
import { HistoricalFigure, RoundSubmission } from '../types/game';
import { getScholarlyRank, ALL_SCHOLARLY_RANKS, formatHistoricalYear, formatDistanceKm } from '../utils/geo';
import confetti from 'canvas-confetti';
import { Share2, RotateCcw, CheckCircle2, XCircle, Info, ChevronRight, X } from 'lucide-react';

interface FinalScorecardProps {
  figures: HistoricalFigure[];
  submissions: RoundSubmission[];
  totalScore: number;
  onPlayAgain: () => void;
  onOpenCurator?: () => void;
}

export const FinalScorecard: React.FC<FinalScorecardProps> = ({
  figures,
  submissions,
  totalScore,
  onPlayAgain,
}) => {
  const rank = getScholarlyRank(totalScore);
  const [copied, setCopied] = React.useState(false);
  const [isLadderOpen, setIsLadderOpen] = React.useState(false);

  // Trigger celebration confetti
  useEffect(() => {
    if (totalScore >= 25000) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#38bdf8', '#10b981', '#f8fafc'],
        });
      } catch {
        // Ignore
      }
    }
  }, [totalScore]);

  // Helper to determine the circle emoji for each round
  const getRoundCircle = (sub: RoundSubmission): string => {
    // Perfect score on a round (5,000 points) awards a blue circle
    if (sub.totalRoundScore >= 5000) return '🔵';
    if (sub.totalRoundScore >= 4000) return '🟢';
    if (sub.totalRoundScore >= 2500) return '🟡';
    return '🔴';
  };

  // Share result to clipboard
  const handleShare = () => {
    const circles = submissions.map(getRoundCircle).join('');

    const lines = [
      `whence`,
      circles,
      ``,
      `Score: ${totalScore.toLocaleString()} / 50,000`,
      `Rank: ${rank.title} ${rank.badge}`,
      ``,
      `https://worldggame.github.io/whence/`,
    ];

    const textToCopy = lines.join('\n');

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }).catch(() => {
        fallbackCopy(textToCopy);
      });
    } else {
      fallbackCopy(textToCopy);
    }
  };

  const fallbackCopy = (text: string) => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Ignore
    }
  };

  return (
    <div className="w-full max-w-4xl h-full max-h-[calc(100dvh-3.5rem)] flex flex-col justify-between bg-slate-900/95 border border-slate-700/80 rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-2xl backdrop-blur-md overflow-hidden animate-in fade-in duration-300 select-none relative">
      {/* 1. Header & Score Row */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-800 shrink-0">
        <div>
          <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-amber-400">
            Game Complete
          </span>

          <div className="flex items-center gap-2 mt-0.5">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide leading-tight">
              {rank.title}
            </h1>
            <button
              onClick={() => setIsLadderOpen(true)}
              title="Compare all ranks"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] text-amber-400 hover:text-amber-300 font-mono transition-colors"
            >
              <span>{rank.badge}</span>
              <Info className="w-3 h-3 text-slate-400" />
            </button>
          </div>

          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
            {rank.subtitle}
          </p>
        </div>

        {/* Big Score Pill */}
        <div className="flex flex-col items-end bg-slate-950/90 border border-amber-500/30 rounded-xl px-4 py-1.5 shrink-0 shadow-inner">
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-medium">Final Score</span>
          <span className="text-2xl sm:text-3xl font-mono font-bold text-amber-400 tabular-nums leading-none mt-0.5">
            {totalScore.toLocaleString()}
          </span>
          <span className="text-[9px] text-slate-500 font-mono mt-0.5">out of 50,000 pts</span>
        </div>
      </div>

      {/* 2. Results Table: Clean, Fitted, Zero Page Scroll */}
      <div className="flex-1 min-h-0 flex flex-col my-2 overflow-hidden">
        <div className="flex items-center justify-between pb-1.5 shrink-0">
          <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold font-mono">
            Results
          </h3>
          <span className="text-[11px] text-slate-500 font-mono">10 Figures</span>
        </div>

        <div className="flex-1 min-h-0 overflow-auto rounded-xl border border-slate-800 bg-slate-950/70">
          <table className="w-full min-w-[560px] sm:min-w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 font-medium border-b border-slate-800 sticky top-0 z-10 backdrop-blur-xs">
              <tr>
                <th className="py-1.5 px-3 w-8">#</th>
                <th className="py-1.5 px-3">Figure & Lifespan</th>
                <th className="py-1.5 px-3">Birthplace</th>
                <th className="py-1.5 px-3">Distance & Points</th>
                <th className="py-1.5 px-3">Year Guess</th>
                <th className="py-1.5 px-3 text-right">Round Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {submissions.map((sub, idx) => {
                const fig = figures.find((f) => f.id === sub.figureId);
                if (!fig) return null;

                return (
                  <tr key={fig.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-1.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        <span>{idx + 1}</span>
                        <span className="text-[11px]">{getRoundCircle(sub)}</span>
                      </span>
                    </td>
                    <td className="py-1.5 px-3">
                      <div className="font-bold text-slate-100 truncate max-w-[160px] sm:max-w-[200px]">{fig.name}</div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {formatHistoricalYear(fig.birthYear)} – {formatHistoricalYear(fig.deathYear)}
                      </div>
                    </td>
                    <td className="py-1.5 px-3 text-slate-300 truncate max-w-[120px] sm:max-w-[160px]">
                      {fig.birthPlace}
                    </td>
                    <td className="py-1.5 px-3 font-mono">
                      <div className="text-amber-300 font-medium leading-none">{formatDistanceKm(sub.distanceKm)}</div>
                      <div className="text-[10px] text-slate-400 leading-none mt-0.5">+{sub.distanceScore.toLocaleString()} pts</div>
                    </td>
                    <td className="py-1.5 px-3 font-mono">
                      <div className="flex items-center gap-1 leading-none">
                        {sub.isWithinLifetime ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-3 h-3 text-rose-400 shrink-0" />
                        )}
                        <span className={sub.isWithinLifetime ? 'text-emerald-300 font-semibold text-[11px]' : 'text-slate-300 text-[11px]'}>
                          {formatHistoricalYear(sub.guessedYear)}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 leading-none mt-0.5">+{sub.yearScore.toLocaleString()} pts</div>
                    </td>
                    <td className="py-1.5 px-3 text-right font-mono font-bold text-amber-400 tabular-nums">
                      +{sub.totalRoundScore.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Action Buttons Row */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800 shrink-0">
        <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
          guess whence the people in the pictures
        </span>

        <div className="flex items-center gap-2.5 ml-auto">
          <button
            onClick={() => setIsLadderOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 bg-slate-850 hover:bg-slate-800 text-amber-400 text-xs font-semibold shadow-sm transition-colors"
          >
            <Info className="w-3.5 h-3.5" />
            <span>Rank Tiers</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Share2 className="w-3.5 h-3.5 text-sky-400" />
            <span>{copied ? 'Copied!' : 'Share Score'}</span>
          </button>

          <button
            onClick={onPlayAgain}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Play Again</span>
          </button>
        </div>
      </div>

      {/* 4. Rank Hierarchy & Comparison Modal */}
      {isLadderOpen && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-30 flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col max-h-full overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 shrink-0">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Rank Hierarchy</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Scores out of 50,000 across 10 rounds
                </p>
              </div>
              <button
                onClick={() => setIsLadderOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto py-2.5 space-y-2">
              {ALL_SCHOLARLY_RANKS.map((r) => {
                const isCurrent = rank.title === r.title;

                return (
                  <div
                    key={r.title}
                    className={`p-2.5 rounded-xl border transition-colors ${
                      isCurrent
                        ? 'bg-amber-500/15 border-amber-500/60 shadow-inner'
                        : 'bg-slate-950/60 border-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{r.badge.split(' ')[0]}</span>
                        <span className={`text-xs font-bold ${isCurrent ? 'text-amber-300' : 'text-slate-200'}`}>
                          {r.title}
                        </span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-bold text-[9px] uppercase tracking-wider font-mono">
                            Your Rank
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] font-mono font-semibold text-slate-400">
                        {r.minScore.toLocaleString()} {r.maxScore < 50000 ? `– ${r.maxScore.toLocaleString()}` : '+'} pts
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {r.description}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-800 shrink-0 flex justify-end">
              <button
                onClick={() => setIsLadderOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
