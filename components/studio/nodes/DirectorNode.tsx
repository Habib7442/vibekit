import { NodeProps, Node } from '@xyflow/react';
import { Sparkles } from 'lucide-react';
import { BaseNode } from '../BaseNode';

type DirectorNodeData = Node<{
  summary?: string;
  status?: string;
}, 'director'>;

export function DirectorNode({ id, data, selected }: NodeProps<DirectorNodeData>) {
  return (
    <BaseNode
      id={id}
      title="Aesthetic Director"
      icon={<Sparkles size={16} />}
      selected={selected}
      inputs={[{ id: 'brand_info', label: 'Brand Data' }]}
      outputs={[
        { id: 'style_json', label: 'Style Logic' },
        { id: 'summary', label: 'Summary' }
      ]}
      className="border-purple-500/20"
      status={(data?.status as any) || 'idle'}
    >
      <div className="space-y-2">
        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Intelligence</p>
        <p className="text-zinc-300">
          Analyzes inputs via Gemini to define aesthetic rules.
        </p>
        {data?.summary && (
          <div className="mt-2 p-2 bg-purple-500/5 rounded border border-purple-500/10 text-purple-200">
             {data.summary}
          </div>
        )}
      </div>
    </BaseNode>
  );
}
