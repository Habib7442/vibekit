import { Node, Edge } from '@xyflow/react';
import { expandPrompt } from '@/lib/gemini';
import { generateAIImage, generateScreenImageAction } from '@/lib/actions/ai.actions';

export type NodeStatus = 'idle' | 'running' | 'completed' | 'error';

/**
 * The core logic for each node type
 */
export const nodeExecutors: Record<string, (id: string, inputs: any, config: any) => Promise<any>> = {
  textInput: async (id, inputs, config) => {
    // Pass both the text value and any configured settings (like aspectRatio)
    return {
      text: config.value || '',
      aspectRatio: config.aspectRatio || '1:1'
    };
  },

  director: async (id, inputs, config) => {
    const prompt = inputs.brand_info || '';
    if (!prompt) throw new Error('No brand info provided to Director');
    
    // Call Gemini expandPrompt
    const result = await expandPrompt(prompt);
    return result; // { detailedPrompt, niche, palette }
  },
  
  colorTheorist: async (id, inputs, config) => {
    const styleLogic = inputs.palette || inputs.style_json;
    if (!styleLogic || !styleLogic.palette) {
        return { primary: '#111111', secondary: '#333333', accent: '#6366f1' };
    }
    return styleLogic.palette;
  },

  typography: async (id, inputs, config) => {
    const styleLogic = inputs.style_logic || {};
    const niche = styleLogic.niche || 'General Design';
    const aesthetic = styleLogic.detailedPrompt || 'Modern and Minimalist';
    
    const { suggestTypography } = await import('@/lib/gemini');
    const result = await suggestTypography(niche, aesthetic);
    return result; // { display, body, reasoning }
  },

  imagen: async (id, inputs, config) => {
    // Check multiple possible input sources for the prompt
    let prompt = '';
    let aspectRatioFromInput = '';

    // If input is an object containing text/value, extract it
    const promptInput = inputs.prompt || inputs.default || inputs.style_json || '';
    if (typeof promptInput === 'object' && promptInput !== null) {
      prompt = promptInput.text || promptInput.value || promptInput.detailedPrompt || '';
      aspectRatioFromInput = promptInput.aspectRatio || '';
    } else {
      prompt = promptInput;
    }

    if (!prompt || prompt.length < 3) {
      throw new Error('Image Generation requires a descriptive prompt. Please connect a Text Input node with content.');
    }

    const finalAspectRatio = aspectRatioFromInput || config?.aspectRatio || '1:1';
    
    // Call the server action
    const data = await generateAIImage({
      prompt,
      aspectRatio: finalAspectRatio
    });

    const result = data.images[0];
    return { image: result.image, prompt }; 
  },

  appBuilder: async (id, inputs, config) => {
    // AppBuilder just passes config through — the execution hook handles spawning screens
    const selectedScreens: string[] = config.selectedScreens || [];
    const customScreens: string[] = config.customScreens || [];
    const allScreens = [...selectedScreens, ...customScreens];

    if (allScreens.length === 0) {
      throw new Error('Please select at least one screen to generate.');
    }

    if (!config.value || config.value.length < 3) {
      throw new Error('Please provide an app description.');
    }

    return {
      appDescription: config.value,
      screens: allScreens,
      colorHex: config.colorHex || '',
    };
  },

  appScreen: async (id, inputs, config) => {
    const screenName = config.screenName || 'Screen';
    const appDescription = config.appDescription || inputs.config?.appDescription || '';
    const colorHex = config.colorHex || inputs.config?.colorHex || '';
    const screenIndex = config.screenIndex || 1;
    const totalScreens = config.totalScreens || 1;

    // Call the server action
    const data = await generateScreenImageAction({
      appDescription, 
      screenName, 
      colorHex, 
      screenIndex, 
      totalScreens 
    });

    return { image: data.image, screenName }; 
  }
};

/**
 * Finds all nodes that a specific node depends on
 */
function getDependencies(nodeId: string, edges: Edge[]) {
  return edges
    .filter((edge) => edge.target === nodeId)
    .map((edge) => ({
      sourceId: edge.source,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
    }));
}

/**
 * Topologically sorts nodes for execution
 * Basic version: handles simple dependency chains
 */
export function sortNodes(nodes: Node[], edges: Edge[]): Node[] {
  const sorted: Node[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  function visit(node: Node) {
    if (visiting.has(node.id)) throw new Error('Cycle detected in workflow');
    if (visited.has(node.id)) return;

    visiting.add(node.id);

    const deps = edges.filter((e) => e.target === node.id);
    deps.forEach((edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      if (sourceNode) visit(sourceNode);
    });

    visiting.delete(node.id);
    visited.add(node.id);
    sorted.push(node);
  }

  nodes.forEach((node) => visit(node));
  return sorted;
}
