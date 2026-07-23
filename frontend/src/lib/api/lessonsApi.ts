/** Lessons Learned API client — SRD 8.14–8.15 */
import { apiClient } from './client';
import type {
  LessonLearnedRequest,
  LessonLearnedListItem,
  LessonCreatedResponse,
  PaginatedResponse,
} from '@/types/api';

export interface LessonsQueryParams {
  page?: number;
  page_size?: number;
  equipment_tag?: string;
  tag?: string;
}

export const lessonsApi = {
  /** POST /api/lessons — Submit a lesson learned entry (SRD 8.14) */
  create: (data: LessonLearnedRequest): Promise<LessonCreatedResponse> =>
    apiClient.post<LessonCreatedResponse>('/api/lessons', data),

  /** GET /api/lessons — Browse/search lessons (SRD 8.15) */
  list: (params?: LessonsQueryParams): Promise<PaginatedResponse<LessonLearnedListItem>> =>
    apiClient.get<PaginatedResponse<LessonLearnedListItem>>('/api/lessons', params as Record<string, string | number | boolean>),
};
