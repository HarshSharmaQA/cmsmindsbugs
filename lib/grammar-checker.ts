/**
 * Free grammar checking using LanguageTool API
 * No API key required for basic usage
 */

export interface GrammarSuggestion {
  message: string;
  offset: number;
  length: number;
  replacements: string[];
  rule: string;
  category: string;
}

export async function checkGrammar(text: string, language: string = 'en-US'): Promise<GrammarSuggestion[]> {
  if (!text || text.trim().length === 0) {
    return [];
  }

  try {
    console.log('Checking grammar for:', text.substring(0, 50) + '...');
    
    const response = await fetch('/api/grammar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, language }),
    });

    if (!response.ok) {
      console.error('Grammar API error:', response.status, response.statusText);
      throw new Error('Grammar check failed');
    }

    const data = await response.json();
    console.log('Grammar check results:', data.matches.length, 'suggestions');
    
    return data.matches.map((match: any) => ({
      message: match.message,
      offset: match.offset,
      length: match.length,
      replacements: match.replacements.slice(0, 3).map((r: any) => r.value),
      rule: match.rule.id,
      category: match.rule.category.name,
    }));
  } catch (error) {
    console.error('Grammar check error:', error);
    return [];
  }
}
