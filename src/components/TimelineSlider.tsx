import React, { useState, useEffect } from 'react';
import { sound } from '../utils/audio';
import { formatHistoricalYear } from '../utils/geo';
import { ChevronRight } from 'lucide-react';

interface TimelineSliderProps {
  year: number;
  onChange: (year: number) => void;
  onSubmit?: () => void;
  canSubmit?: boolean;
  disabled?: boolean;
}

const MIN_YEAR = -1500;
const MAX_YEAR = 2000;
const TOTAL_SPAN = MAX_YEAR - MIN_YEAR; // 3500 years

export const TimelineSlider: React.FC<TimelineSliderProps> = ({
  year,
  onChange,
  onSubmit,
  canSubmit = false,
  disabled = false,
}) => {
  const [isBCE, setIsBCE] = useState<boolean>(year < 0);
  const [absVal, setAbsVal] = useState<number>(Math.abs(year) || 1);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Sync internal state when prop changes
  useEffect(() => {
    setIsBCE(year < 0);
    setAbsVal(Math.abs(year) || 1);
  }, [year]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    sound.playTick();
    onChange(val);
  };

  const handleAbsValChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseInt(e.target.value, 10);
    if (isNaN(parsed)) {
      setAbsVal(0);
      return;
    }
    const clamped = Math.max(1, Math.min(3000, parsed));
    setAbsVal(clamped);
    onChange(isBCE ? -clamped : clamped);
  };

  const toggleEra = (targetBCE: boolean) => {
    setIsBCE(targetBCE);
    sound.playTick();
    onChange(targetBCE ? -absVal : absVal);
  };

  // Percentage for track fill and floating thumb bubble
  const percentage = Math.min(100, Math.max(0, ((year - MIN_YEAR) / TOTAL_SPAN) * 100));

  return (
    <div className="w-full bg-slate-950/95 border border-slate-800/90 rounded-2xl p-2.5 sm:p-3 md:px-5 md:py-3 shadow-2xl backdrop-blur-md pointer-events-auto select-none">
      {/* =========================================================================
          MOBILE ONLY (< md, < 768px): 2-Row Stacked Layout
          Row 1: Left = Year Thing, Right = Submit Button
          Row 2: Full-width Slider with Floating Year Bubble
         ========================================================================= */}
      <div className="flex flex-col gap-2 md:hidden">
        {/* Mobile Row 1: Left Year Input, Right Submit */}
        <div className="flex items-center justify-between gap-2">
          {/* Year Thing (Direct Numeric Type-in Box with BCE/CE Toggle) */}
          <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1.5 focus-within:border-sky-400 shadow-inner shrink-0">
            <input
              type="number"
              min="1"
              max="3000"
              value={absVal || ''}
              onChange={handleAbsValChange}
              disabled={disabled}
              aria-label="Direct year entry"
              className="w-14 bg-transparent text-xs font-mono font-bold text-white focus:outline-hidden text-right tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <div className="ml-1.5 pl-1.5 border-l border-slate-750 flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => toggleEra(true)}
                disabled={disabled}
                className={`px-1.5 py-0.5 text-[10px] font-bold rounded-md transition-colors ${
                  isBCE
                    ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                BCE
              </button>
              <button
                type="button"
                onClick={() => toggleEra(false)}
                disabled={disabled}
                className={`px-1.5 py-0.5 text-[10px] font-bold rounded-md transition-colors ${
                  !isBCE
                    ? 'bg-sky-500/25 text-sky-300 border border-sky-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                CE
              </button>
            </div>
          </div>

          {/* Submit Button on Mobile */}
          {onSubmit && (
            <button
              onClick={onSubmit}
              disabled={!canSubmit || disabled}
              className="flex items-center gap-1 px-4 py-2 rounded-xl font-bold text-xs shadow-lg transition-all shrink-0 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20 disabled:opacity-35 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Submit</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Mobile Row 2: Full-Width Slider */}
        <div className="w-full flex flex-col justify-center min-w-0 pt-3 pb-0.5">
          <div className="relative w-full flex items-center touch-none">
            {/* Floating Live Year Bubble directly tracking thumb */}
            <div
              className={`absolute -top-7.5 pointer-events-none transition-opacity duration-150 z-10 flex flex-col items-center ${
                isDragging ? 'opacity-100 scale-105' : 'opacity-90 hover:opacity-100'
              }`}
              style={{
                left: `${percentage}%`,
                transform: 'translateX(-50%)',
              }}
            >
              <div className="px-2 py-0.5 rounded-md bg-slate-900 border border-amber-500/60 shadow-lg text-[10px] font-mono font-bold text-amber-300 whitespace-nowrap">
                {formatHistoricalYear(year)}
              </div>
              <div className="w-1.5 h-1.5 bg-slate-900 border-r border-b border-amber-500/60 transform rotate-45 -mt-1" />
            </div>

            {/* Visual Track Fill Progress */}
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-2.5 rounded-full pointer-events-none bg-gradient-to-r from-amber-500/50 via-sky-500/60 to-amber-400"
              style={{ width: `${percentage}%` }}
            />

            {/* Full-Width Slider Input */}
            <input
              type="range"
              min={MIN_YEAR}
              max={MAX_YEAR}
              step="5"
              value={year}
              onChange={handleSliderChange}
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={() => setIsDragging(false)}
              onTouchStart={() => setIsDragging(true)}
              onTouchEnd={() => setIsDragging(false)}
              disabled={disabled}
              aria-label="Timeline Year Slider"
              className="whence-slider w-full h-3 appearance-none cursor-pointer focus:outline-hidden disabled:opacity-50 relative z-10"
            />
          </div>

          {/* Clean Mobile Milestones */}
          <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-2 select-none px-1">
            <button
              type="button"
              onClick={() => { sound.playTick(); onChange(-1500); }}
              className="hover:text-amber-400 transition-colors"
            >
              1500 BCE
            </button>
            <button
              type="button"
              onClick={() => { sound.playTick(); onChange(-500); }}
              className="hover:text-amber-400 transition-colors"
            >
              500 BCE
            </button>
            <button
              type="button"
              onClick={() => { sound.playTick(); onChange(1); }}
              className="text-slate-300 font-bold hover:text-sky-400 transition-colors"
            >
              1 CE
            </button>
            <button
              type="button"
              onClick={() => { sound.playTick(); onChange(1000); }}
              className="hover:text-amber-400 transition-colors"
            >
              1000 CE
            </button>
            <button
              type="button"
              onClick={() => { sound.playTick(); onChange(2000); }}
              className="hover:text-amber-400 transition-colors"
            >
              2000 CE
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          TABLET & PC VIEW (>= md, >= 768px): Single Horizontal Row
          Left: Year Thing (Input, BCE/CE)
          Middle: Slider Bar with Notches (flex-1)
          Right: Submit Button
         ========================================================================= */}
      <div className="hidden md:flex md:items-center md:gap-4 md:w-full">
        {/* LEFT: Year Thing (Input, BCE/CE) */}
        <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1.5 focus-within:border-sky-400 shadow-inner shrink-0">
          <input
            type="number"
            min="1"
            max="3000"
            value={absVal || ''}
            onChange={handleAbsValChange}
            disabled={disabled}
            aria-label="Direct year entry"
            className="w-16 bg-transparent text-sm font-mono font-bold text-white focus:outline-hidden text-right tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <div className="ml-1.5 pl-1.5 border-l border-slate-750 flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => toggleEra(true)}
              disabled={disabled}
              className={`px-1.5 py-0.5 text-xs font-bold rounded-md transition-colors ${
                isBCE
                  ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              BCE
            </button>
            <button
              type="button"
              onClick={() => toggleEra(false)}
              disabled={disabled}
              className={`px-1.5 py-0.5 text-xs font-bold rounded-md transition-colors ${
                !isBCE
                  ? 'bg-sky-500/25 text-sky-300 border border-sky-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              CE
            </button>
          </div>
        </div>

        {/* CENTER: Timeline Range Slider & Century Notches */}
        <div className="flex-1 flex flex-col justify-center min-w-0 pt-2">
          <div className="relative w-full flex items-center touch-none">
            {/* Floating Live Year Bubble directly tracking thumb */}
            <div
              className={`absolute -top-7.5 pointer-events-none transition-opacity duration-150 z-10 flex flex-col items-center ${
                isDragging ? 'opacity-100 scale-105' : 'opacity-90 hover:opacity-100'
              }`}
              style={{
                left: `${percentage}%`,
                transform: 'translateX(-50%)',
              }}
            >
              <div className="px-2 py-0.5 rounded-md bg-slate-900 border border-amber-500/60 shadow-lg text-[11px] font-mono font-bold text-amber-300 whitespace-nowrap">
                {formatHistoricalYear(year)}
              </div>
              <div className="w-1.5 h-1.5 bg-slate-900 border-r border-b border-amber-500/60 transform rotate-45 -mt-1" />
            </div>

            {/* Visual Track Fill Progress */}
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-2.5 rounded-full pointer-events-none bg-gradient-to-r from-amber-500/50 via-sky-500/60 to-amber-400"
              style={{ width: `${percentage}%` }}
            />

            {/* Slider Input */}
            <input
              type="range"
              min={MIN_YEAR}
              max={MAX_YEAR}
              step="5"
              value={year}
              onChange={handleSliderChange}
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={() => setIsDragging(false)}
              onTouchStart={() => setIsDragging(true)}
              onTouchEnd={() => setIsDragging(false)}
              disabled={disabled}
              aria-label="Timeline Year Slider"
              className="whence-slider w-full h-3 appearance-none cursor-pointer focus:outline-hidden disabled:opacity-50 relative z-10"
            />
          </div>

          {/* Desktop All 8 Milestones */}
          <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1.5 select-none px-1">
            <button
              type="button"
              onClick={() => { sound.playTick(); onChange(-1500); }}
              className="hover:text-amber-400 transition-colors"
            >
              1500 BCE
            </button>
            <button
              type="button"
              onClick={() => { sound.playTick(); onChange(-1000); }}
              className="hover:text-amber-400 transition-colors"
            >
              1000 BCE
            </button>
            <button
              type="button"
              onClick={() => { sound.playTick(); onChange(-500); }}
              className="hover:text-amber-400 transition-colors"
            >
              500 BCE
            </button>
            <button
              type="button"
              onClick={() => { sound.playTick(); onChange(1); }}
              className="text-slate-300 font-bold hover:text-sky-400 transition-colors"
            >
              1 CE
            </button>
            <button
              type="button"
              onClick={() => { sound.playTick(); onChange(500); }}
              className="hover:text-amber-400 transition-colors"
            >
              500 CE
            </button>
            <button
              type="button"
              onClick={() => { sound.playTick(); onChange(1000); }}
              className="hover:text-amber-400 transition-colors"
            >
              1000 CE
            </button>
            <button
              type="button"
              onClick={() => { sound.playTick(); onChange(1500); }}
              className="hover:text-amber-400 transition-colors"
            >
              1500 CE
            </button>
            <button
              type="button"
              onClick={() => { sound.playTick(); onChange(2000); }}
              className="hover:text-amber-400 transition-colors"
            >
              2000 CE
            </button>
          </div>
        </div>

        {/* RIGHT: Submit Button */}
        {onSubmit && (
          <button
            onClick={onSubmit}
            disabled={!canSubmit || disabled}
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg transition-all shrink-0 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20 disabled:opacity-35 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Submit</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
