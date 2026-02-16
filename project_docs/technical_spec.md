# Technical Specification: Aesthetic Studio (MVP)

## 1. Core Architecture: The "Logical Loop"

To achieve a "superfast, lightweight" SaaS, we will use a **Client-Side Execution Engine**. Most design tools wait for the server to process nodes; we will process everything in the user's browser, only calling the API for AI (Gemini) and Database (Supabase) operations.

### State Management (Zustand)
We will use a single source of truth for the workflow:
- **`nodes`**: The UI state of the canvas.
- **`edges`**: The connections between nodes.
- **`executionData`**: A cached storage of node results to prevent redundant AI calls.

### Execution Flow
1. **Dependency Analysis**: When "Run" is clicked, we build a Directed Acyclic Graph (DAG).
2. **Topological Sort**: Order nodes from inputs to outputs.
3. **Async Batching**: Resolve AI nodes (Gemini) in parallel where they don't depend on each other.
4. **Caching**: If Node A's inputs haven't changed since the last run, skip its execution and use the value from `executionData`.

---

## 2. Node Schema Definition

Every node will follow a strict "Port" system:

```typescript
interface AestheticNode {
  id: string;
  type: string; // e.g., 'gemini-director'
  data: {
    inputs: Record<string, any>;  // Incoming data from edges
    config: Record<string, any>;  // User-set values in the settings panel
    output: any;                  // The calculated result
    status: 'idle' | 'running' | 'completed' | 'error';
  };
}
```

### MVP Node Types:
1.  **Text Input**: Raw string collector.
2.  **Aesthetic Director (Gemini)**: Takes "Brand Info" -> Returns "Style Guidelines" (JSON).
3.  **Color Theorist**: Takes "Style" -> Returns "Palette" (Hex codes).
4.  **Imagen Generator (Gemini Image)**: Takes "Prompt + Style" -> Returns "Image URL" (Base64).
5.  **Visual Preview**: Renders the final result.

---

## 3. Database Schema (Supabase)

We need to store the "DNA" of the workflows.

### Table: `workflows`
- `id`: uuid (primary key)
- `user_id`: uuid (fk to profiles)
- `name`: text
- `nodes`: jsonb (Stores the node positions, types, and config)
- `edges`: jsonb (Stores the connections)
- `is_public`: boolean
- `created_at`: timestamptz

---

## 4. UI/UX Design System

To keep it "lightweight," we will avoid heavy component libraries.

- **Canvas**: Powered by `xyflow` (React Flow).
- **Styling**: Tailwind CSS v4 (native, fast CSS variables).
- **Icons**: Lucide React.
- **Components**: Custom-built minimalist UI (Settings panels, Node wrappers).
- **Theme**: "Obsidian Depth" 
    - Background: `#050505`
    - Node Border: `#1A1A1A`
    - Accent: `#6366f1` (Indigo Glow)

---

## 5. Performance Strategy

1.  **Zero-JSL**: Only ship code needed for the current route.
2.  **Optimistic UI**: Node connections and movements reflect instantly in local state.
3.  **Gemini Batching**: Combine multiple "Director" requests into one Gemini prompt where possible to save on 1-minute timeout constraints.
4.  **Local Forage**: Auto-save drafts to `localStorage` so users don't lose work on refresh.

---

## 6. Implementation Roadmap

### Phase 1: The Skeleton (Today)
- [ ] Install `xyflow` (Newest version of React Flow).
- [ ] Set up Zustand store for nodes.
- [ ] Create the "Node Wrapper" component.

### Phase 2: The Brain
- [ ] Integrate `lib/gemini.ts` with the execution engine.
- [ ] Create the first 3 nodes (Input, Director, Preview).

### Phase 3: The Persistence
- [ ] Supabase "Save/Load" functionality.
- [ ] User dashboard to see all workflows.

### Phase 4: The Export
- [ ] Code export node.
- [ ] High-res image download.
