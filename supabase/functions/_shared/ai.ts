const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const AI_GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

export interface SummarizeOptions {
  cacheKey?: string;
  maxTokens?: number;
}

export interface ClassifyTagsOptions {
  fallbackKeywords?: boolean;
  cacheKey?: string;
}

export interface AIResult {
  content: string;
  tokensUsed: number;
}

export async function summarize(text: string, options: SummarizeOptions = {}): Promise<AIResult> {
  if (!LOVABLE_API_KEY) {
    console.warn('LOVABLE_API_KEY not set, skipping AI summarization');
    return { content: '', tokensUsed: 0 };
  }

  const aiEnabled = Deno.env.get('AI_ENABLE') === 'true';
  if (!aiEnabled) {
    return { content: '', tokensUsed: 0 };
  }

  const maxTokens = options.maxTokens || 300;

  try {
    const response = await fetch(AI_GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a civic governance assistant. Summarize the following text in 2-3 clear, concise sentences that highlight the key points and decisions. Focus on what matters to residents.',
          },
          {
            role: 'user',
            content: text.slice(0, 10000), // Limit input text
          },
        ],
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('AI summarization failed:', response.status, error);
      return { content: '', tokensUsed: 0 };
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content || '';
    const tokensUsed = data.usage?.total_tokens || 0;

    return { content: summary, tokensUsed };
  } catch (error) {
    console.error('AI summarization error:', error);
    return { content: '', tokensUsed: 0 };
  }
}

export async function classifyTags(text: string, options: ClassifyTagsOptions = {}): Promise<AIResult> {
  if (!LOVABLE_API_KEY) {
    return { content: '', tokensUsed: 0 };
  }

  const aiEnabled = Deno.env.get('AI_ENABLE') === 'true';
  if (!aiEnabled) {
    return { content: '', tokensUsed: 0 };
  }

  try {
    const response = await fetch(AI_GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a civic governance classifier. Analyze the text and return only a comma-separated list of relevant tags from: zoning, short-term-rentals, budget, water, transportation, housing, environment, parks, police, fire, taxes. Return only the tags, nothing else.',
          },
          {
            role: 'user',
            content: text.slice(0, 5000),
          },
        ],
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      return { content: '', tokensUsed: 0 };
    }

    const data = await response.json();
    const tagsStr = data.choices?.[0]?.message?.content || '';
    const tokensUsed = data.usage?.total_tokens || 0;

    return { content: tagsStr, tokensUsed };
  } catch (error) {
    console.error('AI tag classification error:', error);
    return { content: '', tokensUsed: 0 };
  }
}
