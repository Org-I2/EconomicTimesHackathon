/** Auth API client — SRD 8.1 */
import { apiClient } from './client';
import type { LoginRequest, LoginResponse } from '@/types/api';

export const authApi = {
  /** POST /auth/login — Authenticate and receive JWT */
  login: (data: LoginRequest): Promise<LoginResponse> =>
    apiClient.post<LoginResponse>('/auth/login', data),
};
