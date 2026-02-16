'use client';

import { useState } from 'react';
import { useWorkflowStore } from '@/lib/store/useWorkflowStore';
import { sortNodes, nodeExecutors } from '@/lib/engine/workflowEngine';

export function useWorkflowExecution() {
  const { nodes, edges, setNodes } = useWorkflowStore();
  const [isExecuting, setIsExecuting] = useState(false);

  const executeWorkflow = async () => {
    if (isExecuting) return;
    setIsExecuting(true);

    try {
      // 0. SMART ACTION: Auto-spawn Imagen nodes for generative prompts
      const textNodes = nodes.filter(n => n.type === 'textInput' && (n.data.value?.toLowerCase().includes('create') || n.data.value?.toLowerCase().includes('generate')));
      
      let currentNodes = [...nodes];
      let currentEdges = [...edges];
      let nodesChanged = false;

      for (const tNode of textNodes) {
        // Check if already connected to an imagen node
        const isConnectedToImagen = edges.some(e => e.source === tNode.id && currentNodes.find(n => n.id === e.target)?.type === 'imagen');
        
        if (!isConnectedToImagen) {
          const newId = `imagen_auto_${Date.now()}`;
          const newNode = {
            id: newId,
            type: 'imagen',
            position: { x: tNode.position.x + 400, y: tNode.position.y },
            data: { status: 'idle', image: null, prompt: '' }
          };
          const newEdge = {
            id: `edge_auto_${Date.now()}`,
            source: tNode.id,
            target: newId,
            sourceHandle: 'text',
            targetHandle: 'prompt',
            animated: true
          };
          currentNodes.push(newNode);
          currentEdges.push(newEdge);
          nodesChanged = true;
        }
      }

      // 0b. SMART ACTION: Auto-spawn AppScreen nodes for App Builder nodes
      const appBuilderNodes = currentNodes.filter(n => n.type === 'appBuilder');

      for (const abNode of appBuilderNodes) {
        const selectedScreens: string[] = abNode.data.selectedScreens || [];
        const customScreens: string[] = abNode.data.customScreens || [];
        const allScreens = [...selectedScreens, ...customScreens];

        if (allScreens.length === 0) continue;

        // Check if this builder already has spawned screen nodes
        const existingScreenEdges = currentEdges.filter(e => e.source === abNode.id && currentNodes.find(n => n.id === e.target)?.type === 'appScreen');
        
        if (existingScreenEdges.length === 0) {
          // Spawn one AppScreen node per screen
          for (let i = 0; i < allScreens.length; i++) {
            const screenId = `appScreen_${Date.now()}_${i}`;
            const screenNode = {
              id: screenId,
              type: 'appScreen',
              position: { 
                x: abNode.position.x + 420, 
                y: abNode.position.y + (i * 320) - ((allScreens.length - 1) * 160)
              },
              data: { 
                status: 'idle', 
                image: null, 
                screenName: allScreens[i],
                screenIndex: i + 1,
                totalScreens: allScreens.length,
                appDescription: abNode.data.value || '',
                colorHex: abNode.data.colorHex || '',
              }
            };
            const screenEdge = {
              id: `edge_screen_${Date.now()}_${i}`,
              source: abNode.id,
              target: screenId,
              sourceHandle: 'screens',
              targetHandle: 'config',
              animated: true
            };
            currentNodes.push(screenNode);
            currentEdges.push(screenEdge);
            nodesChanged = true;
          }
        }
      }

      if (nodesChanged) {
        useWorkflowStore.getState().setNodes(currentNodes);
        useWorkflowStore.getState().setEdges(currentEdges);
      }

      // 1. Sort nodes by dependency
      const sortedNodes = sortNodes(currentNodes, currentEdges);
      
      // 2. Clear previous outputs and set statuses to idle
      currentNodes = currentNodes.map(n => ({
        ...n,
        data: { ...n.data, status: 'idle', output: null }
      }));
      setNodes(currentNodes);

      // 3. Execute nodes one by one
      for (const node of sortedNodes) {
        // Update status to running
        currentNodes = currentNodes.map(n => 
          n.id === node.id ? { ...n, data: { ...n.data, status: 'running' } } : n
        );
        setNodes(currentNodes);

        try {
          // Gather inputs from previous nodes — use currentEdges (includes auto-spawned)
          const incomingEdges = currentEdges.filter(e => e.target === node.id);
          const inputs: Record<string, any> = {};
          
          incomingEdges.forEach(edge => {
            const sourceNode = currentNodes.find(n => n.id === edge.source);
            if (sourceNode && sourceNode.data.output !== undefined && sourceNode.data.output !== null) {
              const output = sourceNode.data.output;
              const handleId = edge.targetHandle || 'default';
              
              // If source output is an object, take specific handle if it matches
              inputs[handleId] = typeof output === 'object' 
                ? (output[edge.sourceHandle || ''] ?? output) 
                : output;
              
              console.log(`[Engine] Node ${node.id} received input for "${handleId}":`, inputs[handleId]);
            }
          });

          // Execute node logic
          const executor = nodeExecutors[node.type || ''];
          if (executor) {
            const result = await executor(node.id, inputs, node.data);
            
            // Update node with result and completed status
            // Spread result into data so node components can read fields directly
            const spreadData = typeof result === 'object' && result !== null ? result : {};
            currentNodes = currentNodes.map(n => 
              n.id === node.id ? { 
                ...n, 
                data: { 
                    ...n.data, 
                    ...spreadData,
                    status: 'completed', 
                    output: result,
                } 
              } : n
            );
          } else {
             currentNodes = currentNodes.map(n => 
              n.id === node.id ? { ...n, data: { ...n.data, status: 'completed' } } : n
            );
          }

          setNodes(currentNodes);
        } catch (err) {
          console.error(`Error executing node ${node.id}:`, err);
          currentNodes = currentNodes.map(n => 
            n.id === node.id ? { ...n, data: { ...n.data, status: 'error' } } : n
          );
          setNodes(currentNodes);
          // Don't throw — continue other nodes if possible
        }
      }
    } catch (error) {
      console.error('Workflow Execution Failed:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  return { executeWorkflow, isExecuting };
}
