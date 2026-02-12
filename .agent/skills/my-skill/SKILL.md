# AI Media Kit Generation Skill

## Overview
This skill enables Claude to help users create professional media kits for content creators, models, and influencers using Google's Gemini APIs for vision analysis and image generation.

## Core Capabilities

### 1. Instagram Insights Analysis (Vision API)
Extract metrics from Instagram screenshot uploads to auto-populate media kit data.

### 2. Professional Bio Generation
Transform casual creator bios into polished, brand-ready descriptions.

### 3. Media Kit Code Generation
Generate custom React/HTML components based on natural language descriptions.

### 4. Visual Asset Creation (Image Generation)
Create branded headers, banners, and marketing materials.

---

## API Configuration

### Gemini Vision API (gemini-3-pro-preview)
**Purpose:** Extract data from Instagram Insights screenshots

**Endpoint:**
```
https://generativelanguage.googleapis.com/v1alpha/models/gemini-3-pro-preview:generateContent
```

**Headers:**
```
x-goog-api-key: $GEMINI_API_KEY
Content-Type: application/json
```

### Gemini Image Generation (gemini-3-pro-image-preview)
**Purpose:** Generate custom branded visuals for media kits

**Endpoint:**
```
https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent
```

---

## Use Cases & Implementation

## USE CASE 1: Extract Instagram Metrics from Screenshot

### When to Use
- User uploads Instagram Insights screenshot
- User mentions "my Instagram stats" or "analytics"
- Creating or updating a media kit

### Implementation

```bash
# Step 1: User uploads screenshot
# Step 2: Convert image to base64
# Step 3: Call Gemini Vision API

curl "https://generativelanguage.googleapis.com/v1alpha/models/gemini-3-pro-preview:generateContent" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H 'Content-Type: application/json' \
  -X POST \
  -d '{
    "contents": [{
      "parts": [
        { 
          "text": "Extract Instagram metrics from this screenshot. Return ONLY valid JSON with these exact fields: follower_count (number), engagement_rate (percentage as number), total_reach (number), top_locations (array of strings), age_demographics (object with age ranges as keys and percentages as values), gender_split (object with male/female percentages), post_impressions (number), profile_visits (number). If any field is not visible, use null." 
        },
        {
          "inlineData": {
            "mimeType": "image/jpeg",
            "data": "<BASE64_SCREENSHOT_DATA>"
          },
          "mediaResolution": {
            "level": "media_resolution_high"
          }
        }
      ]
    }]
  }'
```

### Expected Response Format
```json
{
  "follower_count": 45200,
  "engagement_rate": 4.8,
  "total_reach": 125000,
  "top_locations": ["Mumbai, India", "Delhi, India", "Bangalore, India"],
  "age_demographics": {
    "18-24": 35,
    "25-34": 42,
    "35-44": 18,
    "45+": 5
  },
  "gender_split": {
    "female": 68,
    "male": 32
  },
  "post_impressions": 89000,
  "profile_visits": 12500
}
```

### Prompt Engineering Tips
**DO:**
- Request specific JSON structure with exact field names
- Ask for null if data not visible
- Specify number formats (percentage vs count)
- Use high media resolution for better OCR

**DON'T:**
- Ask open-ended questions
- Rely on default formatting
- Accept approximate values without structure

---

## USE CASE 2: Generate Professional Bio Variations

### When to Use
- User provides casual bio and wants professional version
- Creating media kit content
- Different tones needed for different brand types

### Implementation

```bash
curl "https://generativelanguage.googleapis.com/v1alpha/models/gemini-3-pro-preview:generateContent" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H 'Content-Type: application/json' \
  -X POST \
  -d '{
    "contents": [{
      "parts": [{
        "text": "Transform this casual bio into 3 professional versions for a media kit.\n\nOriginal bio: \"Hey! Im Maya, I love fashion and styling. Been doing this for 2 years. I post outfit ideas and shopping hauls. Love working with sustainable brands!\"\n\nNiche: Fashion & Lifestyle\nFollowers: 45K\nEngagement: 4.8%\n\nCreate 3 variations:\n1. CORPORATE: For established luxury brands (150 words max)\n2. CASUAL: For DTC/Gen-Z brands (120 words max)\n3. LUXURY: For high-end fashion houses (180 words max)\n\nReturn as JSON:\n{\n  \"corporate\": \"...\",\n  \"casual\": \"...\",\n  \"luxury\": \"...\"\n}\n\nEach bio must:\n- Sound professional but authentic\n- Highlight value to brands\n- Include specific metrics naturally\n- Match the tone exactly"
      }]
    }]
  }'
```

### Expected Response
```json
{
  "corporate": "Maya is a fashion content creator specializing in sustainable style and conscious consumption. With a dedicated community of 45,000 followers and a 4.8% engagement rate, she creates authentic content that drives meaningful conversations around ethical fashion. Over the past two years, Maya has established herself as a trusted voice in the sustainable fashion space, delivering consistent value through carefully curated outfit inspiration and transparent shopping guides. Her audience demographic skews 25-34, predominantly female, with strong purchasing intent in the mid-to-premium fashion segment.",
  
  "casual": "Maya's all about making sustainable fashion actually fun! For the past 2 years, she's been sharing outfit inspo and honest shopping hauls with her 45K followers who love real talk about style. With a super engaged community (4.8% engagement rate—yeah, they actually care!), Maya creates content that feels like chatting with your stylish best friend. She's passionate about working with brands that give a damn about the planet, and her audience trusts her recs.",
  
  "luxury": "Maya represents the evolution of luxury fashion content creation—where sustainability meets sophistication. With two years of dedicated focus on conscious style curation, she has cultivated an engaged audience of 45,000 discerning followers who appreciate the intersection of elegance and ethics. Her content philosophy centers on thoughtful consumption, timeless style, and the celebration of craftsmanship. Maintaining a 4.8% engagement rate in a competitive landscape, Maya's aesthetic sensibility and authentic storytelling resonate particularly with audiences seeking to align their values with their wardrobe choices. Her collaborations are selective, purposeful, and designed to create lasting impressions that honor both brand heritage and contemporary consciousness."
}
```

---

## USE CASE 3: Generate Custom Media Kit Components

### When to Use
- User describes desired media kit aesthetic
- Vibe-coding: "make it more minimal", "add stats section"
- Creating unique layouts beyond templates

### Implementation Strategy

#### Step 1: Initial Generation
```bash
curl "https://generativelanguage.googleapis.com/v1alpha/models/gemini-3-pro-preview:generateContent" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H 'Content-Type: application/json' \
  -X POST \
  -d '{
    "contents": [{
      "parts": [{
        "text": "You are an expert React developer and web designer specializing in media kits for content creators.\n\nCreate a React component for a media kit with these specifications:\n\nSTYLE: Minimalist fashion editorial, think Vogue magazine\nCOLORS: Black, white, warm gray accents\nTYPOGRAPHY: Serif headlines, sans-serif body\nLAYOUT: Magazine-style grid with large images\n\nCREATOR DATA:\n- Name: Maya Sharma\n- Niche: Sustainable Fashion\n- Followers: 45,200\n- Engagement: 4.8%\n- Bio: [professional bio here]\n\nINCLUDE SECTIONS:\n1. Hero (full-screen with name/headshot)\n2. About (bio + aesthetic description)\n3. Stats (followers, engagement, demographics)\n4. Portfolio (grid of 6 images)\n5. Brand Collaborations (logos carousel)\n6. Contact CTA\n\nREQUIREMENTS:\n- Use React functional component\n- Use Tailwind CSS classes only\n- Mobile-responsive (mobile-first)\n- Semantic HTML\n- Include placeholder images\n- Modern, clean code\n- No external dependencies except React\n\nReturn ONLY the complete React component code. No explanations, no markdown formatting, just the code."
      }]
    }]
  }'
```

#### Step 2: Refinement (Vibe Coding)
```bash
curl "https://generativelanguage.googleapis.com/v1alpha/models/gemini-3-pro-preview:generateContent" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H 'Content-Type: application/json' \
  -X POST \
  -d '{
    "contents": [{
      "parts": [{
        "text": "You previously generated this media kit component:\n\n[PREVIOUS_CODE_HERE]\n\nUser feedback: \"Make the header image full-bleed, add animated fade-in effects, and make the stats section more visual with charts instead of just numbers.\"\n\nUpdate the component to incorporate this feedback while:\n- Maintaining overall design consistency\n- Keeping responsive design\n- Using only CSS animations (no JS libraries)\n- Ensuring accessibility\n\nReturn ONLY the updated complete component code."
      }]
    }]
  }'
```

### Code Quality Guidelines

**Component Structure:**
```jsx
export default function MediaKit() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-screen">
        {/* Hero content */}
      </section>
      
      {/* About Section */}
      <section className="py-20 px-4 max-w-6xl mx-auto">
        {/* About content */}
      </section>
      
      {/* Stats Section */}
      <section className="bg-gray-50 py-20">
        {/* Stats visualization */}
      </section>
      
      {/* Portfolio Grid */}
      <section className="py-20">
        {/* Image grid */}
      </section>
      
      {/* Contact Section */}
      <section className="py-20 bg-black text-white">
        {/* CTA */}
      </section>
    </div>
  );
}
```

**Tailwind Best Practices:**
- Use responsive breakpoints: `sm:`, `md:`, `lg:`, `xl:`
- Consistent spacing: `p-4`, `py-8`, `gap-6`
- Typography scale: `text-sm`, `text-base`, `text-lg`, `text-4xl`
- Hover states: `hover:opacity-80`, `hover:scale-105`

---

## USE CASE 4: Generate Branded Visual Assets

### When to Use
- User needs custom header image for media kit
- Creating social media banners
- Generating brand-specific graphics

### Implementation

```bash
curl -s -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "contents": [{
      "parts": [{
        "text": "Create a professional media kit header image for a sustainable fashion content creator. Style: Minimalist, editorial, high-end fashion magazine aesthetic. Colors: Black, white, warm beige. Include elegant serif typography with the name '\''MAYA SHARMA'\'' and subtitle '\''Sustainable Fashion Creator'\''. Layout: Magazine cover style with abstract geometric shapes and subtle texture. No photos, just typography and design elements. Sophisticated and modern."
      }]
    }],
    "generationConfig": {
      "responseModalities": ["TEXT", "IMAGE"],
      "imageConfig": {
        "aspectRatio": "16:9",
        "imageSize": "2K"
      }
    }
  }'
```

### Image Generation Guidelines

**Aspect Ratios:**
- `16:9` - Header banners, hero images
- `1:1` - Instagram posts, profile images
- `9:16` - Instagram stories, mobile banners
- `5:4` - Media kit thumbnails

**Image Sizes:**
- `2K` - High quality for print/download
- `1K` - Standard web use
- `512` - Thumbnails, previews

**Prompt Best Practices:**
```
GOOD: "Minimalist fashion editorial header with elegant serif typography, 
       black and white color scheme, geometric shapes, magazine style"

BAD:  "Make me a cool header"
```

**Style Keywords:**
- Editorial: "magazine layout", "sophisticated", "high-end"
- Minimal: "clean", "whitespace", "simple geometric"
- Modern: "contemporary", "bold typography", "asymmetric"
- Luxury: "elegant", "refined", "premium", "subtle textures"

---

## USE CASE 5: Multi-Image Portfolio Analysis

### When to Use
- User uploads multiple portfolio images
- Need to analyze aesthetic consistency
- Generate descriptions for portfolio pieces

### Implementation

```bash
curl -s -X POST \
  "https://generativelanguage.googleapis.com/v1alpha/models/gemini-3-pro-preview:generateContent" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "contents": [{
      "parts":[
        {
          "text": "Analyze these 5 portfolio images from a content creator. Identify:\n1. Overall aesthetic style\n2. Dominant color palette\n3. Content themes\n4. Recommended niche categories\n5. Suggested media kit design direction\n\nReturn as JSON with analysis and recommendations."
        },
        {"inlineData": {"mimeType":"image/jpeg", "data": "<BASE64_IMG_1>"}},
        {"inlineData": {"mimeType":"image/jpeg", "data": "<BASE64_IMG_2>"}},
        {"inlineData": {"mimeType":"image/jpeg", "data": "<BASE64_IMG_3>"}},
        {"inlineData": {"mimeType":"image/jpeg", "data": "<BASE64_IMG_4>"}},
        {"inlineData": {"mimeType":"image/jpeg", "data": "<BASE64_IMG_5>"}}
      ]
    }],
    "generationConfig": {
      "responseModalities": ["TEXT"]
    }
  }'
```

---

## Rate Calculator Logic

### Formula Implementation
```python
def calculate_creator_rate(data):
    """
    Calculate recommended rate for content creator based on metrics
    
    Args:
        data: {
            'follower_count': int,
            'engagement_rate': float (percentage),
            'niche': str,
            'content_type': str (post, story, reel, etc)
        }
    
    Returns:
        {
            'base_rate': int,
            'recommended_low': int,
            'recommended_high': int,
            'reasoning': str
        }
    """
    
    # Base rate by follower tier
    if data['follower_count'] < 10000:
        base = 100
    elif data['follower_count'] < 50000:
        base = 500
    elif data['follower_count'] < 100000:
        base = 1500
    elif data['follower_count'] < 500000:
        base = 5000
    else:
        base = 10000
    
    # Engagement multiplier
    engagement_multiplier = 1.0
    if data['engagement_rate'] > 8:
        engagement_multiplier = 2.0
    elif data['engagement_rate'] > 5:
        engagement_multiplier = 1.5
    elif data['engagement_rate'] > 3:
        engagement_multiplier = 1.2
    elif data['engagement_rate'] < 2:
        engagement_multiplier = 0.8
    
    # Niche multipliers (based on market data)
    niche_multipliers = {
        'fashion': 1.2,
        'beauty': 1.3,
        'tech': 1.5,
        'finance': 1.6,
        'lifestyle': 1.0,
        'fitness': 1.1,
        'food': 1.1,
        'travel': 1.2,
        'parenting': 1.0,
        'gaming': 1.3
    }
    
    niche_mult = niche_multipliers.get(data['niche'].lower(), 1.0)
    
    # Content type multipliers
    content_multipliers = {
        'post': 1.0,
        'story': 0.5,
        'reel': 1.3,
        'igtv': 1.4,
        'carousel': 1.1
    }
    
    content_mult = content_multipliers.get(data['content_type'].lower(), 1.0)
    
    # Calculate final rate
    final_rate = base * engagement_multiplier * niche_mult * content_mult
    
    # Create range (±20%)
    recommended_low = int(final_rate * 0.8)
    recommended_high = int(final_rate * 1.2)
    
    reasoning = f"""Based on {data['follower_count']:,} followers with {data['engagement_rate']}% engagement:
- Base rate tier: ${base}
- Engagement boost: {engagement_multiplier}x ({"excellent" if engagement_multiplier >= 1.5 else "good" if engagement_multiplier >= 1.2 else "average"})
- {data['niche'].title()} niche factor: {niche_mult}x
- {data['content_type'].title()} content premium: {content_mult}x

Your audience is highly engaged and valuable to brands in the {data['niche']} space."""
    
    return {
        'base_rate': int(final_rate),
        'recommended_low': recommended_low,
        'recommended_high': recommended_high,
        'reasoning': reasoning,
        'package_suggestions': {
            'single_post': f"${recommended_low}-${recommended_high}",
            'three_pack': f"${int(recommended_low * 2.5)}-${int(recommended_high * 2.5)}",
            'monthly': f"${int(recommended_low * 8)}-${int(recommended_high * 8)} (12 posts)"
        }
    }
```

---

## Workflow Examples

### Complete Media Kit Creation Flow

```plaintext
Step 1: Data Collection
├── User uploads Instagram screenshot
├── API: Extract metrics via Gemini Vision
└── Store: Save to database

Step 2: Bio Enhancement
├── User provides casual bio
├── API: Generate 3 professional variations
└── User: Selects preferred version

Step 3: Visual Design
├── User describes aesthetic ("minimal fashion editorial")
├── API: Generate custom React component
└── Preview: Show live render

Step 4: Refinement (Vibe Coding)
├── User: "Make header full-bleed, add animations"
├── API: Update component code
├── Preview: Show updated render
└── Repeat until satisfied

Step 5: Asset Generation
├── API: Generate branded header image
├── API: Generate social banners
└── Include in media kit

Step 6: Export
├── Generate PDF version
├── Deploy to custom URL (yourname.imagestudiolab.com)
└── Provide download links
```

---

## Error Handling

### Vision API Errors
```javascript
// Handle unclear screenshots
if (response.follower_count === null) {
  return {
    error: "Could not read follower count from screenshot",
    suggestion: "Please upload a clearer image of your Instagram Insights page"
  }
}

// Handle non-Instagram images
if (!isInstagramScreenshot(image)) {
  return {
    error: "This doesn't appear to be an Instagram Insights screenshot",
    suggestion: "Please upload a screenshot from Instagram > Insights > Audience"
  }
}
```

### Code Generation Errors
```javascript
// Validate generated code
function validateGeneratedCode(code) {
  // Check for valid React syntax
  if (!code.includes('export default function')) {
    throw new Error('Invalid component structure');
  }
  
  // Ensure no unsafe code
  if (code.includes('dangerouslySetInnerHTML')) {
    throw new Error('Security violation in generated code');
  }
  
  // Check Tailwind usage
  if (!code.includes('className')) {
    throw new Error('Missing Tailwind styling');
  }
  
  return true;
}
```

---

## Performance Optimization

### Caching Strategy
```javascript
// Cache common patterns
const CACHE_PATTERNS = {
  'minimal_fashion': '<cached_template_code>',
  'modern_tech': '<cached_template_code>',
  'luxury_beauty': '<cached_template_code>'
}

// Quick generation for similar requests
if (userRequest.includes('minimal') && userRequest.includes('fashion')) {
  startWithCache('minimal_fashion');
  applyCustomizations(userRequest);
}
```

### Streaming Responses
```javascript
// Stream code generation for better UX
async function* streamCodeGeneration(prompt) {
  const stream = await gemini.generateContentStream(prompt);
  
  for await (const chunk of stream) {
    yield chunk.text;
    // Update preview in real-time
    updateLivePreview(chunk.text);
  }
}
```

---

## Security Guidelines

### Input Validation
- Sanitize all user text inputs
- Validate image uploads (type, size, content)
- Limit API call frequency (rate limiting)
- Never execute generated code on server

### Output Safety
- Sandbox preview environment (iframe)
- Content Security Policy headers
- No inline scripts in generated code
- Escape user data in generated components

### API Key Protection
- Never expose API keys to client
- Use server-side proxy for API calls
- Rotate keys regularly
- Monitor usage for anomalies

---

## Testing Checklist

### Vision API Tests
- [ ] Clear Instagram screenshot → Correct extraction
- [ ] Blurry screenshot → Error with helpful message
- [ ] Non-Instagram image → Rejection with guidance
- [ ] Multiple languages → Proper handling
- [ ] Various Instagram UI versions → Compatibility

### Code Generation Tests
- [ ] Minimal design → Clean, simple code
- [ ] Complex design → Proper component structure
- [ ] Mobile responsive → Breakpoints work
- [ ] Accessibility → ARIA labels, semantic HTML
- [ ] No dependencies → Pure React + Tailwind

### Image Generation Tests
- [ ] Brand colors → Accurate reproduction
- [ ] Typography → Readable, professional
- [ ] Aspect ratios → Correct dimensions
- [ ] High resolution → Quality output

---

## Best Practices Summary

### DO:
✅ Request structured JSON responses
✅ Use high media resolution for OCR
✅ Provide detailed design specifications
✅ Validate and sanitize all outputs
✅ Cache common patterns
✅ Stream long operations
✅ Test with real user data
✅ Handle errors gracefully

### DON'T:
❌ Trust unvalidated API responses
❌ Execute generated code server-side
❌ Skip input sanitization
❌ Use low resolution for vision tasks
❌ Generate code with security risks
❌ Ignore accessibility requirements
❌ Forget mobile responsiveness

---

## Monitoring & Analytics

### Track These Metrics:
- API call success rate
- Average response time
- Code generation quality (user feedback)
- Vision extraction accuracy
- Image generation satisfaction
- User refinement iterations (vibe coding loops)

### Quality Indicators:
- **Good**: 1-2 refinement iterations
- **Needs improvement**: 5+ iterations
- **Excellent**: User accepts first generation

---

## Future Enhancements

### Planned Features:
1. **Component Library**: Pre-built sections users can mix/match
2. **A/B Testing**: Generate multiple variations, let user choose
3. **Brand Guidelines**: Upload brand PDF, extract colors/fonts
4. **Live Data Sync**: Connect Instagram API for auto-updates
5. **Collaboration**: Multiple users edit same media kit
6. **Version Control**: Git-like history for all changes

---

## Support Resources

### Common User Questions:

**Q: Screenshot upload fails**
A: Ensure image is JPG/PNG, under 10MB, and shows full Insights page

**Q: Generated code doesn't match description**
A: Be more specific in description. Include color codes, specific fonts, exact layout details

**Q: How many refinements allowed?**
A: Unlimited in paid tiers, 3 per media kit in free tier

**Q: Can I edit code manually?**
A: Yes! Toggle "Advanced Mode" to see and edit code directly

---

## Version History

**v1.0** - Initial skill creation
- Vision API for metric extraction
- Bio generation
- Basic component generation
- Image generation for assets

**v1.1** - Enhanced vibe coding (planned)
- Iterative refinement
- Component composition
- Style transfer from references

**v1.2** - Advanced features (planned)
- Animation support
- Interactive components
- Data visualization charts

---

## Quick Reference

### API Endpoints
```
Vision Analysis:
POST /v1alpha/models/gemini-3-pro-preview:generateContent

Image Generation:
POST /v1beta/models/gemini-3-pro-image-preview:generateContent
```

### Essential Headers
```
x-goog-api-key: $GEMINI_API_KEY
Content-Type: application/json
```

### Response Modalities
```
"responseModalities": ["TEXT"]           // Text only
"responseModalities": ["IMAGE"]          // Image only  
"responseModalities": ["TEXT", "IMAGE"]  // Both
```

### Image Config
```json
{
  "aspectRatio": "16:9",  // or "1:1", "9:16", "5:4"
  "imageSize": "2K"        // or "1K", "512"
}
```

---

## Contact & Support

For issues with this skill:
- Report bugs in the skill repository
- Request features via GitHub issues
- Join community Discord for help

---

**Last Updated:** 2026-02-12
**Skill Version:** 1.0
**Maintained by:** ImageStudioLab Team