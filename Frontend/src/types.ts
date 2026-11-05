/**
 * SindhuDrishti Frontend Type Definitions
 * 
 * Strict TypeScript types aligned 1:1 with backend FastAPI Pydantic schemas.
 */

// ==========================================
// 1. SYSTEM HEALTH & STUDY AREA METADATA
// ==========================================
export interface HealthResponse {
  status: 'healthy' | 'unhealthy' | string;
  service: string;
  version: string;
}

export interface BoundingBox {
  min_lon: number;
  min_lat: number;
  max_lon: number;
  max_lat: number;
}

export interface StudyAreaDatasets {
  hotspots_count: number;
  water_masks_count: number;
  source: string;
  status: string;
}

export type BasinId = 'jayakwadi' | 'hussainsagar' | 'yamuna';

export interface BasinInfo {
  id: BasinId;
  name: string;
  basin: string;
  region: string;
  study_area_name: string;
  crs: string;
  center: [number, number];
  default_zoom: number;
  bounding_box: BoundingBox;
  description: string;
  status: string;
}

export interface StudyAreaMetadata {
  basin_id?: BasinId;
  basin: string;
  region: string;
  study_area_name: string;
  crs: string;
  center?: [number, number];
  default_zoom?: number;
  bounding_box: BoundingBox;
  description?: string;
  datasets: StudyAreaDatasets;
}


// ==========================================
// 2. GEOSPATIAL GEOJSON TYPES
// ==========================================
export type GeoJSONGeometry =
  | { type: 'Point'; coordinates: [number, number] }
  | { type: 'Polygon'; coordinates: number[][][] }
  | { type: 'MultiPolygon'; coordinates: number[][][][] };

export interface HotspotProperties {
  candidate?: number;
  candidate_id?: number;
  count?: number;
  area_m2?: number;
  source?: string;
  status?: string;
  confidence_score?: number;
  spectral_class?: string;
  fdi_value?: number;
  ndvi_value?: number;
  is_organic_vegetation?: boolean;
  ground_truth_status?: string;
  satellite_platform?: string;
  marida_class?: string;
  marida_confidence?: number;
  marida_rationale?: string;
  marida_probabilities?: Record<string, number>;
  zone_type?: 'pelagic_open_water' | 'shoreline_littoral' | string;
  distance_to_shore_m?: number;
  is_shoreline_edge_artifact?: boolean;
  edge_artifact_warning?: string;
  [key: string]: any;
}

export interface SatellitePassInfo {
  id: string;
  datetime: string;
  platform: string;
  tile_id: string;
  cloud_cover_percent: number;
  thumbnail_url?: string;
  stac_asset_href?: string;
}

export interface SatelliteStatus {
  status: string;
  satellite_constellation: string;
  data_provider: string;
  cost_tier: string;
  study_area: string;
  bounding_box: [number, number, number, number];
  latest_pass?: SatellitePassInfo;
  total_cached_passes: number;
}

export interface SatelliteSyncResponse {
  success: boolean;
  message: string;
  latest_pass?: SatellitePassInfo;
  hotspots_evaluated: number;
  candidate_debris_count: number;
  vegetation_hyacinth_count: number;
  sync_timestamp: string;
}

export interface WaterMaskProperties {
  area_m2?: number;
  count?: number;
  geometry_type?: string;
  water?: number;
  waterbody_name?: string;
  area_km2?: number;
  area_hectares?: number;
  perimeter_km?: number;
  ndwi_threshold?: number;
  mndwi_threshold?: number;
  extraction_algorithm?: string;
  spatial_resolution?: string;
  satellite_source?: string;
  water_clarity?: string;
  [key: string]: any;
}

export interface WaterMaskAnalysis {
  basin_id: BasinId;
  basin: string;
  region: string;
  waterbody_name: string;
  satellite_sensor: string;
  spatial_resolution: string;
  detection_algorithm: string;
  algorithm_code: 'mndwi' | 'ndwi' | 'awei' | string;
  applied_threshold: number;
  detected_surface_area_m2: number;
  detected_surface_area_km2: number;
  detected_surface_area_hectares: number;
  total_water_pixels: number;
  shoreline_perimeter_km: number;
  detection_confidence_percent: number;
  shoreline_exclusion_buffer_m: number;
  water_clarity_assessment: string;
  spectral_bands_used: string[];
  status: string;
}


export interface GeoJSONFeature<P = any> {
  type: 'Feature';
  id?: string;
  geometry: GeoJSONGeometry;
  properties: P;
}

export interface GeoJSONFeatureCollection<P = any> {
  type: 'FeatureCollection';
  features: GeoJSONFeature<P>[];
  metadata?: {
    total_matched?: number;
    source?: string;
    disclaimer?: string;
  };
}

// ==========================================
// 3. DASHBOARD & CLEANUP PRIORITIES
// ==========================================
export interface DashboardStats {
  candidate_hotspots: number;
  water_mask_features: number;
  citizen_reports_total: number;
  citizen_reports_pending: number;
  citizen_reports_verified: number;
  citizen_reports_rejected: number;
  reports_last_7_days: number;
  reports_last_30_days: number;
}

export type DataSource = 'satellite_candidate_hotspot' | 'citizen_report';

export interface CleanupPriorityFactor {
  name: string;
  value: number;
  weight: number;
  description: string;
}

export interface CleanupPriorityItem {
  id: string;
  source: DataSource;
  latitude: number;
  longitude: number;
  priority_score: number;
  factors: CleanupPriorityFactor[];
  explanation: string;
  raw_data: Record<string, any>;
}

export interface CleanupPriorityResponse {
  priorities: CleanupPriorityItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  methodology: string;
  limitations: string[];
}

// ==========================================
// 4. DRIFT SIMULATION
// ==========================================
export interface DriftSimulateRequest {
  latitude: number;
  longitude: number;
  duration_hours: number;
  timestep_minutes: number;
  particle_count: number;
  current_velocity_ms: number;
  current_direction_deg: number;
  wind_factor: number;
  wind_speed_ms: number;
  wind_direction_deg: number;
  random_seed?: number;
  hotspot_id?: string;
  debris_name?: string;
}

export interface DriftTrajectoryPoint {
  time_offset_hours: number;
  latitude: number;
  longitude: number;
  status: 'active' | 'out_of_bounds' | 'ashore' | string;
}

export interface ParticleTrajectory {
  particle_id: number;
  trajectory: DriftTrajectoryPoint[];
  final_status: string;
}

export interface InterceptionWaypoint {
  hour: number;
  latitude: number;
  longitude: number;
  status: string;
  zone_desc?: string;
  action?: string;
  is_optimal?: boolean;
}

export interface FieldAssetRequirement {
  skimmer_boats: number;
  containment_booms_meters: number;
  field_crew_count: number;
  estimated_extraction_hours: number;
}

export interface EconomicImpact {
  estimated_debris_mass_kg: number;
  estimated_debris_mass_tons: number;
  infrastructure_damage_prevented_inr: number;
  infrastructure_damage_prevented_lakhs: number;
  recovery_roi_multiplier: number;
  debris_area_m2?: number;
}

export interface FieldDispatchOrder {
  order_id: string;
  target_debris_id?: string;
  target_name: string;
  target_latitude: number;
  target_longitude: number;
  priority_level: string;
  critical_interception_window: string;
  optimal_staging_area: string;
  recommended_tactics: string[];
}

export interface DriftSummary {
  particle_count: number;
  duration_hours: number;
  timestep_minutes: number;
  active_at_end: number;
  out_of_bounds_at_end: number;
  beached_at_end?: number;
  tracked_debris_name?: string;
  tracked_debris_id?: string;
  starting_coordinates: {
    latitude: number;
    longitude: number;
  };
  drift_heading_degrees?: number;
  drift_heading_cardinal?: string;
  destination_target?: string;
  average_drift_speed_kmh?: number;
  total_drift_distance_km?: number;
  estimated_shore_interception_hours?: number;
  primary_driver?: string;
  recommended_action?: string;
  risk_level?: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' | string;
  interception_schedule?: InterceptionWaypoint[];
  estimated_debris_mass_kg?: number;
  estimated_debris_mass_tons?: number;
  field_assets?: FieldAssetRequirement;
  economic_impact?: EconomicImpact;
  field_dispatch_order?: FieldDispatchOrder;
}

export interface DriftSimulateResponse {
  simulation_id: string;
  timestamp: string;
  parameters: DriftSimulateRequest;
  particles: ParticleTrajectory[];
  summary: DriftSummary;
  disclaimer: string;
  limitations: string[];
}

// ==========================================
// 5. CITIZEN POLLUTION REPORTS & AI VISION
// ==========================================
export type ReportStatus = 'pending' | 'verified' | 'rejected';

export interface AIVisionPolymer {
  polymer: string;
  confidence_percent: number;
  color_hex: string;
}

export interface AIVisionCorrelation {
  matched_hotspot_id: string;
  distance_meters: number;
  correlation_confidence_percent: number;
  satellite_spectral_class: string;
  marida_class: string;
  fdi_value: number;
  validation_status: string;
}

export interface AIVisionAnalysis {
  model_version: string;
  has_analyzed_media: boolean;
  severity_grade: number;
  severity_label: string;
  estimated_litter_density_items_m2: number;
  polymer_breakdown: AIVisionPolymer[];
  is_satellite_correlated: boolean;
  satellite_correlation?: AIVisionCorrelation | null;
  recommended_field_action?: string;
}

export interface ReportCreate {
  latitude: string;
  longitude: string;
  description: string;
  photo_reference?: string;
}

export interface ReportUpdate {
  status: ReportStatus;
  reviewer_notes?: string;
}

export interface ReportResponse {
  report_id: string;
  latitude: string;
  longitude: string;
  description: string;
  photo_reference?: string | null;
  status: ReportStatus;
  submitted_at: string;
  reviewer_notes?: string | null;
  reviewed_at?: string | null;
  ai_vision_analysis?: AIVisionAnalysis | null;
}

export interface ChangeDetectionZoneSummary {
  count: number;
  area_m2: number;
  description: string;
}

export interface SatelliteChangeDetectionResponse {
  baseline_pass: SatellitePassInfo;
  comparison_pass: SatellitePassInfo;
  days_elapsed: number;
  accumulating_zones: ChangeDetectionZoneSummary;
  persistent_zones: ChangeDetectionZoneSummary;
  cleared_zones: ChangeDetectionZoneSummary;
  net_area_change_percent: number;
  net_debris_growth_status: string;
  features: GeoJSONFeature<HotspotProperties>[];
}

export interface ReportListResponse {
  reports: ReportResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export type ReportDetailResponse = ReportResponse;

// Navigation Routes
export type NavigationTab = 'landing' | 'explore-map' | 'dashboard' | 'drift' | 'reports';
