'use client';

import React, { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  ConnectionLineType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useWorkflowStore } from '@/lib/store/useWorkflowStore';
import { useWorkflowExecution } from '@/hooks/useWorkflowExecution';
import { TextInputNode } from './nodes/TextInputNode';
import { DirectorNode } from './nodes/DirectorNode';
import { ColorNode } from './nodes/ColorNode';
import { TypographyNode } from './nodes/TypographyNode';
import { ImagenNode } from './nodes/ImagenNode';
import { AppBuilderNode } from './nodes/AppBuilderNode';
import { AppScreenNode } from './nodes/AppScreenNode';
import { Play, Plus, Trash2, Palette, Type, Sparkles, ImageIcon, Smartphone } from 'lucide-react';

export function WorkflowCanvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, setNodes, setEdges } = useWorkflowStore();
  const { executeWorkflow, isExecuting } = useWorkflowExecution();

  const nodeTypes = useMemo(() => ({
    textInput: TextInputNode,
    director: DirectorNode,
    colorTheorist: ColorNode,
    typography: TypographyNode,
    imagen: ImagenNode,
    appBuilder: AppBuilderNode,
    appScreen: AppScreenNode,
  }), []);

  const addNode = (type: 'textInput' | 'director' | 'colorTheorist' | 'typography' | 'imagen' | 'appBuilder') => {
    const id = `${type}_${Date.now()}`;
    const newNode = {
      id,
      type,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: { status: 'idle', value: '', summary: '' },
    };
    setNodes([...nodes, newNode]);
  };

  const clearCanvas = () => {
    if (confirm('Are you sure you want to clear the entire canvas?')) {
      setNodes([]);
      setEdges([]);
    }
  };

  return (
    <div className="w-full h-screen bg-[#050505]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        colorMode="dark"
        connectionLineType={ConnectionLineType.Bezier}
        defaultEdgeOptions={{
          style: { stroke: '#E4E4E7', strokeWidth: 1.5, opacity: 0.4 },
          animated: true,
          type: 'bezier',
        }}
      >
        <Background color="#111" gap={20} size={1} />
        <Controls className="!bg-[#1A1A24] !border-[#2D2D3D] !fill-white" />
        <MiniMap 
          style={{ backgroundColor: '#0A0A0F' }}
          nodeColor={(node) => {
            if (node.type === 'textInput') return '#3b82f6';
            if (node.type === 'director') return '#a855f7';
            return '#1A1A1A';
          }}
          maskColor="rgba(0, 0, 0, 0.4)"
        />

        {/* Branding Panel */}
        <Panel position="top-left" className="bg-[#1A1A24]/90 border border-[#2D2D3D] p-4 rounded-2xl shadow-2xl backdrop-blur-xl m-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center shadow-xl shadow-indigo-500/20">
              <span className="text-white font-black text-2xl italic tracking-tighter">A</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-xl leading-none tracking-tight">Aesthetic Studio</h1>
              <div className="flex items-center gap-2 mt-1">
                 <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-[0.2em]">Engine Active</p>
              </div>
            </div>
          </div>
        </Panel>

        {/* Toolbar Panel */}
        <Panel position="top-right" className="m-4 flex flex-col gap-3">
          <div className="bg-[#1A1A24]/90 border border-[#2D2D3D] p-2 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col gap-2">
            <button 
              onClick={() => addNode('textInput')}
              className="w-12 h-12 rounded-xl bg-[#2D2D3D] hover:bg-[#3D3D4D] text-zinc-300 flex items-center justify-center transition-all group relative"
              title="Add Text Input"
            >
              <Plus size={20} />
              <span className="absolute right-14 bg-[#1A1A24] border border-[#2D2D3D] text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Text Input</span>
            </button>
            <button 
              onClick={() => addNode('appBuilder')}
              className="w-12 h-12 rounded-xl bg-[#2D2D3D] hover:bg-[#3D3D4D] text-cyan-400 flex items-center justify-center transition-all group relative"
              title="Add App Builder"
            >
              <Smartphone size={20} />
              <span className="absolute right-14 bg-[#1A1A24] border border-[#2D2D3D] text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">App Builder (AI)</span>
            </button>
          </div>

          <button 
            onClick={clearCanvas}
            className="w-12 h-12 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 flex items-center justify-center transition-all"
            title="Clear Canvas"
          >
            <Trash2 size={20} />
          </button>
        </Panel>

        {/* Action Panel */}
        <Panel position="bottom-center" className="mb-8">
          <div className="bg-[#1A1A24]/90 border border-[#2D2D3D] p-2 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl flex items-center gap-2 pr-6">
            <button 
              onClick={executeWorkflow}
              disabled={isExecuting || nodes.length === 0}
              className="h-12 px-8 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded-full font-bold shadow-xl shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-3 overflow-hidden group"
            >
              {isExecuting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                    <Play size={14} fill="currentColor" />
                  </div>
                  <span>Run Workflow</span>
                </>
              )}
            </button>
            
            {nodes.length > 0 && !isExecuting && (
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest pl-2">
                    {nodes.length} Nodes Loaded
                </div>
            )}
          </div>
        </Panel>
      </ReactFlow>
      
      <style jsx global>{`
        .react-flow__handle {
          width: 14px !important;
          height: 14px !important;
          border-radius: 50% !important;
          z-index: 100 !important;
          cursor: crosshair !important;
        }
        .react-flow__handle-right {
           box-shadow: 0 0 10px rgba(255, 255, 255, 0.3) !important;
        }
        .react-flow__edge-path {
          stroke-dasharray: 6;
          animation: dashdraw 1s linear infinite;
          filter: drop-shadow(0 0 3px rgba(99, 102, 241, 0.2));
        }
        @keyframes dashdraw {
          from { stroke-dashoffset: 12; }
          to { stroke-dashoffset: 0; }
        }
        .react-flow__controls {
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          background: rgba(13, 13, 18, 0.8) !important;
          backdrop-filter: blur(20px);
          border-radius: 16px !important;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.6) !important;
        }
        .react-flow__controls-button {
           border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
           fill: #71717a !important;
        }
        .react-flow__controls-button:hover {
           background: rgba(255, 255, 255, 0.05) !important;
           fill: #fff !important;
        }
      `}</style>
    </div>
  );
}
