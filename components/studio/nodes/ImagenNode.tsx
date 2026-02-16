import { NodeProps, Node } from '@xyflow/react';
import { ImageIcon } from 'lucide-react';
import { BaseNode } from '../BaseNode';
import { ImagePreview, EditBar } from '../shared';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useWorkflowStore } from '@/lib/store/useWorkflowStore';
import { generateAIImage } from '@/lib/actions/ai.actions';

type ImagenNodeData = Node<{
  image?: string;
  status?: string;
  prompt?: string;
}, 'imagen'>;

export function ImagenNode({ id, data, selected }: NodeProps<ImagenNodeData>) {
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

  return (
    <BaseNode
      id={id}
      title="Visual Artist"
      icon={<ImageIcon size={16} />}
      selected={selected}
      inputs={[{ id: 'prompt', label: 'Prompt' }]}
      outputs={[{ id: 'image', label: 'Image' }]}
      className={cn("border-amber-500/20", "!min-w-[240px] !max-w-[280px]")}
      status={(data?.status as any) || 'idle'}
    >
      <div className="space-y-3">
        {/* Inline edit bar */}
        {editMode && (
          <EditBar
            value={editPrompt}
            onChange={setEditPrompt}
            onSubmit={handleEdit}
            onCancel={() => { setEditMode(false); setEditPrompt(''); }}
            isLoading={isEditing}
            placeholder="Describe your edit..."
            accentColor="amber"
          />
        )}

        {/* Reusable image preview with all interactions */}
        <div className={cn(isEditing && "opacity-50 pointer-events-none")}>
          <ImagePreview
            imageUrl={imageUrl}
            fileName={`visual-asset-${id}.png`}
            isLoading={data?.status === 'running'}
            loadingText="Painting..."
            idleText="Awaiting prompt"
            onEdit={() => setEditMode(true)}
          />
        </div>

        {/* Editing overlay on image */}
        {isEditing && (
          <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center pointer-events-none">
            <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
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
