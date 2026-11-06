/**
 * SindhuDrishti Unified API Client
 * 
 * Directly connected to FastAPI backend at /api/v1 (proxied via Vite).
 * Matches all 11 backend endpoints and schemas.
 */

import {
  HealthResponse,
  StudyAreaMetadata,
  GeoJSONFeatureCollection,
  HotspotProperties,
  WaterMaskProperties,
  DashboardStats,
  CleanupPriorityResponse,
  DriftSimulateRequest,
  DriftSimulateResponse,
  ReportCreate,
  ReportUpdate,
  ReportResponse,
  ReportDetailResponse,
  ReportListResponse,
  ReportStatus,
} from '../types';

// Configurable API base URL: defaults to '/api/v1' (proxied by Vite) or uses environment variable
const BASE_URL = (
  (import.meta.env?.VITE_API_BASE_URL as string | undefined) ||
  (import.meta.env?.VITE_API_URL ? `${(import.meta.env.VITE_API_URL as string).replace(/\/+$/, '')}/api/v1` : '/api/v1')
).replace(/\/+$/, '');

class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function fetchJson<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson && errJson.detail) {
        errorDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // Body not JSON
    }
    throw new ApiError(errorDetail, response.status);
  }

  return response.json();
}

export const api = {
  // 1. Health
  async getHealth(): Promise<HealthResponse> {
    return fetchJson<HealthResponse>('/health');
  },

  // 2. Multi-Basin Watershed Directory
  async getBasins(): Promise<{ basins: import('../types').BasinInfo[]; total: number }> {
    return fetchJson<{ basins: import('../types').BasinInfo[]; total: number }>('/basins');
  },

  // 3. Study Area Metadata
  async getStudyArea(basin = 'jayakwadi'): Promise<StudyAreaMetadata> {
    return fetchJson<StudyAreaMetadata>(`/study-area?basin=${encodeURIComponent(basin)}`);
  },

  // 4. Reservoir Water Masks (GeoJSON)
  async getWaterMasks(basin = 'jayakwadi'): Promise<GeoJSONFeatureCollection<WaterMaskProperties>> {
    return fetchJson<GeoJSONFeatureCollection<WaterMaskProperties>>(`/water-masks?basin=${encodeURIComponent(basin)}`);
  },

  // 4b. Multi-Spectral Water Detection Diagnostics & Analysis
  async getWaterMaskAnalysis(params?: {
    basin?: string;
    algorithm?: string;
    threshold?: number;
  }): Promise<import('../types').WaterMaskAnalysis> {
    const query = new URLSearchParams();
    if (params?.basin) query.set('basin', params.basin);
    if (params?.algorithm) query.set('algorithm', params.algorithm);
    if (params?.threshold !== undefined) query.set('threshold', params.threshold.toString());
    const qStr = query.toString();
    return fetchJson<import('../types').WaterMaskAnalysis>(`/water-masks/analysis${qStr ? `?${qStr}` : ''}`);
  },

  // 5. Candidate Hotspots (GeoJSON with optional basin, min_area, min_confidence, and spectral_class filter)
  async getHotspots(params?: {
    basin?: string;
    min_area?: number;
    status?: string;
    min_confidence?: number;
    spectral_class?: string;
    zone?: string;
    exclude_artifacts?: boolean;
    water_only?: boolean;
  }): Promise<GeoJSONFeatureCollection<HotspotProperties>> {
    const query = new URLSearchParams();
    if (params?.basin) {
      query.set('basin', params.basin);
    }
    if (params?.water_only) {
      query.set('water_only', 'true');
    }
    if (params?.min_area !== undefined && params.min_area > 0) {
      query.set('min_area', params.min_area.toString());
    }
    if (params?.status) {
      query.set('status', params.status);
    }
    if (params?.min_confidence !== undefined && params.min_confidence > 0) {
      query.set('min_confidence', params.min_confidence.toString());
    }
    if (params?.spectral_class && params.spectral_class !== 'all') {
      query.set('spectral_class', params.spectral_class);
    }
    if (params?.zone && params.zone !== 'all') {
      query.set('zone', params.zone);
    }
    if (params?.exclude_artifacts) {
      query.set('exclude_artifacts', 'true');
    }
    const qStr = query.toString();
    return fetchJson<GeoJSONFeatureCollection<HotspotProperties>>(`/hotspots${qStr ? `?${qStr}` : ''}`);
  },

  // 5. Dashboard Summary Statistics
  async getDashboardStats(): Promise<DashboardStats> {
    return fetchJson<DashboardStats>('/dashboard/stats');
  },

  // 6. Cleanup Priorities (Paginated with scoring factors)
  async getCleanupPriorities(page = 1, pageSize = 20): Promise<CleanupPriorityResponse> {
    const query = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });
    return fetchJson<CleanupPriorityResponse>(`/dashboard/cleanup/priorities?${query.toString()}`);
  },

  // 7. Kinematic Drift Simulation
  async simulateDrift(request: DriftSimulateRequest): Promise<DriftSimulateResponse> {
    return fetchJson<DriftSimulateResponse>('/drift/simulate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  // 8. Submit Citizen Pollution Report
  async createReport(report: ReportCreate): Promise<ReportResponse> {
    return fetchJson<ReportResponse>('/reports', {
      method: 'POST',
      body: JSON.stringify(report),
    });
  },

  // 9. List Reports (with status filter, pagination, and optional reviewer key)
  async getReports(params?: {
    status?: ReportStatus | 'all';
    page?: number;
    pageSize?: number;
    reviewerApiKey?: string;
  }): Promise<ReportListResponse> {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'all') {
      query.set('status', params.status);
    }
    if (params?.page) {
      query.set('page', params.page.toString());
    }
    if (params?.pageSize) {
      query.set('page_size', params.pageSize.toString());
    }

    const headers: Record<string, string> = {};
    if (params?.reviewerApiKey) {
      headers['X-Reviewer-API-Key'] = params.reviewerApiKey.trim();
    }

    const qStr = query.toString();
    return fetchJson<ReportListResponse>(`/reports${qStr ? `?${qStr}` : ''}`, {
      headers,
    });
  },

  // 10. Get Report by ID
  async getReport(reportId: string, reviewerApiKey?: string): Promise<ReportDetailResponse> {
    const headers: Record<string, string> = {};
    if (reviewerApiKey) {
      headers['X-Reviewer-API-Key'] = reviewerApiKey.trim();
    }
    return fetchJson<ReportDetailResponse>(`/reports/${encodeURIComponent(reportId)}`, {
      headers,
    });
  },

  // 11. Update Report Status (Reviewer Only, requires X-Reviewer-API-Key)
  async updateReportStatus(
    reportId: string,
    update: ReportUpdate,
    reviewerApiKey: string
  ): Promise<ReportDetailResponse> {
    return fetchJson<ReportDetailResponse>(`/reports/${encodeURIComponent(reportId)}/status`, {
      method: 'PATCH',
      headers: {
        'X-Reviewer-API-Key': reviewerApiKey.trim(),
      },
      body: JSON.stringify(update),
    });
  },

  // 12. Satellite STAC & Orbital Feed (Tier 4)
  async getSatelliteStatus(): Promise<import('../types').SatelliteStatus> {
    return fetchJson<import('../types').SatelliteStatus>('/satellite/status');
  },

  async getSatellitePasses(maxCloudCover = 30): Promise<{ passes: import('../types').SatellitePassInfo[]; total: number; latest?: import('../types').SatellitePassInfo }> {
    return fetchJson<{ passes: import('../types').SatellitePassInfo[]; total: number; latest?: import('../types').SatellitePassInfo }>(`/satellite/passes?max_cloud_cover=${maxCloudCover}`);
  },

  async syncSatellitePass(): Promise<import('../types').SatelliteSyncResponse> {
    return fetchJson<import('../types').SatelliteSyncResponse>('/satellite/sync', {
      method: 'POST',
    });
  },

  // 13. Multi-Temporal Sentinel-2 Pass Change Detection
  async getChangeDetection(): Promise<import('../types').SatelliteChangeDetectionResponse> {
    return fetchJson<import('../types').SatelliteChangeDetectionResponse>('/satellite/change-detection');
  },
};

export { ApiError };
