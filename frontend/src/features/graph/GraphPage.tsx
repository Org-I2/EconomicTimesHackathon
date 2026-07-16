/** Knowledge Graph Page — visualizes entities and relationships (SRD FR-6, 7.9) */
import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import ForceGraph2D from 'react-force-graph-2d';
type ForceGraphMethods = any;
type NodeObject = any;
type LinkObject = any;
import { Network, RefreshCw, Filter, SlidersHorizontal, Info, Search, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { knowledgeApi } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import { useGraphFilterStore } from '@/stores/graphFilterStore';
import { LoadingExperience } from '@/components/ui/LoadingExperience';
import { cn, getDocTypeColor, formatDateTime } from '@/utils';
import type { GraphNode, GraphEdge, GraphNodeType } from '@/types/api';
import toast from 'react-hot-toast';

// Color map for node types
const NODE_COLORS: Record<GraphNodeType, string> = {
  Equipment: '#eab308', // accent/amber
  Document: '#3b82f6', // blue
  Incident: '#ef4444', // red
  SOP: '#10b981', // green
  Person: '#8b5cf6', // purple
  LessonLearned: '#f97316', // orange
};

// Size map for node types
const NODE_SIZES: Record<GraphNodeType, number> = {
  Equipment: 12,
  Document: 8,
  Incident: 10,
  SOP: 9,
  Person: 7,
  LessonLearned: 9,
};

interface CustomNode extends NodeObject {
  id: string;
  type: GraphNodeType;
  label: string;
  properties: Record<string, unknown>;
  val: number;
  color: string;
}

interface CustomLink extends LinkObject {
  id: string;
  type: string;
  source: string | CustomNode;
  target: string | CustomNode;
  weight: number;
}

/** Knowledge Graph visualization using react-force-graph-2d */
export default function GraphPage() {
  const navigate = useNavigate();
  const fgRef = useRef<ForceGraphMethods>();
  
  const {
    equipmentFilter, setEquipmentFilter,
    visibleNodeTypes, toggleNodeType,
    selectedNodeId, setSelectedNode, resetFilters
  } = useGraphFilterStore();

  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [searchInput, setSearchInput] = useState('');
  
  // Update dimensions on resize
  useEffect(() => {
    if (!containerRef) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });
    resizeObserver.observe(containerRef);
    return () => resizeObserver.disconnect();
  }, [containerRef]);

  // Fetch initial node if an equipment filter is set, otherwise we might fetch a subset or root node
  // ASSUMPTION: The backend `/knowledge/node/{id}` returns the node and its immediate neighbors (edges).
  // For the hackathon, we simulate a global graph by fetching a root node or a searched equipment tag.
  const rootQueryId = equipmentFilter || 'GLOBAL_ROOT';
  
  const { data: graphData, isLoading: graphLoading, isError: graphError, refetch: refetchGraph } = useQuery({
    queryKey: queryKeys.knowledge.node(rootQueryId),
    queryFn: () => knowledgeApi.getNode(rootQueryId),
    // If it's GLOBAL_ROOT and fails, maybe the graph isn't built yet
    retry: false,
  });

  const buildMutation = useMutation({
    mutationFn: () => knowledgeApi.build(),
    onSuccess: () => {
      toast.success('Graph rebuild triggered successfully');
    },
    onError: () => {
      toast.error('Failed to trigger graph rebuild');
    }
  });

  const handleSearch = () => {
    if (searchInput.trim()) {
      setEquipmentFilter(searchInput.trim());
      setSelectedNode(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  // Transform backend data to react-force-graph format
  const { nodes, links } = useMemo(() => {
    if (!graphData) return { nodes: [], links: [] };

    // Process nodes (apply filters)
    const processedNodes: CustomNode[] = [];
    const nodeIds = new Set<string>();

    // Add root node
    if (visibleNodeTypes[graphData.node.type]) {
      processedNodes.push({
        id: graphData.node.id,
        type: graphData.node.type,
        label: graphData.node.label,
        properties: graphData.node.properties,
        val: NODE_SIZES[graphData.node.type] * 1.5, // Root is larger
        color: NODE_COLORS[graphData.node.type],
      });
      nodeIds.add(graphData.node.id);
    }

    // Process edges to find neighbor nodes and links
    const processedLinks: CustomLink[] = [];
    
    graphData.edges.forEach((edge) => {
      // Create stub neighbor nodes if they pass filters
      // Note: Backend might need to provide neighbor types if we want to filter properly.
      // Assuming edge properties or a separate array provides neighbor details in a real app.
      // For this mock integration, we assume edges link to document/equipment IDs.
      
      const isTarget = edge.source_id === graphData.node.id;
      const neighborId = isTarget ? edge.target_id : edge.source_id;
      
      // Basic type inference from ID prefix for demonstration
      let neighborType: GraphNodeType = 'Document';
      if (neighborId.startsWith('EQ-') || /^[A-Z]-\d+/.test(neighborId)) neighborType = 'Equipment';
      if (neighborId.startsWith('INC-')) neighborType = 'Incident';
      
      if (visibleNodeTypes[neighborType]) {
        if (!nodeIds.has(neighborId)) {
          processedNodes.push({
            id: neighborId,
            type: neighborType,
            label: neighborId, // Fallback label
            properties: {},
            val: NODE_SIZES[neighborType],
            color: NODE_COLORS[neighborType],
          });
          nodeIds.add(neighborId);
        }
        
        processedLinks.push({
          id: edge.id,
          type: edge.relationship_type,
          source: edge.source_id,
          target: edge.target_id,
          weight: edge.weight,
        });
      }
    });

    return { nodes: processedNodes, links: processedLinks };
  }, [graphData, visibleNodeTypes]);

  const handleNodeClick = useCallback((node: CustomNode) => {
    setSelectedNode(node.id);
    
    // Pan to node
    if (fgRef.current) {
      fgRef.current.centerAt(node.x, node.y, 1000);
      fgRef.current.zoom(8, 2000);
    }
  }, [setSelectedNode]);

  // Paint custom nodes (draw circle + label)
  const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.label || node.id;
    const fontSize = 12 / globalScale;
    ctx.font = `${fontSize}px Inter, sans-serif`;
    
    // Draw Node
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false);
    
    if (node.id === selectedNodeId) {
      ctx.fillStyle = node.color;
      ctx.fill();
      ctx.lineWidth = 2 / globalScale;
      ctx.strokeStyle = '#fff';
      ctx.stroke();
      
      // Outer ring for selected
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.val + (4 / globalScale), 0, 2 * Math.PI, false);
      ctx.strokeStyle = node.color;
      ctx.stroke();
    } else {
      ctx.fillStyle = node.color;
      ctx.fill();
    }

    // Draw Label if zoomed in enough or selected
    if (globalScale > 1.5 || node.id === selectedNodeId) {
      const textWidth = ctx.measureText(label).width;
      const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); 
      
      ctx.fillStyle = 'rgba(24, 24, 27, 0.8)'; // surface-primary
      ctx.fillRect(
        node.x - bckgDimensions[0] / 2, 
        node.y + node.val + (2 / globalScale), 
        bckgDimensions[0], 
        bckgDimensions[1]
      );

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#e4e4e7'; // text-primary
      ctx.fillText(label, node.x, node.y + node.val + (2 / globalScale) + bckgDimensions[1] / 2);
    }
  }, [selectedNodeId]);

  // Selected node details
  const selectedNodeData = useMemo(() => {
    if (!selectedNodeId) return null;
    return nodes.find(n => n.id === selectedNodeId) || null;
  }, [selectedNodeId, nodes]);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <PageHeader
        title="Knowledge Graph"
        description="Explore semantic relationships between equipment, documents, and incidents"
        actions={
          <Button 
            variant="outline" 
            size="sm" 
            icon={<RefreshCw className={cn("h-4 w-4", buildMutation.isPending && "animate-spin")} />}
            onClick={() => buildMutation.mutate()}
            loading={buildMutation.isPending}
          >
            Rebuild Graph
          </Button>
        }
      />

      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        
        {/* Left: Controls & Details Panel */}
        <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0 overflow-y-auto pr-1">
          
          {/* Search/Filter Card */}
          <Card padding="md" className="shrink-0">
            <CardTitle className="text-sm mb-3 flex items-center gap-2">
              <Search className="h-4 w-4 text-text-tertiary" />
              Focus Node
            </CardTitle>
            <div className="flex gap-2">
              <Input
                placeholder="Equipment Tag or Doc ID..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1"
                mono
              />
              <Button size="icon" variant="secondary" onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            {equipmentFilter && (
              <div className="mt-3 flex items-center justify-between bg-surface-secondary p-2 rounded-md">
                <span className="text-xs text-text-secondary">
                  Focus: <strong className="text-accent-500 font-mono">{equipmentFilter}</strong>
                </span>
                <button 
                  onClick={() => { setEquipmentFilter(''); setSearchInput(''); }}
                  className="text-xs text-text-tertiary hover:text-text-primary"
                >
                  Clear
                </button>
              </div>
            )}
          </Card>

          {/* Type Filters Card */}
          <Card padding="md" className="shrink-0">
            <CardTitle className="text-sm mb-3 flex items-center gap-2">
              <Filter className="h-4 w-4 text-text-tertiary" />
              Node Types
            </CardTitle>
            <div className="flex flex-col gap-2">
              {(Object.keys(NODE_COLORS) as GraphNodeType[]).map((type) => (
                <label key={type} className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={visibleNodeTypes[type]}
                      onChange={() => toggleNodeType(type)}
                      className="peer sr-only"
                    />
                    <div className="w-4 h-4 rounded border border-border-primary bg-surface-secondary peer-checked:bg-accent-500 peer-checked:border-accent-500 transition-colors" />
                    <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: NODE_COLORS[type] }} />
                    <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">{type}</span>
                  </div>
                </label>
              ))}
            </div>
          </Card>

          {/* Node Details Card */}
          <Card className="flex-1 flex flex-col min-h-[250px]">
            <CardTitle className="text-sm mb-3 flex items-center gap-2">
              <Info className="h-4 w-4 text-text-tertiary" />
              Node Details
            </CardTitle>
            
            <div className="flex-1 overflow-y-auto bg-surface-secondary/30 rounded-md border border-border-primary p-3">
              {selectedNodeData ? (
                <div className="space-y-4">
                  <div>
                    <Badge style={{ backgroundColor: `${NODE_COLORS[selectedNodeData.type]}20`, color: NODE_COLORS[selectedNodeData.type], borderColor: `${NODE_COLORS[selectedNodeData.type]}40` }} className="mb-2">
                      {selectedNodeData.type}
                    </Badge>
                    <h4 className="text-base font-bold text-text-primary break-all">
                      {selectedNodeData.label}
                    </h4>
                    <p className="text-xs text-text-tertiary font-mono mt-1 break-all">
                      ID: {selectedNodeData.id}
                    </p>
                  </div>
                  
                  {Object.keys(selectedNodeData.properties).length > 0 && (
                    <div className="space-y-2 pt-3 border-t border-border-secondary">
                      <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Properties</p>
                      <dl className="space-y-1.5">
                        {Object.entries(selectedNodeData.properties).map(([k, v]) => (
                          <div key={k} className="flex flex-col">
                            <dt className="text-xs text-text-tertiary">{k.replace(/_/g, ' ')}</dt>
                            <dd className="text-sm text-text-secondary break-all">{String(v)}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}

                  {selectedNodeData.type === 'Document' && (
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="w-full mt-4"
                      onClick={() => navigate(`/documents/${selectedNodeData.id}`)}
                    >
                      View Document
                    </Button>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-text-tertiary">
                  <Network className="h-8 w-8 mb-2 opacity-20" />
                  <p className="text-sm">Select a node in the graph to view its details</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right: Graph Visualization */}
        <Card padding="none" className="flex-1 relative overflow-hidden bg-[#09090b]">
          {/* Controls overlay */}
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 bg-surface-primary/80 backdrop-blur-sm p-1.5 rounded-lg border border-border-primary">
            <button className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-surface-secondary rounded" onClick={() => fgRef.current?.zoom(fgRef.current.zoom() * 1.2, 400)} aria-label="Zoom In">
              <ZoomIn className="h-4 w-4" />
            </button>
            <button className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-surface-secondary rounded" onClick={() => fgRef.current?.zoom(fgRef.current.zoom() / 1.2, 400)} aria-label="Zoom Out">
              <ZoomOut className="h-4 w-4" />
            </button>
            <button className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-surface-secondary rounded" onClick={() => fgRef.current?.zoomToFit(400)} aria-label="Fit to Screen">
              <Maximize className="h-4 w-4" />
            </button>
          </div>

          <div ref={setContainerRef} className="w-full h-full">
            {graphLoading ? (
              <LoadingExperience 
                isLoading={true} 
                variant="graph"
                messages={['Building Knowledge Graph...', 'Connecting related assets...', 'Rendering relationships...']}
                overlay={false}
              />
            ) : nodes.length > 0 ? (
              <ForceGraph2D
                ref={fgRef}
                width={dimensions.width}
                height={dimensions.height}
                graphData={{ nodes, links }}
                nodeLabel="label"
                nodeColor="color"
                nodeRelSize={1}
                nodeCanvasObject={paintNode}
                linkColor={() => '#3f3f46'} // border-secondary
                linkWidth={(link: any) => Math.max(1, (link.weight || 1) * 2)}
                linkDirectionalParticles={2}
                linkDirectionalParticleWidth={1.5}
                linkDirectionalParticleColor={() => '#a1a1aa'}
                linkDirectionalParticleSpeed={0.005}
                onNodeClick={handleNodeClick}
                backgroundColor="transparent"
                cooldownTicks={100}
                onEngineStop={() => {
                  if (nodes.length < 50 && fgRef.current) fgRef.current.zoomToFit(400, 50);
                }}
              />
            ) : graphError ? (
              <ErrorState 
                title="Graph Loading Failed" 
                message="Cannot connect to the Knowledge Graph API." 
                onRetry={() => refetchGraph()} 
              />
            ) : (
              <EmptyState
                icon={<Network className="h-8 w-8" />}
                title="Graph empty"
                description={rootQueryId === 'GLOBAL_ROOT' ? "The knowledge graph hasn't been built yet or no documents are indexed." : `No connections found for ${rootQueryId}.`}
                action={
                  <Button onClick={() => buildMutation.mutate()} loading={buildMutation.isPending}>
                    Rebuild Knowledge Graph
                  </Button>
                }
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
