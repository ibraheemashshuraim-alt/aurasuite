import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { text, lang = 'ur' } = await request.json();
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Clean text: remove markdown, actions, emojis
    const cleanText = text
      .replace(/[*_#`~[\]]/g, ' ')
      .replace(/https?:\/\/\S+/g, ' ')
      .replace(/Jarvis Execution Completed:|- [a-zA-Z_]+:/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) {
      return NextResponse.json({ error: 'Clean text is empty' }, { status: 400 });
    }

    // Truncate to safe length for natural response
    const speechChunk = cleanText.slice(0, 200);

    // Detect if text is mostly English or Urdu/Roman Urdu
    // If it has Urdu characters or Roman Urdu keywords (kya, hai, theek, salam, shukriya, etc.)
    const isUrduScript = /[\u0600-\u06FF]/.test(speechChunk);
    const romanUrduWords = ['salam', 'kya', 'hai', 'hain', 'theek', 'hoon', 'madad', 'aap', 'mera', 'kaise', 'shukriya', 'bilkul'];
    const lower = speechChunk.toLowerCase();
    const hasRomanUrdu = romanUrduWords.some(w => lower.includes(w));

    let chosenLang = lang;
    if (isUrduScript) {
      chosenLang = 'ur';
    } else if (hasRomanUrdu) {
      // Indian/Pakistani neural voice engine reads Roman Urdu perfectly in 'hi' or 'ur'
      chosenLang = 'hi';
    } else {
      chosenLang = 'en';
    }

    const encoded = encodeURIComponent(speechChunk);
    const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=${chosenLang}&client=tw-ob`;

    const res = await fetch(googleTtsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch TTS audio' }, { status: 500 });
    }

    const audioBuffer = await res.arrayBuffer();

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400'
      }
    });
  } catch (err) {
    console.error('TTS API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
