import { NodeProps, Node } from '@xyflow/react';
import { Palette } from 'lucide-react';
import { BaseNode } from '../BaseNode';

type ColorNodeData = Node<{
  palette?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  status?: string;
}, 'colorTheorist'>;

export function ColorNode({ id, data, selected }: NodeProps<ColorNodeData>) {
  const palette = data?.palette || { primary: '#111', secondary: '#333', accent: '#6366f1' };

  return (
    <BaseNode
      id={id}
      title="Color Theorist"
      icon={<Palette size={16} />}
      selected={selected}
      inputs={[{ id: 'palette', label: 'Palette Data' }]}
      outputs={[{ id: 'colors', label: 'Hex Codes' }]}
      className="border-pink-500/20"
      status={(data?.status as any) || 'idle'}
    >
      <div className="space-y-4">
        <p className="text-zinc-400 text-[10px]">Strategic Distribution (70/20/10)</p>
        
        <div className="flex h-12 rounded-lg overflow-hidden border border-[#2D2D3D]">
          <div 
            className="flex-[7] h-full transition-colors duration-500" 
            style={{ backgroundColor: palette.primary }} 
            title={`Primary: ${palette.primary}`}
          />
          <div 
            className="flex-[2] h-full transition-colors duration-500" 
            style={{ backgroundColor: palette.secondary }} 
            title={`Secondary: ${palette.secondary}`}
          />
          <div 
            className="flex-[1] h-full transition-colors duration-500" 
            style={{ backgroundColor: palette.accent }} 
            title={`Accent: ${palette.accent}`}
          />
        </div>

        <div className="grid grid-cols-1 gap-1">
          <div className="flex items-center justify-between text-[10px] bg-black/20 p-1 rounded">
            <span className="text-zinc-500">Primary</span>
            <span className="text-zinc-300 font-mono uppercase">{palette.primary}</span>
          </div>
          <div className="flex items-center justify-between text-[10px] bg-black/20 p-1 rounded">
            <span className="text-zinc-500">Secondary</span>
            <span className="text-zinc-300 font-mono uppercase">{palette.secondary}</span>
          </div>
          <div className="flex items-center justify-between text-[10px] bg-black/20 p-1 rounded">
            <span className="text-zinc-500">Accent</span>
            <span className="text-indigo-400 font-mono uppercase">{palette.accent}</span>
          </div>
        </div>
      </div>
    </BaseNode>
  );
}
