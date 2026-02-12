# Implementation Plan - Lovable for Media Kits

## Phase 1: Foundation & UI
- [ ] Set up environment variables (`GEMINI_API_KEY`)
- [ ] Create `app/builder` route
- [ ] Design the three-pane layout (Chat, Preview, Code)
- [ ] Set up `lib/gemini.ts` with Vision and Image Generation support
- [ ] Implement `LivePreview` with iframe isolation

## Phase 2: Gemini Integration (Skill-Based)
- [ ] **Instagram Insights Extraction**: Implement Vision API call to extract metrics from screenshots
- [ ] **Professional Bio Polishing**: Implement text generation for brand-ready bios
- [ ] **Component Generation**: Gemini-powered React/Tailwind code generation (Initial & Refinement)
- [ ] **Visual Asset Creation**: Integrate Gemini Image Generation for headers and banners

## Phase 3: Interactive "Vibe-Coding" Experience
- [ ] Implement Chat logic for iterative refinements
- [ ] Real-time code syncing with `LivePreview`
- [ ] Rate Calculator logic implementation (from Skill)
- [ ] History/Undo support for iterations

## Phase 4: Polish & Export
- [ ] Export as ZIP/HTML/PDF
- [ ] Deploy to custom subdomain (Future)
- [ ] User Portfolio Management
