import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { geoInterpolate } from 'd3-geo';
import { sound } from '../utils/audio';
import { ZoomIn, ZoomOut, RotateCcw, Crosshair, MapPin } from 'lucide-react';

interface AnthropeumMapProps {
  pin: { lat: number; lng: number } | null;
  onPinChange?: (pin: { lat: number; lng: number }) => void;
  targetPin?: { lat: number; lng: number; name?: string } | null;
  isRevealMode?: boolean;
  interactive?: boolean;
}

// Symmetrical SVG Player Guess Pin
function createPlayerPinIcon() {
  const svg = `
    <div style="position: relative; width: 28px; height: 40px; pointer-events: none;">
      <!-- Pulsing Ground Contact Ring -->
      <div style="position: absolute; bottom: 0px; left: 14px; transform: translate(-50%, 50%); width: 24px; height: 10px; border-radius: 50%; background: rgba(245, 158, 11, 0.4); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      
      <!-- SVG Pin Graphic -->
      <svg width="28" height="40" viewBox="0 0 28 40" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.5));">
        <ellipse cx="14" cy="38" rx="6" ry="2" fill="rgba(0,0,0,0.6)"/>
        <path d="M14 1C6.82 1 1 6.82 1 14C1 23.5 14 38 14 38S27 23.5 27 14C27 6.82 21.18 1 14 1Z" fill="#F59E0B" stroke="#FFFFFF" stroke-width="2"/>
        <circle cx="14" cy="14" r="5" fill="#78350F" stroke="#FEF3C7" stroke-width="1.5"/>
      </svg>
    </div>
  `;

  return L.divIcon({
    className: 'custom-whence-pin',
    html: svg,
    iconSize: [28, 40],
    iconAnchor: [14, 38], // Tip points with sub-pixel precision to clicked position
  });
}

// Symmetrical SVG Target Birthplace Pin
function createTargetPinIcon(label: string) {
  const svg = `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center; width: 140px; pointer-events: none;">
      <div style="background: #10B981; color: #FFFFFF; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; font-size: 11px; padding: 3px 8px; border-radius: 6px; box-shadow: 0 4px 14px rgba(0,0,0,0.6); border: 1.5px solid #FFFFFF; white-space: nowrap; margin-bottom: 2px;">
        ${label}
      </div>
      <svg width="30" height="42" viewBox="0 0 30 42" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.6));">
        <ellipse cx="15" cy="40" rx="6" ry="2" fill="rgba(0,0,0,0.6)"/>
        <path d="M15 1C7.82 1 2 6.82 2 14C2 24.5 15 40 15 40S28 24.5 28 14C28 6.82 22.18 1 15 1Z" fill="#10B981" stroke="#FFFFFF" stroke-width="2"/>
        <circle cx="15" cy="14" r="5.5" fill="#064E3B" stroke="#A7F3D0" stroke-width="1.5"/>
      </svg>
    </div>
  `;

  return L.divIcon({
    className: 'custom-whence-pin',
    html: svg,
    iconSize: [140, 68],
    iconAnchor: [70, 66],
  });
}

export const AnthropeumMap: React.FC<AnthropeumMapProps> = ({
  pin,
  onPinChange,
  targetPin,
  isRevealMode = false,
  interactive = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const playerMarkerRef = useRef<L.Marker | null>(null);
  const targetMarkerRef = useRef<L.Marker | null>(null);
  const geodesicLineRef = useRef<L.Polyline | null>(null);

  const propsRef = useRef({ interactive, isRevealMode, onPinChange });
  useEffect(() => {
    propsRef.current = { interactive, isRevealMode, onPinChange };
  });

  // Initialize Map with Smooth Infinite Panning
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Restrict vertical panning to [-85, 85] to lock top and bottom boundaries,
    // while allowing infinite horizontal scrolling along [-Infinity, Infinity]
    const verticalBounds = L.latLngBounds(
      L.latLng(-85, -Infinity),
      L.latLng(85, Infinity)
    );

    // True infinite horizontal scrolling map with locked vertical boundaries
    const map = L.map(mapContainerRef.current, {
      center: [28, 18],
      zoom: 3,
      minZoom: 2,
      maxZoom: 12,
      zoomControl: false,
      attributionControl: false,
      worldCopyJump: false,
      maxBounds: verticalBounds,
      maxBoundsViscosity: 1.0, // Solid barrier preventing vertical drag into void
    });

    // 1. Fast Cached Esri Dark Gray Base Tile Layer (Infinite wrap)
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 12,
        minZoom: 2,
        attribution: 'Esri, Garmin, © OpenStreetMap',
        noWrap: false, // Infinite horizontal wrapping
        keepBuffer: 8, // Pre-caches 8 adjacent tiles around the view for instant 60fps pan
        updateWhenIdle: false, // Updates continuously during pan without waiting for gesture stop
      }
    ).addTo(map);

    // 2. Fast Cached Esri Dark Gray Reference Layer (Progressive Labels & Boundaries)
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 12,
        minZoom: 2,
        pane: 'overlayPane',
        noWrap: false, // Infinite horizontal wrapping
        keepBuffer: 8,
        updateWhenIdle: false,
      }
    ).addTo(map);

    // Maintain latest callback & state in refs to avoid stale closures in map click listener
    const onMapClick = (e: L.LeafletMouseEvent) => {
      if (!propsRef.current.interactive || propsRef.current.isRevealMode) return;
      const wrapped = e.latlng.wrap();
      const lat = Number(wrapped.lat.toFixed(4));
      const lng = Number(wrapped.lng.toFixed(4));

      sound.playPinDrop();
      if (propsRef.current.onPinChange) {
        propsRef.current.onPinChange({ lat, lng });
      }
    };

    map.on('click', onMapClick);

    mapInstanceRef.current = map;

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      clearTimeout(timer);
      if (targetMarkerRef.current) {
        targetMarkerRef.current.remove();
        targetMarkerRef.current = null;
      }
      if (geodesicLineRef.current) {
        geodesicLineRef.current.remove();
        geodesicLineRef.current = null;
      }
      if (playerMarkerRef.current) {
        playerMarkerRef.current.remove();
        playerMarkerRef.current = null;
      }
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update cursor
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.getContainer().style.cursor = interactive && !isRevealMode ? 'crosshair' : 'grab';
  }, [interactive, isRevealMode]);

  // Sync Player Pin Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!pin) {
      if (playerMarkerRef.current) {
        playerMarkerRef.current.remove();
        playerMarkerRef.current = null;
      }
      return;
    }

    const icon = createPlayerPinIcon();

    if (playerMarkerRef.current) {
      playerMarkerRef.current.setLatLng([pin.lat, pin.lng]);
    } else {
      const marker = L.marker([pin.lat, pin.lng], {
        icon,
        draggable: interactive && !isRevealMode,
        zIndexOffset: 1000,
      }).addTo(map);

      // Support dragging pin to adjust placement
      marker.on('dragend', () => {
        const pos = marker.getLatLng().wrap();
        sound.playPinDrop();
        if (onPinChange) {
          onPinChange({
            lat: Number(pos.lat.toFixed(4)),
            lng: Number(pos.lng.toFixed(4)),
          });
        }
      });

      playerMarkerRef.current = marker;
    }

    if (playerMarkerRef.current) {
      if (interactive && !isRevealMode) {
        playerMarkerRef.current.dragging?.enable();
      } else {
        playerMarkerRef.current.dragging?.disable();
      }
    }
  }, [pin, interactive, isRevealMode, onPinChange]);

  // Sync Reveal Target & Geodesic Arc
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Always remove any previous target marker and geodesic arc before creating fresh ones
    if (targetMarkerRef.current) {
      targetMarkerRef.current.remove();
      targetMarkerRef.current = null;
    }
    if (geodesicLineRef.current) {
      geodesicLineRef.current.remove();
      geodesicLineRef.current = null;
    }

    if (!isRevealMode || !targetPin) {
      return;
    }

    // 1. Target Marker
    // 1. Calculate the shortest longitudinal distance between player's pin and target
    // If the shortest path crosses the Pacific (e.g. Japan at 135° and California at -120°),
    // position targetPin in the same coordinate space as player's pin so both markers
    // and the arc exist on the exact same world copy.
    let targetLng = targetPin.lng;
    let playerLng = pin ? pin.lng : 0;

    if (pin) {
      let diff = targetLng - playerLng;
      // Wrap diff into [-180, 180]
      while (diff > 180) diff -= 360;
      while (diff < -180) diff += 360;
      targetLng = playerLng + diff;
    }

    const targetIcon = createTargetPinIcon(targetPin.name || 'Birthplace');
    targetMarkerRef.current = L.marker([targetPin.lat, targetLng], {
      icon: targetIcon,
      zIndexOffset: 1200,
    }).addTo(map);

    // 2. Geodesic Curve Arc
    if (pin) {
      const arcPoints: [number, number][] = [];
      const steps = 60;
      const midLat = (pin.lat + targetPin.lat) / 2;
      const distDeg = Math.hypot(targetLng - playerLng, targetPin.lat - pin.lat);

      // Add a natural arch proportional to distance
      const maxLatAllowed = 80;
      const minLatAllowed = -80;
      const archSign = midLat >= 0 ? 1 : -1;
      const archElevation = Math.min(20, (distDeg / 360) * 40) * archSign;
      const apexLat = Math.max(minLatAllowed, Math.min(maxLatAllowed, midLat + archElevation));

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const lat = (1 - t) * (1 - t) * pin.lat + 2 * (1 - t) * t * apexLat + t * t * targetPin.lat;
        const lng = (1 - t) * playerLng + t * targetLng;
        arcPoints.push([lat, lng]);
      }

      geodesicLineRef.current = L.polyline(arcPoints, {
        color: '#38bdf8',
        weight: 3.5,
        opacity: 0.9,
        dashArray: '6, 6',
      }).addTo(map);

      // 3. Smooth Camera Focus framing both markers together
      const bounds = L.latLngBounds([
        [pin.lat, playerLng],
        [targetPin.lat, targetLng],
      ]);

      const isMobile = window.innerWidth < 768;
      const paddingTopLeft: [number, number] = isMobile ? [20, 20] : [420, 60];
      const paddingBottomRight: [number, number] = isMobile ? [280, 20] : [60, 60];

      map.flyToBounds(bounds, {
        paddingTopLeft,
        paddingBottomRight,
        maxZoom: 6,
        duration: 1.4,
      });
    } else {
      map.flyTo([targetPin.lat, targetLng], 5, { duration: 1.2 });
    }

    return () => {
      if (targetMarkerRef.current) {
        targetMarkerRef.current.remove();
        targetMarkerRef.current = null;
      }
      if (geodesicLineRef.current) {
        geodesicLineRef.current.remove();
        geodesicLineRef.current = null;
      }
    };
  }, [isRevealMode, targetPin, pin]);

  // Map Controls
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleReset = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (pin) {
      map.flyTo([pin.lat, pin.lng], 6, { duration: 1 });
    } else {
      map.flyTo([28, 18], 3, { duration: 1 });
    }
  };

  return (
    <div className="relative w-full h-full min-h-0 bg-[#090d16] overflow-hidden select-none">
      <div ref={mapContainerRef} className="w-full h-full block z-0" />

      {/* Floating Controls (Top-Right) */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-20 pointer-events-auto">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-slate-200 hover:text-white hover:bg-slate-800 transition-colors shadow-2xl backdrop-blur-md"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-slate-200 hover:text-white hover:bg-slate-800 transition-colors shadow-2xl backdrop-blur-md"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleReset}
          title="Center on Pin / Global View"
          className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-slate-200 hover:text-white hover:bg-slate-800 transition-colors shadow-2xl backdrop-blur-md"
        >
          {pin ? <Crosshair className="w-4 h-4 text-amber-400" /> : <RotateCcw className="w-4 h-4" />}
        </button>
      </div>

      {/* Pin Coordinates Kicker (Desktop bottom-left) */}
      {pin && (
        <div className="hidden sm:block absolute bottom-24 left-4 z-10 pointer-events-none">
          <div className="px-3 py-1.5 rounded-lg bg-slate-950/90 border border-amber-500/50 text-xs font-mono text-amber-300 shadow-xl backdrop-blur-md flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>
              Pin: {Math.abs(pin.lat).toFixed(2)}°{pin.lat >= 0 ? 'N' : 'S'}, {Math.abs(pin.lng).toFixed(2)}°{pin.lng >= 0 ? 'E' : 'W'} (Drag to adjust)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
