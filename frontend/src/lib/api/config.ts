/**
 * API Configuration — Central service URL configuration
 *
 * HOW TO CHANGE BACKEND URL:
 * - Local development: defaults to '' (empty) — Vite proxy forwards /api → http://127.0.0.1:8000
 * - Production / Vercel: set VITE_API_BASE_URL environment variable to your Render backend URL
 *   e.g. VITE_API_BASE_URL=https://your-app.onrender.com
 *
 * In Vercel dashboard: Settings → Environment Variables → Add VITE_API_BASE_URL
 * In local .env.local file: VITE_API_BASE_URL=http://127.0.0.1:8000
 *
 * FILE LOCATION: frontend/src/lib/api/config.ts
 */

/**
 * The base URL for all API requests.
 * - In development, leave empty so Vite's proxy (vite.config.ts /api → localhost:8000) handles routing.
 * - In production, set VITE_API_BASE_URL to your deployed backend URL (e.g. https://xyz.onrender.com).
 */
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL || '';

/**
 * All backend API endpoint paths (relative to API_BASE_URL).
 * Update these if backend routes ever change — all callers will auto-update.
 */
export const API_ENDPOINTS = {
  // Authentication
  auth: {
    login: '/api/auth/login',    // POST — form data: username, password
    signup: '/api/auth/signup',  // POST — JSON: { email, password, full_name?, role? }
  },

  // Document Management
  documents: {
    list:   '/api/documents',                         // GET
    upload: '/api/documents/upload',                  // POST multipart/form-data
    byId:   (id: string) => `/api/documents/${id}`,   // GET
    delete: (id: string) => `/api/documents/${id}`,   // DELETE
    retry:  (id: string) => `/api/documents/${id}/retry`, // POST
  },

  // Copilot / RAG Chat
  copilot: {
    query:          '/api/copilot/query',                                       // POST
    sessions:       '/api/copilot/sessions',                                    // GET
    sessionHistory: (id: string) => `/api/copilot/sessions/${id}/history`,      // GET
  },

  // Knowledge Graph
  kg: {
    graph:    '/api/kg/graph',    // GET ?document_id=
    entities: '/api/kg/entities', // GET ?q=&entity_type=
  },

  // Specialized AI Agents
  agents: {
    rca:              '/api/agents/rca',               // POST { equipment_tag }
    complianceCheck:  '/api/agents/compliance-check',  // POST { regulation }
  },

  // System
  health: '/health',
} as const;
