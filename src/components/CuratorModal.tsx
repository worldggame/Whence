import React, { useState, useEffect } from 'react';
import { HistoricalFigure, FigureCategory, PortraitMedium } from '../types/game';
import { formatHistoricalYear } from '../utils/geo';
import { getDailyPack } from '../data/figures';
import {
  Lock,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Download,
  Upload,
  Search,
  Eye,
  X,
  ExternalLink,
  Image as ImageIcon,
  Check,
  AlertCircle,
  HelpCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ListOrdered,
  Sparkles,
  MapPin,
  Loader2,
  Copy,
  CheckCheck,
  Globe,
  Info,
  Pencil,
} from 'lucide-react';

interface CitySearchResult {
  id: number;
  name: string;
  country?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

interface CuratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDateKey: string;
  onSelectDate: (dateKey: string) => void;
  calendarSchedules: Record<string, HistoricalFigure[]>;
  onUpdateRosterForDate: (dateKey: string, newRoster: HistoricalFigure[]) => void;
  onAddCustomFigure: (figure: HistoricalFigure) => void;
  serverSyncStatus?: 'connected' | 'static' | 'syncing';
}

const DEFAULT_PASSCODE = 'curator2026';

interface WikipediaSearchResult {
  title: string;
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
  description?: string;
  extract?: string;
  pageid: number;
}

import { formatDateKey, formatFriendlyDate, resolveGameRosterForDate, getEasternDateKey } from '../utils/date';
export { formatDateKey, formatFriendlyDate };

export const CuratorModal: React.FC<CuratorModalProps> = ({
  isOpen,
  onClose,
  currentDateKey,
  onSelectDate,
  calendarSchedules,
  onUpdateRosterForDate,
  onAddCustomFigure,
  serverSyncStatus = 'static',
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passcode, setPasscode] = useState<string>('');
  const [passcodeError, setPasscodeError] = useState<boolean>(false);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);

  // Selected date in curator
  const [selectedDate, setSelectedDate] = useState<string>(currentDateKey);

  // Tabs: 'ROSTER' (Daily Confirmed 10) | 'SEARCH' (Find & Author Figures)
  const [activeTab, setActiveTab] = useState<'ROSTER' | 'SEARCH'>('ROSTER');

  // Searcher state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<WikipediaSearchResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Active drafted figure form
  const [editingExistingId, setEditingExistingId] = useState<string | null>(null);
  const [editingFigure, setEditingFigure] = useState<Partial<HistoricalFigure>>({
    name: '',
    category: 'philosophy',
    medium: 'oil_painting',
    portraitUrl: '',
    birthPlace: '',
    birthCountry: '',
    latitude: 48.8566,
    longitude: 2.3522,
    birthYear: 1500,
    deathYear: 1570,
    shortBio: '',
    clue: '',
  });

  const [previewFigure, setPreviewFigure] = useState<HistoricalFigure | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // City Search & Geocoding Auto-Population state
  const [citySearchQuery, setCitySearchQuery] = useState<string>('');
  const [isCitySearching, setIsCitySearching] = useState<boolean>(false);
  const [cityResults, setCityResults] = useState<CitySearchResult[]>([]);
  const [showCityDropdown, setShowCityDropdown] = useState<boolean>(false);

  // Debounced city search using Open-Meteo Geocoding API
  useEffect(() => {
    const q = citySearchQuery.trim();
    if (q.length < 2) {
      setCityResults([]);
      setShowCityDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCitySearching(true);
      try {
        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=8&language=en&format=json`
        );
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.results)) {
            setCityResults(data.results);
            setShowCityDropdown(true);
          } else {
            setCityResults([]);
          }
        }
      } catch (err) {
        console.warn('Geocoding search failed:', err);
      } finally {
        setIsCitySearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [citySearchQuery]);

  // Select city from dropdown: auto-populates birthplace, country, latitude, and longitude!
  const handleSelectCity = (city: CitySearchResult) => {
    const roundedLat = Math.round(city.latitude * 10000) / 10000;
    const roundedLng = Math.round(city.longitude * 10000) / 10000;
    const locationName = city.name;
    const countryName = city.country || city.admin1 || locationName;

    setEditingFigure((prev) => ({
      ...prev,
      birthPlace: locationName,
      birthCountry: countryName,
      latitude: roundedLat,
      longitude: roundedLng,
    }));

    setCitySearchQuery('');
    setShowCityDropdown(false);
  };

  // Sync selectedDate when opened
  useEffect(() => {
    if (isOpen) {
      setSelectedDate(currentDateKey);
    }
  }, [isOpen, currentDateKey]);

  // Check if this date has an explicitly programmed roster in calendarSchedules
  const isExplicitlyProgrammed = calendarSchedules[selectedDate] !== undefined;

  // Compute the 10-figure roster: if explicitly programmed (including empty [] when reset), use it;
  // if not programmed, default to previous day's game!
  const dateRoster: HistoricalFigure[] = isExplicitlyProgrammed
    ? calendarSchedules[selectedDate]
    : resolveGameRosterForDate(selectedDate, calendarSchedules);

  if (!isOpen) return null;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim().toLowerCase() === DEFAULT_PASSCODE) {
      setIsAuthenticated(true);
      setPasscodeError(false);
    } else {
      setPasscodeError(true);
    }
  };

  // Calendar Day Stepper
  const handleShiftDay = (delta: number) => {
    handleCancelEdit();
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + delta);
    const newDateKey = formatDateKey(date);
    setSelectedDate(newDateKey);
    onSelectDate(newDateKey);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      handleCancelEdit();
      setSelectedDate(val);
      onSelectDate(val);
    }
  };

  // RESET DAY: Completely empties the rotation so the curator can build all 10 from scratch
  const handleResetDay = () => {
    handleCancelEdit();
    onUpdateRosterForDate(selectedDate, []);
    setStatusNotice(`Emptied rotation for ${formatFriendlyDate(selectedDate)} (0/10 figures).`);
    setTimeout(() => setStatusNotice(null), 3000);
  };

  // Start editing an existing figure from the roster
  const handleStartEditFigure = (fig: HistoricalFigure) => {
    setEditingExistingId(fig.id);
    setEditingFigure({
      name: fig.name,
      category: fig.category,
      medium: fig.medium,
      portraitUrl: fig.portraitUrl,
      birthPlace: fig.birthPlace,
      birthCountry: fig.birthCountry,
      latitude: fig.latitude,
      longitude: fig.longitude,
      birthYear: fig.birthYear,
      deathYear: fig.deathYear,
      shortBio: fig.shortBio,
      clue: fig.clue,
      famousQuoteOrWork: fig.famousQuoteOrWork,
    });
    setCitySearchQuery('');
    setActiveTab('SEARCH');
  };

  // Cancel editing mode and clear the form
  const handleCancelEdit = () => {
    setEditingExistingId(null);
    setEditingFigure({
      name: '',
      category: 'philosophy',
      medium: 'oil_painting',
      portraitUrl: '',
      birthPlace: '',
      birthCountry: '',
      latitude: 48.8566,
      longitude: 2.3522,
      birthYear: 1500,
      deathYear: 1570,
      shortBio: '',
      clue: '',
    });
    setCitySearchQuery('');
  };

  // SEARCH: Wikipedia API query for high-res portraits and bio
  const handlePerformSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);

    try {
      const endpoint = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=prefixsearch&gpssearch=${encodeURIComponent(
        query
      )}&gpslimit=6&prop=pageimages|description|extracts&piprop=thumbnail&pithumbsize=600&exintro=1&explaintext=1&exchars=240`;

      const response = await fetch(endpoint);
      const data = await response.json();

      if (data.query && data.query.pages) {
        const pages: WikipediaSearchResult[] = Object.values(data.query.pages);
        setSearchResults(pages);
      } else {
        setSearchResults([]);
        setSearchError('No figures found. Try a different spelling or name.');
      }
    } catch {
      setSearchError('Could not reach image search. You can also paste an image URL directly.');
    } finally {
      setIsSearching(false);
    }
  };

  // Click search result to autofill
  const handleSelectSearchResult = (result: WikipediaSearchResult) => {
    const imageUrl = result.thumbnail?.source || '';
    const bio = result.extract || result.description || '';

    let detectedBirthYear = 1500;
    let detectedDeathYear = 1570;

    const bcMatch = bio.match(/\((?:c\.\s*)?(\d+)\s*(?:BC|BCE)?\s*[-–—]\s*(?:c\.\s*)?(\d+)\s*(BC|BCE)\)/i);
    const adMatch = bio.match(/\((?:c\.\s*)?(\d{3,4})\s*[-–—]\s*(?:c\.\s*)?(\d{3,4})\)/);

    if (bcMatch) {
      detectedBirthYear = -Math.abs(parseInt(bcMatch[1], 10));
      detectedDeathYear = -Math.abs(parseInt(bcMatch[2], 10));
    } else if (adMatch) {
      detectedBirthYear = parseInt(adMatch[1], 10);
      detectedDeathYear = parseInt(adMatch[2], 10);
    }

    setEditingFigure((prev) => ({
      ...prev,
      name: result.title,
      portraitUrl: imageUrl,
      shortBio: bio,
      birthYear: detectedBirthYear,
      deathYear: detectedDeathYear,
      category: prev.category || 'philosophy',
      medium: prev.medium || 'oil_painting',
      clue: `Renowned figure from ${detectedBirthYear > 0 ? `${detectedBirthYear} CE` : `${Math.abs(detectedBirthYear)} BCE`}`,
    }));
  };

  // Reordering in active roster
  const moveRosterItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...dateRoster];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;
    onUpdateRosterForDate(selectedDate, newItems);
  };

  const removeRosterItem = (id: string) => {
    if (editingExistingId === id) {
      handleCancelEdit();
    }
    onUpdateRosterForDate(
      selectedDate,
      dateRoster.filter((item) => item.id !== id)
    );
  };

  // Save drafted figure into this date's roster (handles both Create and Edit)
  const handleSaveToRoster = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFigure.name || !editingFigure.portraitUrl || !editingFigure.birthPlace) {
      alert('Please provide a Name, Portrait Image URL, and Birthplace.');
      return;
    }

    if (editingExistingId) {
      // Update existing figure in-place
      const updated: HistoricalFigure = {
        id: editingExistingId,
        name: editingFigure.name.trim(),
        category: editingFigure.category || 'philosophy',
        medium: editingFigure.medium || 'oil_painting',
        portraitUrl: editingFigure.portraitUrl.trim(),
        birthPlace: editingFigure.birthPlace.trim(),
        birthCountry: editingFigure.birthCountry?.trim() || editingFigure.birthPlace.trim(),
        latitude: Number(editingFigure.latitude) || 48.8566,
        longitude: Number(editingFigure.longitude) || 2.3522,
        birthYear: Number(editingFigure.birthYear) || 1500,
        deathYear: Number(editingFigure.deathYear) || 1570,
        shortBio: editingFigure.shortBio?.trim() || `${editingFigure.name} was an influential historical figure.`,
        famousQuoteOrWork: editingFigure.famousQuoteOrWork || '',
        clue: editingFigure.clue?.trim() || 'A renowned visionary across history.',
      };

      const updatedRoster = dateRoster.map((f) => (f.id === editingExistingId ? updated : f));
      onUpdateRosterForDate(selectedDate, updatedRoster);
      onAddCustomFigure(updated);

      handleCancelEdit();
      setActiveTab('ROSTER');
      setStatusNotice(`Updated "${updated.name}" in ${formatFriendlyDate(selectedDate)}!`);
      setTimeout(() => setStatusNotice(null), 3500);
      return;
    }

    // Creating new figure
    if (dateRoster.length >= 10) {
      alert(`This date already has 10 figures. Switch to the "Confirmed Figures" tab to edit, reorder, or remove one.`);
      return;
    }

    const created: HistoricalFigure = {
      id: `curated_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: editingFigure.name.trim(),
      category: editingFigure.category || 'philosophy',
      medium: editingFigure.medium || 'oil_painting',
      portraitUrl: editingFigure.portraitUrl.trim(),
      birthPlace: editingFigure.birthPlace.trim(),
      birthCountry: editingFigure.birthCountry?.trim() || editingFigure.birthPlace.trim(),
      latitude: Number(editingFigure.latitude) || 48.8566,
      longitude: Number(editingFigure.longitude) || 2.3522,
      birthYear: Number(editingFigure.birthYear) || 1500,
      deathYear: Number(editingFigure.deathYear) || 1570,
      shortBio: editingFigure.shortBio?.trim() || `${editingFigure.name} was an influential historical figure.`,
      famousQuoteOrWork: '',
      clue: editingFigure.clue?.trim() || 'A renowned visionary across history.',
    };

    onAddCustomFigure(created);
    onUpdateRosterForDate(selectedDate, [...dateRoster, created]);

    handleCancelEdit();
    setStatusNotice(`Added "${created.name}" to ${formatFriendlyDate(selectedDate)} (${dateRoster.length + 1}/10)!`);
    setTimeout(() => setStatusNotice(null), 3000);
  };

  // Export full calendar schedules as schedules.json for GitHub deployment
  const handleExportAllSchedules = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(calendarSchedules, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `schedules.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setStatusNotice('Exported schedules.json! Place this file into src/data/schedules.json in your GitHub repo.');
    setTimeout(() => setStatusNotice(null), 5000);
  };

  // Copy full schedules JSON to clipboard for GitHub Web Editor
  const handleCopyAllSchedules = () => {
    const json = JSON.stringify(calendarSchedules, null, 2);
    navigator.clipboard.writeText(json).then(() => {
      setCopiedAll(true);
      setStatusNotice('Copied schedules.json to clipboard! Paste into src/data/schedules.json in GitHub.');
      setTimeout(() => {
        setCopiedAll(false);
        setStatusNotice(null);
      }, 4000);
    });
  };

  // Export current day's pack
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dateRoster, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `whence-${selectedDate}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON: supports either a single day's roster or a full schedules.json dictionary
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0) {
          onUpdateRosterForDate(selectedDate, parsed.slice(0, 10));
          setStatusNotice(`Loaded ${Math.min(10, parsed.length)} cases into ${formatFriendlyDate(selectedDate)}.`);
        } else if (typeof parsed === 'object' && parsed !== null) {
          Object.entries(parsed).forEach(([dateKey, roster]) => {
            if (Array.isArray(roster)) {
              onUpdateRosterForDate(dateKey, roster as HistoricalFigure[]);
            }
          });
          setStatusNotice(`Imported schedules for ${Object.keys(parsed).length} dates!`);
        } else {
          alert('Invalid pack JSON format.');
        }
        setTimeout(() => setStatusNotice(null), 4000);
      } catch {
        alert('Could not parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const isToday = selectedDate === getEasternDateKey();

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Sleek Minimal Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-serif font-bold text-white tracking-wide">
              Curator Console
            </span>

            {serverSyncStatus === 'connected' ? (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Server Connected</span>
              </span>
            ) : (
              <span
                title="Running in Static GitHub Pages mode. Click 'Export schedules.json' below to commit changes to your repository."
                className="ml-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono border border-amber-500/30 flex items-center gap-1"
              >
                <Globe className="w-3 h-3 text-amber-400" />
                <span>Static / GitHub Mode</span>
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Passcode Lock View */}
        {!isAuthenticated ? (
          <div className="p-8 max-w-xs mx-auto text-center flex-1 flex flex-col justify-center">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="text-base font-serif font-bold text-white">Curator Access</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Enter passcode to manage daily game calendars and author cases.
            </p>

            <form onSubmit={handleUnlock} className="space-y-3">
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Passcode (default: curator2026)"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400 font-mono text-center"
              />
              {passcodeError && (
                <p className="text-xs text-rose-400">Incorrect passcode.</p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPasscode(DEFAULT_PASSCODE)}
                  className="flex-1 py-1.5 text-xs text-slate-400 hover:text-slate-200 border border-slate-800 rounded-lg"
                >
                  Fill Default
                </button>
                <button
                  type="submit"
                  className="flex-1 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all"
                >
                  Unlock
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Authenticated Curator Workspace */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Minimal Calendar Bar */}
            <div className="px-5 py-2.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-3 text-xs">
              {/* Date Navigation */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleShiftDay(-1)}
                  title="Previous Day"
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  className="bg-slate-900 border border-slate-700 text-white px-2 py-1 rounded-lg text-xs font-mono focus:outline-hidden"
                />

                <button
                  onClick={() => handleShiftDay(1)}
                  title="Next Day"
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {isToday ? (
                  <span className="ml-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold text-[10px] uppercase">
                    Today
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      const today = getEasternDateKey();
                      setSelectedDate(today);
                      onSelectDate(today);
                    }}
                    className="ml-1 text-[11px] text-sky-400 hover:underline"
                  >
                    Today
                  </button>
                )}

                {!isExplicitlyProgrammed && (
                  <span
                    title="No custom game has been programmed for this date, so it defaults to the previous day."
                    className="ml-1.5 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 text-[10px] font-mono border border-amber-500/30 whitespace-nowrap"
                  >
                    Defaults to previous day
                  </span>
                )}
              </div>

              {/* Actions: Export Full schedules.json / Copy JSON / Reset / Import */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={handleExportAllSchedules}
                  title="Export full schedules.json dictionary to commit to your GitHub repository"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export schedules.json</span>
                </button>

                <button
                  onClick={handleCopyAllSchedules}
                  title="Copy full schedules JSON to clipboard to paste into GitHub"
                  className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
                >
                  {copiedAll ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{copiedAll ? 'Copied!' : 'Copy JSON'}</span>
                </button>

                <button
                  onClick={handleResetDay}
                  title="Reset this day's 10-figure roster to build from scratch"
                  className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                >
                  <RotateCcw className="w-3 h-3 text-slate-400" />
                  <span>Reset Day</span>
                </button>

                <label
                  title="Import schedules.json or daily pack"
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportJson}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Static GitHub Pages Info Banner */}
            {serverSyncStatus === 'static' && (
              <div className="px-5 py-2 bg-amber-950/40 border-b border-amber-500/20 flex items-center justify-between text-[11px] text-amber-200/90 gap-2">
                <div className="flex items-center gap-1.5 leading-relaxed">
                  <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>
                    <strong>GitHub Pages Mode:</strong> Changes are saved in your browser. To push schedules live to all players, click <strong>Export schedules.json</strong> and place it in <code className="font-mono bg-black/40 px-1 py-0.5 rounded text-amber-300">src/data/schedules.json</code> in your repo.
                  </span>
                </div>
              </div>
            )}

            {/* Clean 2-Tab Navigation */}
            <div className="flex items-center justify-between px-5 bg-slate-950/60 border-b border-slate-800 text-xs">
              <div className="flex gap-2">
                {/* TAB 1: CONFIRMED 10 FIGURES */}
                <button
                  onClick={() => setActiveTab('ROSTER')}
                  className={`py-2 px-3 border-b-2 font-medium flex items-center gap-1.5 transition-colors ${
                    activeTab === 'ROSTER'
                      ? 'border-amber-400 text-white font-bold'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                  <span>Confirmed Figures</span>
                  <span className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] ${
                    dateRoster.length === 10 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {dateRoster.length}/10
                  </span>
                </button>

                {/* TAB 2: SEARCH & ADD / EDIT FIGURE */}
                <button
                  onClick={() => setActiveTab('SEARCH')}
                  className={`py-2 px-3 border-b-2 font-medium flex items-center gap-1.5 transition-colors ${
                    activeTab === 'SEARCH'
                      ? 'border-amber-400 text-white font-bold'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {editingExistingId ? (
                    <>
                      <Pencil className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-amber-300 font-bold">Edit Entry</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-3.5 h-3.5" />
                      <span>Search & Add</span>
                    </>
                  )}
                </button>
              </div>

              <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                {formatFriendlyDate(selectedDate)}
              </span>
            </div>

            {statusNotice && (
              <div className="bg-emerald-950/50 border-b border-emerald-500/30 text-emerald-300 text-xs px-5 py-1.5 flex items-center gap-1.5 animate-in fade-in duration-150">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>{statusNotice}</span>
              </div>
            )}

            {/* TAB 1 CONTENT: CONFIRMED 10 FIGURES */}
            {activeTab === 'ROSTER' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400 pb-1">
                  <span>The 10 rounds for {formatFriendlyDate(selectedDate)}. Order top to bottom.</span>
                  <span className="font-mono font-bold text-amber-400">{dateRoster.length}/10 cases</span>
                </div>

                {dateRoster.length === 0 ? (
                  <div className="p-8 text-center bg-slate-950/40 border border-slate-800 rounded-xl space-y-2">
                    <p className="text-xs text-slate-400">No figures on this date.</p>
                    <button
                      onClick={handleResetDay}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold"
                    >
                      Fill Default Rotation
                    </button>
                  </div>
                ) : (
                  dateRoster.map((fig, idx) => (
                    <div
                      key={fig.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-colors gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-md bg-slate-800 text-amber-400 font-mono text-[11px] flex items-center justify-center font-bold shrink-0">
                          {idx + 1}
                        </span>

                        <img
                          src={fig.portraitUrl}
                          alt={fig.name}
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 object-cover rounded-md border border-slate-700 bg-slate-900 shrink-0"
                        />

                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                            <span>{fig.name}</span>
                            <span className="text-[9px] uppercase font-mono px-1 rounded-sm bg-slate-800 text-slate-400 shrink-0">
                              {fig.category}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono truncate">
                            {fig.birthPlace} · {formatHistoricalYear(fig.birthYear)} – {formatHistoricalYear(fig.deathYear)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleStartEditFigure(fig)}
                          title="Edit this entry"
                          className={`p-1 rounded transition-colors ${
                            editingExistingId === fig.id
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                              : 'text-amber-400 hover:text-amber-300 hover:bg-slate-800'
                          }`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setPreviewFigure(fig)}
                          title="Preview"
                          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveRosterItem(idx, 'up')}
                          disabled={idx === 0}
                          title="Move Up"
                          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 disabled:opacity-20"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveRosterItem(idx, 'down')}
                          disabled={idx === dateRoster.length - 1}
                          title="Move Down"
                          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 disabled:opacity-20"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => removeRosterItem(fig.id)}
                          title="Remove"
                          className="p-1 text-rose-400 hover:text-rose-300 rounded hover:bg-rose-950/40"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 2 CONTENT: SEARCH & AUTHOR FIGURE */}
            {activeTab === 'SEARCH' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                {/* Compact Search Bar */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5 text-amber-400" />
                      <span>Find Likeness</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        const q = editingFigure.name || searchQuery || 'historical portrait';
                        window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(q + ' portrait')}`, '_blank');
                      }}
                      className="text-[10px] text-amber-400 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-2.5 h-2.5" />
                      <span>Search on Google Images</span>
                    </button>
                  </div>

                  <form onSubmit={handlePerformSearch} className="flex gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Type a philosopher or historical figure name..."
                      className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                    />
                    <button
                      type="submit"
                      disabled={isSearching}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all disabled:opacity-50"
                    >
                      {isSearching ? 'Searching...' : 'Search'}
                    </button>
                  </form>

                  {/* Search Thumbnails */}
                  {searchResults.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                      {searchResults.map((result) => {
                        const hasThumb = !!result.thumbnail?.source;
                        const isSelected = editingFigure.name === result.title;

                        return (
                          <button
                            key={result.pageid}
                            type="button"
                            onClick={() => handleSelectSearchResult(result)}
                            className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-all ${
                              isSelected
                                ? 'bg-amber-500/20 border-amber-500 text-white'
                                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
                            }`}
                          >
                            <div className="w-10 h-10 rounded bg-slate-950 overflow-hidden shrink-0 border border-slate-800">
                              {hasThumb ? (
                                <img
                                  src={result.thumbnail?.source}
                                  alt={result.title}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-600">
                                  <ImageIcon className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-[11px] font-bold truncate">{result.title}</div>
                              <div className="text-[9px] text-slate-400 line-clamp-1">{result.description || 'Figure'}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {searchError && (
                    <p className="text-xs text-rose-400 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{searchError}</span>
                    </p>
                  )}
                </div>

                {/* Minimal Authoring Form */}
                <form onSubmit={handleSaveToRoster} className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-3">
                  {editingExistingId && (
                    <div className="p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/40 flex items-center justify-between text-xs text-amber-200">
                      <div className="flex items-center gap-2 min-w-0">
                        <Pencil className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">
                          Editing existing entry: <strong>{editingFigure.name || 'Figure'}</strong>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition-colors shrink-0"
                      >
                        Cancel Edit
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      {editingExistingId ? (
                        <>
                          <Pencil className="w-3 h-3" />
                          <span>Edit Entry Details</span>
                        </>
                      ) : (
                        <span>Case Details</span>
                      )}
                    </div>
                    {editingExistingId && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        Target: {formatFriendlyDate(selectedDate)}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] text-slate-400 mb-0.5">Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Hypatia of Alexandria"
                        value={editingFigure.name}
                        onChange={(e) => setEditingFigure({ ...editingFigure, name: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Category</label>
                      <select
                        value={editingFigure.category}
                        onChange={(e) => setEditingFigure({ ...editingFigure, category: e.target.value as FigureCategory })}
                        className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                      >
                        <option value="philosophy">Philosophy</option>
                        <option value="literature">Literature</option>
                        <option value="science">Science</option>
                        <option value="politics">Politics</option>
                        <option value="art">Art</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Portrait URL */}
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">Portrait URL *</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="url"
                        required
                        placeholder="https://..."
                        value={editingFigure.portraitUrl}
                        onChange={(e) => setEditingFigure({ ...editingFigure, portraitUrl: e.target.value })}
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                      />
                      {editingFigure.portraitUrl && (
                        <img
                          src={editingFigure.portraitUrl}
                          alt="thumb"
                          referrerPolicy="no-referrer"
                          className="w-7 h-7 rounded object-cover border border-slate-700 shrink-0 bg-slate-900"
                        />
                      )}
                    </div>
                  </div>

                  {/* Geography with City Search & Auto-Population */}
                  <div className="space-y-2">
                    <div className="relative">
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                          <MapPin className="w-3 h-3 text-sky-400" />
                          <span>Search City (Auto-populates Lat & Long)</span>
                        </label>
                        {editingFigure.birthPlace && (
                          <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>{editingFigure.birthPlace}{editingFigure.birthCountry && editingFigure.birthCountry !== editingFigure.birthPlace ? `, ${editingFigure.birthCountry}` : ''}</span>
                          </span>
                        )}
                      </div>

                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Type city name (e.g. Florence, Alexandria, Kyoto, Baghdad, Vienna)..."
                          value={citySearchQuery}
                          onChange={(e) => {
                            setCitySearchQuery(e.target.value);
                            setShowCityDropdown(true);
                          }}
                          onFocus={() => {
                            if (cityResults.length > 0) setShowCityDropdown(true);
                          }}
                          className="w-full pl-8 pr-8 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-sky-400"
                        />
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                        {isCitySearching && (
                          <Loader2 className="w-3.5 h-3.5 text-sky-400 animate-spin absolute right-2.5 top-2.5 pointer-events-none" />
                        )}
                      </div>

                      {/* Floating Dropdown List */}
                      {showCityDropdown && cityResults.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-40 max-h-52 overflow-y-auto divide-y divide-slate-800">
                          {cityResults.map((c) => {
                            const regionCountry = [c.admin1, c.country].filter(Boolean).join(', ');
                            return (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => handleSelectCity(c)}
                                className="w-full text-left px-3 py-2 hover:bg-slate-800 transition-colors flex items-center justify-between gap-3 text-xs"
                              >
                                <div className="min-w-0">
                                  <div className="font-bold text-white flex items-center gap-1.5 truncate">
                                    <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                                    <span>{c.name}</span>
                                  </div>
                                  {regionCountry && (
                                    <div className="text-[10px] text-slate-400 pl-4.5 truncate">
                                      {regionCountry}
                                    </div>
                                  )}
                                </div>
                                <div className="text-[10px] font-mono text-sky-400 shrink-0 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                                  {c.latitude.toFixed(4)}°, {c.longitude.toFixed(4)}°
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Populated Inputs: Birthplace City, Latitude, Longitude */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-0.5">Birthplace City *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Florence"
                          value={editingFigure.birthPlace}
                          onChange={(e) => setEditingFigure({ ...editingFigure, birthPlace: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-0.5">Latitude (-85 to +85) *</label>
                        <input
                          type="number"
                          step="0.0001"
                          required
                          value={editingFigure.latitude}
                          onChange={(e) => setEditingFigure({ ...editingFigure, latitude: parseFloat(e.target.value) })}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-amber-300 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-0.5">Longitude (-180 to +180) *</label>
                        <input
                          type="number"
                          step="0.0001"
                          required
                          value={editingFigure.longitude}
                          onChange={(e) => setEditingFigure({ ...editingFigure, longitude: parseFloat(e.target.value) })}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-amber-300 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Lifespan */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Birth Year (BCE negative) *</label>
                      <input
                        type="number"
                        required
                        value={editingFigure.birthYear}
                        onChange={(e) => setEditingFigure({ ...editingFigure, birthYear: parseInt(e.target.value, 10) })}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Death Year *</label>
                      <input
                        type="number"
                        required
                        value={editingFigure.deathYear}
                        onChange={(e) => setEditingFigure({ ...editingFigure, deathYear: parseInt(e.target.value, 10) })}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  {/* Clue and Bio */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Clue (for player hints)</label>
                      <input
                        type="text"
                        placeholder="Subtle hint without revealing identity..."
                        value={editingFigure.clue}
                        onChange={(e) => setEditingFigure({ ...editingFigure, clue: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Summary (shown on reveal)</label>
                      <input
                        type="text"
                        placeholder="Key historical contributions..."
                        value={editingFigure.shortBio}
                        onChange={(e) => setEditingFigure({ ...editingFigure, shortBio: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    {editingExistingId && (
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={!editingExistingId && dateRoster.length >= 10}
                      className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md disabled:opacity-40 flex items-center gap-1.5"
                    >
                      {editingExistingId ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Save Changes to Entry</span>
                        </>
                      ) : (
                        <span>+ Add to {formatFriendlyDate(selectedDate)} ({dateRoster.length}/10)</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Minimal Preview Modal */}
        {previewFigure && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-sm w-full p-4 space-y-2.5 shadow-2xl">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] uppercase font-mono text-amber-400">Preview Case</span>
                  <h3 className="text-base font-bold text-white">{previewFigure.name}</h3>
                </div>
                <button
                  onClick={() => setPreviewFigure(null)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <img
                src={previewFigure.portraitUrl}
                alt={previewFigure.name}
                referrerPolicy="no-referrer"
                className="w-full h-44 object-contain rounded-lg bg-slate-950 border border-slate-800"
              />

              <div className="text-xs space-y-0.5 text-slate-300 font-mono">
                <div><strong>Birthplace:</strong> {previewFigure.birthPlace}</div>
                <div><strong>Lifespan:</strong> {formatHistoricalYear(previewFigure.birthYear)} – {formatHistoricalYear(previewFigure.deathYear)}</div>
                <div><strong>Coords:</strong> {previewFigure.latitude}°, {previewFigure.longitude}°</div>
              </div>

              <p className="text-[11px] text-slate-400 line-clamp-2">
                {previewFigure.shortBio}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
