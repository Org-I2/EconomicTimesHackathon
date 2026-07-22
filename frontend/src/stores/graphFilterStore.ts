/** Knowledge Graph filter store — manages graph view state (Zustand) */
import { create } from 'zustand';
import type { GraphNodeType } from '@/types/api';

interface GraphFilterState {
  /** Current focal equipment tag filter */
  equipmentFilter: string;

  /** Node type visibility toggles */
  visibleNodeTypes: Record<GraphNodeType, boolean>;

  /** Currently selected node ID */
  selectedNodeId: string | null;

  setEquipmentFilter: (filter: string) => void;
  toggleNodeType: (type: GraphNodeType) => void;
  setSelectedNode: (id: string | null) => void;
  resetFilters: () => void;
}

const defaultVisibility: Record<GraphNodeType, boolean> = {
  Equipment: true,
  Document: true,
  Incident: true,
  SOP: true,
  Person: true,
  LessonLearned: true,
};

export const useGraphFilterStore = create<GraphFilterState>((set) => ({
  equipmentFilter: '',
  visibleNodeTypes: { ...defaultVisibility },
  selectedNodeId: null,

  setEquipmentFilter: (filter) => set({ equipmentFilter: filter }),

  toggleNodeType: (type) =>
    set((s) => ({
      visibleNodeTypes: {
        ...s.visibleNodeTypes,
        [type]: !s.visibleNodeTypes[type],
      },
    })),

  setSelectedNode: (id) => set({ selectedNodeId: id }),

  resetFilters: () =>
    set({
      equipmentFilter: '',
      visibleNodeTypes: { ...defaultVisibility },
      selectedNodeId: null,
    }),
}));
