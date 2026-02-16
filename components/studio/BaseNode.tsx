import React, { ReactNode } from 'react';
import { Handle, Position } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { Trash2 } from 'lucide-react';
import { useWorkflowStore } from '@/lib/store/useWorkflowStore';

interface BaseNodeProps {
  id: string;
  title: string;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
  selected?: boolean;
  status?: 'idle' | 'running' | 'completed' | 'error';
  inputs?: { id: string; label: string }[];
  outputs?: { id: string; label: string }[];
}

export function BaseNode({
  id,
  title,
  icon,
  children,
  className,
  selected,
  status = 'idle',
  inputs = [],
  outputs = [],
}: BaseNodeProps) {
  const deleteNode = useWorkflowStore((state) => state.deleteNode);

  return (
    <div
      className={cn(
        'min-w-[300px] rounded-3xl border transition-all duration-500 shadow-2xl group/node relative',
        'bg-[#0D0D12]/90 backdrop-blur-3xl',
        selected ? 'border-zinc-100 ring-2 ring-zinc-100/10' : 'border-zinc-800/80',
        status === 'running' && 'border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.15)]',
        status === 'error' && 'border-red-500/50',
        className
      )}
    >
      {/* Input Handles - Positioned outside to the left */}
      <div className="absolute -left-3 top-0 bottom-0 flex flex-col justify-center gap-8 pointer-events-none z-50">
          {inputs.map((input) => (
            <div key={input.id} className="relative flex items-center group/handle pointer-events-auto">
              <Handle
                type="target"
                position={Position.Left}
                id={input.id}
                className="!w-4 !h-4 !bg-[#0D0D12] !border-2 !border-zinc-600 hover:!border-zinc-100 !transition-all !m-0"
              />
              <span className="absolute left-6 text-[10px] text-zinc-500 uppercase font-bold tracking-[0.15em] opacity-0 group-hover/handle:opacity-100 transition-opacity whitespace-nowrap bg-[#0D0D12] px-2 py-1 rounded-md border border-zinc-800">
                {input.label}
              </span>
            </div>
          ))}
      </div>

       {/* Output Handles - Positioned outside to the right */}
       <div className="absolute -right-3 top-0 bottom-0 flex flex-col justify-center gap-8 pointer-events-none text-right z-50">
          {outputs.map((output) => (
            <div key={output.id} className="relative flex items-center justify-end group/handle pointer-events-auto">
              <span className="absolute right-6 text-[10px] text-zinc-500 uppercase font-bold tracking-[0.15em] opacity-0 group-hover/handle:opacity-100 transition-opacity whitespace-nowrap bg-[#0D0D12] px-2 py-1 rounded-md border border-zinc-800">
                {output.label}
              </span>
              <Handle
                type="source"
                position={Position.Right}
                id={output.id}
                className="!w-4 !h-4 !bg-zinc-100 !border-[3px] !border-[#0D0D12] hover:!scale-125 !transition-all !m-0 shadow-lg shadow-white/10"
              />
            </div>
          ))}
      </div>

      {/* Node Interior */}
      <div className="p-1">
        <div className="bg-[#12121A]/50 rounded-[22px] overflow-hidden border border-zinc-800/20">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-white/[0.02] border-b border-zinc-800/30">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800/40 flex items-center justify-center text-zinc-400 group-hover/node:text-white transition-colors">
                    {icon}
                    </div>
                    <div>
                    <h3 className="text-white text-sm font-bold tracking-tight mb-0.5">{title}</h3>
                    <p className={cn(
                        "text-[9px] uppercase font-black tracking-[0.2em]",
                        status === 'running' ? 'text-amber-500 animate-pulse' : 'text-zinc-600'
                    )}>
                        {status}
                    </p>
                    </div>
                </div>
                
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        deleteNode(id);
                    }}
                    className="w-9 h-9 rounded-xl hover:bg-red-500/10 text-zinc-700 hover:text-red-500 flex items-center justify-center transition-all opacity-0 group-hover/node:opacity-100"
                >
                    <Trash2 size={18} />
                </button>
            </div>

            {/* Content Body */}
            <div className="p-5 min-h-[60px]">
                {children}
            </div>
        </div>
      </div>
    </div>
  );
}
