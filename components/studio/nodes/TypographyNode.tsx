import { NodeProps, Node } from '@xyflow/react';
import { Type as FontIcon } from 'lucide-react';
import { BaseNode } from '../BaseNode';

type TypographyNodeData = Node<{
  display?: { family: string; style: string };
  body?: { family: string; style: string };
  reasoning?: string;
  status?: string;
}, 'typography'>;

export function TypographyNode({ id, data, selected }: NodeProps<TypographyNodeData>) {
  return (
    <BaseNode
      id={id}
      title="Typography Curator"
      icon={<FontIcon size={16} />}
      selected={selected}
      inputs={[{ id: 'style_logic', label: 'Style Logic' }]}
      outputs={[{ id: 'fonts', label: 'Font Data' }]}
      className="border-blue-500/20"
      status={(data?.status as any) || 'idle'}
    >
      <div className="space-y-4">
        <div className="space-y-1">
          <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-tight">Display Font</p>
          <p className="text-white text-base font-semibold italic border-b border-white/10 pb-1">
            {data?.display?.family || 'Playfair Display'}
          </p>
          <p className="text-zinc-500 text-[9px]">{data?.display?.style || 'Serif'}</p>
        </div>

        <div className="space-y-1">
          <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-tight">Body Font</p>
          <p className="text-zinc-200 text-sm">
            {data?.body?.family || 'Inter'}
          </p>
          <p className="text-zinc-500 text-[9px]">{data?.body?.style || 'Sans-Serif'}</p>
        </div>

        {data?.reasoning && (
          <div className="p-2 bg-blue-500/5 rounded border border-blue-500/10 text-[10px] text-zinc-400 italic">
            "{data.reasoning}"
          </div>
        )}
      </div>
    </BaseNode>
  );
}
