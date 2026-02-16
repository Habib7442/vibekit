# Implementation Plan: Aesthetic Studio

## Phase 1: Foundation (Current)
- [x] Create Technical Specification.
- [x] Clean up old code and packages.
- [x] Install latest `@xyflow/react`, `zustand`, `lucide-react`.
- [x] Initialize shadcn (v4 compatible).
- [x] Set up workflow state store (Zustand).
- [x] Build `BaseNode` component.
- [x] Build `TextInputNode`.
- [x] Build `DirectorNode` (Visual only).
- [x] Create `Studio` layout and canvas.

## Phase 2: Execution Engine
- [ ] Implement topological sorting for node execution.
- [ ] Create `useWorkflowEngine` hook to process connections.
- [ ] Handle async status (idle -> running -> completed) visually on nodes.
- [ ] Connect `DirectorNode` to `lib/gemini.ts`.
- [ ] Build `ColorNode` and `TypographyNode`.

## Phase 3: Visual Generation
- [ ] Build `ImagenNode` for image generation.
- [ ] Build `PreviewNode` for final design visualization.
- [ ] Implement "Run Workflow" global button.
- [ ] Add "Variable" support between nodes.

## Phase 4: Polish & Persistence
- [ ] Supabase table setup (`workflows`).
- [ ] Workflow saving/loading UI.
- [ ] "App Mode" toggle (Simplified UI).
- [ ] Export to Code / Image options.

---
**Status**: 🏗️ Building Phase 1 Basic Mechanics
