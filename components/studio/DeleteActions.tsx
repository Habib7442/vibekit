'use client';

import { Trash2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { deleteCanvasAction, deleteImageAction } from '@/lib/actions/studio.actions';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface DeleteActionsProps {
  type: 'canvas' | 'image';
  id: string;
  canvasId?: string;
  className?: string;
  redirectAfterDelete?: boolean;
}

export function DeleteActions({ type, id, canvasId, className, redirectAfterDelete }: DeleteActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
    
    setIsDeleting(true);
    try {
      if (type === 'canvas') {
        await deleteCanvasAction(id);
        if (redirectAfterDelete) {
          router.push('/studio/generations');
        }
      } else if (type === 'image' && canvasId) {
        await deleteImageAction(id, canvasId);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleDelete();
      }}
      disabled={isDeleting}
      className={cn(
        "p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all disabled:opacity-50",
        className
      )}
      title={`Delete ${type}`}
    >
      {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
    </button>
  );
}
