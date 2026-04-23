import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json([]);
    }

    // Try Hugging Face API first
    try {
      const response = await fetch(
        'https://api-inference.huggingface.co/models/tuner007/pegasus_paraphrase',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: text,
            parameters: {
              max_length: 256,
              num_return_sequences: 3,
              temperature: 0.7,
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        if (Array.isArray(data)) {
          const variations = data
            .map((item: any) => ({
              text: item.generated_text || item.summary_text,
              score: item.score,
            }))
            .filter((item: any) => item.text && item.text !== text);
          
          if (variations.length > 0) {
            return NextResponse.json(variations);
          }
        }
      }
    } catch (error) {
      console.log('Hugging Face API failed, using fallback');
    }

    // Fallback to simple variations
    const variations = generateSimpleVariations(text);
    return NextResponse.json(variations);
  } catch (error) {
    console.error('Rephrase API error:', error);
    return NextResponse.json([], { status: 500 });
  }
}

function generateSimpleVariations(text: string) {
  const variations: any[] = [];

  // Formal version
  const formal = text
    .replace(/don't/gi, 'do not')
    .replace(/can't/gi, 'cannot')
    .replace(/won't/gi, 'will not')
    .replace(/isn't/gi, 'is not')
    .replace(/aren't/gi, 'are not');
  
  if (formal !== text) {
    variations.push({ text: formal });
  }

  // Concise version
  const concise = text
    .replace(/\b(just|really|very|quite|actually|basically)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (concise !== text && concise.length > 10) {
    variations.push({ text: concise });
  }

  // Professional version
  const professional = text
    .replace(/\bI think\b/gi, 'It appears')
    .replace(/\bI guess\b/gi, 'It seems')
    .replace(/\bkinda\b/gi, 'somewhat')
    .replace(/\bgonna\b/gi, 'going to')
    .replace(/\bwanna\b/gi, 'want to');
  
  if (professional !== text) {
    variations.push({ text: professional });
  }

  return variations.slice(0, 3);
}
