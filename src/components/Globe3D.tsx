import React, { useEffect, useRef, useState, useCallback } from 'react';
import { geoOrthographic, geoPath, geoGraticule10, geoInterpolate, geoDistance } from 'd3-geo';
import { countriesGeoJson, countryBordersMesh } from '../data/worldMapData';
import { WORLD_COUNTRIES, WORLD_CITIES, WorldPlace } from '../data/worldPlaces';
import { sound } from '../utils/audio';
import { RotateCcw, ZoomIn, ZoomOut, Crosshair, MapPin } from 'lucide-react';

interface Globe3DProps {
  pin: { lat: number; lng: number } | null;
  onPinChange?: (pin: { lat: number; lng: number }) => void;
  targetPin?: { lat: number; lng: number; name?: string } | null;
  isRevealMode?: boolean;
  interactive?: boolean;
}

export const Globe3D: React.FC<Globe3DProps> = ({
  pin,
  onPinChange,
  targetPin,
  isRevealMode = false,
  interactive = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Globe orientation: [yaw (longitude), pitch (latitude), roll]
  const [rotation, setRotation] = useState<[number, number, number]>([0, -15, 0]);
  const [zoom, setZoom] = useState<number>(320);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const lastMousePos = useRef<{ x: number; y: number } | null>(null);
  const dragVelocity = useRef<{ vx: number; vy: number }>({ vx: 0, vy: 0 });

  // Animated arc progress (0 to 1) for reveal
  const [arcProgress, setArcProgress] = useState<number>(isRevealMode ? 1 : 0);

  // Initialize or re-center camera to midpoint on reveal
  useEffect(() => {
    if (isRevealMode && targetPin) {
      setArcProgress(0);
      let p = 0;
      const startTime = performance.now();
      const duration = 1200; // ms

      const targetLng = pin ? (pin.lng + targetPin.lng) / 2 : targetPin.lng;
      const targetLat = pin ? (pin.lat + targetPin.lat) / 2 : targetPin.lat;

      // Animate rotation to face target
      setRotation([-targetLng, -targetLat, 0]);

      const interval = setInterval(() => {
        const elapsed = performance.now() - startTime;
        p = Math.min(1, elapsed / duration);
        const ease = 1 - Math.pow(1 - p, 3);
        setArcProgress(ease);
        if (p >= 1) clearInterval(interval);
      }, 16);

      return () => clearInterval(interval);
    } else {
      setArcProgress(0);
    }
  }, [isRevealMode, targetPin, pin]);

  // Main Canvas Render Loop
  const renderGlobe = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const radius = zoom;

    ctx.clearRect(0, 0, width, height);

    // Setup d3-geo orthographic projection
    const projection = geoOrthographic()
      .scale(radius)
      .translate([width / 2, height / 2])
      .rotate(rotation)
      .clipAngle(90);

    const path = geoPath(projection, ctx);

    const cx = width / 2;
    const cy = height / 2;

    // Helper: is coordinate on the visible front hemisphere?
    const isVisible = (coords: [number, number]) => {
      const center = [-rotation[0], -rotation[1]];
      const dist = geoDistance(coords, center as [number, number]);
      return dist <= Math.PI / 2;
    };

    // 1. Atmosphere Limb Glow
    const atmosphereGrad = ctx.createRadialGradient(cx, cy, radius * 0.95, cx, cy, radius * 1.08);
    atmosphereGrad.addColorStop(0, 'rgba(56, 189, 248, 0.16)');
    atmosphereGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.05)');
    atmosphereGrad.addColorStop(1, 'rgba(7, 11, 20, 0)');
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.08, 0, Math.PI * 2);
    ctx.fillStyle = atmosphereGrad;
    ctx.fill();

    // 2. Ocean / Globe Sphere Surface
    const oceanGrad = ctx.createRadialGradient(
      cx - radius * 0.3,
      cy - radius * 0.3,
      radius * 0.1,
      cx,
      cy,
      radius
    );
    oceanGrad.addColorStop(0, '#101a2d');
    oceanGrad.addColorStop(0.7, '#09101c');
    oceanGrad.addColorStop(1, '#050810');

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = oceanGrad;
    ctx.fill();

    // Outer rim border
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.28)';
    ctx.stroke();

    // 3. Graticules (Latitude & Longitude Grid)
    ctx.save();
    ctx.beginPath();
    path(geoGraticule10());
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.2)';
    ctx.stroke();

    // Equator Line
    ctx.beginPath();
    path({
      type: 'LineString',
      coordinates: Array.from({ length: 73 }, (_, i) => [i * 5 - 180, 0]),
    });
    ctx.lineWidth = 0.9;
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
    ctx.stroke();
    ctx.restore();

    // 4. Draw Country Polygons (from world-atlas)
    ctx.save();
    ctx.beginPath();
    path(countriesGeoJson);
    ctx.fillStyle = '#172234'; // Charcoal landmass
    ctx.fill();
    ctx.lineWidth = 0.6;
    ctx.strokeStyle = '#273852'; // Coastline border
    ctx.stroke();
    ctx.restore();

    // 5. Draw Country Internal Border Lines (Political Boundaries)
    // Opacity and sharpness increase as user zooms in
    const borderOpacity = Math.min(0.65, Math.max(0.15, (zoom - 180) / 400));
    ctx.save();
    ctx.beginPath();
    path(countryBordersMesh);
    ctx.lineWidth = zoom > 500 ? 1.2 : 0.7;
    ctx.strokeStyle = `rgba(100, 116, 139, ${borderOpacity})`;
    ctx.stroke();
    ctx.restore();

    // 6. Zoom-Dependent Cartographic Features: Country Names
    // Render country labels if zoom >= 220
    if (zoom >= 220) {
      ctx.save();
      const countryFontSize = Math.min(14, Math.max(9, Math.floor(zoom / 36)));
      ctx.font = `600 ${countryFontSize}px "Cinzel", Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (const country of WORLD_COUNTRIES) {
        if (zoom >= country.minZoom) {
          const coords: [number, number] = [country.lng, country.lat];
          if (isVisible(coords)) {
            const pt = projection(coords);
            if (pt) {
              const [px, py] = pt;
              // Text halo for legibility
              ctx.lineWidth = 3;
              ctx.strokeStyle = 'rgba(11, 16, 26, 0.85)';
              ctx.strokeText(country.name.toUpperCase(), px, py);

              ctx.fillStyle = 'rgba(226, 232, 240, 0.75)';
              ctx.fillText(country.name.toUpperCase(), px, py);
            }
          }
        }
      }
      ctx.restore();
    }

    // 7. Zoom-Dependent Cartographic Features: Cities & Capitals
    // Render capitals and major cultural hubs when zoom is high enough
    if (zoom >= 280) {
      ctx.save();
      for (const city of WORLD_CITIES) {
        if (zoom >= city.minZoom) {
          const coords: [number, number] = [city.lng, city.lat];
          if (isVisible(coords)) {
            const pt = projection(coords);
            if (pt) {
              const [px, py] = pt;
              const isCapital = city.type === 'capital';

              // Draw City Marker Dot
              if (isCapital) {
                // Capital outer ring
                ctx.beginPath();
                ctx.arc(px, py, 3.5, 0, Math.PI * 2);
                ctx.fillStyle = '#f8fafc';
                ctx.fill();
                ctx.lineWidth = 1.2;
                ctx.strokeStyle = '#38bdf8';
                ctx.stroke();

                // Capital center dot
                ctx.beginPath();
                ctx.arc(px, py, 1.2, 0, Math.PI * 2);
                ctx.fillStyle = '#0f172a';
                ctx.fill();
              } else {
                // Standard city dot
                ctx.beginPath();
                ctx.arc(px, py, 2.2, 0, Math.PI * 2);
                ctx.fillStyle = '#94a3b8';
                ctx.fill();
                ctx.lineWidth = 0.8;
                ctx.strokeStyle = '#0f172a';
                ctx.stroke();
              }

              // City Name Label
              const cityFontSize = isCapital ? 11 : 10;
              ctx.font = `${isCapital ? '600' : '500'} ${cityFontSize}px "Plus Jakarta Sans", sans-serif`;
              ctx.textAlign = 'left';
              ctx.textBaseline = 'middle';

              const offsetX = px + 6;
              const offsetY = py;

              ctx.lineWidth = 2.5;
              ctx.strokeStyle = 'rgba(7, 11, 20, 0.9)';
              ctx.strokeText(city.name, offsetX, offsetY);

              ctx.fillStyle = isCapital ? '#e2e8f0' : '#cbd5e1';
              ctx.fillText(city.name, offsetX, offsetY);
            }
          }
        }
      }
      ctx.restore();
    }

    // 8. Great-Circle Geodesic Arc (Between Player Guess & Actual Target)
    if (isRevealMode && pin && targetPin && arcProgress > 0) {
      const interpolator = geoInterpolate([pin.lng, pin.lat], [targetPin.lng, targetPin.lat]);
      const steps = 60;
      const currentSteps = Math.max(2, Math.floor(steps * arcProgress));
      const lineCoords: [number, number][] = [];

      for (let i = 0; i <= currentSteps; i++) {
        lineCoords.push(interpolator(i / steps));
      }

      ctx.save();
      ctx.beginPath();
      path({
        type: 'LineString',
        coordinates: lineCoords,
      });
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#38bdf8'; // Celestial glowing cyan
      ctx.setLineDash([5, 3]);
      ctx.stroke();
      ctx.restore();
    }

    // 9. Actual Target Birthplace Pin (Emerald/Gold)
    if (isRevealMode && targetPin) {
      const targetCoords: [number, number] = [targetPin.lng, targetPin.lat];
      if (isVisible(targetCoords)) {
        const pt = projection(targetCoords);
        if (pt) {
          const [px, py] = pt;

          // Pulse ring
          ctx.beginPath();
          ctx.arc(px, py, 16, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
          ctx.fill();

          // Target base
          ctx.beginPath();
          ctx.arc(px, py, 6, 0, Math.PI * 2);
          ctx.fillStyle = '#10b981';
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#ffffff';
          ctx.stroke();

          // Flag pole
          ctx.beginPath();
          ctx.moveTo(px, py - 6);
          ctx.lineTo(px, py - 22);
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#10b981';
          ctx.stroke();

          // Flag banner
          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.moveTo(px, py - 22);
          ctx.lineTo(px + 14, py - 17);
          ctx.lineTo(px, py - 12);
          ctx.closePath();
          ctx.fill();

          // Location Label
          ctx.font = '600 12px Plus Jakarta Sans, sans-serif';
          ctx.fillStyle = '#f8fafc';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
          ctx.shadowBlur = 6;
          const label = targetPin.name || 'Birthplace';
          ctx.fillText(label, px + 8, py - 26);
          ctx.shadowBlur = 0;
        }
      }
    }

    // 10. Player Guess Pin (Brass/Amber)
    if (pin) {
      const pinCoords: [number, number] = [pin.lng, pin.lat];
      if (isVisible(pinCoords)) {
        const pt = projection(pinCoords);
        if (pt) {
          const [px, py] = pt;

          // Pulse ring
          ctx.beginPath();
          ctx.arc(px, py, 14, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(245, 158, 11, 0.3)';
          ctx.fill();

          // Pin base
          ctx.beginPath();
          ctx.arc(px, py, 5, 0, Math.PI * 2);
          ctx.fillStyle = '#f59e0b';
          ctx.fill();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = '#ffffff';
          ctx.stroke();

          // Pin needle
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px, py - 18);
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#f59e0b';
          ctx.stroke();

          // Pin head
          ctx.beginPath();
          ctx.arc(px, py - 18, 5.5, 0, Math.PI * 2);
          ctx.fillStyle = '#f59e0b';
          ctx.fill();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = '#fef3c7';
          ctx.stroke();

          // Label
          ctx.font = '600 11px Plus Jakarta Sans, sans-serif';
          ctx.fillStyle = '#fef08a';
          ctx.shadowColor = 'rgba(0,0,0,0.9)';
          ctx.shadowBlur = 5;
          ctx.fillText('Your Pin', px + 8, py - 14);
          ctx.shadowBlur = 0;
        }
      }
    }
  }, [rotation, zoom, pin, targetPin, isRevealMode, arcProgress]);

  // Fullscreen Responsive Sizing
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      // Adjust default radius to fill the viewport generously
      const defaultZoom = Math.min(rect.width, rect.height) * 0.44;
      setZoom((prev) => (prev === 320 ? defaultZoom : prev));

      renderGlobe();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [renderGlobe]);

  // Render on state update
  useEffect(() => {
    renderGlobe();
  }, [renderGlobe]);

  // Mouse / Touch Interaction for Drag-to-Rotate
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    dragVelocity.current = { vx: 0, vy: 0 };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !lastMousePos.current) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;

    dragVelocity.current = { vx: dx, vy: dy };
    lastMousePos.current = { x: e.clientX, y: e.clientY };

    const sensitivity = 75 / zoom;
    setRotation((prev) => {
      const newYaw = prev[0] + dx * sensitivity;
      const newPitch = Math.max(-85, Math.min(85, prev[1] - dy * sensitivity));
      return [newYaw, newPitch, 0];
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);

    // If mouse didn't drag, treat as pin drop click
    const last = lastMousePos.current;
    if (interactive && !isRevealMode && last && onPinChange) {
      const dx = Math.abs(e.clientX - last.x);
      const dy = Math.abs(e.clientY - last.y);

      if (dx < 5 && dy < 5) {
        dropPinAtClientCoord(e.clientX, e.clientY);
      }
    }

    lastMousePos.current = null;
  };

  // Convert click coordinate to lat/lng and drop pin
  const dropPinAtClientCoord = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !onPinChange) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const canvasX = (clientX - rect.left) * dpr;
    const canvasY = (clientY - rect.top) * dpr;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const distFromCenter = Math.hypot(canvasX - cx, canvasY - cy);

    // Only drop pin if clicked inside the globe sphere
    if (distFromCenter <= zoom) {
      const projection = geoOrthographic()
        .scale(zoom)
        .translate([cx, cy])
        .rotate(rotation)
        .clipAngle(90);

      const inverted = projection.invert?.([canvasX, canvasY]);
      if (inverted && !isNaN(inverted[0]) && !isNaN(inverted[1])) {
        const [lng, lat] = inverted;
        sound.playPinDrop();
        onPinChange({
          lat: Number(lat.toFixed(4)),
          lng: Number(lng.toFixed(4)),
        });
      }
    }
  };

  // Wheel zoom supporting deep zoom for cities
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 35 : -35;
    setZoom((prev) => Math.max(140, Math.min(1200, prev + delta)));
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(1200, prev + 60));
  const handleZoomOut = () => setZoom((prev) => Math.max(140, prev - 60));
  const handleReset = () => {
    if (pin) {
      setRotation([-pin.lng, -pin.lat, 0]);
    } else {
      setRotation([0, -15, 0]);
    }
    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      setZoom(Math.min(rect.width, rect.height) * 0.44);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-0 bg-[#070b14] overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
      onWheel={handleWheel}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => setIsDragging(false)}
      />

      {/* Floating Globe Control Strip (Top-Right) */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
        <button
          onClick={handleZoomIn}
          title="Zoom In (shows country names, capitals & cities)"
          className="p-2.5 rounded-xl bg-slate-900/85 border border-slate-700/70 text-slate-200 hover:text-white hover:bg-slate-800 transition-colors shadow-xl backdrop-blur-md"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-2.5 rounded-xl bg-slate-900/85 border border-slate-700/70 text-slate-200 hover:text-white hover:bg-slate-800 transition-colors shadow-xl backdrop-blur-md"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleReset}
          title="Re-center View"
          className="p-2.5 rounded-xl bg-slate-900/85 border border-slate-700/70 text-slate-200 hover:text-white hover:bg-slate-800 transition-colors shadow-xl backdrop-blur-md"
        >
          {pin ? <Crosshair className="w-4 h-4 text-amber-400" /> : <RotateCcw className="w-4 h-4" />}
        </button>
      </div>

      {/* Zoom Level Indicator & Coordinate Tooltip */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none hidden sm:flex items-center gap-2">
        <span className="px-3 py-1 rounded-full bg-slate-900/70 border border-slate-800 text-[11px] font-mono text-slate-400 backdrop-blur-md shadow-md">
          {zoom >= 380 ? 'Detailed Map · Cities & Borders Active' : zoom >= 220 ? 'Countries Active · Zoom in for Cities' : 'Continental View'}
        </span>
      </div>

      {/* Pin Coordinates Kicker (Bottom-Left) */}
      <div className="absolute bottom-4 left-4 z-10 pointer-events-none">
        {pin ? (
          <div className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-amber-500/50 text-xs font-mono text-amber-300 shadow-xl backdrop-blur-md flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>
              Pin: {Math.abs(pin.lat).toFixed(2)}°{pin.lat >= 0 ? 'N' : 'S'}, {Math.abs(pin.lng).toFixed(2)}°{pin.lng >= 0 ? 'E' : 'W'}
            </span>
          </div>
        ) : !isRevealMode ? (
          <div className="px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-400 shadow-md backdrop-blur-md">
            Click globe to drop birth pin · Zoom in for cities
          </div>
        ) : null}
      </div>
    </div>
  );
};
