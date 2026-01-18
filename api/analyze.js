const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

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
        let promptText = 'Analyze this coffee bag image and provide expert-level brewing recommendations. Assume the user is an experienced home barista who understands brewing parameters and techniques.';

        const hasFlowControl = equipment && equipment.includes('with flow control');

        if (specificMethod) {
            // User wants a specific brew method
            promptText += `\n\nThe user specifically wants a recipe for: ${specificMethod}\n\nProvide ONLY one recommendation using this method. Tailor the parameters to this coffee based on what you can see.`;
        } else if (equipment) {
            promptText += `\n\nUser's available equipment: ${equipment}\n\nRecommend brew methods compatible with their equipment.`;
        }

        if (hasFlowControl) {
            promptText += `\n\nIMPORTANT: The user has a flow control device on their espresso machine. For any espresso-based methods, provide specific pressure modulation guidance in the flow_control parameter (e.g., "Start at 9 bar, drop to 6 bar at 15s, ramp back to 9 bar at 25s").`;
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
        "flow_control": "Flow control notes if applicable or N/A"
      },
      "technique_notes": "2-3 sentences with practical technique tips. Assume good knowledge but not pro-level. Focus on what makes this technique work well and common pitfalls to avoid."
    }
  ]
}

Provide expert-level parameters optimized for this coffee. Use technical language. If info isn't visible, make educated estimates based on roast level and origin.`;
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
        "flow_control": "Flow control notes if applicable or N/A"
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
        "flow_control": "Flow control notes if applicable or N/A"
      },
      "technique_notes": "2-3 sentences with practical technique tips. Assume good knowledge but not pro-level. Focus on what makes this technique work well and common pitfalls to avoid."
    }
  ]
}

Provide only the top 2 most suitable techniques. Use technical language. If info isn't visible, make educated estimates based on roast level and origin.`;
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
