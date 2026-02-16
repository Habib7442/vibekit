# Carousel Generation Logic: The AI Blueprint

This document defines how VibeCarousel transforms a user's raw idea into a structured, high-engagement 10-slide carousel.

## 1. The Structured JSON Schema
The AI will NOT return React code directly. It will return a structured JSON object. This allows the UI to render slides consistently and allows the user to edit text without breaking the design.

```typescript
interface Carousel {
  id: string;
  metadata: {
    topic: string;
    targetAudience: string;
    tone: "educational" | "authoritative" | "motivational" | "storytelling";
    vibe_dna: {
      palette: string[]; // [bg, text, accent1, accent2]
      fontHeading: string;
      fontBody: string;
      aesthetic: "minimal" | "bold" | "editorial" | "luxury" | "tech";
    }
  };
  slides: Slide[];
}

interface Slide {
  id: number;
  type: "HOOK" | "INTRO" | "TIP" | "STEP" | "SUMMARY" | "CTA";
  content: {
    headline: string;
    body?: string;
    bullets?: string[];
    badge?: string; // e.g. "Step 01", "Pro Tip"
    cta_text?: string; // Only for CTA slides
  };
  layout_id: string; // e.g. "center-focus", "split-vertical", "asymmetric-grid"
}
```

---

## 2. The Multi-Step Prompting Strategy

### Step 1: Content Slicing & Hook Engineering
**Goal**: Transform user intent into a logical narrative.

**System Instructions**:
- Act as a viral content strategist for LinkedIn and Instagram.
- Analyze the user topic and identify the "Primary Value Proposition".
- **Slide 1 (The Hook)**: Must be a pattern-interruptor. Use Curiosity Gap, Negation (e.g., "Stop doing X"), or Big Promise.
- **Slide 2 (The Setup)**: Validate the problem or set the stage.
- **Slides 3-8 (The Meat)**: 1 core idea per slide. Avoid text walls. Max 3 bullets or 25 words per slide.
- **Slide 9 (The Summary)**: Recap the transformation.
- **Slide 10 (The CTA)**: Direct action. Match the CTA to the tone.

### Step 2: Visual DNA (Vibe) Mapping
**Goal**: Assign an aesthetic based on the content tone.

**Logic Examples**:
- If Tone = "Luxury/Coaching" → Vibe = "Luxury" (Beige, Gold, Serif fonts).
- If Tone = "SaaS/Tech" → Vibe = "Minimal Dark" (Black, Electric Blue, Mono fonts).
- If Tone = "Aggressive Marketing" → Vibe = "Bold" (Red/Yellow, Sans-serif, Massive fonts).

---

## 3. Example Gemini System Prompt

```text
You are the VibeCarousel Carousel Architect. You specialize in creating 4:5 social media carousels that drive growth and retention.

TASK: Create a [LENGTH]-slide carousel based on: "[USER_TOPIC]"

RULES:
1. CONTENT: Use a [TONE] tone. Ensure a smooth narrative flow from Slide 1 to [LENGTH].
2. TITLES: Use bold, active headlines. 
3. DATA: Return ONLY a valid JSON object following the VibeCarousel Schema.
4. HOOK: Slide 1 MUST be a 10/10 scroll-stopper.
5. VIBE: Select a color palette and font pairing that matches the vibe.

JSON SCHEMA:
{
  "metadata": { ... },
  "slides": [ ... ]
}
```

---

## 4. Design-Prop Mapping (React Side)
When the JSON arrives, the `SlideRenderer` will map `vibe_dna` to Tailwind classes:

- `aesthetic: "minimal"` → `p-12, font-sans, letter-spacing-tight`
- `aesthetic: "editorial"` → `p-16, font-serif, large-cap-initials`
- `layout_id: "center-focus"` → `flex-col items-center justify-center text-center`

---

## 5. Refinement (Vibe-Coding) Chat
When a user says "Make it more professional", the follow-up prompt is:
*"The user wants to refine the style to be 'more professional'. Update the 'vibe_dna' metadata. Do NOT change the slide content unless requested."*
