import { NodeProps, Node } from '@xyflow/react';
import { Smartphone, Plus, X } from 'lucide-react';
import { BaseNode } from '../BaseNode';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useWorkflowStore } from '@/lib/store/useWorkflowStore';

const COMMON_SCREENS = [
  'Login',
  'Sign Up',
  'Home',
  'Dashboard',
  'Profile',
  'Settings',
  'Onboarding',
  'Chat',
  'Search',
  'Notifications',
] as const;

type AppBuilderNodeData = Node<{
  value?: string;
  selectedScreens?: string[];
  customScreens?: string[];
  colorHex?: string;
  status?: string;
}, 'appBuilder'>;

export function AppBuilderNode({ id, data, selected }: NodeProps<AppBuilderNodeData>) {
  const setNodes = useWorkflowStore((state) => state.setNodes);
  const nodes = useWorkflowStore((state) => state.nodes);

  const [customInput, setCustomInput] = useState('');

  const prompt = data?.value || '';
  const selectedScreens: string[] = data?.selectedScreens || [];
  const customScreens: string[] = data?.customScreens || [];
  const colorHex = data?.colorHex || '';

  const updateData = (updates: Record<string, any>) => {
    const nextNodes = nodes.map((node) => {
      if (node.id === id) {
        return { ...node, data: { ...node.data, ...updates } };
      }
      return node;
    });
    setNodes(nextNodes);
  };

  const toggleScreen = (screen: string) => {
    const updated = selectedScreens.includes(screen)
      ? selectedScreens.filter(s => s !== screen)
      : [...selectedScreens, screen];
    updateData({ selectedScreens: updated });
  };

  const addCustomScreen = () => {
    const trimmed = customInput.trim();
    if (!trimmed || customScreens.includes(trimmed)) return;
    updateData({ customScreens: [...customScreens, trimmed] });
    setCustomInput('');
  };

  const removeCustomScreen = (screen: string) => {
    updateData({ customScreens: customScreens.filter(s => s !== screen) });
  };

  const handleCustomKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomScreen();
    }
  };

  const totalScreens = selectedScreens.length + customScreens.length;

  // Validate hex color
  const isValidHex = /^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(colorHex);
  const displayColor = colorHex && isValidHex
    ? (colorHex.startsWith('#') ? colorHex : `#${colorHex}`)
    : null;

  return (
    <BaseNode
      id={id}
      title="App Designer"
      icon={<Smartphone size={16} />}
      selected={selected}
      outputs={[{ id: 'screens', label: 'Screens' }]}
      className={cn("border-cyan-500/20 shadow-[0_0_30px_-15px_rgba(6,182,212,0.15)]", "!min-w-[300px] !max-w-[340px]")}
      status={(data?.status as any) || 'idle'}
    >
      <div className="space-y-4">

        {/* App Description */}
        <div>
          <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold px-1 mb-1.5 block">App Description</label>
          <textarea
            className="w-full h-20 bg-[#050505] border border-zinc-800/60 rounded-xl p-3 text-white text-[11px] focus:outline-none focus:border-cyan-500/40 resize-none placeholder:text-zinc-600 transition-all leading-relaxed"
            placeholder="Describe your app... e.g. A fitness tracking app with dark theme"
            value={prompt}
            onChange={(e) => updateData({ value: e.target.value })}
          />
        </div>

        {/* Common Screens */}
        <div>
          <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold px-1 mb-2 block">
            Select Screens
            <span className="text-cyan-500 ml-1.5">({totalScreens})</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_SCREENS.map((screen) => (
              <button
                key={screen}
                onClick={() => toggleScreen(screen)}
                className={cn(
                  "px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all border",
                  selectedScreens.includes(screen)
                    ? "bg-cyan-500/15 text-cyan-400 border-cyan-500/30 shadow-[0_0_10px_-4px_rgba(6,182,212,0.3)]"
                    : "bg-zinc-900/50 text-zinc-500 border-zinc-800/40 hover:bg-zinc-800/50 hover:text-zinc-300"
                )}
              >
                {screen}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Screens */}
        <div>
          <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold px-1 mb-1.5 block">Custom Screens</label>
          
          {/* Display custom screens as tags */}
          {customScreens.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {customScreens.map((screen) => (
                <span
                  key={screen}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5"
                >
                  {screen}
                  <button
                    onClick={() => removeCustomScreen(screen)}
                    className="hover:text-red-400 transition-colors"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Add custom screen input */}
          <div className="flex gap-1.5">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={handleCustomKeyDown}
              placeholder="Add screen name..."
              className="flex-1 bg-[#050505] border border-zinc-800/60 rounded-lg px-3 py-1.5 text-white text-[10px] focus:outline-none focus:border-cyan-500/40 placeholder:text-zinc-600 transition-all"
            />
            <button
              onClick={addCustomScreen}
              disabled={!customInput.trim()}
              className="w-7 h-7 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 disabled:opacity-30 flex items-center justify-center text-cyan-400 transition-all"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* Color Input */}
        <div>
          <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold px-1 mb-1.5 block">
            Primary Color
            <span className="text-zinc-600 font-normal ml-1">(optional)</span>
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 text-[10px] font-bold">#</span>
              <input
                type="text"
                value={colorHex.replace('#', '')}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
                  updateData({ colorHex: val });
                }}
                placeholder="Auto"
                maxLength={6}
                className="w-full bg-[#050505] border border-zinc-800/60 rounded-lg pl-7 pr-3 py-1.5 text-white text-[10px] font-mono focus:outline-none focus:border-cyan-500/40 placeholder:text-zinc-600 transition-all"
              />
            </div>
            {/* Color preview */}
            <div
              className={cn(
                "w-7 h-7 rounded-lg border transition-all shrink-0",
                displayColor
                  ? "border-zinc-700/50 shadow-lg"
                  : "border-dashed border-zinc-800/60 bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-blue-500/20"
              )}
              style={displayColor ? { backgroundColor: displayColor } : undefined}
              title={displayColor || 'Auto — AI will choose'}
            />
          </div>
          {!displayColor && (
            <p className="text-[9px] text-zinc-600 mt-1 px-1">AI will auto-select the best color palette</p>
          )}
        </div>

        {/* Summary Bar */}
        <div className="flex items-center justify-between p-2.5 bg-[#050505] rounded-xl border border-zinc-800/40">
          <div className="flex items-center gap-2">
            <Smartphone size={14} className="text-cyan-500" />
            <span className="text-[10px] text-zinc-400 font-medium">
              {totalScreens === 0 ? 'No screens selected' : `${totalScreens} screen${totalScreens > 1 ? 's' : ''} ready`}
            </span>
          </div>
          {displayColor && (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full border border-zinc-700/50" style={{ backgroundColor: displayColor }} />
              <span className="text-[9px] text-zinc-500 font-mono">{displayColor}</span>
            </div>
          )}
        </div>
      </div>
    </BaseNode>
  );
}
