const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Using Claude 3 Haiku for API compatibility
module.exports = async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        const { image, mediaType, equipment, specificMethod, currentBrewMethod, adjustmentRequest, previousAnalysis } = req.body;

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
                    model: 'claude-3-haiku-20240307',
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
            res.status(200).json(adjustmentData);
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
        } else if (equipment) {
            promptText += `\n\n⚠️ CRITICAL EQUIPMENT REQUIREMENT:
User's available equipment: ${equipment}

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
      "technique_notes": "2-3 sentences with practical technique tips. Assume good knowledge but not pro-level. Focus on what makes this technique work well and common pitfalls to avoid.\n\n⚠️ POUR OVER SPECIFIC REQUIREMENT: If this is a pour over method (V60, Chemex, Kalita Wave, etc.), you MUST include detailed pouring instructions in this field formatted as follows:\n\n**Pouring Schedule:**\n• **Bloom**: [X]g water, wait [Y] seconds\n• **First Pour**: [X]g to [total]g, [timing]\n• **Second Pour**: [X]g to [total]g, [timing]\n• **Third Pour**: [X]g to [total]g, [timing]\n[Continue for all pours until reaching target yield]\n\nExample:\n**Pouring Schedule:**\n• **Bloom**: 50g water, wait 30-45 seconds\n• **First Pour**: 100g to 150g total (0:45-1:15)\n• **Second Pour**: 100g to 250g total (1:15-1:45)\n• **Third Pour**: 50g to 300g total (1:45-2:15)\n• Target finish time: 2:30-3:00"
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
      "technique_notes": "2-3 sentences with practical technique tips. Assume good knowledge but not pro-level. Focus on what makes this technique work well and common pitfalls to avoid.\n\n⚠️ POUR OVER SPECIFIC REQUIREMENT: If this is a pour over method (V60, Chemex, Kalita Wave, etc.), you MUST include detailed pouring instructions in this field formatted as follows:\n\n**Pouring Schedule:**\n• **Bloom**: [X]g water, wait [Y] seconds\n• **First Pour**: [X]g to [total]g, [timing]\n• **Second Pour**: [X]g to [total]g, [timing]\n• **Third Pour**: [X]g to [total]g, [timing]\n[Continue for all pours until reaching target yield]\n\nExample:\n**Pouring Schedule:**\n• **Bloom**: 50g water, wait 30-45 seconds\n• **First Pour**: 100g to 150g total (0:45-1:15)\n• **Second Pour**: 100g to 250g total (1:15-1:45)\n• **Third Pour**: 50g to 300g total (1:45-2:15)\n• Target finish time: 2:30-3:00"
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
      "technique_notes": "2-3 sentences with practical technique tips. Assume good knowledge but not pro-level. Focus on what makes this technique work well and common pitfalls to avoid.\n\n⚠️ POUR OVER SPECIFIC REQUIREMENT: If this is a pour over method (V60, Chemex, Kalita Wave, etc.), you MUST include detailed pouring instructions in this field formatted as follows:\n\n**Pouring Schedule:**\n• **Bloom**: [X]g water, wait [Y] seconds\n• **First Pour**: [X]g to [total]g, [timing]\n• **Second Pour**: [X]g to [total]g, [timing]\n• **Third Pour**: [X]g to [total]g, [timing]\n[Continue for all pours until reaching target yield]\n\nExample:\n**Pouring Schedule:**\n• **Bloom**: 50g water, wait 30-45 seconds\n• **First Pour**: 100g to 150g total (0:45-1:15)\n• **Second Pour**: 100g to 250g total (1:15-1:45)\n• **Third Pour**: 50g to 300g total (1:45-2:15)\n• Target finish time: 2:30-3:00"
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
                model: 'claude-3-haiku-20240307',
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
        res.status(200).json(data);

    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ error: error.message });
    }
}
