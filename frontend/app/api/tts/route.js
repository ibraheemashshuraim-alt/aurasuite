import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { text, lang } = await request.json();
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Clean text: remove code blocks, JSON, actions, markdown symbols
    let cleanText = text
      .replace(/\{[\s\S]*?\}/g, ' ') // remove JSON objects
      .replace(/[*_#`~[\]]/g, ' ')
      .replace(/https?:\/\/\S+/g, ' ')
      .replace(/Jarvis Execution Completed:|- [a-zA-Z_]+:/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) {
      return NextResponse.json({ error: 'Clean text is empty' }, { status: 400 });
    }

    // Take clean spoken portion (up to 250 chars)
    const speechChunk = cleanText.slice(0, 250);

    // Language & Voice detection:
    // 1. Check Urdu script characters
    const isUrduScript = /[\u0600-\u06FF]/.test(speechChunk);

    // 2. Common Roman Urdu markers
    const romanUrduWords = [
      'salam', 'kya', 'hai', 'hain', 'theek', 'hoon', 'madad', 'aap', 'mera', 
      'kaise', 'shukriya', 'bilkul', 'bhai', 'acha', 'kar', 'raha', 'rahe', 'bataiye',
      'waise', 'aur', 'nahi', 'hoga', 'gaya', 'jee', 'shukriya'
    ];
    const lower = speechChunk.toLowerCase();
    const isRomanUrdu = romanUrduWords.some(w => lower.split(/\s+/).includes(w) || lower.includes(' ' + w) || lower.startsWith(w));

    let chosenLang = lang;
    if (!chosenLang) {
      if (isUrduScript) {
        chosenLang = 'ur';
      } else if (isRomanUrdu) {
        // 'ur' for native Urdu pronunciation
        chosenLang = 'ur';
      } else {
        // British English (The iconic Jarvis voice accent)
        chosenLang = 'en-GB';
      }
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
