/**
 * Free text rephrasing using Hugging Face Inference API
 * Uses paraphrase models for text rewriting
 */

export interface RephrasingOption {
  text: string;
  score?: number;
}

/**
 * Rephrase text using free Hugging Face API
 * No API key required for basic usage (rate limited)
 */
export async function rephraseText(text: string): Promise<RephrasingOption[]> {
  if (!text || text.trim().length === 0) {
    return [];
  }

  try {
    const response = await fetch('/api/rephrase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      console.error('Rephrasing API error:', response.status);
      return [];
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Rephrasing error:', error);
    return [];
  }
}
