/**
 * Conversation API Endpoint
 * Handles multi-turn conversations about brew adjustments
 */

const { getProvider } = require('./ai-provider');

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
        const {
            message,
            conversationHistory = [],
            coffeeContext,
            recipeContext,
            aiProvider = 'anthropic'
        } = req.body;

        // Validate required fields
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        if (!coffeeContext || !recipeContext) {
            return res.status(400).json({ error: 'Coffee and recipe context are required' });
        }

        // Build system prompt with coffee and recipe context
        const systemPrompt = `You are a coffee brewing expert helping a user improve their brew. Be concise, specific, and actionable.

Coffee Information:
- Name: ${coffeeContext.name || 'Unknown'}
- Roaster: ${coffeeContext.roaster || 'Unknown'}
- Roast Level: ${coffeeContext.roast_level || 'Unknown'}
- Origin: ${coffeeContext.origin || 'Unknown'}
- Processing: ${coffeeContext.processing || 'Unknown'}
- Flavor Notes: ${coffeeContext.flavor_notes?.join(', ') || 'Not specified'}

Current Recipe:
- Method: ${recipeContext.brew_method || 'Unknown'}
- Dose: ${recipeContext.parameters?.dose || 'Unknown'}
- Ratio: ${recipeContext.parameters?.ratio || 'Unknown'}
- Water Temperature: ${recipeContext.parameters?.water_temp || 'Unknown'}
- Grind Size: ${recipeContext.parameters?.grind_size || 'Unknown'}
- Brew Time: ${recipeContext.parameters?.brew_time || 'Unknown'}
${recipeContext.parameters?.pressure ? `- Pressure: ${recipeContext.parameters.pressure}` : ''}
${recipeContext.parameters?.flow_control && recipeContext.parameters.flow_control !== 'N/A' ? `- Flow Control: ${recipeContext.parameters.flow_control}` : ''}

Brewing Guidance Provided:
${recipeContext.technique_notes || 'No specific guidance provided yet.'}

Guidelines:
1. Keep responses concise (2-3 paragraphs maximum)
2. Provide specific, actionable advice based on their feedback
3. Reference the specific coffee characteristics and current recipe parameters
4. If they describe taste issues, suggest specific parameter adjustments
5. If they ask questions, answer clearly and relate to their specific setup
6. Be encouraging and supportive while being technically accurate`;

        // Build conversation messages
        const messages = [
            ...conversationHistory.map(msg => ({
                role: msg.role,
                content: msg.content
            })),
            { role: 'user', content: message }
        ];

        // Get AI provider and send message
        const provider = getProvider(aiProvider);
        const result = await provider.sendMessage(messages, systemPrompt, 1500);

        // Return response
        return res.status(200).json({
            response: result.text,
            timestamp: new Date().toISOString(),
            usage: result.usage
        });

    } catch (error) {
        console.error('Conversation error:', error);
        res.status(500).json({
            error: 'Failed to process conversation',
            details: error.message
        });
    }
};
