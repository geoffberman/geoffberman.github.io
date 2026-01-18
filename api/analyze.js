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
        const { image, mediaType, equipment, specificMethod } = req.body;

        // Build the prompt with equipment info if available
        let promptText = `Carefully analyze this coffee bag image and extract ALL visible information. Look for:
- Coffee name/blend name
- Roaster name (brand)
- Roast level (light/medium/dark) - look for text or visual cues like bean color
- Origin/region (e.g., Ethiopia, Colombia, blend)
- Processing method (washed, natural, honey, etc.)
- Flavor notes or tasting notes
- Any other relevant details

Then provide expert-level brewing recommendations using MODERN specialty coffee methodologies and thinking from experts like Lance Hedrick and James Hoffmann. Favor contemporary approaches:

For Espresso:
- Consider turbo/blooming shots for lighter roasts (higher ratios like 1:2.5-3.5, shorter times 20-25s)
- Lower temperatures (88-92°C) for light roasts to reduce astringency
- Pre-infusion and pressure profiling when available
- Even extraction over traditional "perfect" ratios

For Pour Over (V60, etc):
- Emphasize bloom phase (2-3x coffee weight, 30-45s)
- Higher water temperatures (95-100°C) for light roasts
- Focus on even extraction and drawdown times
- Modern pour patterns (center pours, swirling)

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
            promptText += `\n\nUser's available equipment: ${equipment}\n\nRecommend brew methods compatible with their equipment.`;
        }

        if (hasFlowControl) {
            promptText += `\n\n⚠️ CRITICAL REQUIREMENT: The user has a FLOW CONTROL device on their espresso machine. For ALL espresso-based methods, you MUST provide detailed pressure profiling instructions in the flow_control parameter. DO NOT use "N/A" - provide specific pressure modulation like "Start at 6 bar for 5s pre-infusion, ramp to 9 bar at 10s, hold until 20s, then decline to 7 bar until 30s". Pressure profiling is expected and required.`;
        }

        promptText += '\n\nProvide your response in the following JSON format:';

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
      "technique_name": "${specificMethod}",
      "reasoning": "Brief technical reason why this method works for this specific coffee (1-2 sentences)",
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
      "technique_notes": "2-3 sentences with practical technique tips. Assume good knowledge but not pro-level. Focus on what makes this technique work well and common pitfalls to avoid."
    }
  ]
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
      "technique_name": "First recommended brew method",
      "reasoning": "Brief technical reason (1-2 sentences)",
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
      "technique_notes": "2-3 sentences with practical technique tips. Assume good knowledge but not pro-level. Focus on what makes this technique work well and common pitfalls to avoid."
    },
    {
      "technique_name": "Second recommended brew method",
      "reasoning": "Brief technical reason (1-2 sentences)",
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
      "technique_notes": "2-3 sentences with practical technique tips. Assume good knowledge but not pro-level. Focus on what makes this technique work well and common pitfalls to avoid."
    }
  ]
}

Read the image carefully and extract all visible information accurately. Provide only the top 2 most suitable techniques. Use technical language. If info isn't visible, make educated estimates based on roast level and other visual clues.`;
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
