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
        const { image, mediaType } = req.body;

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20240620',
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
                            text: `Analyze this coffee bag image and provide detailed brewing recommendations. Please structure your response in the following JSON format:

{
  "coffee_analysis": {
    "name": "Coffee name if visible",
    "roaster": "Roaster name if visible",
    "roast_level": "Light/Medium/Dark or Unknown",
    "origin": "Origin if visible or Unknown",
    "flavor_notes": ["note1", "note2"] or [],
    "bean_type": "Arabica/Robusta/Blend or Unknown",
    "processing": "Processing method if visible or Unknown"
  },
  "recommended_brew_method": {
    "primary_method": "Name of recommended brew method",
    "reasoning": "Why this method is recommended for this coffee",
    "alternative_methods": ["method1", "method2"]
  },
  "brew_recipe": {
    "coffee_amount": "Amount in grams",
    "water_amount": "Amount in ml or grams",
    "ratio": "Coffee to water ratio (e.g., 1:16)",
    "water_temperature": "Temperature in °F and °C",
    "grind_size": "Grind size description",
    "brew_time": "Total brew time",
    "instructions": ["step1", "step2", "step3"]
  }
}

If you cannot clearly see certain information on the bag, use "Unknown" or empty arrays. Focus on providing the best brewing recommendations based on what you can observe.`
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
