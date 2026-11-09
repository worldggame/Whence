import React, { useState } from 'react';
import { HistoricalFigure } from '../types/game';
import { ZoomIn, Sparkles, ChevronDown, ChevronUp, User, Lightbulb } from 'lucide-react';

interface PortraitCardProps {
  figure: HistoricalFigure;
  isRevealMode?: boolean;
  hintsRemaining: number;
  isClueRevealed: boolean;
  onUseHint: () => void;
}

export const PortraitCard: React.FC<PortraitCardProps> = ({
  figure,
  isRevealMode = false,
  hintsRemaining,
  isClueRevealed,
  onUseHint,
}) => {
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'philosophy': return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
      case 'literature': return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
      case 'history': return 'text-sky-400 border-sky-500/30 bg-sky-500/10';
      case 'science': return 'text-purple-400 border-purple-500/30 bg-purple-500/10';
      default: return 'text-slate-400 border-slate-700 bg-slate-800';
    }
  };

  // If collapsed, show a minimal sleek floating bar with thumbnail and category
  if (isCollapsed) {
    return (
      <div className="bg-slate-950/90 border border-slate-700/80 rounded-2xl p-1.5 shadow-2xl backdrop-blur-md flex items-center gap-2 select-none animate-in fade-in duration-150">
        <button
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-2 px-2 py-1 text-xs text-slate-200 hover:text-white transition-colors"
        >
          {figure.portraitUrl ? (
            <img
              src={figure.portraitUrl}
              alt="Portrait"
              referrerPolicy="no-referrer"
              className="w-7 h-7 rounded-full object-cover border border-amber-400/60 bg-slate-900 shrink-0 shadow-sm"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0">
              <User className="w-3.5 h-3.5 text-amber-400" />
            </div>
          )}
          <div className="flex flex-col text-left">
            <span className="text-[11px] font-bold text-white leading-tight">
              {isRevealMode ? figure.name : 'Likeness'}
            </span>
            <span className="text-[9px] text-amber-400/90 uppercase font-mono tracking-wider">
              {figure.category} · Tap to expand
            </span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="w-full flex flex-col bg-slate-950/90 border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md transition-all duration-300">
        {/* Curatorial Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/80 bg-slate-950/90">
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md border ${getCategoryColor(
                figure.category
              )}`}
            >
              {figure.category}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsZoomed(true)}
              title="Inspect Portrait"
              className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800/60 transition-colors"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsCollapsed(true)}
              title="Minimize Card"
              className="flex items-center gap-1 px-1.5 py-0.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800/60 text-[10px] transition-colors"
            >
              <span className="hidden xs:inline">Minimize</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Framed Likeness Viewer - Compact on mobile screens */}
        <div className="relative w-full h-36 xs:h-40 sm:h-52 bg-slate-950 flex items-center justify-center p-2 sm:p-2.5 overflow-hidden">
          <div className="relative w-full h-full rounded-xl overflow-hidden border border-slate-800/80 bg-slate-900/60 flex items-center justify-center">
            {!imageLoaded && !hasError && (
              <div className="absolute inset-0 bg-slate-900 animate-pulse flex items-center justify-center">
                <User className="w-8 h-8 text-slate-700" />
              </div>
            )}

            {!hasError ? (
              <img
                src={figure.portraitUrl}
                alt={isRevealMode ? figure.name : 'Likeness'}
                referrerPolicy="no-referrer"
                onLoad={() => setImageLoaded(true)}
                onError={() => setHasError(true)}
                className={`w-full h-full object-contain filter drop-shadow-md transition-all duration-300 cursor-zoom-in ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onClick={() => setIsZoomed(true)}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-slate-950">
                <div className="w-12 h-12 rounded-full border border-amber-500/30 flex items-center justify-center bg-slate-900 mb-1">
                  <User className="w-6 h-6 text-amber-300/70" />
                </div>
                <span className="text-[11px] text-slate-400">Portrait Image</span>
              </div>
            )}
          </div>
        </div>

        {/* Clue / Identity Area with 2 Hints Per Day Constraint */}
        <div className="p-3 bg-slate-950/95 border-t border-slate-800/80">
          {isRevealMode ? (
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                {figure.name}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                {figure.shortBio}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* If clue is revealed for this figure */}
              {isClueRevealed ? (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200/90 leading-relaxed italic">
                  <div className="flex items-center gap-1 text-[10px] uppercase font-mono text-amber-400 mb-1 not-italic font-bold">
                    <Sparkles className="w-3 h-3" />
                    <span>Clue</span>
                  </div>
                  "{figure.clue || 'Examine their clothing and artistic style to deduce their birthplace and century.'}"
                </div>
              ) : (
                /* Clue is currently hidden */
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                    <span>Hints: <strong className="text-white">{hintsRemaining}</strong>/2 left</span>
                  </div>

                  {hintsRemaining > 0 ? (
                    <button
                      onClick={onUseHint}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-[11px] font-medium text-amber-300 hover:text-white transition-colors"
                    >
                      Use Hint
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-medium">
                      0 hints left
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Artwork Lightbox Modal */}
      {isZoomed && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setIsZoomed(false)}
        >
          <div className="relative max-w-2xl max-h-[85vh] flex flex-col items-center">
            <img
              src={figure.portraitUrl}
              alt={figure.name}
              referrerPolicy="no-referrer"
              className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl border border-slate-700"
            />
            <div className="mt-3 text-center">
              <p className="text-xs text-slate-300">
                {isRevealMode ? figure.name : 'Likeness'}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Click anywhere to close</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
