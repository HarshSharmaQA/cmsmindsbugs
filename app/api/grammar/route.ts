import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text, language = 'en-US' } = await request.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ matches: [] });
    }

    const response = await fetch('https://api.languagetool.org/v2/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        text,
        language,
        enabledOnly: 'false',
      }),
    });

    if (!response.ok) {
      throw new Error('Grammar check failed');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Grammar API error:', error);
    return NextResponse.json({ matches: [] }, { status: 500 });
  }
}
