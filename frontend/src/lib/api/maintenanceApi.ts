/** Maintenance API client — SRD 8.11 */
import { apiClient } from './client';
import type { MaintenanceRecommendation } from '@/types/api';

export const maintenanceApi = {
  /** GET /maintenance/recommendations — Equipment maintenance timeline + estimate (SRD 8.11) */
  getRecommendations: (equipmentTag: string): Promise<MaintenanceRecommendation> =>
    apiClient.get<MaintenanceRecommendation>('/maintenance/recommendations', { equipment_tag: equipmentTag }),
};
