const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Rate limiting - persists across warm invocations of the same serverless instance
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 30; // max requests per IP per window
const rateLimitStore = new Map();

function checkRateLimit(ip) {
    const now = Date.now();
    const record = rateLimitStore.get(ip);

    // Clean up expired entries periodically (every 100 checks)
    if (Math.random() < 0.01) {
        for (const [key, val] of rateLimitStore) {
            if (now - val.windowStart > RATE_LIMIT_WINDOW_MS) {
                rateLimitStore.delete(key);
            }
        }
    }

    if (!record || now - record.windowStart > RATE_LIMIT_WINDOW_MS) {
        rateLimitStore.set(ip, { windowStart: now, count: 1 });
        return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
    }

    record.count++;
    if (record.count > RATE_LIMIT_MAX_REQUESTS) {
        const retryAfter = Math.ceil((record.windowStart + RATE_LIMIT_WINDOW_MS - now) / 1000);
        return { allowed: false, remaining: 0, retryAfter };
    }

    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - record.count };
}

// Sanitize response to remove control characters that break client JSON parsing
function sanitizeApiResponse(data) {
    return JSON.parse(JSON.stringify(data, (key, value) => {
        if (typeof value === 'string') {
            return value.replace(/[\x00-\x1f]/g, (ch) => {
                const code = ch.charCodeAt(0);
                if (code === 9 || code === 10 || code === 13) return ' ';
                return '';
            });
        }
        return value;
    }));
}

module.exports = async function handler(req, res) {
    // Enable CORS - restrict to same-origin deployments
    const allowedOrigin = process.env.CORS_ORIGIN || req.headers.origin || '*';
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Expose-Headers', 'Retry-After, X-RateLimit-Limit, X-RateLimit-Remaining');

    // Handle preflight request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    // Rate limiting
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
    const rateLimit = checkRateLimit(clientIp);
    res.setHeader('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS);
    res.setHeader('X-RateLimit-Remaining', rateLimit.remaining);
    if (!rateLimit.allowed) {
        res.setHeader('Retry-After', rateLimit.retryAfter);
        res.status(429).json({ error: 'Too many requests. Please try again later.' });
        return;
    }

    try {
        const { image, mediaType, equipment, specificMethod, currentBrewMethod, selectedFilterType, adjustmentRequest, previousAnalysis } = req.body;

        // Validate image size (base64 ~1.37x original, 10MB base64 ≈ ~7.3MB image)
        const MAX_IMAGE_BASE64_LENGTH = 10 * 1024 * 1024;
        if (image && image.length > MAX_IMAGE_BASE64_LENGTH) {
            res.status(413).json({ error: 'Image too large. Please use an image under 7MB.' });
            return;
        }

        // Handle recipe adjustment requests
        if (adjustmentRequest && previousAnalysis) {
            const adjustmentPrompt = `The user brewed this coffee and provided taste feedback:

${adjustmentRequest}

Previous coffee details:
- Name: ${previousAnalysis.name || 'Unknown'}
- Roaster: ${previousAnalysis.roaster || 'Unknown'}
- Roast Level: ${previousAnalysis.roast_level || 'Unknown'}
- Origin: ${previousAnalysis.origin || 'Unknown'}
- Processing: ${previousAnalysis.processing || 'Unknown'}

Brew Method Used: ${currentBrewMethod || 'Unknown'}

Equipment: ${equipment}
${selectedFilterType ? `\nFilter Being Used: ${selectedFilterType}\n\n⚠️ FILTER-AWARE ADJUSTMENTS: The user is brewing with a "${selectedFilterType}" filter. Factor this into your adjusted parameters:\n- **Sibarist Fast / Sibarist B3**: Very fast flow rate — use finer grind to compensate, shorter total brew time expected, more aggressive pour schedule\n- **Paper - White (bleached)**: Standard flow rate, clean cup, neutral baseline\n- **Paper - Natural (unbleached)**: Slightly slower than white, can add papery taste if not rinsed well\n- **Cafec**: Medium-fast flow depending on model, typically clean cup similar to white paper\n- **Metal (reusable)**: Very fast flow, passes oils and fines — use finer grind, expect more body and sediment, shorter drawdown\n- **Cloth**: Medium-slow flow, produces very clean but full-bodied cup — slightly coarser grind than paper\nAdjust grind size, pour timing, and brew time recommendations based on this filter's flow characteristics.\n` : ''}
⚠️ CRITICAL: The user brewed this coffee using "${currentBrewMethod}". You MUST provide adjustments for the SAME brew method (${currentBrewMethod}). DO NOT switch to a different brew method.

⚠️ IMPORTANT: Analyze the user's feedback to determine the appropriate response:

1. **If feedback is about taste/extraction** (sour, bitter, timing, temperature): Provide adjusted recipe parameters in JSON format
2. **If feedback includes corrections or questions**: Respond in 1 SHORT sentence (10-15 words max), acknowledge and suggest next step

⚠️ GRINDER SETTINGS FORMAT:
- **Ceado E37SD/E37S**: Just the number, no "setting" word (e.g., "1.5" or "3.5", NEVER "setting 15")
- Scale is 0-9 ONLY (espresso 0.5-2.5, pour over 3.5-5.5)
- **Baratza Encore**: 1-40 scale (pour over 12-18)

For conversational responses, respond in plain text, not JSON. One sentence only.

For taste/extraction adjustments (case 1), provide your response in this EXACT JSON format (no markdown, no code blocks, just pure JSON):

{
  "adjusted_parameters": {
    "dose": "exact value with units (e.g., '18g')",
    "yield": "exact value with units (e.g., '36g' or '250ml')",
    "ratio": "exact ratio (e.g., '1:2' or '1:16')",
    "water_temp": "exact temperature (e.g., '202°F' or '94°C')",
    "grind_size": "specific description (e.g., 'Fine, setting 15 on Baratza Encore')",
    "brew_time": "exact time (e.g., '28-30 seconds' or '3:00')",
    "pressure": "exact pressure (e.g., '9 bars' or 'N/A')",
    "flow_control": "specific flow profile (e.g., '6 bar pre-infusion for 8s, ramp to 9 bar' or 'N/A')"
  },
  "adjustments_explained": "**What Changed and Why:**\n\n1. **Grind Size** - Specific change and reason\n2. **Temperature** - Specific change and reason\n3. **Brew Time** - Specific change and reason\n[etc.]\n\nUse markdown formatting with **bold** for parameter names."
}

Make the adjusted_parameters complete and ready to display in a table. The adjustments_explained should explain what changed from the original and WHY.`;

            const adjustmentResponse = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': process.env.ANTHROPIC_API_KEY,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: 'claude-haiku-4-5-20251001',
                    max_tokens: 2000,
                    messages: [{
                        role: 'user',
                        content: adjustmentPrompt
                    }]
                })
            });

            if (!adjustmentResponse.ok) {
                throw new Error(`Anthropic API error: ${adjustmentResponse.status}`);
            }

            const adjustmentData = await adjustmentResponse.json();
            res.status(200).json(sanitizeApiResponse(adjustmentData));
            return;
        }

        // Build the prompt with equipment info if available
        let promptText = `Carefully analyze this coffee bag image and extract ALL visible information. Look for:
- Coffee name/blend name
- Roaster name (brand)
- Roast level (light/medium/dark) - look for text or visual cues like bean color
- Origin/region (e.g., Ethiopia, Colombia, blend)
- Processing method (washed, natural, honey, etc.)
- Flavor notes or tasting notes
- Any other relevant details

CRITICAL: Research what the coffee community ACTUALLY recommends for this specific coffee or similar ones. Don't apply generic roast-level formulas.

⚠️ RESEARCH-BASED RECOMMENDATION PROCESS:
1. **Identify the coffee**: Look at origin, processing, roast level, roaster, flavor notes
2. **Search your knowledge**: What do coffee experts recommend for this SPECIFIC coffee or very similar ones?
   - Check if you know community recipes for this roaster/coffee
   - Look for similar coffees (same origin + processing + roast level)
   - Reference known recipes from YouTube, Reddit r/coffee, home-barista.com
3. **Consider ALL appropriate methods**: Don't exclude methods based on roast level alone
   - Light roasts: Can be excellent as pour over, filter, OR as turbo/lungo espresso shots
   - Medium roasts: Very versatile - pour over, espresso, immersion all work
   - Dark roasts: Great for espresso, but also work well in French Press, Moka Pot
4. **Match to user's equipment**: Filter your researched recommendations by what they have
5. **Suggest upgrades if truly limiting**: Only if their gear can't properly execute the best methods for THIS coffee

⚠️ CRITICAL: DO NOT DEFAULT TO ESPRESSO
- If user has V60, prioritize V60 recommendations
- If user has French Press, prioritize French Press
- If user has multiple methods, recommend what's BEST for THIS specific coffee based on community knowledge
- Don't assume espresso is best - many light roasts shine more with pour over
- Match the brew method to the coffee's characteristics, not to assumptions

Modern Espresso Techniques for Light Roasts:
- **Turbo Shots**: 1:2.5-3.5 ratio, 20-25 seconds, coarser grind, popular for fruity light roasts
- **Lungo/Allongé**: 1:3-4 ratio, 35-45 seconds, highlights acidity and fruit notes
- **Blooming Espresso**: Pre-infusion with pause, then extraction, reduces channeling
- **Lower Pressure**: 6-8 bar instead of 9, gentler extraction for delicate flavors
Don't ignore these! Many light roast single origins are specifically sold as "espresso" with these modern techniques in mind.

Examples of correct research-based thinking:
- "Onyx Coffee Lab Monarch" light roast → Check if you know Onyx's brew guides (they often recommend both espresso turbo shots AND V60)
- Ethiopian natural light roast → Community loves both V60 (for clarity) AND turbo shots (for intensity + fruit)
- Colombian washed → Classic all-rounder, good for any method
- "Counter Culture Big Trouble" → Known espresso blend, but also works as filter

Reference recipes from experts:
- James Hoffmann: V60 technique, turbo shot experiments, espresso dialing
- Lance Hedrick: Pressure profiling, turbo shots, "soup" immersion method
- Scott Rao: Even extraction principles, blooming espresso
- Onyx Coffee Lab, George Howell, Tim Wendelboe: Often publish brew guides for their coffees

Then provide expert-level brewing recommendations using MODERN specialty coffee methodologies:

For Espresso:
- **Traditional Espresso**: 1:2-2.5 ratio, 25-30 seconds, 92-94°C - works for most medium-dark roasts
- **Turbo Shots** (popular for light roasts): 1:2.5-3.5 ratio, 20-25 seconds, coarser grind, 92-95°C
- **Lungo/Allongé** (light roasts): 1:3-4 ratio, 35-45 seconds, highlights brightness
- **Blooming Espresso**: 6 bar pre-infusion for 5-8s, pause, then 9 bar - reduces channeling in light roasts
- Lower temps (88-92°C) for very light roasts IF using traditional ratios
- Pre-infusion and pressure profiling when user has flow control
- Prioritize even extraction over hitting exact numbers

For Pour Over (V60, etc):
- Emphasize bloom phase (2-3x coffee weight, 30-45s)
- Higher water temperatures (95-100°C) for light roasts
- Focus on even extraction and drawdown times
- Modern pour patterns (center pours, swirling)

⚠️ FILTER-SPECIFIC BREWING ADJUSTMENTS:
If the user's equipment includes filters, tailor pour-over parameters based on filter type:
- **Sibarist Fast**: Very fast drainage — grind FINER than normal (2-3 clicks finer), faster pours acceptable, expect 2:00-2:30 total brew time for V60. Produces very clean, tea-like cup.
- **Sibarist B3**: Fast drainage (slightly slower than Fast) — grind 1-2 clicks finer, 2:15-2:45 brew time. Balanced clarity with some body.
- **Paper - White (bleached)**: Standard baseline flow rate. Use normal V60 grind recommendations. 2:30-3:30 brew time.
- **Paper - Natural (unbleached)**: Slightly slower than white paper — can grind slightly coarser. Rinse thoroughly to avoid papery taste.
- **Cafec**: Medium-fast flow (depends on model) — similar to white paper but slightly faster. Grind 1 click finer than standard paper.
- **Metal (reusable)**: Very fast flow, passes oils and fines — grind significantly FINER (3-4 clicks finer than paper). Produces full-bodied cup with oils. Shorter drawdown expected.
- **Cloth**: Medium-slow flow — grind slightly COARSER than paper. Produces very clean but full-bodied cup. Longer drawdown, 3:00-3:45.

GRINDER-SPECIFIC SETTINGS:
When recommending grind sizes, if you see equipment mentions specific grinders, tailor your advice:
- **Ceado E37SD / E37S**: Dial goes from 0 (finest) to 9 (coarsest) with micro-adjustments between each number
  * Espresso: 0.5 - 2.5 (light roasts closer to 2.5, dark roasts closer to 1.0)
  * V60/Pour Over: 3.5 - 5.5 (light roasts finer around 3.5-4, medium around 4.5-5)
  * French Press: 6.5 - 8
- **Baratza Encore**: 1-40 scale
  * Espresso: Not ideal (limited range)
  * V60/Pour Over: 12-18
  * French Press: 28-32
- **Baratza Virtuoso/Sette**: Mention specific number ranges
- If no specific grinder mentioned: Use descriptive terms (fine, medium-fine, medium, medium-coarse, coarse)

For Oxo Rapid Brew Cup:
- Lance Hedrick calls it "soup" - embrace the immersion brewing style
- Use full immersion approach, not trying to mimic pour over
- Grind slightly coarser than pour over
- Longer steep time (3-4 minutes) for full extraction

General Modern Principles:
- Grind quality matters more than exact settings
- Water quality and temperature control are critical
- Even extraction is the primary goal
- Ratios and times are starting points, adjust by taste
- Lighter roasts benefit from hotter water and longer contact times

IMPORTANT: Only include information you can actually see or confidently infer from the image. If information is not visible, use "Unknown" or make educated guesses based on visible roast level and any other clues.`;

        const hasFlowControl = equipment && equipment.includes('with flow control');

        if (specificMethod) {
            // User wants a specific brew method
            promptText += `\n\nThe user specifically wants a recipe for: ${specificMethod}\n\nProvide ONLY one recommendation using this method. Tailor the parameters to this coffee based on what you can see.`;

            if (selectedFilterType) {
                promptText += `\n\n🔎 SELECTED FILTER: ${selectedFilterType}\nThe user is brewing with a "${selectedFilterType}" filter. If this is a pour-over method, you MUST adjust grind size, pour schedule, and brew time based on this filter's flow characteristics (see filter-specific adjustments above).`;
            }

            // Special handling for milk-based drinks
            if (specificMethod.toLowerCase().includes('latte') || specificMethod.toLowerCase().includes('cappuccino') || specificMethod.toLowerCase().includes('cortado') || specificMethod.toLowerCase().includes('flat white')) {
                promptText += `\n\n⚠️ MILK DRINK REQUIREMENT: This is a milk-based drink. You MUST provide:\n1. Espresso shot parameters (dose, yield, time, etc.)\n2. Milk steaming instructions (temperature, texture, volume)\n3. Assembly/ratio instructions (espresso:milk ratio)\n4. The technique_name should be "${specificMethod}" - do NOT change it to just "Espresso" or "Turbo Shot"`;
            }
        } else if (equipment) {
            promptText += `\n\n⚠️ CRITICAL EQUIPMENT REQUIREMENT:
User's available equipment: ${equipment}
${selectedFilterType ? `\n🔎 SELECTED FILTER FOR THIS BREW: ${selectedFilterType}\nThe user has specifically chosen to brew with a "${selectedFilterType}" filter. For any pour-over recommendations, you MUST adjust grind size, pour schedule, and brew time based on this filter's flow characteristics (see filter-specific adjustments above).\n` : ''}
IMPORTANT CONSTRAINTS:
1. You MUST ONLY recommend brewing methods that the user can perform with their EXISTING equipment listed above
2. DO NOT suggest methods they don't have equipment for
3. If the user has an espresso machine, recommend espresso techniques. If they have a V60, recommend V60 techniques. If they have a French Press, recommend French Press. Match recommendations to their actual gear.
4. If their equipment is NOT IDEAL for this specific coffee (e.g., they only have a French Press but this is a delicate Ethiopian light roast that would shine more with pour over), you MUST include an "equipment_suggestions" field in your JSON response explaining:
   - Why their current equipment isn't ideal for THIS coffee
   - What specific additional equipment would unlock better results (be specific: "Hario V60" not just "pour over")
   - Why that equipment would work better for this coffee's characteristics
   - Keep it to 2-3 sentences, be helpful not preachy

⚠️ CRITICAL: OMIT "equipment_suggestions" ENTIRELY if their equipment is already good/adequate for this coffee
   - DO NOT include affirmations like "your equipment is well-suited" or "no upgrades needed"
   - ONLY include equipment_suggestions when you have an ACTUAL recommendation to add/upgrade equipment
   - If their gear is fine, simply omit this field from the JSON (don't include it at all)

Examples:
- User has: "Espresso Machine" and coffee is: "Ethiopian Yirgacheffe light roast natural" → Recommend BOTH "Espresso - Turbo Shot" (popular modern approach for this coffee) AND mention V60 in equipment_suggestions as alternative
- User has: "French Press" but coffee is: "Ethiopian light roast natural process" → Recommend French Press method BUT suggest V60 in equipment_suggestions for more clarity
- User has: "V60" but coffee is: "Dark roast espresso blend" → Recommend V60 (it works), but note in equipment_suggestions that espresso would better suit this blend's body
- User has: "Espresso Machine, V60" and coffee is: "Light roast single origin" → Recommend BOTH "Espresso - Turbo Shot" AND "V60 Pour Over" as equally valid options

Give recommendations based on what the coffee community actually brews with this coffee. Don't exclude espresso for light roasts - turbo/lungo shots are hugely popular for them.`;
        }

        if (hasFlowControl) {
            promptText += `\n\n⚠️ CRITICAL REQUIREMENT: The user has a FLOW CONTROL device on their espresso machine. For ALL espresso-based methods, you MUST provide TAILORED pressure profiling instructions based on THIS specific coffee's characteristics.

DO NOT use generic profiles. Consider:
- Roast level: Light roasts often benefit from gentle pre-infusion (4-6 bar) to prevent channeling, then gradual ramp. Dark roasts can handle more aggressive profiles.
- Origin/Processing:
  * Ethiopian naturals → gentle pre-infusion, declining pressure to manage sweetness
  * Washed Central Americans → stable pressure, traditional 9 bar works well
  * Kenyan → longer pre-infusion, declining pressure in final third
  * Naturals in general → lower peak pressure (7-8 bar) to prevent over-extraction
- Flavor goals: If fruity/delicate → lower pressure. If bold/chocolatey → higher pressure acceptable.

Example tailored profiles:
- "Ethiopian natural light: 5 bar pre-infusion for 8s, ramp to 7 bar at 12s, hold until 25s, decline to 5 bar until finish at 35s"
- "Colombian washed medium: 6 bar for 5s, ramp to 9 bar at 10s, hold 9 bar until 25s, decline to 7 bar until 30s"
- "Dark roast blend: 7 bar for 4s, quick ramp to 9 bar, hold until 20s"

Pressure profiling is expected and MUST be specific to this coffee.`;
        }

        promptText += '\n\n⚠️ CRITICAL OUTPUT FORMAT: Provide your response as pure JSON ONLY. Do NOT wrap it in markdown code blocks (```json). Do NOT add any explanatory text before or after the JSON. Return ONLY the raw JSON object starting with { and ending with }.\n\nProvide your response in the following JSON format:';

        // Build JSON format based on whether specific method is requested
        let jsonFormat;
        if (specificMethod) {
            jsonFormat = `

{
  "coffee_analysis": {
    "name": "Coffee name",
    "roaster": "Roaster name",
    "roast_level": "Light/Medium/Dark",
    "origin": "Origin",
    "flavor_notes": ["note1", "note2"],
    "processing": "Processing method"
  },
  "recommended_techniques": [
    {
      "technique_name": "${specificMethod} (specify style if espresso: 'Espresso - Turbo Shot', 'Espresso - Lungo', 'Espresso - Traditional', etc.)",
      "reasoning": "Brief technical reason based on what you know about this coffee or similar ones (1-2 sentences)",
      "parameters": {
        "dose": "Coffee dose in grams",
        "yield": "Total brew output in grams or ml",
        "ratio": "Coffee:water ratio (e.g., 1:16)",
        "water_temp": "Water temperature (e.g., 93°C / 200°F)",
        "grind_size": "Grind size (e.g., Medium-fine)",
        "brew_time": "Total brew time (e.g., 2:30-3:00)",
        "pressure": "Pressure if applicable (e.g., 9 bar, N/A for pour over)",
        "flow_control": "Detailed pressure profiling if espresso with flow control, otherwise N/A"
      },
      "technique_notes": "2-3 sentences with practical technique tips. Assume good knowledge but not pro-level. Focus on what makes this technique work well and common pitfalls to avoid.\n\n⚠️ POUR OVER SPECIFIC REQUIREMENT: If this is a pour over method (V60, Chemex, Kalita Wave, etc.), you MUST include detailed pouring instructions in this field formatted as follows:\n\n**Pouring Schedule:**\n• **Bloom**: [X]g water, wait [Y] seconds\n• **First Pour**: [X]g to [total]g, [timing]\n• **Second Pour**: [X]g to [total]g, [timing]\n• **Third Pour**: [X]g to [total]g, [timing]\n[Continue for all pours until reaching target yield]\n\nExample:\n**Pouring Schedule:**\n• **Bloom**: 50g water, wait 30-45 seconds\n• **First Pour**: 100g to 150g total (0:45-1:15)\n• **Second Pour**: 100g to 250g total (1:15-1:45)\n• **Third Pour**: 50g to 300g total (1:45-2:15)\n• Target finish time: 2:30-3:00\n\n⚠️ MILK DRINK SPECIFIC REQUIREMENT: If this is a milk-based drink (Latte, Cappuccino, Cortado, Flat White, etc.), you MUST include milk preparation and assembly instructions in this field formatted as follows:\n\n**Milk Preparation:**\n• Steam [X]ml of milk to [temp]°F ([temp]°C)\n• Texture: [microfoam/velvety/etc description]\n• Pour pattern: [how to combine with espresso]\n• Ratio: [espresso:milk ratio like 1:3 for latte]\n\nExample for Latte:\n**Milk Preparation:**\n• Steam 180-240ml of whole milk to 140-150°F (60-65°C)\n• Texture: Smooth, velvety microfoam with minimal visible bubbles\n• Pour pattern: Start with espresso in cup, pour milk in circular motion from center\n• Ratio: 1:3 to 1:5 (espresso:milk)"
    }
  ],
  "equipment_suggestions": "CRITICAL: ONLY include this field if you have an ACTUAL recommendation to upgrade/add equipment. DO NOT include affirmations or 'equipment is fine' messages. If their gear is adequate, completely OMIT this field from the JSON response."
}

Read the image carefully and extract all visible information accurately. Use technical language. If info isn't visible, make educated estimates based on roast level and other visual clues.`;
        } else {
            jsonFormat = `

{
  "coffee_analysis": {
    "name": "Coffee name",
    "roaster": "Roaster name",
    "roast_level": "Light/Medium/Dark",
    "origin": "Origin",
    "flavor_notes": ["note1", "note2"],
    "processing": "Processing method"
  },
  "recommended_techniques": [
    {
      "technique_name": "First recommended brew method (MUST match user's equipment). If espresso, specify: 'Espresso - Turbo Shot', 'Espresso - Lungo', 'Espresso - Traditional', etc.",
      "reasoning": "Brief research-based reason - what does the community recommend for this coffee or similar ones? (1-2 sentences)",
      "parameters": {
        "dose": "Coffee dose in grams",
        "yield": "Total brew output in grams or ml",
        "ratio": "Coffee:water ratio (e.g., 1:16)",
        "water_temp": "Water temperature (e.g., 93°C / 200°F)",
        "grind_size": "Grind size (e.g., Medium-fine)",
        "brew_time": "Total brew time (e.g., 2:30-3:00)",
        "pressure": "Pressure if applicable (e.g., 9 bar, N/A for pour over)",
        "flow_control": "Detailed pressure profiling if espresso with flow control, otherwise N/A"
      },
      "technique_notes": "2-3 sentences with practical technique tips. Assume good knowledge but not pro-level. Focus on what makes this technique work well and common pitfalls to avoid.\n\n⚠️ POUR OVER SPECIFIC REQUIREMENT: If this is a pour over method (V60, Chemex, Kalita Wave, etc.), you MUST include detailed pouring instructions in this field formatted as follows:\n\n**Pouring Schedule:**\n• **Bloom**: [X]g water, wait [Y] seconds\n• **First Pour**: [X]g to [total]g, [timing]\n• **Second Pour**: [X]g to [total]g, [timing]\n• **Third Pour**: [X]g to [total]g, [timing]\n[Continue for all pours until reaching target yield]\n\nExample:\n**Pouring Schedule:**\n• **Bloom**: 50g water, wait 30-45 seconds\n• **First Pour**: 100g to 150g total (0:45-1:15)\n• **Second Pour**: 100g to 250g total (1:15-1:45)\n• **Third Pour**: 50g to 300g total (1:45-2:15)\n• Target finish time: 2:30-3:00\n\n⚠️ MILK DRINK SPECIFIC REQUIREMENT: If this is a milk-based drink (Latte, Cappuccino, Cortado, Flat White, etc.), you MUST include milk preparation and assembly instructions in this field formatted as follows:\n\n**Milk Preparation:**\n• Steam [X]ml of milk to [temp]°F ([temp]°C)\n• Texture: [microfoam/velvety/etc description]\n• Pour pattern: [how to combine with espresso]\n• Ratio: [espresso:milk ratio like 1:3 for latte]\n\nExample for Latte:\n**Milk Preparation:**\n• Steam 180-240ml of whole milk to 140-150°F (60-65°C)\n• Texture: Smooth, velvety microfoam with minimal visible bubbles\n• Pour pattern: Start with espresso in cup, pour milk in circular motion from center\n• Ratio: 1:3 to 1:5 (espresso:milk)"
    },
    {
      "technique_name": "Second recommended brew method (MUST match user's equipment). If espresso, specify style.",
      "reasoning": "Research-based reason (1-2 sentences)",
      "parameters": {
        "dose": "Coffee dose in grams",
        "yield": "Total brew output in grams or ml",
        "ratio": "Coffee:water ratio",
        "water_temp": "Water temperature",
        "grind_size": "Grind size",
        "brew_time": "Total brew time",
        "pressure": "Pressure if applicable or N/A",
        "flow_control": "Detailed pressure profiling if espresso with flow control, otherwise N/A"
      },
      "technique_notes": "2-3 sentences with practical technique tips. Assume good knowledge but not pro-level. Focus on what makes this technique work well and common pitfalls to avoid.\n\n⚠️ POUR OVER SPECIFIC REQUIREMENT: If this is a pour over method (V60, Chemex, Kalita Wave, etc.), you MUST include detailed pouring instructions in this field formatted as follows:\n\n**Pouring Schedule:**\n• **Bloom**: [X]g water, wait [Y] seconds\n• **First Pour**: [X]g to [total]g, [timing]\n• **Second Pour**: [X]g to [total]g, [timing]\n• **Third Pour**: [X]g to [total]g, [timing]\n[Continue for all pours until reaching target yield]\n\nExample:\n**Pouring Schedule:**\n• **Bloom**: 50g water, wait 30-45 seconds\n• **First Pour**: 100g to 150g total (0:45-1:15)\n• **Second Pour**: 100g to 250g total (1:15-1:45)\n• **Third Pour**: 50g to 300g total (1:45-2:15)\n• Target finish time: 2:30-3:00\n\n⚠️ MILK DRINK SPECIFIC REQUIREMENT: If this is a milk-based drink (Latte, Cappuccino, Cortado, Flat White, etc.), you MUST include milk preparation and assembly instructions in this field formatted as follows:\n\n**Milk Preparation:**\n• Steam [X]ml of milk to [temp]°F ([temp]°C)\n• Texture: [microfoam/velvety/etc description]\n• Pour pattern: [how to combine with espresso]\n• Ratio: [espresso:milk ratio like 1:3 for latte]\n\nExample for Latte:\n**Milk Preparation:**\n• Steam 180-240ml of whole milk to 140-150°F (60-65°C)\n• Texture: Smooth, velvety microfoam with minimal visible bubbles\n• Pour pattern: Start with espresso in cup, pour milk in circular motion from center\n• Ratio: 1:3 to 1:5 (espresso:milk)"
    }
  ],
  "equipment_suggestions": "CRITICAL: ONLY include this field if you have an ACTUAL recommendation to upgrade/add equipment. DO NOT include affirmations or 'equipment is fine' messages. If their gear is adequate, completely OMIT this field from the JSON response."
}

Read the image carefully and extract all visible information accurately. Provide only the top 2 most suitable techniques THAT MATCH THE USER'S EQUIPMENT. Use technical language. If info isn't visible, make educated estimates based on roast level and other visual clues.`;
        }

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-haiku-4-5-20251001',
                max_tokens: 2048,
                messages: [{
                    role: 'user',
                    content: [
                        {
                            type: 'image',
                            source: {
                                type: 'base64',
                                media_type: mediaType,
                                data: image
                            }
                        },
                        {
                            type: 'text',
                            text: promptText + jsonFormat
                        }
                    ]
                }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
        }

        const data = await response.json();
        res.status(200).json(sanitizeApiResponse(data));

    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ error: error.message });
    }
}
