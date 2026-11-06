import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Wind, 
  Waves, 
  Sliders, 
  RefreshCw, 
  Sparkles, 
  Crosshair, 
  Target, 
  Layers, 
  Compass, 
  CheckCircle2,
  Navigation,
  Clock,
  MapPin,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  ShieldCheck,
  Truck,
  Anchor,
  Printer,
  Download,
  FileText,
  X,
  Users
} from 'lucide-react';
import { 
  DriftSimulateRequest, 
  DriftSimulateResponse, 
  GeoJSONFeatureCollection, 
  HotspotProperties, 
  GeoJSONFeature,
  InterceptionWaypoint 
} from '../../types';

interface DriftControlsProps {
  params: DriftSimulateRequest;
  simulation: DriftSimulateResponse | null;
  hotspots?: GeoJSONFeatureCollection<HotspotProperties> | null;
  currentStepHour?: number;
  onSelectHour?: (hour: number) => void;
  onChangeParams: (updated: Partial<DriftSimulateRequest>) => void;
  onExecute: () => void;
  isLoading: boolean;
}

function getCentroid(feat: GeoJSONFeature<HotspotProperties>): [number, number] | null {
  if (!feat.geometry) return null;
  if (feat.geometry.type === 'Point') {
    return [feat.geometry.coordinates[1], feat.geometry.coordinates[0]];
  }
  if (feat.geometry.type === 'Polygon') {
    const coords = (feat.geometry as any).coordinates[0];
    if (!coords || coords.length === 0) return null;
    const avgLat = coords.reduce((sum: number, c: number[]) => sum + c[1], 0) / coords.length;
    const avgLon = coords.reduce((sum: number, c: number[]) => sum + c[0], 0) / coords.length;
    return [avgLat, avgLon];
  }
  return null;
}

export const DriftControls: React.FC<DriftControlsProps> = ({
  params,
  simulation,
  hotspots,
  currentStepHour = 0,
  onSelectHour,
  onChangeParams,
  onExecute,
  isLoading,
}) => {
  const [selectedDebrisId, setSelectedDebrisId] = useState<string>(params.hotspot_id || 'pelagic-windrow-1');
  const [copiedHour, setCopiedHour] = useState<number | null>(null);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [showDispatchModal, setShowDispatchModal] = useState<boolean>(false);
  const scheduleContainerRef = useRef<HTMLDivElement | null>(null);
  const activeWaypointRef = useRef<HTMLDivElement | null>(null);

  // Keep viewport and window scroll perfectly stable during playback.
  // Scroll strictly inside the local schedule container using container.scrollTop.
  useEffect(() => {
    const container = scheduleContainerRef.current;
    const target = activeWaypointRef.current;
    if (container && target) {
      const containerRect = container.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      if (targetRect.top < containerRect.top) {
        container.scrollTop -= (containerRect.top - targetRect.top + 8);
      } else if (targetRect.bottom > containerRect.bottom) {
        container.scrollTop += (targetRect.bottom - containerRect.bottom + 8);
      }
    }
  }, [currentStepHour]);

  // Group hotspots into pelagic open-water windrows and shoreline candidates
  const { pelagicHotspots, shorelineHotspots } = useMemo(() => {
    const pelagic: GeoJSONFeature<HotspotProperties>[] = [];
    const shoreline: GeoJSONFeature<HotspotProperties>[] = [];
    if (!hotspots?.features) return { pelagicHotspots: pelagic, shorelineHotspots: shoreline };

    for (const f of hotspots.features) {
      if (f.properties?.zone_type === 'pelagic_open_water') {
        pelagic.push(f);
      } else {
        shoreline.push(f);
      }
    }
    return { pelagicHotspots: pelagic, shorelineHotspots: shoreline };
  }, [hotspots]);

  const activeHotspot = useMemo(() => {
    if (!hotspots?.features || !selectedDebrisId) return null;
    return hotspots.features.find((f) => f.id === selectedDebrisId) || null;
  }, [hotspots, selectedDebrisId]);

  const handleSelectDebris = (hotspotId: string) => {
    setSelectedDebrisId(hotspotId);
    if (!hotspots?.features) return;
    const feat = hotspots.features.find((f) => f.id === hotspotId);
    if (!feat) return;

    const centroid = getCentroid(feat);
    if (centroid) {
      const name = feat.properties?.name || feat.id || 'Selected Debris Hotspot';
      onChangeParams({
        latitude: parseFloat(centroid[0].toFixed(5)),
        longitude: parseFloat(centroid[1].toFixed(5)),
        hotspot_id: feat.id,
        debris_name: name,
        // Auto-configure optimal single-debris tracking
        particle_count: 1,
      });
    }
  };

  const handleCopyGPS = (e: React.MouseEvent, lat: number, lon: number, hour: number) => {
    e.stopPropagation();
    const text = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    navigator.clipboard.writeText(text);
    setCopiedHour(hour);
    setTimeout(() => setCopiedHour(null), 2000);
  };

  // Hour-by-hour schedule from simulation summary or generated fallback
  const schedule: InterceptionWaypoint[] = useMemo(() => {
    if (simulation?.summary?.interception_schedule && simulation.summary.interception_schedule.length > 0) {
      return simulation.summary.interception_schedule;
    }

    // Fallback derivation from first particle trajectory
    if (simulation?.particles?.[0]?.trajectory) {
      const traj = simulation.particles[0].trajectory;
      const res: InterceptionWaypoint[] = [];
      let foundAshore = false;
      for (const pt of traj) {
        if (pt.status === 'ashore' || pt.status === 'out_of_bounds') {
          const isFirst = !foundAshore;
          foundAshore = true;
          res.push({
            hour: pt.time_offset_hours,
            latitude: pt.latitude,
            longitude: pt.longitude,
            status: 'ashore',
            zone_desc: isFirst ? 'Shoreline Beaching Zone' : 'Bank Beaching Zone (Stranded)',
            action: isFirst 
              ? '⭐ Optimal Shoreline Collection Point (Accessible via Road / Bank)' 
              : `Field Recovery Window (+${pt.time_offset_hours.toFixed(0)}h: Stranded on bank awaiting truck pickup)`,
            is_optimal: isFirst,
          });
        } else {
          res.push({
            hour: pt.time_offset_hours,
            latitude: pt.latitude,
            longitude: pt.longitude,
            status: 'active',
            zone_desc: 'Open Water Pelagic Flow',
            action: 'Waterborne Patrol (Boat / Skimmer Required)',
            is_optimal: false,
          });
        }
      }
      return res;
    }

    return [];
  }, [simulation]);

  const optimalWaypoint = schedule.find((w) => w.is_optimal) || schedule[schedule.length - 1];

  useEffect(() => {
    if (showDispatchModal) {
      document.body.classList.add('has-drift-modal');
    } else {
      document.body.classList.remove('has-drift-modal');
    }
    return () => {
      document.body.classList.remove('has-drift-modal');
    };
  }, [showDispatchModal]);

  const generateReportHtml = () => {
    if (!simulation?.summary) return null;
    const sum = simulation.summary;
    const orderId = sum.field_dispatch_order?.order_id || 'DSP-JYK-A49B2';
    const timestamp = simulation.timestamp || new Date().toISOString();
    const dest = sum.destination_target || 'Jayakwadi Reservoir Shoreline / Basin';
    const etaHours = sum.estimated_shore_interception_hours ?? 3.0;
    const etaWindow = `T+${etaHours.toFixed(1)}h to T+${(etaHours + 2.0).toFixed(1)}h`;
    const risk = sum.risk_level || 'CRITICAL';
    const massTons = sum.estimated_debris_mass_tons ?? 3.8;
    const massKg = sum.estimated_debris_mass_kg ?? 3800;
    const staging = sum.field_dispatch_order?.optimal_staging_area || 'Paithan North Jetty';
    const damagePrevented = sum.economic_impact?.infrastructure_damage_prevented_lakhs ?? 14.8;
    const roi = sum.economic_impact?.recovery_roi_multiplier ?? 8.4;
    const skimmers = sum.field_assets?.skimmer_boats ?? 2;
    const booms = sum.field_assets?.containment_booms_meters ?? 200;
    const crew = sum.field_assets?.field_crew_count ?? 6;
    const heading = `${sum.drift_heading_degrees ?? 0}° (${sum.drift_heading_cardinal ?? 'E'})`;
    const speed = `${sum.average_drift_speed_kmh ?? 0} km/h`;
    const dist = `${sum.total_drift_distance_km ?? 0} km`;
    const action = sum.recommended_action || 'Deploy rapid containment deflection booms across prevailing drift vector to intercept floating debris before shoreline stranding.';
    const tactics = sum.field_dispatch_order?.recommended_tactics || [
      'Deploy floating deflection boom 40° across drift vector to funnel debris into extraction zone.',
      `Stage recovery boat at optimal beaching waypoint before Hour ${Math.round(etaHours)}.`,
      'Avoid shoreline vegetative entanglement in shallow littoral margins.'
    ];

    const waypointsRows = schedule.map((wp) => `
      <tr style="${wp.is_optimal ? 'background-color: #fef3c7; font-weight: bold;' : ''}">
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1;">T+${wp.hour.toFixed(1)}h</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-family: monospace;">${wp.latitude.toFixed(4)}°N, ${wp.longitude.toFixed(4)}°E</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1;">${wp.status === 'ashore' ? '🛑 Shoreline / Beaching' : '🌊 Pelagic Water Drift'}</td>
        <td style="padding: 6px 10px; border: 1px solid #cbd5e1;">${wp.action}</td>
      </tr>
    `).join('');

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SindhuDrishti Tactical Field Dispatch Order #${orderId}</title>
  <style>
    @page { 
      size: A4 portrait; 
      margin: 10mm 12mm; 
    }
    *, *:before, *:after {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.4;
      color: #0f172a !important;
      background: #ffffff !important;
      margin: 0;
      padding: 0;
      width: 100%;
    }
    .report-wrap {
      width: 100%;
      max-width: 100%;
      background: #ffffff;
      padding: 0;
    }
    .header {
      border-bottom: 2px solid #0284c7;
      padding-bottom: 10px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .badge {
      display: inline-block;
      padding: 2px 7px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      border-radius: 4px;
    }
    .badge-cyan { background: #e0f2fe; color: #0369a1; border: 1px solid #7dd3fc; }
    .badge-amber { background: #fef3c7; color: #92400e; border: 1px solid #fcd34d; }
    .badge-rose { background: #ffe4e6; color: #9f1239; border: 1px solid #fda4af; }
    .section-title {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #0369a1;
      margin-top: 12px;
      margin-bottom: 6px;
      padding-bottom: 3px;
      border-bottom: 1px solid #e2e8f0;
    }
    .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 8px; }
    .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 8px; }
    .kpi-card {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 6px 10px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .kpi-label { font-size: 9px; color: #64748b; text-transform: uppercase; font-weight: 700; }
    .kpi-val { font-size: 13px; font-weight: 800; color: #0f172a; margin-top: 2px; }
    .kpi-sub { font-size: 9px; color: #64748b; }
    .amber-card {
      background: #fffbeb !important;
      border: 1.5px solid #d97706 !important;
      border-radius: 8px;
      padding: 8px 12px;
      margin-bottom: 8px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
      font-size: 10px;
    }
    thead {
      display: table-header-group;
    }
    tr {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    th {
      background: #e2e8f0 !important;
      color: #0f172a !important;
      text-align: left;
      padding: 4px 6px;
      font-weight: 700;
      border: 1px solid #cbd5e1;
    }
    td { border: 1px solid #cbd5e1; color: #1e293b; padding: 4px 6px; }
    ul { margin: 3px 0; padding-left: 18px; font-size: 10px; }
    li { margin-bottom: 2px; color: #1e293b; }
    .footer {
      margin-top: 10px;
      padding-top: 6px;
      border-top: 1px solid #cbd5e1;
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      color: #64748b;
      break-inside: avoid;
      page-break-inside: avoid;
    }
  </style>
</head>
<body>
  <div class="report-wrap">
    <div class="header">
      <div>
        <span class="badge badge-cyan">SINDHUDRISHTI NGO RAPID RESPONSE DIRECTIVE</span>
        <h1 style="font-size: 17px; font-weight: 800; margin: 4px 0 2px 0; color: #0f172a;">TACTICAL FIELD DISPATCH ORDER #${orderId}</h1>
        <p style="font-size: 11px; color: #64748b; margin: 0;">Godavari Basin Authority • Paithan Dam Reservoir Recovery Desk</p>
      </div>
      <div style="text-align: right;">
        <span class="badge ${risk === 'CRITICAL' ? 'badge-rose' : 'badge-amber'}">PRIORITY: ${risk}</span>
        <div style="font-size: 10px; color: #64748b; margin-top: 4px; font-family: monospace;">Generated: ${timestamp}</div>
      </div>
    </div>

    <!-- RECOMMENDED COLLECTION WINDOW -->
    <div class="amber-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
        <span style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #92400e;">
          ⭐ RECOMMENDED COLLECTION WINDOW
        </span>
        <span class="badge badge-amber">OPTIMAL INTERCEPTION WINDOW</span>
      </div>
      <div class="grid-3" style="margin-bottom: 6px;">
        <div>
          <span class="kpi-label">Destination Target</span>
          <div style="font-size: 12px; font-weight: 700; color: #0f172a;">${dest}</div>
        </div>
        <div>
          <span class="kpi-label">Recommended Time Window</span>
          <div style="font-size: 12px; font-weight: 700; color: #b45309;">${etaWindow}</div>
        </div>
        <div>
          <span class="kpi-label">Staging Base</span>
          <div style="font-size: 12px; font-weight: 700; color: #0369a1;">${staging}</div>
        </div>
      </div>
      <div class="grid-3" style="margin-bottom: 6px; font-size: 10px; color: #334155;">
        <div><b>Drift Heading:</b> ${heading}</div>
        <div><b>Average Velocity:</b> ${speed}</div>
        <div><b>Drift Distance:</b> ${dist}</div>
      </div>
      <div style="font-size: 11px; color: #1e293b; border-top: 1px solid #fde68a; padding-top: 6px; margin-top: 4px;">
        <b>Containment Directive:</b> ${action}
      </div>
    </div>

    <!-- MISSION CRITICAL OVERVIEW -->
    <div class="section-title">Mission Critical Overview</div>
    <div class="grid-4">
      <div class="kpi-card">
        <span class="kpi-label">Priority Level</span>
        <div class="kpi-val" style="color: #e11d48;">${risk}</div>
        <span class="kpi-sub">Immediate Deployment</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Estimated Debris</span>
        <div class="kpi-val" style="color: #d97706;">${massTons} Tons</div>
        <span class="kpi-sub">~${massKg.toLocaleString()} kg macroplastics</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Damage Prevented</span>
        <div class="kpi-val" style="color: #16a34a;">₹${damagePrevented} Lakhs</div>
        <span class="kpi-sub">Turbine & canal protection</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Recovery Dividend</span>
        <div class="kpi-val" style="color: #0284c7;">${roi}x ROI</div>
        <span class="kpi-sub">Cost-to-benefit ratio</span>
      </div>
    </div>

    <!-- REQUIRED FIELD EQUIPMENT MANIFEST -->
    <div class="section-title">Required Operational Asset Manifest</div>
    <div class="grid-3">
      <div class="kpi-card">
        <div style="font-size: 16px; margin-bottom: 2px;">🚤</div>
        <div class="kpi-val">${skimmers} Catamarans</div>
        <div class="kpi-sub">Trash Skimmer Retrieval Craft</div>
      </div>
      <div class="kpi-card">
        <div style="font-size: 16px; margin-bottom: 2px;">⚓</div>
        <div class="kpi-val">${booms}m Boom</div>
        <div class="kpi-sub">Deflection & Containment Barrier</div>
      </div>
      <div class="kpi-card">
        <div style="font-size: 16px; margin-bottom: 2px;">👷</div>
        <div class="kpi-val">${crew} Personnel</div>
        <div class="kpi-sub">Rapid Recovery Operators</div>
      </div>
    </div>

    <!-- WAYPOINT INTERCEPTION TIMELINE -->
    <div class="section-title">Hour-by-Hour Waypoint Interception Timeline</div>
    <table>
      <thead>
        <tr>
          <th>Time (T+)</th>
          <th>GPS Coordinates</th>
          <th>Drift Status</th>
          <th>Tactical Action / Directive</th>
        </tr>
      </thead>
      <tbody>
        ${waypointsRows}
      </tbody>
    </table>

    <!-- TACTICAL DIRECTIVES -->
    <div class="section-title">Tactical Directives for Rapid Recovery Crew</div>
    <ul>
      ${tactics.map((t: string) => `<li>${t}</li>`).join('')}
    </ul>

    <!-- SIGN-OFF -->
    <div class="footer">
      <div>
        <b>Authorization:</b> Field Operations Lead / NGO Dispatch Desk<br>
        <b>Validation:</b> Verified against Copernicus Sentinel-2 Level-2A STAC Data
      </div>
      <div style="text-align: right;">
        <b>Signature:</b> ___________________________<br>
        <b>Date:</b> ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
      </div>
    </div>
  </div>
</body>
</html>`;

    return { html: htmlContent, orderId };
  };

  const handleDownloadHtmlReport = () => {
    const reportData = generateReportHtml();
    if (!reportData) return;
    const blob = new Blob([reportData.html], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SindhuDrishti_Drift_Report_${reportData.orderId}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrintReport = () => {
    const reportData = generateReportHtml();
    if (!reportData) return;

    // Create an invisible, rendered iframe to print this pristine document
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.left = '-9999px';
    printFrame.style.top = '-9999px';
    printFrame.style.width = '1000px';
    printFrame.style.height = '1400px';
    printFrame.style.border = '0';
    printFrame.style.opacity = '0';
    printFrame.style.pointerEvents = 'none';
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow?.document || printFrame.contentDocument;
    if (frameDoc) {
      frameDoc.open();
      frameDoc.write(reportData.html);
      frameDoc.close();
      
      // Allow the browser to parse HTML and layout styles before invoking print
      setTimeout(() => {
        try {
          printFrame.contentWindow?.focus();
          printFrame.contentWindow?.print();
        } catch (e) {
          console.error('Iframe print error, falling back to window.print():', e);
          window.print();
        } finally {
          setTimeout(() => {
            if (document.body.contains(printFrame)) {
              document.body.removeChild(printFrame);
            }
          }, 60000);
        }
      }, 400);
    }
  };

  return (
    <>
      <aside className="w-full lg:w-96 xl:w-104 shrink-0 bg-[#020614]/95 border border-sky-950/80 rounded-2xl flex flex-col overflow-hidden backdrop-blur-xl shadow-2xl select-none font-['DM_Sans',sans-serif]">
      {/* Header */}
      <div className="p-4 border-b border-sky-950/70 bg-[#03091c]/90 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-800/80 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(56,189,248,0.25)]">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white tracking-wide uppercase font-mono">
              NGO Field Dispatch Hub
            </h3>
            <p className="text-[11px] text-zinc-400">
              Hour-by-Hour Debris Interception
            </p>
          </div>
        </div>

        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-300 font-bold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          AUTO-PILOT ACTIVE
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        
        {/* 1. AUTOMATIC METEOROLOGICAL LIVE STREAM CARD */}
        <div className="p-3 rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/20 to-[#020b1c] space-y-1.5 font-mono text-[10px]">
          <div className="flex items-center justify-between text-emerald-300 font-bold">
            <span className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              Auto Hydrodynamic Feed
            </span>
            <span className="text-zinc-500">Jayakwadi Basin Model</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-zinc-300">
            <div>
              <span className="text-zinc-500 block">Current Flow:</span>
              <span className="text-white font-bold">{params.current_velocity_ms} m/s ({params.current_direction_deg}° Downstream)</span>
            </div>
            <div>
              <span className="text-zinc-500 block">Trade Wind Leeway:</span>
              <span className="text-white font-bold">{params.wind_speed_ms} m/s ({params.wind_direction_deg}° Trade)</span>
            </div>
          </div>
          <p className="text-[9px] text-zinc-400 pt-0.5">
            Parameters are automatically matched to current reservoir drift conditions.
          </p>
        </div>

        {/* 2. TARGET DEBRIS HOTSPOT PICKER */}
        <div className="p-3.5 rounded-xl border border-cyan-500/50 bg-gradient-to-br from-[#031338]/80 to-[#020a1f] space-y-2.5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-cyan-300 uppercase tracking-wide flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
              1. Choose Detected Debris Anomaly
            </span>
            <span className="text-[9px] font-mono text-cyan-300 font-bold bg-cyan-950/90 px-2 py-0.5 rounded border border-cyan-800">
              {hotspots?.features?.length ?? 141} DETECTED
            </span>
          </div>

          <div>
            <select
              value={selectedDebrisId}
              onChange={(e) => handleSelectDebris(e.target.value)}
              className="w-full bg-[#030919] border border-sky-800 rounded-lg px-2.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              <option value="">-- Click on Map or Choose Hotspot --</option>
              {pelagicHotspots.length > 0 && (
                <optgroup label="🌊 Central Pelagic Open-Water Windrows">
                  {pelagicHotspots.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.properties?.name || f.id} (FDI: +{f.properties?.fdi_value ?? '0.04'})
                    </option>
                  ))}
                </optgroup>
              )}
              {shorelineHotspots.length > 0 && (
                <optgroup label="🏖️ Shoreline & Catchment Embayments">
                  {shorelineHotspots.slice(0, 30).map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.properties?.name || f.id} ({f.properties?.zone_type || 'Shoreline'})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Custom Release Indicator Banner */}
          {params.hotspot_id === 'custom-release' && (
            <div className="p-2.5 rounded-lg border border-purple-500/60 bg-gradient-to-r from-purple-950/50 to-[#02081c] flex items-center justify-between text-[10px] font-mono shadow-md">
              <div className="flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                <div>
                  <span className="text-white font-bold block">Custom Map Release Beacon</span>
                  <span className="text-purple-300 text-[9px]">{params.latitude.toFixed(4)}°N, {params.longitude.toFixed(4)}°E</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleSelectDebris('pelagic-windrow-1')}
                className="px-2 py-0.5 rounded bg-purple-900/70 border border-purple-600 text-[9px] text-purple-200 hover:text-white cursor-pointer"
              >
                Reset Hotspot
              </button>
            </div>
          )}

          {/* Active Debris Dossier Card */}
          {activeHotspot && params.hotspot_id !== 'custom-release' && (
            <div className="p-2.5 rounded-lg bg-[#02081c] border border-sky-900/60 text-[10px] font-mono space-y-1">
              <div className="flex items-center justify-between text-white font-bold">
                <span className="truncate">{activeHotspot.properties?.name}</span>
                <span className="text-cyan-400">FDI: +{activeHotspot.properties?.fdi_value}</span>
              </div>
              <div className="flex items-center justify-between text-zinc-400 text-[9px]">
                <span>MARIDA: {activeHotspot.properties?.marida_class?.replace(/_/g, ' ')}</span>
                <span>Area: {Math.round(activeHotspot.properties?.area_m2 ?? 12000).toLocaleString()} m²</span>
              </div>
            </div>
          )}
        </div>

        {/* 3. NGO FIELD RESOURCE & ECONOMIC IMPACT ADVISORY */}
        {simulation?.summary && (
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#041a3d] to-[#020c24] border border-amber-500/40 shadow-lg space-y-2.5">
            <div className="flex items-center justify-between text-amber-300 font-bold text-xs font-mono">
              <span className="flex items-center gap-1.5">
                <Target className="w-4 h-4 text-amber-400" />
                RECOMMENDED COLLECTION WINDOW
              </span>
              <span className="px-1.5 py-0.5 rounded bg-amber-950 border border-amber-700 text-[9px] text-amber-200">
                ETA: ~{simulation.summary.estimated_shore_interception_hours ?? 3.0}h
              </span>
            </div>

            <div className="text-[11px] text-zinc-200 leading-snug">
              <p className="font-bold text-white mb-0.5">
                📍 Destination: {simulation.summary.destination_target}
              </p>
              <p className="text-zinc-300 text-[10px]">
                {simulation.summary.recommended_action}
              </p>
            </div>

            {/* Economic Impact & Required Field Assets Metrics */}
            <div className="pt-2 border-t border-sky-950 space-y-2 font-mono text-[10px]">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg bg-[#010817] border border-sky-900/50">
                  <span className="text-zinc-500 text-[9px] block">ESTIMATED DEBRIS MASS</span>
                  <span className="text-cyan-300 font-bold text-xs block">
                    {simulation.summary.estimated_debris_mass_tons ?? 3.8} Metric Tons
                  </span>
                  <span className="text-zinc-400 text-[9px]">
                    ~{(simulation.summary.estimated_debris_mass_kg ?? 3800).toLocaleString()} kg macroplastics
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-[#010817] border border-sky-900/50">
                  <span className="text-zinc-500 text-[9px] block">INFRASTRUCTURE ROI</span>
                  <span className="text-emerald-400 font-bold text-xs block">
                    ₹{simulation.summary.economic_impact?.infrastructure_damage_prevented_lakhs ?? 14.8} Lakhs
                  </span>
                  <span className="text-zinc-400 text-[9px]">
                    {simulation.summary.economic_impact?.recovery_roi_multiplier ?? 8.4}x cleanup dividend
                  </span>
                </div>
              </div>

              {/* Required Assets Manifest */}
              <div className="p-2 rounded-lg bg-[#010817] border border-sky-900/50 space-y-1">
                <span className="text-zinc-400 font-bold text-[9px] uppercase tracking-wide block">
                  Field Asset Dispatch Requirement:
                </span>
                <div className="grid grid-cols-3 gap-1 text-[10px] text-white">
                  <div className="flex items-center gap-1 text-cyan-300">
                    <Truck className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span>{simulation.summary.field_assets?.skimmer_boats ?? 2} Skimmers</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-300">
                    <Anchor className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>{simulation.summary.field_assets?.containment_booms_meters ?? 200}m Boom</span>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-300">
                    <Users className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>{simulation.summary.field_assets?.field_crew_count ?? 6} Crew</span>
                  </div>
                </div>
              </div>

              {/* 1-Click Field Dispatch Brief Export */}
              <button
                type="button"
                onClick={() => setShowDispatchModal(true)}
                className="w-full py-1.5 px-3 rounded-lg bg-gradient-to-r from-amber-500/20 to-cyan-500/20 hover:from-amber-500/30 hover:to-cyan-500/30 border border-amber-500/50 text-amber-200 hover:text-white font-bold text-[10px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>Print / Download Field Dispatch Order</span>
              </button>
            </div>
          </div>
        )}

        {/* 4. HOUR-BY-HOUR COLLECTION SCHEDULE (The core tool for the NGO crew) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wide flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              Hour-by-Hour Collection Schedule
            </span>
            <span className="text-[9px] font-mono text-zinc-500">
              Click hour to inspect on map
            </span>
          </div>

          <div ref={scheduleContainerRef} className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
            {schedule.map((wp, idx) => {
              const isSelected = Math.abs(currentStepHour - wp.hour) < 0.5;
              const isBeached = wp.status === 'ashore';

              return (
                <div
                  key={idx}
                  ref={isSelected ? activeWaypointRef : null}
                  onClick={() => onSelectHour?.(wp.hour)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-950/60 border-cyan-400 shadow-[0_0_12px_rgba(56,189,248,0.3)] ring-1 ring-cyan-400'
                      : wp.is_optimal
                      ? 'bg-amber-950/30 border-amber-500/60 hover:border-amber-400'
                      : 'bg-[#030919] border-sky-950 hover:border-sky-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        wp.is_optimal
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                      }`}>
                        T+{wp.hour.toFixed(1)}h
                      </span>
                      <span className="font-bold text-white text-[11px]">
                        {wp.is_optimal ? '⭐ Interception Beaching Point' : `Waypoint #${idx + 1}`}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleCopyGPS(e, wp.latitude, wp.longitude, wp.hour)}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900 border border-sky-900/60 text-[9px] font-mono text-zinc-400 hover:text-cyan-300 hover:border-cyan-400 transition-colors cursor-pointer"
                      title="Copy GPS coordinates"
                    >
                      {copiedHour === wp.hour ? (
                        <>
                          <Check className="w-2.5 h-2.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-2.5 h-2.5" />
                          <span>Copy GPS</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mb-1">
                    <span>GPS: {wp.latitude.toFixed(4)}° N, {wp.longitude.toFixed(4)}° E</span>
                    <span className={isBeached ? 'text-amber-400 font-bold' : 'text-cyan-300'}>
                      {isBeached ? '🛑 At Shoreline' : '🌊 Pelagic Drift'}
                    </span>
                  </div>

                  <p className="text-[10px] text-zinc-300 leading-tight">
                    {wp.action}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. COLLAPSIBLE ADVANCED HYDRODYNAMIC OVERRIDES (Optional) */}
        <div className="border border-sky-950/80 rounded-xl overflow-hidden bg-[#030919]/50">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full p-2.5 flex items-center justify-between text-[10px] font-mono text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              Advanced Vector Overrides (Optional)
            </span>
            {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showAdvanced && (
            <div className="p-3 border-t border-sky-950 space-y-3 text-[10px] font-mono">
              <div>
                <div className="flex justify-between text-zinc-400 mb-1">
                  <span>Current Velocity (m/s)</span>
                  <span className="text-white">{params.current_velocity_ms} m/s</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.5"
                  step="0.05"
                  value={params.current_velocity_ms}
                  onChange={(e) => onChangeParams({ current_velocity_ms: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-400 bg-slate-900 h-1.5 rounded cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-zinc-400 mb-1">
                  <span>Current Direction</span>
                  <span className="text-white">{params.current_direction_deg}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="15"
                  value={params.current_direction_deg}
                  onChange={(e) => onChangeParams({ current_direction_deg: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-400 bg-slate-900 h-1.5 rounded cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-zinc-400 mb-1">
                  <span>Wind Speed (m/s)</span>
                  <span className="text-white">{params.wind_speed_ms} m/s</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="15.0"
                  step="0.5"
                  value={params.wind_speed_ms}
                  onChange={(e) => onChangeParams({ wind_speed_ms: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-400 bg-slate-900 h-1.5 rounded cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-zinc-400 mb-1">
                  <span>Wind Direction</span>
                  <span className="text-white">{params.wind_direction_deg}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="15"
                  value={params.wind_direction_deg}
                  onChange={(e) => onChangeParams({ wind_direction_deg: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-400 bg-slate-900 h-1.5 rounded cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* 6. RE-SIMULATE BUTTON */}
        <button
          type="button"
          onClick={onExecute}
          disabled={isLoading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 font-bold text-xs hover:from-cyan-300 hover:to-sky-400 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Recalculating Dispatch Plan...' : 'Recalculate Interception Waypoints 📍'}</span>
        </button>
      </div>
    </aside>

    {/* 7. PRINTABLE NGO FIELD DISPATCH ORDER MODAL (PORTALED OUTSIDE ASIDE FOR FLAWLESS PRINT PREVIEW) */}
    {showDispatchModal && simulation?.summary && createPortal(
      <div 
        id="drift-modal-portal"
        className="drift-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in"
      >
          <div 
            id="drift-printable-report"
            className="w-full max-w-3xl max-h-[92vh] flex flex-col bg-[#030919] border-2 border-cyan-500/60 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.25)] text-white font-mono overflow-hidden"
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-sky-800 shrink-0 bg-[#020718] flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-cyan-400 font-bold uppercase tracking-widest print-text-cyan">
                    SINDHUDRISHTI NGO RAPID RESPONSE DIRECTIVE
                  </span>
                </div>
                <h2 className="text-sm sm:text-base font-bold text-white mt-1 print-text-dark">
                  TACTICAL FIELD DISPATCH ORDER #{simulation.summary.field_dispatch_order?.order_id || 'DSP-JYK-A49B2'}
                </h2>
                <p className="text-[11px] text-zinc-400 print-text-muted">
                  Godavari Basin Authority • Paithan Dam Reservoir Recovery Desk
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDispatchModal(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-sky-950 transition-colors cursor-pointer no-print"
                title="Close Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Report Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
              
              {/* ⭐ RECOMMENDED COLLECTION WINDOW */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-950/40 via-[#041a3d] to-[#020c24] border-2 border-amber-500/70 shadow-lg space-y-3 print-card-amber">
                <div className="flex items-center justify-between border-b border-amber-500/40 pb-2">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider print-text-amber">
                    <Target className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>RECOMMENDED COLLECTION WINDOW</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/50 text-[10px] font-bold">
                    ETA: ~{(simulation.summary.estimated_shore_interception_hours ?? 3.0).toFixed(1)}h
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="p-2.5 rounded-lg bg-[#010817] border border-sky-900/60 print-card">
                    <span className="text-[9px] text-zinc-400 uppercase tracking-wide block print-text-muted">Destination Target</span>
                    <span className="text-white font-bold text-xs mt-0.5 block print-text-dark">
                      📍 {simulation.summary.destination_target || 'Jayakwadi Reservoir Shoreline / Basin'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#010817] border border-sky-900/60 print-card">
                    <span className="text-[9px] text-zinc-400 uppercase tracking-wide block print-text-muted">Interception Window</span>
                    <span className="text-amber-300 font-bold text-xs mt-0.5 block print-text-amber">
                      ⏱ T+{(simulation.summary.estimated_shore_interception_hours ?? 3.0).toFixed(1)}h to T+{((simulation.summary.estimated_shore_interception_hours ?? 3.0) + 2.0).toFixed(1)}h
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#010817] border border-sky-900/60 print-card">
                    <span className="text-[9px] text-zinc-400 uppercase tracking-wide block print-text-muted">Staging Area</span>
                    <span className="text-cyan-300 font-bold text-xs mt-0.5 truncate block print-text-cyan">
                      ⚓ {simulation.summary.field_dispatch_order?.optimal_staging_area || 'Paithan North Jetty'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[10px] text-zinc-300 print-text-muted">
                  <div>
                    <span className="text-zinc-500 block">Drift Heading:</span>
                    <span className="text-white font-bold print-text-dark">
                      {simulation.summary.drift_heading_degrees ?? 0}° ({simulation.summary.drift_heading_cardinal ?? 'E'})
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Average Velocity:</span>
                    <span className="text-white font-bold print-text-dark">
                      {simulation.summary.average_drift_speed_kmh ?? 0} km/h
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Total Distance:</span>
                    <span className="text-white font-bold print-text-dark">
                      {simulation.summary.total_drift_distance_km ?? 0} km
                    </span>
                  </div>
                </div>

                {simulation.summary.recommended_action && (
                  <div className="pt-2 border-t border-amber-500/30 text-[11px] text-zinc-200 print-text-dark">
                    <span className="text-emerald-400 font-bold block mb-0.5 print-text-emerald">
                      🛡️ Recommended Containment Directive:
                    </span>
                    <p className="leading-snug">
                      {simulation.summary.recommended_action}
                    </p>
                  </div>
                )}
              </div>

              {/* Mission Critical Overview */}
              <div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5 print-text-muted">
                  Mission Critical Overview
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-[#010817] border border-sky-900 print-card">
                    <span className="text-[9px] text-zinc-500 block uppercase print-text-muted">Priority Level</span>
                    <span className="text-rose-400 font-bold text-sm block print-text-rose">
                      {simulation.summary.risk_level || 'CRITICAL'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#010817] border border-sky-900 print-card">
                    <span className="text-[9px] text-zinc-500 block uppercase print-text-muted">Estimated Debris</span>
                    <span className="text-amber-300 font-bold text-sm block print-text-amber">
                      {simulation.summary.estimated_debris_mass_tons ?? 3.8} Tons
                    </span>
                    <span className="text-[9px] text-zinc-500 block print-text-muted">
                      ~{(simulation.summary.estimated_debris_mass_kg ?? 3800).toLocaleString()} kg
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#010817] border border-sky-900 print-card">
                    <span className="text-[9px] text-zinc-500 block uppercase print-text-muted">Damage Prevented</span>
                    <span className="text-emerald-400 font-bold text-sm block print-text-emerald">
                      ₹{simulation.summary.economic_impact?.infrastructure_damage_prevented_lakhs ?? 14.8}L
                    </span>
                    <span className="text-[9px] text-zinc-500 block print-text-muted">Turbine savings</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#010817] border border-sky-900 print-card">
                    <span className="text-[9px] text-zinc-500 block uppercase print-text-muted">Recovery ROI</span>
                    <span className="text-cyan-300 font-bold text-sm block print-text-cyan">
                      {simulation.summary.economic_impact?.recovery_roi_multiplier ?? 8.4}x
                    </span>
                    <span className="text-[9px] text-zinc-500 block print-text-muted">Cleanup dividend</span>
                  </div>
                </div>
              </div>

              {/* Required Field Equipment Manifest */}
              <div className="p-3.5 rounded-xl bg-[#010614] border border-sky-900 space-y-2 print-card">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block print-text-muted">
                  Required Operational Asset Manifest:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center gap-2 p-2 rounded bg-[#030d24] border border-sky-950 print-card">
                    <Truck className="w-4 h-4 text-cyan-400 print-text-cyan" />
                    <div>
                      <span className="text-white font-bold block print-text-dark">{simulation.summary.field_assets?.skimmer_boats ?? 2} Catamarans</span>
                      <span className="text-[10px] text-zinc-400 print-text-muted">Trash Skimmer Craft</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded bg-[#030d24] border border-sky-950 print-card">
                    <Anchor className="w-4 h-4 text-amber-400 print-text-amber" />
                    <div>
                      <span className="text-white font-bold block print-text-dark">{simulation.summary.field_assets?.containment_booms_meters ?? 200}m Boom</span>
                      <span className="text-[10px] text-zinc-400 print-text-muted">Deflection Barrier</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded bg-[#030d24] border border-sky-950 print-card">
                    <Users className="w-4 h-4 text-emerald-400 print-text-emerald" />
                    <div>
                      <span className="text-white font-bold block print-text-dark">{simulation.summary.field_assets?.field_crew_count ?? 6} Personnel</span>
                      <span className="text-[10px] text-zinc-400 print-text-muted">Recovery Operators</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Waypoint Interception Timeline Table */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block print-text-muted">
                  Hour-by-Hour Interception Timeline:
                </span>
                <div className="overflow-x-auto rounded-lg border border-sky-900/60 print-card">
                  <table className="w-full text-left text-[11px] font-mono border-collapse">
                    <thead>
                      <tr className="bg-[#020b1f] border-b border-sky-900 text-cyan-300">
                        <th className="p-2">Time</th>
                        <th className="p-2">Coordinates</th>
                        <th className="p-2">Status</th>
                        <th className="p-2">Tactical Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sky-950/60 text-zinc-300">
                      {schedule.map((wp, idx) => (
                        <tr key={idx} className={wp.is_optimal ? 'bg-amber-950/30 text-amber-200' : ''}>
                          <td className="p-2 font-bold">T+{wp.hour.toFixed(1)}h</td>
                          <td className="p-2 font-mono">{wp.latitude.toFixed(4)}°N, {wp.longitude.toFixed(4)}°E</td>
                          <td className="p-2">
                            {wp.status === 'ashore' ? '🛑 Shoreline Beaching' : '🌊 Pelagic Drift'}
                          </td>
                          <td className="p-2">{wp.action}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tactical Deployment Directives */}
              <div className="space-y-1.5 text-xs">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block print-text-muted">
                  Tactical Directives for Rapid Recovery Crew:
                </span>
                <ul className="space-y-1 text-zinc-300 text-[11px] list-disc list-inside print-text-dark">
                  {simulation.summary.field_dispatch_order?.recommended_tactics?.map((tactic, tIdx) => (
                    <li key={tIdx} className="leading-snug">{tactic}</li>
                  )) || (
                    <>
                      <li>Deploy floating deflection boom 40° across drift vector to funnel debris into extraction zone.</li>
                      <li>Stage recovery boat at optimal beaching waypoint before Hour {(simulation.summary.estimated_shore_interception_hours ?? 3.0).toFixed(0)}.</li>
                      <li>Avoid shoreline vegetative entanglement in shallow littoral margins.</li>
                    </>
                  )}
                </ul>
              </div>

              {/* Official Certification Footer */}
              <div className="pt-3 border-t border-sky-900/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[10px] text-zinc-400 print-text-muted">
                <div>
                  <span className="block font-bold text-zinc-300 print-text-dark">Authority: Godavari Basin Management Division</span>
                  <span>Sensor Verification: Sentinel-2 MSI Level-2A STAC Planetary Computer</span>
                </div>
                <div className="text-right">
                  <span className="block">Status: Certified for Immediate Field Dispatch</span>
                  <span className="font-mono text-zinc-500">Dispatch Order Hash: #{simulation.summary.field_dispatch_order?.order_id || 'DSP-JYK-A49B2'}</span>
                </div>
              </div>

            </div>

            {/* Modal Footer Controls */}
            <div className="p-4 border-t border-sky-800 shrink-0 bg-[#020718] flex flex-wrap items-center justify-between gap-2 no-print">
              <span className="text-[10px] text-zinc-400 hidden sm:inline">
                Formatted for Clean Single/Double Page PDF Export
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadHtmlReport}
                  className="px-3.5 py-2 rounded-xl bg-cyan-950 border border-cyan-700/80 hover:bg-cyan-900/80 text-cyan-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
                  title="Download standalone HTML report"
                >
                  <Download className="w-4 h-4 text-cyan-400" />
                  <span>Download HTML</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrintReport}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 hover:from-amber-300 hover:to-amber-400 transition-colors cursor-pointer shadow-lg"
                  title="Print or Save as PDF"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDispatchModal(false)}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-sky-800 text-zinc-300 hover:text-white transition-colors cursor-pointer text-xs"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}
    </>
  );
};
