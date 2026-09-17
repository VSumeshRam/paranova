'use client';

import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface GraphHUDProps {
  nodesData: any[]; // Knowledge nodes
  edgesData: any[]; // Prerequisites
  masteryStates: Record<string, { pMastery: number; isMastered: boolean }>;
  activeNodeId: string | null;
  diagnosedGapNodeId: string | null;
  activeAntiPatternNodeId: string | null;
}

export function GraphHUD({ 
  nodesData, 
  edgesData, 
  masteryStates, 
  activeNodeId, 
  diagnosedGapNodeId, 
  activeAntiPatternNodeId 
}: GraphHUDProps) {
  
  // Base layout positioning for the 5-node arithmetic DAG
  const layoutMap: Record<string, {x: number, y: number}> = {
    'NODE_INT': { x: 250, y: 50 },
    'NODE_DIV': { x: 250, y: 150 },
    'NODE_FRAC_CORE': { x: 250, y: 250 },
    'NODE_COMMON_DENOM': { x: 250, y: 350 },
    'NODE_FRAC_ADD': { x: 250, y: 450 },
  };

  const initialNodes = useMemo(() => {
    return nodesData.map(node => {
      const state = masteryStates[node.id] || { pMastery: 0.1, isMastered: false };
      
      let bgColor = '#f3f4f6'; // default gray
      let borderColor = '#d1d5db';
      let textColor = '#374151';

      if (node.id === activeAntiPatternNodeId) {
        bgColor = '#fef2f2';
        borderColor = '#ef4444'; // Red
        textColor = '#991b1b';
      } else if (node.id === diagnosedGapNodeId) {
        bgColor = '#fffbeb';
        borderColor = '#f59e0b'; // Amber
        textColor = '#92400e';
      } else if (node.id === activeNodeId) {
        bgColor = '#eff6ff';
        borderColor = '#3b82f6'; // Blue
        textColor = '#1e40af';
      } else if (state.isMastered) {
        bgColor = '#ecfdf5';
        borderColor = '#10b981'; // Green
        textColor = '#065f46';
      }

      return {
        id: node.id,
        position: layoutMap[node.id] || { x: 0, y: 0 },
        data: { 
          label: (
            <div className="flex flex-col items-center p-2">
              <span className="font-bold text-sm text-center">{node.label}</span>
              <span className="text-xs mt-1">
                P(L) = {(state.pMastery * 100).toFixed(1)}%
              </span>
            </div>
          )
        },
        style: {
          background: bgColor,
          border: `2px solid ${borderColor}`,
          color: textColor,
          borderRadius: '8px',
          width: 180,
        }
      };
    });
  }, [nodesData, masteryStates, activeNodeId, diagnosedGapNodeId, activeAntiPatternNodeId]);

  const initialEdges = useMemo(() => {
    return edgesData.map(edge => ({
      id: `e-${edge.sourceId}-${edge.targetId}`,
      source: edge.sourceId,
      target: edge.targetId,
      animated: edge.targetId === activeNodeId,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: '#9ca3af',
      },
      style: { stroke: '#9ca3af', strokeWidth: 2 },
    }));
  }, [edgesData, activeNodeId]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="w-full h-full relative border rounded-xl overflow-hidden bg-white shadow-inner">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        attributionPosition="bottom-right"
      >
        <Background gap={16} size={1} />
        <Controls />
        <MiniMap zoomable pannable />
      </ReactFlow>
      
      {/* HUD Overlay Drawer */}
      <div className="absolute top-4 right-4 w-64 bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-gray-200">
        <h3 className="font-bold text-gray-800 mb-2 border-b pb-2">Telemetry HUD</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Active Node:</span>
            <span className="font-medium text-blue-600 truncate max-w-[120px]">{activeNodeId || 'None'}</span>
          </div>
          {diagnosedGapNodeId && (
            <div className="flex justify-between text-amber-600">
              <span>Gap Found:</span>
              <span className="font-bold">{diagnosedGapNodeId}</span>
            </div>
          )}
          {activeAntiPatternNodeId && (
            <div className="flex justify-between text-red-600">
              <span>Misconception:</span>
              <span className="font-bold">Detected</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
