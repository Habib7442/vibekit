# Product Requirements Document
## VisualAI Studio — AI-Native Design Platform for E-Commerce & Marketing Teams

**Version:** 1.0  
**Date:** February 25, 2026  
**Status:** Draft  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Target Users](#3-target-users)
4. [Goals & Success Metrics](#4-goals--success-metrics)
5. [Competitive Analysis](#5-competitive-analysis)
6. [Product Overview](#6-product-overview)
7. [Feature Specifications](#7-feature-specifications)
8. [User Flows](#8-user-flows)
9. [AI Architecture](#9-ai-architecture)
10. [Technical Requirements](#10-technical-requirements)
11. [Design Principles](#11-design-principles)
12. [Monetization](#12-monetization)
13. [Phased Roadmap](#13-phased-roadmap)
14. [Risks & Mitigations](#14-risks--mitigations)
15. [Open Questions](#15-open-questions)

---

## 1. Executive Summary

**VisualAI Studio** is an AI-native design platform that lets small businesses, e-commerce sellers, and marketing teams produce professional-quality visual assets — product photos, ad creatives, social media posts, brand kits — without hiring a designer or knowing design software.

The core insight: every existing design tool (Canva, Pixlr, Kittl, Lovart) either requires design skill, has weak AI that doesn't follow instructions, treats every asset as a one-off, or is unreliable. None of them can take a brand brief and generate 40 campaign-consistent assets in one session. None of them can replace a $200 product photoshoot with a phone photo and a text prompt.

We solve this using two Google Gemini APIs:
- **Gemini 3 Pro** (`gemini-3-pro-preview`) — brand reasoning, design critique, campaign planning, copy writing
- **Nano Banana Pro** (`gemini-3-pro-image-preview`) — 4K image generation, conversational editing, grounded real-time generation, up to 14 reference image compositing

**Beachhead market:** E-commerce product photography replacement.  
**Expansion:** Brand kit generation → Campaign asset batching → Agency workflow tools.

---

## 2. Problem Statement

### The Core Pain
> *"I know what I want to say visually. I just can't make it look good fast enough — or at all."*

Specifically:

**For e-commerce sellers:**
- Professional product photography costs $50–$200 per shot
- A seller with 200 SKUs needs $10,000–$40,000 in photography just to launch
- Re-shooting for seasons, promotions, and new backgrounds is an ongoing cost
- Phone photos look unprofessional and hurt conversion rates

**For marketing teams (3–20 person companies):**
- A campaign requires 30–50 assets (social posts, stories, banners, email headers, ads) all in consistent brand style
- In Canva this takes 2–3 days of a person's full time
- AI tools like Canva AI or Pixlr AI don't follow instructions reliably and produce inconsistent results
- There is no tool that remembers your brand and applies it automatically across an entire campaign

**For content creators:**
- Thumbnails, banners, and promo graphics need to be produced multiple times per week
- Current tools require too many manual steps and produce generic-looking outputs
- They need something that matches their personal aesthetic without starting from scratch every time

### What Nobody Has Solved Yet
1. A design AI that actually follows complex instructions reliably (existing tools ignore prompts)
2. Brand memory that persists across an entire work session — loading brand guide once and having every output automatically on-brand
3. Product photography from a single phone image — no studio, no budget
4. Real-time grounded generation — making visuals based on today's weather, today's news, current events
5. Conversational multi-turn editing — truly iterating on an image the way you'd iterate with a human designer

---

## 3. Target Users

### Primary: E-Commerce Seller (Beachhead)
**Name:** Sarah  
**Profile:** Runs a Shopify store selling handmade candles. Ships 100–500 orders/month. Does everything herself — product sourcing, customer service, marketing.  
**Pain:** Spends $500/month on a photographer. Still needs to manually edit and format for different platforms. Wants to try new product angles and seasonal looks without paying for a reshoot every time.  
**Willingness to pay:** $39–$79/month if it saves one photoshoot  
**Tech comfort:** Uses Canva, Shopify apps, basic iPhone editing  

### Secondary: In-House Marketing Manager
**Name:** James  
**Profile:** Solo marketing manager at a 15-person SaaS startup. Manages all social, email, paid ads, and content.  
**Pain:** Spends 60% of his time reformatting the same content into different asset sizes and styles. The brand guide exists but is ignored by AI tools. Can't afford a full-time designer.  
**Willingness to pay:** $99–$199/month on a team plan  
**Tech comfort:** Proficient with Figma, Canva, HubSpot  

### Tertiary: Agency Creative Producer
**Name:** Priya  
**Profile:** Runs a small 4-person digital agency. Manages 8–12 brand clients. Needs to produce monthly content calendars worth of assets per client.  
**Pain:** Production takes 70% of her team's time. Briefs are clear; execution is slow. She would pay well to speed up production without sacrificing quality.  
**Willingness to pay:** $299–$499/month for multi-client workspace  
**Tech comfort:** High. Uses Adobe CC, Figma, Midjourney  

### Non-Target (Explicitly Out of Scope for v1)
- Professional graphic designers (use Figma/Illustrator, don't need this)
- Video editors (different product entirely)
- Enterprise brand teams (require compliance, SSO, and legal workflows we're not building yet)

---

## 4. Goals & Success Metrics

### Business Goals (Year 1)
- Reach 500 paying customers by Month 6
- Reach $50,000 MRR by Month 12
- Achieve Net Promoter Score (NPS) ≥ 50
- Keep monthly churn below 5%

### Product Goals (v1 Launch)
| Goal | Metric | Target |
|------|--------|--------|
| Users produce first asset | Time to first generated image | < 3 minutes from signup |
| AI quality satisfaction | % users who regenerate same prompt 3+ times (frustration signal) | < 15% |
| Core loop engagement | Sessions per week per active user | ≥ 3 |
| Brand kit adoption | % users who upload a brand kit within first week | ≥ 40% |
| Product photo conversion | % e-commerce users who generate ≥ 5 product shots in first session | ≥ 60% |

### North Star Metric
**Weekly Active Asset Creators** — number of users who generate at least one production-ready asset per week. This measures whether the product is genuinely replacing their old workflow.

---

## 5. Competitive Analysis

### Canva
**Strengths:** Massive template library, team collaboration, brand kit, widespread adoption  
**Weaknesses:** RGB only (no CMYK for print), no PSD export, weak AI that generates generic results, no campaign memory, no conversational editing, advanced typography missing (no kerning/tracking)  
**Our advantage:** AI that actually follows instructions, brand memory across full session, 4K output, conversational iteration

### Kittl
**Strengths:** Excellent vector tools, strong for print-on-demand, good typography tools, vintage/retro aesthetics  
**Weaknesses:** No video/animation, small asset library, tight limits on lower tiers, no team collaboration, AI is bolted on not native  
**Our advantage:** Everything above plus Kittl has no AI-native generation pipeline

### Pixlr
**Strengths:** Free, browser-based, 15 years of SEO/brand trust, good photo editing tools  
**Weaknesses:** AI tools are widely reported as broken (generates wrong content, slow, unreliable), no team features, no brand memory, declining product quality since ownership change, no RAW file support  
**Our advantage:** AI that works reliably is table stakes for us — already better on the most critical dimension

### Lovart
**Strengths:** Most ambitious vision — generates full campaign deliverables from one prompt  
**Weaknesses:** Unreliable and buggy, billing issues reported, no customer support, inconsistent quality, trust problems with user base, no real editing after generation  
**Our advantage:** Reliability + conversational editing + better model quality

### Gap Summary
No competitor has all four of:
1. AI that reliably follows complex instructions
2. Brand memory that persists across a full work session
3. Conversational multi-turn image editing
4. 4K output suitable for print and professional use

---

## 6. Product Overview

### Product Name
**VisualAI Studio**

### Tagline
*"Your brand. Any asset. 4K. In minutes."*

### Core Value Proposition
Load your brand once. Describe what you need. Get professional assets — product photos, ads, social posts, infographics — that actually look like you.

### Key Differentiators
1. **Brand Memory** — Upload your logo, colors, fonts, and brand guide once. Every output is automatically on-brand without re-explaining.
2. **Conversational Editing** — Iterate on images the way you'd talk to a human designer. "Make it moodier." "Change the background to a marble counter." "Move the logo to the top right."
3. **Product Photography Engine** — Upload a phone photo of your product. Get studio-quality shots on any background, any lifestyle scene, any aspect ratio.
4. **Campaign Mode** — Describe a campaign. Get every asset format (Instagram post, story, Facebook ad, email header, banner) generated in your brand style simultaneously.
5. **Grounded Generation** — Generate visuals based on real-time data: weather forecasts, event scores, trending topics. Powered by Gemini 3's Google Search tool.

### Platform
- Web app (primary — works in all modern browsers)
- Mobile app (v2 — iOS and Android)
- No desktop download required

---

## 7. Feature Specifications

---

### Feature 1: Brand Kit

**Priority:** P0 (Must have at launch)

**Description:**  
A one-time brand setup that persists across all sessions and is automatically applied to every generated asset.

**User story:**  
*As a business owner, I want to upload my brand assets once so that every design I create automatically uses my correct colors, fonts, and logo without me setting it up every time.*

**Inputs:**
- Logo upload (PNG/SVG, with and without background)
- Primary and secondary color palette (hex picker or extracted from logo automatically)
- Font selection (Google Fonts library + custom font upload)
- Brand voice/tone description (text field, e.g., "playful but premium, never corporate")
- Brand guide PDF upload (optional — Gemini 3 reads and extracts rules automatically)
- Example designs (up to 5 reference images to establish visual style)

**Behavior:**
- Gemini 3 Pro reads uploaded brand guide PDF and extracts: color rules, typography rules, logo usage rules, forbidden styles, tone of voice
- This brand context is automatically prepended to every generation request in the session
- User can toggle brand enforcement on/off per generation
- Brand kit can be updated at any time; updates apply to future generations only

**Brand Kit Memory Architecture:**
- Brand kit stored as structured JSON + vector embeddings
- Injected into Gemini 3 context at session start (within 1M token window)
- User does not need to re-explain brand per generation

**Edge cases:**
- No brand kit uploaded → system prompts user to set up brand kit OR proceeds in "free mode" without brand enforcement
- Conflicting brand signals (e.g., uploaded example designs don't match stated colors) → Gemini 3 flags the conflict and asks user which to prioritize

---

### Feature 2: Product Photography Engine

**Priority:** P0 (Must have at launch — core beachhead feature)

**Description:**  
Upload one or more photos of a product (taken on a phone, any background) and generate professional studio-quality product shots in any scene, background, lighting, or aspect ratio.

**User story:**  
*As a Shopify seller, I want to upload a plain photo of my product and get back professional-looking product shots I can use in my store and ads immediately.*

**Inputs:**
- Product image upload (up to 6 product photos for multi-angle compositing)
- Background/scene description (text, e.g., "marble kitchen counter with soft morning light" or "outdoor market stall on a sunny day")
- Background style presets (Studio White, Lifestyle, Outdoor, Seasonal, Branded)
- Aspect ratio selection (1:1, 4:5, 16:9, 9:16, 4:3)
- Resolution selection (1K, 2K, 4K)
- Quantity (generate 1, 3, or 6 variations per request)

**Behavior:**
- Nano Banana Pro (`gemini-3-pro-image-preview`) receives the product images as reference inputs
- System prompt instructs model to preserve product appearance with high fidelity while placing it in requested scene
- Model uses Thinking mode to reason about composition before generating final output
- All Thought Signatures are automatically managed by the SDK in chat mode
- User can iterate conversationally: "Add a reflection on the surface" / "Make the background more blurred" / "Show the product from a slightly elevated angle"

**Output:**
- Generated images returned as base64, displayed immediately in canvas
- Download options: PNG (web), JPEG (compressed), TIFF (print-ready)
- One-click export to correct size for Shopify, Amazon, Etsy, or Instagram

**Guardrails:**
- If product is not clearly identifiable in uploaded image, system asks for a better photo before proceeding
- System preserves product text/labels with high fidelity (uses Nano Banana Pro's advanced text rendering)

---

### Feature 3: Campaign Asset Generator

**Priority:** P0 (Must have at launch)

**Description:**  
Input a campaign brief (or just a sentence describing your goal). The system generates all required assets — every format, every size — in your brand style simultaneously.

**User story:**  
*As a marketing manager, I want to describe a campaign once and get every asset I need for that campaign — Instagram posts, stories, Facebook ads, email headers — all looking consistent and on-brand, without reformatting each one manually.*

**Inputs:**
- Campaign brief (free-text field, e.g., "Valentine's Day sale — 30% off all candles, warm and romantic mood, Feb 10–14")
- Asset format selection (checkboxes): Instagram Post (1:1), Instagram Story (9:16), Facebook Ad (4:5), Facebook Banner (16:9), Email Header (600x200px), Pinterest (2:3), Twitter/X Post (16:9), Display Banner (300x250)
- Tone override (if different from brand default)
- Key messages or copy to include (optional)

**Behavior:**
- Gemini 3 Pro reads the brief and generates a campaign concept: visual direction, color mood, copy suggestions, layout rationale
- User reviews concept and approves or refines it (one text prompt)
- Nano Banana Pro generates all selected asset formats simultaneously (batched requests)
- All assets use brand kit automatically
- Thought Signatures managed across the generation session so all assets stay visually coherent

**Output:**
- Asset gallery view showing all generated assets organized by format
- Bulk download as ZIP, organized into folders by format
- Export presets for Hootsuite, Buffer, Meta Ads Manager

**Iteration:**
- User can select any individual asset and continue editing it conversationally
- "Make the Instagram story version more vertical and dramatic"
- "The Facebook ad needs stronger contrast — the text is hard to read"
- Changes to one asset do not affect others unless user explicitly says "apply this change to all"

---

### Feature 4: Conversational Canvas

**Priority:** P0 (Core editing experience)

**Description:**  
An infinite canvas where users interact with images the way they'd talk to a human designer. The AI understands context across the full conversation and can edit, refine, or iterate on any image it previously generated.

**User story:**  
*As a user, I want to refine my designs through natural conversation rather than learning complex tools or sliders.*

**Canvas Features:**
- Infinite zoom/pan canvas
- Multi-image workspace (multiple assets open simultaneously)
- Conversation thread attached to each asset (full history preserved)
- Version history — any previous version of an image can be restored with one click
- Side-by-side comparison mode

**Conversational Editing Capabilities:**
- Object manipulation: "Move the text to the bottom left" / "Make the logo bigger"
- Style changes: "Make the whole image moodier" / "Change the color palette to earth tones"
- Background changes: "Replace the background with a forest" / "Make the background blurred"
- Text editing: "Change the headline to 'Summer Sale'" / "Make the font bolder"
- Composition changes: "Add more negative space at the top for text overlay"
- Grounded updates: "Update this to show today's weather in Mumbai"

**Technical Implementation:**
- Each image and its full conversation thread are sent to Nano Banana Pro in each turn
- Thought Signatures from all previous turns are included in every new request (SDK chat mode handles this automatically)
- System prompt includes brand kit context on every turn
- Generation state persists for the full browser session; exported state (JSON) can be saved and reloaded

---

### Feature 5: AI Design Critique

**Priority:** P1 (Important but not required at launch)

**Description:**  
Upload or generate any design and ask Gemini 3 Pro to critique it — checking brand consistency, accessibility, layout quality, and conversion potential.

**User story:**  
*As a non-designer, I want expert feedback on whether my design looks professional and whether it will actually work before I publish it.*

**Inputs:**
- Any generated or uploaded image
- Optional context: "This is a Facebook ad for a 30% off sale targeting women 25–40"

**Outputs — Critique Dimensions:**
- **Brand consistency score** (1–10): Does this match your brand kit?
- **Readability check**: Is all text legible at intended display size?
- **Accessibility check**: Does text contrast meet WCAG AA standards?
- **Composition feedback**: Is the visual hierarchy clear? Where does the eye go first?
- **Conversion feedback**: For ad creatives — is the CTA visible? Is the value proposition clear?
- **Specific actionable fixes**: "Increase headline size by 20%" / "The logo overlaps the product — move it to the bottom right"

**Technical Implementation:**
- Gemini 3 Pro with `thinking_level: "high"` and `media_resolution: "media_resolution_high"`
- Response is structured JSON parsed into a visual scorecard UI
- Each critique point is actionable: user clicks "Fix this" and the canvas enters edit mode for that specific issue

---

### Feature 6: Grounded Generation (Real-Time Data Visuals)

**Priority:** P1

**Description:**  
Generate visuals that incorporate real-time information — weather forecasts, sports scores, news, stock prices — using Gemini 3's Google Search tool grounding with Nano Banana Pro.

**Use cases:**
- Restaurant daily specials graphic using today's weather ("warm soup for a rainy Tuesday")
- Sports team matchday graphic with today's game info
- News publication visual for a breaking story
- Financial product showing current rates or market data
- Event promoter updating venue graphics with current weather forecast

**Inputs:**
- Grounded prompt: "Generate a weekly weather visual for Paris this week for my travel blog"
- Style preferences
- Brand kit (auto-applied)

**Behavior:**
- Nano Banana Pro is called with `tools: [{ googleSearch: {} }]`
- Model searches for real-time data, then uses it to generate an accurate, styled visual
- Response includes `groundingMetadata` showing which sources were used
- Sources displayed to user for transparency

**Limitations:**
- Image-based search results are not passed to the generation model (Google API constraint)
- Accuracy depends on search result quality; user should verify time-sensitive data

---

### Feature 7: Batch Export & Format Intelligence

**Priority:** P0

**Description:**  
Any generated image can be exported in the correct format, size, and color profile for any platform — with zero manual resizing.

**Export Presets:**
| Platform | Format | Size | Color Profile |
|----------|--------|------|---------------|
| Shopify Product | JPEG | 2048x2048 | sRGB |
| Amazon Main Image | JPEG | 2000x2000 | sRGB |
| Instagram Post | JPEG | 1080x1080 | sRGB |
| Instagram Story | JPEG | 1080x1920 | sRGB |
| Facebook Ad | JPEG | 1200x628 | sRGB |
| Pinterest | JPEG | 1000x1500 | sRGB |
| Print (Generic) | TIFF | 300 DPI | CMYK |
| Email Header | JPEG | 600x200 | sRGB |

**Behavior:**
- User selects one or more export presets (checkbox list)
- System generates/resizes to each selected format
- All files downloaded as organized ZIP
- CMYK conversion handled server-side for print exports (fixing Canva's biggest gap)

---

### Feature 8: Asset Library

**Priority:** P1

**Description:**  
All generated assets are saved automatically in a searchable library. Users can find, reuse, download, or continue editing any past asset.

**Features:**
- Auto-saved on generation (no manual save needed)
- Search by: date, campaign name, asset type, keywords, color
- Folder/collection organization
- Version history per asset (all iterations preserved)
- One-click "Continue editing" reopens asset in conversational canvas with full history
- Bulk download by collection or date range
- Sharing: generate a shareable link to any asset or collection for client review

---

## 8. User Flows

### Flow 1: First-Time E-Commerce Seller (Core Beachhead Flow)

```
1. Sign up → Land on "Get Your First Product Shot" page
2. Upload product photo
3. Choose background style (preset: Studio White / Lifestyle / Outdoor)
4. Click "Generate" → 4 variations appear in 15–30 seconds
5. Click on favorite → Enter conversational canvas
6. Type: "Add a small sprig of eucalyptus in the background" → Updated image
7. Type: "Make it 4K and square format" → High-res version generated
8. Click "Export for Shopify" → Downloads 2048x2048 JPEG
9. Prompt: "Set up your brand kit to get on-brand results every time" → Brand kit onboarding
```

### Flow 2: Campaign Asset Generation

```
1. User clicks "New Campaign"
2. Types brief: "Back to school — 20% off all backpacks, energetic blue/yellow palette, target: parents"
3. Gemini 3 Pro generates campaign concept card — user reviews and approves
4. User selects asset formats: IG Post, IG Story, Facebook Ad, Email Header
5. Clicks "Generate All" → 4 assets generated simultaneously
6. Reviews gallery — selects IG Story
7. Types: "The text is too small on mobile, make it bigger and bolder"
8. Accepts result → Downloads all 4 as ZIP
```

### Flow 3: Brand Kit Setup

```
1. User clicks "Brand Kit" in sidebar
2. Uploads logo (PNG)
3. System auto-extracts primary colors from logo — user confirms or adjusts
4. User uploads brand guide PDF → Gemini 3 extracts: font preferences, color rules, tone, forbidden elements
5. User adds 3 example designs they love as style references
6. Clicks "Save Brand Kit"
7. Returns to canvas — all future generations now auto-apply brand
8. Badge on every generated asset: "Brand kit applied ✓"
```

---

## 9. AI Architecture

### Model Assignment

| Feature | Model | Thinking Level | Notes |
|---------|-------|---------------|-------|
| Brand guide extraction | `gemini-3-pro-preview` | `high` | Complex PDF parsing + rule extraction |
| Campaign concept planning | `gemini-3-pro-preview` | `high` | Creative reasoning required |
| Design critique | `gemini-3-pro-preview` | `high` | Detailed multimodal analysis |
| Copy writing / headlines | `gemini-3-flash-preview` | `low` | Fast, simple text generation |
| Product photography | `gemini-3-pro-image-preview` | Thinking on by default | Nano Banana Pro — best fidelity |
| Campaign assets (all formats) | `gemini-3-pro-image-preview` | Thinking on by default | Nano Banana Pro — text rendering |
| Quick icons / backgrounds | `gemini-2.5-flash-image` | N/A | Nano Banana — fast/cheap |
| Grounded generation | `gemini-3-pro-image-preview` + `googleSearch` tool | Thinking on by default | Real-time data visuals |

### Thought Signature Management
- All image generation uses the official `@google/genai` JavaScript SDK in `chat` mode
- Thought Signatures are automatically managed by the SDK — no manual extraction or re-injection required
- This is critical for conversational editing: the model maintains visual reasoning context across all turns in a session
- Session state (full conversation history with signatures) is persisted in server-side session storage for the duration of the browser session

### Brand Context Injection
- Brand kit is serialized to a structured prompt block on session initialization
- Injected as a system-level context in every Gemini 3 call: `"You are generating assets for a brand with the following guidelines: [brand kit JSON]"`
- For Nano Banana Pro calls, brand guidelines are embedded in the generation prompt
- Total brand context stays well within the 1M token context window even with large brand guides

### Media Resolution Settings
- Design critique: `media_resolution_high` (1120 tokens/image) — need maximum detail for accurate analysis
- Product photography input: `media_resolution_high` — preserve product detail
- Campaign briefs with reference images: `media_resolution_medium` (560 tokens) — sufficient for style reference
- Video/animation (future): `media_resolution_low` (70 tokens per frame)

### Temperature
- All Gemini 3 calls use default temperature of `1.0` as recommended by Google
- Do NOT set temperature lower — known to cause looping and performance degradation on Gemini 3

### API Cost Management
- Fast/simple tasks route to `gemini-3-flash-preview` or `gemini-2.5-flash-image` to minimize cost
- 4K generation only triggered explicitly by user (default is 1K for speed, user upgrades to 4K for final export)
- Batch API used for campaign generation (up to 24-hour turnaround option available at discounted rate)
- Context caching enabled for brand kit (brand kit context hashed and cached — saves re-tokenizing on every request)

---

## 10. Technical Requirements

### Frontend
- **Framework:** React 18 + TypeScript
- **Canvas:** Fabric.js or Konva.js for infinite canvas with zoom/pan
- **State management:** Zustand (lightweight, sufficient for canvas state)
- **Styling:** Tailwind CSS
- **File handling:** Browser File API for uploads; canvas `toBlob()` for exports
- **Real-time updates:** Server-Sent Events (SSE) for streaming generation responses

### Backend
- **Runtime:** Node.js with Express or Fastify
- **AI SDK:** `@google/genai` (official JavaScript SDK) — handles Thought Signatures automatically
- **Session storage:** Redis (persists conversation history + Thought Signatures per user session)
- **File storage:** AWS S3 or equivalent — user uploads + generated asset library
- **Image processing:** Sharp.js for CMYK conversion, resizing, format export
- **Queue:** Bull (Redis-backed) for batch campaign generation jobs

### Authentication
- Magic link email auth (v1 — keep it simple)
- Google OAuth (v1.1)
- Team invites via email (v1.1)

### Performance Requirements
- First generated image visible in ≤ 20 seconds from prompt submission (1K resolution)
- 4K generation ≤ 60 seconds
- Canvas interactions (pan/zoom/select) at 60fps
- Asset library search results in ≤ 500ms

### Browser Support
- Chrome 100+, Firefox 100+, Safari 15+, Edge 100+
- Mobile web: iOS Safari 15+, Chrome Android 100+

### Security
- All API keys server-side only — never exposed to client
- User uploads scanned for malware before processing
- Generated images watermarked until paid plan activated
- GDPR-compliant data deletion on account close

---

## 11. Design Principles

### 1. Conversation Over Configuration
The UI should feel like talking to a skilled designer, not operating a tool. Sliders, panels, and menus should be secondary to the natural language input. Every feature should be reachable by typing.

### 2. Instant Gratification
Users should see something impressive within their first 60 seconds. The onboarding does not end with a blank canvas — it ends with a generated image.

### 3. Professional by Default
Every default output should look professional enough to publish. Users should never need to "make it look better" — it should start good and get great through iteration.

### 4. Brand is Sacred
Once a brand kit is uploaded, the system should treat every output as a brand touchpoint. Never generate something that clashes with the brand without warning the user.

### 5. Transparency
When AI makes a decision (color choice, layout, copy) it should be explainable. Users should always understand why the AI did what it did and how to change it.

### 6. Reliability Over Features
A smaller feature set that works perfectly beats a large feature set that occasionally fails. Every generation should produce a usable result. If it can't, it should say so clearly.

---

## 12. Monetization

### Pricing Tiers

**Free Tier — "Starter"**
- 10 image generations per month
- 1K resolution only
- No brand kit
- Watermarked exports
- Purpose: acquisition and conversion funnel

**Solo Plan — $39/month**
- 200 image generations per month
- Up to 2K resolution
- 1 brand kit
- Watermark-free exports
- Asset library (up to 500 assets)
- All export presets
- Target: E-commerce sellers, solo creators

**Pro Plan — $99/month**
- Unlimited generations
- 4K resolution
- 3 brand kits
- Campaign Mode (batch generation)
- Grounded generation (real-time data)
- Design Critique feature
- Asset library (unlimited)
- Priority generation queue
- Target: Marketing managers, active content creators

**Agency Plan — $299/month**
- Everything in Pro
- Up to 10 brand kits (one per client)
- Multi-user workspace (up to 5 seats)
- Client sharing links (read-only for client review)
- White-label export option (no VisualAI watermark on client-facing materials)
- Bulk export / campaign ZIP
- Target: Small agencies, freelancers with multiple clients

### Revenue Projections (Conservative)
| Month | Free Users | Paid Users | MRR |
|-------|-----------|-----------|-----|
| 3 | 500 | 50 | $2,500 |
| 6 | 2,000 | 200 | $12,000 |
| 9 | 5,000 | 450 | $30,000 |
| 12 | 10,000 | 800 | $55,000 |

### API Cost Estimates (Per User Per Month — Pro Plan)
- 500 Nano Banana Pro 1K image generations: ~$67 (at $0.134/image)
- 100 Nano Banana Pro 4K image generations: ~$54 (4K is ~4x cost)
- Gemini 3 Pro text/critique calls: ~$8 (minimal token usage)
- **Total API cost per Pro user: ~$129**
- **Pro plan price: $99** → Initial gross margin negative; improves with caching, routing to Flash models for simple tasks, and usage limits
- **Path to margin:** Route 60% of generations to `gemini-2.5-flash-image` (~$0.01/image) for simple backgrounds/icons, reserve Nano Banana Pro for product shots and campaigns

---

## 13. Phased Roadmap

### Phase 1 — MVP (Months 1–3)
**Goal:** Get to 50 paying e-commerce customers. Prove the product photography replacement use case.

**Deliverables:**
- Product Photography Engine (Feature 2) — core flow
- Basic Conversational Canvas (Feature 4) — single image editing
- Batch Export with Shopify/Amazon presets (Feature 7)
- Simple account system + Stripe billing
- Free tier + Solo Plan only
- Web app only

**Success criteria:** 50 paying users, average rating ≥ 4.0/5.0, < 5% weekly churn

---

### Phase 2 — Growth (Months 4–6)
**Goal:** Expand to marketing teams. Introduce brand memory and campaign generation.

**Deliverables:**
- Brand Kit (Feature 1)
- Campaign Asset Generator (Feature 3)
- Asset Library (Feature 8)
- Pro Plan launch
- Team invites (2-seat minimum)

**Success criteria:** 200 paying users, $12K MRR, Brand Kit adoption ≥ 40% of active users

---

### Phase 3 — Differentiation (Months 7–9)
**Goal:** Build the features no competitor has. Lock in power users.

**Deliverables:**
- AI Design Critique (Feature 5)
- Grounded Generation (Feature 6)
- Agency Plan launch
- Client sharing links
- Multi-brand kit workspace

**Success criteria:** 450 paying users, $30K MRR, Agency Plan accounts ≥ 10% of revenue

---

### Phase 4 — Scale (Months 10–12)
**Goal:** Polish, performance, and expansion.

**Deliverables:**
- Mobile app (iOS first)
- Figma plugin (import Figma frames → enhance with AI)
- API access for developers (headless asset generation)
- Integrations: Shopify app, Meta Ads Manager direct publish, Hootsuite

**Success criteria:** $50K+ MRR, < 4% churn, NPS ≥ 50

---

## 14. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Nano Banana Pro API costs exceed projections | Medium | High | Route simple generations to Flash model; enforce monthly generation limits per tier; monitor cost per user weekly |
| Image generation quality inconsistent for complex product shots | Medium | High | Extensive prompt engineering; fallback to user feedback loop; offer human review for agency tier |
| Google deprecates or changes pricing on Gemini 3 preview models | Medium | High | Abstract API layer so models can be swapped; monitor Google changelog; have Anthropic Claude as fallback for text reasoning |
| Lovart or Canva launches a competing product photography feature | High | Medium | Speed to market is critical; our advantage is conversational editing and brand memory which takes longer to copy |
| Users don't upload brand kits (feature adoption risk) | Medium | Medium | Make brand kit setup part of onboarding, not optional; show before/after comparison of branded vs unbranded output |
| Thought Signature management causes generation errors in complex sessions | Low | High | Use official SDK chat mode (handles automatically); add error recovery to restart session cleanly if signature error occurs |
| GDPR / data privacy concerns about uploaded brand assets | Medium | Medium | Clear data policy; option for users to delete all assets; never use user uploads to train models |

---

## 15. Open Questions

1. **Model naming:** The image generation API is called "Nano Banana Pro" in Google's documentation. This is the marketing name for `gemini-3-pro-image-preview`. Should we mention this model name in our UI, or refer to it generically as "our AI"?

2. **Offline/export quality:** For print-ready CMYK export, we need server-side color conversion. Should we use a dedicated color management library (like `colorjs`) or a headless LibreOffice conversion pipeline?

3. **Video generation:** Gemini's Veo model can generate short video clips. Should we scope this into Phase 3 or Phase 4? E-commerce and social media use cases for short product videos are strong.

4. **Competitor IP:** If users upload competitor logos or branded imagery as reference, we need a clear policy. Do we block this at upload or at generation?

5. **Localization:** South Asian e-commerce market (India, Bangladesh) is a massive underserved opportunity. Does the MVP include Hindi/Bengali UI or just English?

6. **Rate limits:** Gemini 3 Pro Image is currently in preview. At scale (500+ users generating simultaneously), will we hit rate limits? Need to confirm capacity with Google early.

7. **Free tier watermark design:** The watermark should be subtle enough not to embarrass users who share on social, but clear enough to drive conversion to paid. What's the right balance?

---

*Document Owner: Product Team*  
*Last Updated: February 25, 2026*  
*Next Review: March 11, 2026*