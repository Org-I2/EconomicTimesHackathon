import { apiClient } from './client';
import { API_ENDPOINTS } from './config';

export interface GraphNode {
  id: string;
  label: string;
  type: string; // e.g. "Equipment", "Document", "Person"
  properties?: any;
}

export interface GraphLink {
  source: string;
  target: string;
  type: string; // e.g. "MENTIONED_IN", "HAS_INCIDENT"
}

export interface GraphResponse {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface EntityResponse {
  id: string;
  entity_type: string;
  entity_value: string;
  context_snippet: string | null;
}

export const knowledgeApi = {
  /**
   * Fetch the full knowledge graph (nodes + links) for visualization.
   * Optionally filter by a specific document ID.
   * GET /api/kg/graph?document_id={id}
   * Returns: { nodes: [{id, label, type}], links: [{source, target, type}] }
   */
  getGraph: (documentId?: string): Promise<GraphResponse> =>
    apiClient.get<GraphResponse>(API_ENDPOINTS.kg.graph, {
      ...(documentId ? { document_id: documentId } : {}),
    }),

  /**
   * Search/list extracted entities.
   * GET /api/kg/entities?q={query}&entity_type={type}
   */
  getEntities: (q?: string, entityType?: string): Promise<EntityResponse[]> =>
    apiClient.get<EntityResponse[]>(API_ENDPOINTS.kg.entities, {
      ...(q ? { q } : {}),
      ...(entityType ? { entity_type: entityType } : {}),
    }),

  getNode: async (id: string) => {
    const res = await apiClient.get<GraphResponse>(API_ENDPOINTS.kg.graph);
    // Mock mapping from nodes/links to node/edges format for GraphPage
    const node = res.nodes.find((n: any) => n.id === id) || { id, type: 'Equipment', label: id, properties: {} };
    const edges = res.links.map((l: any) => ({
      id: l.source + '-' + l.target,
      source_id: l.source,
      target_id: l.target,
      relationship_type: l.type,
      weight: 1
    }));
    return { node, edges };
  },

  build: async () => {
    return { status: 'success' };
  }
};
