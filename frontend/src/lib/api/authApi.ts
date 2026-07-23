import { apiClient } from './client';
import { API_ENDPOINTS } from './config';

/**
 * Decode a JWT payload (base64url) without verifying signature.
 * Used to extract email/sub from the token so we can display user info.
 */
function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return {};
  }
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  /** Decoded JWT payload: sub = email */
  _decoded?: Record<string, unknown>;
}

export interface SignupResponse {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
}

export const authApi = {
  /**
   * Login with username (email) + password.
   * Backend: POST /api/auth/login (OAuth2 form data)
   * Returns: { access_token, token_type }
   *
   * Note: The backend does NOT return role or expires_in.
   * Role defaults to 'admin' for now; future improvement: add /api/auth/me endpoint.
   */
  login: async (data: { username: string; password: string }): Promise<LoginResponse> => {
    const formData = new URLSearchParams();
    formData.append('username', data.username);
    formData.append('password', data.password);

    const result = await apiClient.post<LoginResponse>(
      API_ENDPOINTS.auth.login,
      formData,
      { 'Content-Type': 'application/x-www-form-urlencoded' }
    );

    // Decode the JWT to extract user email (stored in 'sub' claim)
    result._decoded = decodeJwtPayload(result.access_token);
    return result;
  },

  /**
   * Register a new user.
   * Backend: POST /api/auth/signup
   * Body: { email, password, full_name?, role? }
   * Returns: UserResponse (id, email, full_name, role, is_active, created_at)
   */
  signup: (data: {
    email: string;
    password: string;
    full_name?: string;
    role?: 'admin' | 'engineer' | 'operator';
  }): Promise<SignupResponse> =>
    apiClient.post<SignupResponse>(API_ENDPOINTS.auth.signup, data),
};
