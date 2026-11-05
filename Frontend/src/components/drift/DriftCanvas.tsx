import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Clock, 
  Activity, 
  Target, 
  ShieldCheck, 
  ZoomIn, 
  ZoomOut,
  Navigation,
  Crosshair,
  AlertTriangle
} from 'lucide-react';
import { DriftSimulateResponse, GeoJSONFeatureCollection, WaterMaskProperties, HotspotProperties } from '../../types';

interface DriftCanvasProps {
  simulation: DriftSimulateResponse | null;
  waterMasks?: GeoJSONFeatureCollection<WaterMaskProperties> | null;
  hotspots?: GeoJSONFeatureCollection<HotspotProperties> | null;
  onSelectHotspot?: (hotspotId: string) => void;
  onSelectCustomLocation?: (lat: number, lon: number) => void;
  stepIndex: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onResetPlay: () => void;
  onStepChange: (index: number) => void;
  isLoading: boolean;
}

export const DriftCanvas: React.FC<DriftCanvasProps> = ({ 
  simulation, 
  waterMasks,
  hotspots,
  onSelectHotspot,
  onSelectCustomLocation,
  stepIndex,
  isPlaying,
  onTogglePlay,
  onResetPlay,
  onStepChange,
  isLoading 
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const trajectoryGroupRef = useRef<L.LayerGroup | null>(null);
  const headsGroupRef = useRef<L.LayerGroup | null>(null);
  const hotspotsLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const originMarkerRef = useRef<L.Marker | null>(null);
  const waterMaskGroupRef = useRef<L.GeoJSON | null>(null);

  const particles = simulation?.particles || [];
  const maxSteps = particles[0]?.trajectory?.length || 0;
  const isSingleDebris = particles.length === 1;

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [19.485, 75.340],
      zoom: 12,
      minZoom: 10,
      maxZoom: 17,
      zoomControl: false,
      attributionControl: false,
    });

    // High-resolution Esri World Imagery
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 17, opacity: 0.95 }
    ).addTo(map);

    // Reference Labels & Waterways
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 17, opacity: 0.65 }
    ).addTo(map);

    // Dedicated Layer Groups
    const hLayerGroup = L.layerGroup().addTo(map);
    const trajGroup = L.layerGroup().addTo(map);
    const hGroup = L.layerGroup().addTo(map);

    hotspotsLayerGroupRef.current = hLayerGroup;
    trajectoryGroupRef.current = trajGroup;
    headsGroupRef.current = hGroup;
    mapInstanceRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Render Reservoir Water Mask Polygons
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !waterMasks) return;

    if (waterMaskGroupRef.current) {
      map.removeLayer(waterMaskGroupRef.current);
      waterMaskGroupRef.current = null;
    }

    try {
      const maskLayer = L.geoJSON(waterMasks as any, {
        style: {
          color: '#38bdf8',
          weight: 2,
          opacity: 0.8,
          fillColor: '#0284c7',
          fillOpacity: 0.25,
        },
      });
      maskLayer.on('click', (e: any) => {
        if (onSelectCustomLocation && e.latlng) {
          onSelectCustomLocation(e.latlng.lat, e.latlng.lng);
        }
      });
      maskLayer.addTo(map);
      waterMaskGroupRef.current = maskLayer;
    } catch (err) {
      console.warn('Failed to render water masks on drift canvas', err);
    }
  }, [waterMasks, onSelectCustomLocation]);

  // Click listener for direct map interaction (any point in the basin)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (onSelectCustomLocation && e.latlng) {
        onSelectCustomLocation(e.latlng.lat, e.latlng.lng);
      }
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [onSelectCustomLocation]);

  // 3. Render Detected Hotspots as selectable markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const hGroup = hotspotsLayerGroupRef.current;
    if (!map || !hGroup || !hotspots?.features) return;

    hGroup.clearLayers();

    hotspots.features.forEach((feat) => {
      const isSelected = feat.id === simulation?.parameters?.hotspot_id;
      if (isSelected) return; // Origin marker handles selected

      const coords = (feat.geometry as any)?.coordinates;
      let lat = 19.485;
      let lon = 75.340;
      if (feat.geometry.type === 'Point') {
        lat = coords[1];
        lon = coords[0];
      } else if (feat.geometry.type === 'Polygon' && coords?.[0]?.[0]) {
        lat = coords[0][0][1];
        lon = coords[0][0][0];
      }

      const isPelagic = feat.properties?.zone_type === 'pelagic_open_water';
      const marker = L.circleMarker([lat, lon], {
        radius: isPelagic ? 5 : 4,
        color: isPelagic ? '#38bdf8' : '#f59e0b',
        weight: 1.5,
        fillColor: isPelagic ? '#0284c7' : '#d97706',
        fillOpacity: 0.7,
      });

      marker.bindTooltip(
        `<b>${feat.properties?.name || feat.id}</b><br/>Zone: ${feat.properties?.zone_type || 'Shoreline'}<br/>FDI: +${feat.properties?.fdi_value ?? 0.04}<br/><span style="color:#38bdf8">Click to simulate drift flow</span>`,
        { className: 'leaflet-tooltip-dark', direction: 'top' }
      );

      marker.on('click', () => {
        if (onSelectHotspot && feat.id) {
          onSelectHotspot(feat.id);
        }
      });

      marker.addTo(hGroup);
    });
  }, [hotspots, simulation?.parameters?.hotspot_id, onSelectHotspot]);

  // 4. Render Origin Release Beacon & Fit Bounds
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !simulation) return;

    if (originMarkerRef.current) {
      map.removeLayer(originMarkerRef.current);
      originMarkerRef.current = null;
    }

    const { latitude, longitude } = simulation.parameters;
    const isCustomRelease = simulation.parameters.hotspot_id === 'custom-release';
    const debrisLabel = simulation.summary.tracked_debris_name || 'DEBRIS ORIGIN (T0)';

    const originIcon = L.divIcon({
      className: 'drift-origin-icon',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="w-8 h-8 rounded-full ${isCustomRelease ? 'bg-purple-500/40' : 'bg-cyan-400/30'} animate-ping absolute"></div>
          <div class="w-4 h-4 rounded-full ${isCustomRelease ? 'bg-purple-400 border-2 border-white shadow-[0_0_15px_#c084fc]' : 'bg-cyan-400 border-2 border-white shadow-[0_0_12px_#38bdf8]'} flex items-center justify-center">
            <div class="w-1.5 h-1.5 rounded-full bg-slate-950"></div>
          </div>
          <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-slate-950/95 border ${isCustomRelease ? 'border-purple-400/80 text-purple-200' : 'border-cyan-400/70 text-cyan-300'} text-[9px] font-mono font-bold whitespace-nowrap shadow-xl">
            📍 ${debrisLabel.slice(0, 26)} (T0)
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const marker = L.marker([latitude, longitude], { icon: originIcon }).addTo(map);
    originMarkerRef.current = marker;

    // Bounds fitting strictly around the actual trajectory points
    const latLngs: [number, number][] = [[latitude, longitude]];
    for (const p of simulation.particles) {
      for (const pt of p.trajectory) {
        latLngs.push([pt.latitude, pt.longitude]);
      }
    }

    if (latLngs.length > 0) {
      const bounds = L.latLngBounds(latLngs);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
    }
  }, [simulation?.simulation_id]);

  // 5. Update Particle Trails & Current Positions on stepIndex Change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const trajGroup = trajectoryGroupRef.current;
    const headsGroup = headsGroupRef.current;
    if (!map || !trajGroup || !headsGroup || !simulation) return;

    trajGroup.clearLayers();
    headsGroup.clearLayers();

    for (const p of simulation.particles) {
      const pts = p.trajectory.slice(0, stepIndex + 1).map((pt) => [pt.latitude, pt.longitude] as [number, number]);
      if (pts.length >= 2) {
        L.polyline(pts, {
          color: isSingleDebris ? '#38bdf8' : '#38bdf8',
          weight: isSingleDebris ? 3.5 : 2.2,
          opacity: isSingleDebris ? 0.9 : 0.6,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(trajGroup);

        // For single debris, add milestone checkpoint hour dots along the path
        if (isSingleDebris) {
          p.trajectory.slice(1, stepIndex + 1).forEach((pt, idx) => {
            if (idx % 2 === 0 && pt.status === 'active') {
              const dot = L.circleMarker([pt.latitude, pt.longitude], {
                radius: 3,
                color: '#38bdf8',
                fillColor: '#0284c7',
                fillOpacity: 0.9,
                weight: 1,
              });
              dot.bindTooltip(`+${pt.time_offset_hours.toFixed(0)}h`, { permanent: false, direction: 'right' });
              dot.addTo(trajGroup);
            }
          });
        }
      }

      // Draw particle head at current stepIndex
      const currentPt = p.trajectory[stepIndex] || p.trajectory[p.trajectory.length - 1];
      if (currentPt) {
        const isAshore = currentPt.status === 'ashore' || currentPt.status === 'out_of_bounds';

        if (isAshore) {
          // Explicit Beached Marker right at the shoreline edge
          const beachedIcon = L.divIcon({
            className: 'beached-shore-icon',
            html: `
              <div class="relative flex items-center justify-center">
                <div class="w-6 h-6 rounded-full bg-amber-400/30 animate-ping absolute"></div>
                <div class="w-4 h-4 rounded-full bg-amber-400 border-2 border-white shadow-[0_0_12px_#f59e0b] flex items-center justify-center">
                  <div class="w-1.5 h-1.5 rounded-full bg-slate-950"></div>
                </div>
                <div class="absolute -bottom-5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-amber-950/95 border border-amber-500 text-[8px] font-mono text-amber-200 font-bold whitespace-nowrap shadow-xl">
                  🛑 BEACHED (+${currentPt.time_offset_hours.toFixed(1)}h)
                </div>
              </div>
            `,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });
          const bMarker = L.marker([currentPt.latitude, currentPt.longitude], { icon: beachedIcon });
          bMarker.bindTooltip(
            `<b>Debris Beached on Shoreline</b><br/>Hour: +${currentPt.time_offset_hours.toFixed(1)}h<br/>Status: Stranded at reservoir bank`,
            { className: 'leaflet-tooltip-dark', direction: 'top' }
          );
          bMarker.addTo(headsGroup);
        } else {
          // Active in pelagic water
          const headMarker = L.circleMarker([currentPt.latitude, currentPt.longitude], {
            radius: isSingleDebris ? 7 : 5,
            color: '#ffffff',
            weight: 2,
            fillColor: '#38bdf8',
            fillOpacity: 1.0,
          });

          headMarker.bindTooltip(
            `<b>${simulation.summary.tracked_debris_name || `Particle #${p.particle_id}`}</b><br/>Time: +${currentPt.time_offset_hours.toFixed(1)}h<br/>Status: Active in pelagic water`,
            { className: 'leaflet-tooltip-dark', direction: 'top' }
          );

          headMarker.addTo(headsGroup);
        }
      }
    }
  }, [stepIndex, simulation, isSingleDebris]);

  const currentStepTime = particles[0]?.trajectory[stepIndex]?.time_offset_hours ?? 0;
  const totalDuration = simulation?.parameters?.duration_hours ?? 24;
  const summary = simulation?.summary;

  return (
    <div className="relative w-full h-full min-h-[580px] bg-[#020512] rounded-2xl border border-sky-950/70 shadow-2xl flex flex-col overflow-hidden select-none font-['DM_Sans',sans-serif]">
      {/* Top Status Bar */}
      <div className="p-3.5 px-4 bg-[#03091c]/90 border-b border-sky-950/70 flex items-center justify-between text-xs font-mono z-10 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-white tracking-wide">
            {summary?.tracked_debris_name ? `Tracking: ${summary.tracked_debris_name}` : 'Hydrodynamic Drift Simulator'}
          </span>
          <span className="text-zinc-500">|</span>
          <span className="text-cyan-300">
            {isSingleDebris ? 'Single Debris Streamline' : `${particles.length} Particle Plume`}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-cyan-300 font-bold bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-800/40">
            <Clock className="w-3.5 h-3.5" />
            <span>+{currentStepTime.toFixed(1)}h / {totalDuration}h elapsed</span>
          </div>
        </div>
      </div>

      {/* Main Leaflet Map Viewport */}
      <div className="flex-1 relative w-full h-full min-h-[460px]">
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-20 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
            <span className="text-xs font-mono text-cyan-300 tracking-wide animate-pulse">
              Computing Lagrangian drift vectors & shoreline boundary collision...
            </span>
          </div>
        )}

        {/* Floating Interactive Guide Pill */}
        <div className="absolute top-4 left-16 z-10 pointer-events-none hidden sm:block">
          <div className="px-3 py-1.5 rounded-full bg-[#02071ce0] border border-cyan-500/40 backdrop-blur-md shadow-2xl flex items-center gap-2 text-[10px] font-mono text-cyan-200">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0 shadow-[0_0_8px_#38bdf8]" />
            <span>Interactive: Click anywhere on reservoir water to simulate custom debris release</span>
          </div>
        </div>

        {/* Floating Judge Intelligence HUD (Top-Right) */}
        {summary && (
          <div className="absolute top-4 right-4 z-10 max-w-sm bg-[#030919]/95 border border-sky-800/80 rounded-xl p-3.5 backdrop-blur-xl shadow-2xl font-mono space-y-2.5 pointer-events-auto">
            <div className="flex items-center justify-between border-b border-sky-950 pb-2">
              <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-xs">
                <Target className="w-4 h-4 text-cyan-400" />
                <span>JUDGE IMPACT BRIEF</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                summary.risk_level === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                summary.risk_level === 'HIGH' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                'bg-cyan-950 text-cyan-300 border border-cyan-800'
              }`}>
                {summary.risk_level || 'EVALUATED'}
              </span>
            </div>

            <div className="space-y-1.5 text-[11px]">
              <div>
                <span className="text-zinc-400 text-[10px] block">TARGET DESTINATION</span>
                <span className="text-white font-bold leading-tight block">
                  {summary.destination_target || 'Jayakwadi Reservoir Shoreline'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-sky-950/60">
                <div>
                  <span className="text-zinc-500 text-[10px] block">DRIFT HEADING</span>
                  <span className="text-cyan-300 font-bold">
                    {summary.drift_heading_degrees ?? 0}° ({summary.drift_heading_cardinal ?? 'E'})
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] block">SHORE INTERCEPTION</span>
                  <span className="text-amber-300 font-bold">
                    ~{summary.estimated_shore_interception_hours ?? 3.0}h to Shore
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-sky-950/60">
                <div>
                  <span className="text-zinc-500 text-[10px] block">STATUS</span>
                  <span className="text-white font-bold">
                    {summary.beached_at_end && summary.beached_at_end > 0 ? 'Beached on Shore' : 'Active in Water'}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] block">SPEED</span>
                  <span className="text-white font-bold">
                    {summary.average_drift_speed_kmh ?? 0} km/h
                  </span>
                </div>
              </div>

              {summary.recommended_action && (
                <div className="pt-2 border-t border-sky-950/80">
                  <span className="text-emerald-400 font-bold text-[10px] block mb-0.5 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> CONTAINMENT ACTION:
                  </span>
                  <p className="text-[10px] text-zinc-300 leading-snug">
                    {summary.recommended_action}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Map Controls (Top-Left) */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5">
          <button
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="w-8 h-8 rounded-lg bg-[#030919]/90 border border-sky-900/60 text-white flex items-center justify-center hover:bg-sky-900 transition-colors cursor-pointer shadow-lg"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="w-8 h-8 rounded-lg bg-[#030919]/90 border border-sky-900/60 text-white flex items-center justify-center hover:bg-sky-900 transition-colors cursor-pointer shadow-lg"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (simulation && mapInstanceRef.current) {
                mapInstanceRef.current.setView(
                  [simulation.parameters.latitude, simulation.parameters.longitude],
                  12
                );
              }
            }}
            className="w-8 h-8 rounded-lg bg-[#030919]/90 border border-sky-900/60 text-cyan-400 flex items-center justify-center hover:bg-sky-900 transition-colors cursor-pointer shadow-lg"
            title="Center on Debris Origin"
          >
            <Navigation className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Playback Controls Strip */}
      <div className="p-3.5 px-6 bg-[#03091c]/95 border-t border-sky-950/80 flex items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePlay}
            disabled={!simulation || maxSteps <= 1}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 font-bold text-xs hover:from-cyan-300 transition-all cursor-pointer disabled:opacity-40 flex items-center gap-1.5 shadow-lg"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-slate-950" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-slate-950" />
                <span>Play Flow</span>
              </>
            )}
          </button>

          <button
            onClick={onResetPlay}
            disabled={!simulation}
            className="p-2 rounded-xl bg-[#030919] border border-sky-950 text-zinc-400 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
            title="Reset to T0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Timeline Scrubber */}
        <div className="flex-1 flex items-center gap-3">
          <span className="text-[10px] font-mono text-zinc-500">T=0h</span>
          <input
            type="range"
            min="0"
            max={Math.max(0, maxSteps - 1)}
            value={stepIndex}
            onChange={(e) => onStepChange(parseInt(e.target.value, 10))}
            disabled={!simulation || maxSteps <= 1}
            className="w-full accent-cyan-400 bg-slate-900 h-2 rounded cursor-pointer disabled:opacity-30"
          />
          <span className="text-[10px] font-mono text-cyan-300 font-bold whitespace-nowrap">
            T={currentStepTime.toFixed(1)}h / {totalDuration}h
          </span>
        </div>
      </div>
    </div>
  );
};
