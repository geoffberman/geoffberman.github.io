/**
 * AI Provider Abstraction Layer
 * Supports multiple AI providers (Anthropic Claude, Google Gemini)
 */

/**
 * Base AI Provider Interface
 */
class AIProvider {
  /**
   * Send a message to the AI provider
   * @param {Array} messages - Array of {role: 'user'|'assistant', content: string}
   * @param {string} systemPrompt - System prompt for context
   * @param {number} maxTokens - Maximum tokens to generate
   * @returns {Promise<{text: string, usage?: object}>}
   */
  async sendMessage(messages, systemPrompt, maxTokens) {
    throw new Error('sendMessage must be implemented by provider');
  }

  /**
   * Format a prompt with optional image data
   * @param {string} prompt - Text prompt
   * @param {string|null} imageData - Base64 encoded image or null
   * @returns {object} - Provider-specific message format
   */
  formatPrompt(prompt, imageData = null) {
    throw new Error('formatPrompt must be implemented by provider');
  }
}

/**
 * Anthropic (Claude) Provider
 */
class AnthropicProvider extends AIProvider {
  constructor() {
    super();
    this.apiKey = process.env.ANTHROPIC_API_KEY;
    this.endpoint = 'https://api.anthropic.com/v1/messages';
    this.model = 'claude-3-haiku-20240307';
  }

  formatPrompt(prompt, imageData = null) {
    const content = [];

    if (imageData) {
      // Remove data URL prefix if present
      const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');

      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/jpeg',
          data: base64Data
        }
      });
    }

    content.push({
      type: 'text',
      text: prompt
    });

    return content;
  }

  async sendMessage(messages, systemPrompt, maxTokens) {
    // Format messages for Anthropic API
    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      content: typeof msg.content === 'string'
        ? msg.content
        : msg.content
    }));

    const requestBody = {
      model: this.model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: formattedMessages
    };

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // Validate response has content
    if (!data.content || !data.content[0] || !data.content[0].text) {
      console.error('Anthropic returned invalid response:', JSON.stringify(data, null, 2));
      throw new Error('Anthropic API returned an invalid response structure');
    }

    const text = data.content[0].text;
    if (text.trim() === '') {
      throw new Error('Anthropic API returned an empty response');
    }

    return {
      text: text,
      usage: data.usage
    };
  }
}

/**
 * Google Gemini Provider
 */
class GeminiProvider extends AIProvider {
  constructor() {
    super();
    this.apiKey = process.env.GEMINI_API_KEY;
    this.model = 'gemini-1.5-flash-latest';
    this.endpoint = `https://generativelanguage.googleapis.com/v1/models/${this.model}:generateContent`;
  }

  formatPrompt(prompt, imageData = null) {
    const parts = [];

    if (imageData) {
      // Remove data URL prefix if present
      const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');

      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Data
        }
      });
    }

    parts.push({
      text: prompt
    });

    return parts;
  }

  async sendMessage(messages, systemPrompt, maxTokens) {
    // Gemini uses "contents" format with system instruction separate
    const contents = [];

    // Convert messages to Gemini format
    for (const msg of messages) {
      let parts;

      if (typeof msg.content === 'string') {
        parts = [{ text: msg.content }];
      } else if (Array.isArray(msg.content)) {
        parts = msg.content;
      } else {
        parts = [{ text: JSON.stringify(msg.content) }];
      }

      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: parts
      });
    }

    const requestBody = {
      contents: contents,
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 0.7,
        topP: 0.95,
        topK: 40
      }
    };

    const response = await fetch(`${this.endpoint}?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // Extract text from Gemini response
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    // Validate response has content
    if (!text || text.trim() === '') {
      console.error('Gemini returned empty response:', JSON.stringify(data, null, 2));
      throw new Error('Gemini API returned an empty response. Response structure: ' + JSON.stringify(data).substring(0, 200));
    }

    return {
      text: text,
      usage: data.usageMetadata
    };
  }
}

/**
 * Factory function to get the appropriate provider
 * @param {string} providerName - 'anthropic' or 'gemini'
 * @returns {AIProvider}
 */
function getProvider(providerName = 'anthropic') {
  switch (providerName.toLowerCase()) {
    case 'anthropic':
      return new AnthropicProvider();
    case 'gemini':
      return new GeminiProvider();
    default:
      console.warn(`Unknown provider: ${providerName}, defaulting to Anthropic`);
      return new AnthropicProvider();
  }
}

module.exports = {
  getProvider,
  AIProvider,
  AnthropicProvider,
  GeminiProvider
};
