import { NodeProps, Node } from '@xyflow/react';
import { Smartphone } from 'lucide-react';
import { BaseNode } from '../BaseNode';
import { ImagePreview, EditBar } from '../shared';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useWorkflowStore } from '@/lib/store/useWorkflowStore';
import { generateAIImage } from '@/lib/actions/ai.actions';

type AppScreenNodeData = Node<{
  image?: string;
  status?: string;
  prompt?: string;
  screenName?: string;
  screenIndex?: number;
  totalScreens?: number;
}, 'appScreen'>;

export function AppScreenNode({ id, data, selected }: NodeProps<AppScreenNodeData>) {
  const imageUrl = data?.image ? `data:image/png;base64,${data.image}` : null;
  const [editMode, setEditMode] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const updateNodeData = (updates: Record<string, any>) => {
    const nodes = useWorkflowStore.getState().nodes;
    useWorkflowStore.getState().setNodes(
      nodes.map(n => n.id === id ? { ...n, data: { ...n.data, ...updates } } : n)
    );
  };

  const handleEdit = async () => {
    if (!editPrompt.trim() || isEditing || !data?.image) return;
    setIsEditing(true);

    try {
      const result = await generateAIImage({
        prompt: editPrompt,
        images: [{ data: data.image, mimeType: 'image/png' }]
      });

      const newImage = result.images[0].image;
      updateNodeData({ image: newImage, prompt: editPrompt });
      setEditMode(false);
      setEditPrompt('');
    } catch (err: any) {
      console.error('[Edit] Failed:', err);
      alert('Edit failed: ' + err.message);
    } finally {
      setIsEditing(false);
    }
  };

  const screenLabel = data?.screenName || 'Screen';
  const progress = data?.screenIndex && data?.totalScreens 
    ? `${data.screenIndex}/${data.totalScreens}` 
    : '';

  return (
    <BaseNode
      id={id}
      title={screenLabel}
      icon={<Smartphone size={16} className="text-cyan-500" />}
      selected={selected}
      inputs={[{ id: 'config', label: 'Config' }]}
      outputs={[{ id: 'screen', label: 'Screen' }]}
      className={cn("border-cyan-500/20", "!min-w-[220px] !max-w-[260px]")}
      status={(data?.status as any) || 'idle'}
    >
      <div className="space-y-3">
        {/* Screen badge */}
        {progress && (
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-cyan-500/60 font-bold uppercase tracking-widest">Screen {progress}</span>
          </div>
        )}

        {/* Inline edit bar */}
        {editMode && (
          <EditBar
            value={editPrompt}
            onChange={setEditPrompt}
            onSubmit={handleEdit}
            onCancel={() => { setEditMode(false); setEditPrompt(''); }}
            isLoading={isEditing}
            placeholder="Describe your edit..."
            accentColor="blue"
          />
        )}

        {/* Image preview */}
        <div className={cn(isEditing && "opacity-50 pointer-events-none")}>
          <ImagePreview
            imageUrl={imageUrl}
            fileName={`app-screen-${screenLabel}-${id}.png`}
            isLoading={data?.status === 'running'}
            loadingText="Designing..."
            idleText="Awaiting generation"
            onEdit={() => setEditMode(true)}
          />
        </div>

        {/* Editing overlay */}
        {isEditing && (
          <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center pointer-events-none">
            <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          </div>
        )}

        {/* Prompt preview */}
        {data?.prompt && (
          <p className="text-[10px] text-zinc-500 italic line-clamp-2 leading-relaxed">
            &ldquo;{data.prompt}&rdquo;
          </p>
        )}
      </div>
    </BaseNode>
  );
}
