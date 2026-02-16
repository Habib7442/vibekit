import { NodeProps, Node } from '@xyflow/react';
import { Type, ImageIcon } from 'lucide-react';
import { BaseNode } from '../BaseNode';
import { useWorkflowStore } from '@/lib/store/useWorkflowStore';
import { cn } from '@/lib/utils';

const ASPECT_RATIOS = [
  { label: '1:1',  value: '1:1',  icon: '■' },
  { label: '4:5',  value: '4:5',  icon: '▮' },
  { label: '16:9', value: '16:9', icon: '▬' },
  { label: '9:16', value: '9:16', icon: '▯' },
] as const;

type AspectRatio = typeof ASPECT_RATIOS[number]['value'];

type TextInputNodeData = Node<{
  value?: string;
  isImageGen?: boolean;
  aspectRatio?: AspectRatio;
}, 'textInput'>;

export function TextInputNode({ id, data, selected }: NodeProps<TextInputNodeData>) {
  const setNodes = useWorkflowStore((state) => state.setNodes);
  const nodes = useWorkflowStore((state) => state.nodes);

  const updateData = (updates: Partial<TextInputNodeData['data']>) => {
    const nextNodes = nodes.map((node) => {
      if (node.id === id) {
        return {
          ...node,
          data: {
            ...node.data,
            ...updates,
          },
        };
      }
      return node;
    });
    setNodes(nextNodes);
  };

  const isImageGen = data?.value?.toLowerCase().includes('create') || data?.value?.toLowerCase().includes('generate');

  return (
    <BaseNode
      id={id}
      title={isImageGen ? "Image Generation" : "Text Input"}
      icon={isImageGen ? <ImageIcon size={16} className="text-amber-500" /> : <Type size={16} />}
      selected={selected}
      outputs={[{ id: 'text', label: 'String' }]}
      className={cn(isImageGen && "border-amber-500/30 shadow-[0_0_20px_-10px_rgba(245,158,11,0.2)]")}
    >
      <div className="space-y-3">
        <textarea
          className="w-full h-24 bg-[#050505] border border-[#2D2D3D] rounded-xl p-3 text-white text-xs focus:outline-none focus:border-indigo-500/50 resize-none scrollbar-thin transition-all"
          placeholder="Type 'Create...' to start generating..."
          value={data?.value || ''}
          onChange={(e) => updateData({ value: e.target.value })}
        />

        {isImageGen && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="flex flex-col gap-2 pt-1 border-t border-[#2D2D3D]/50">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold px-1">Ratio</span>
                <div className="flex items-center gap-1 p-1 bg-black/40 rounded-lg border border-zinc-800/40">
                    {ASPECT_RATIOS.map((ar) => (
                        <button
                            key={ar.value}
                            onClick={() => updateData({ aspectRatio: ar.value })}
                            className={cn(
                                "flex-1 py-1 rounded-md text-[9px] font-bold transition-all flex flex-col items-center gap-0.5",
                                (data?.aspectRatio || '1:1') === ar.value
                                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/20"
                                    : "text-zinc-600 hover:text-zinc-400 hover:bg-white/5 border border-transparent"
                            )}
                        >
                            <span className="text-[8px] opacity-60 leading-none">{ar.icon}</span>
                            {ar.label}
                        </button>
                    ))}
                </div>
            </div>
          </div>
        )}
      </div>
    </BaseNode>
  );
}
