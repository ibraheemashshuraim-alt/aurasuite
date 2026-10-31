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

    // Take clean spoken portion (up to 200 chars for instant natural delivery)
    let speechChunk = cleanText.slice(0, 200);

    // Language & Voice detection:
    const isUrduScript = /[\u0600-\u06FF]/.test(speechChunk);

    const romanUrduWords = [
      'salam', 'kya', 'hai', 'hain', 'theek', 'hoon', 'madad', 'aap', 'mera', 
      'kaise', 'shukriya', 'bilkul', 'bhai', 'acha', 'kar', 'raha', 'rahe', 'bataiye',
      'waise', 'aur', 'nahi', 'hoga', 'gaya', 'jee', 'hum', 'tum', 'sab', 'walekum', 'walaikum',
      'assalam', 'farmaye', 'kaam', 'shuru', 'karein', 'aaj'
    ];
    const lower = speechChunk.toLowerCase();
    const isRomanUrdu = romanUrduWords.some(w => lower.split(/\s+/).includes(w) || lower.includes(' ' + w) || lower.startsWith(w));

    let chosenLang = lang;
    if (!chosenLang) {
      if (isUrduScript) {
        // Pure Urdu script -> Google Urdu neural engine (sounds completely natural and native)
        chosenLang = 'ur';
      } else if (isRomanUrdu) {
        // For Roman Urdu, convert key conversational words to Urdu script so Google's Urdu engine pronounces them natively!
        const romanMap = {
          'walaikum': 'وعلیکم',
          'walekum': 'وعلیکم',
          'assalam': 'السلام',
          'assalamu': 'السلام',
          'salam': 'سلام',
          'main': 'میں',
          'mein': 'میں',
          'bilkul': 'بالکل',
          'theek': 'ٹھیک',
          'hoon': 'ہوں',
          'hun': 'ہوں',
          'aap': 'آپ',
          'ap': 'آپ',
          'bataiye': 'بتائیے',
          'batao': 'بتاؤ',
          'kaise': 'کیسے',
          'kaisi': 'کیسی',
          'kaisa': 'کیسا',
          'hain': 'ہیں',
          'hai': 'ہے',
          'aaj': 'آج',
          'kya': 'کیا',
          'madad': 'مدد',
          'kar': 'کر',
          'sakta': 'سکتا',
          'sakti': 'سکتی',
          'shukriya': 'شکریہ',
          'jee': 'جی',
          'ji': 'جی',
          'haan': 'ہاں',
          'nahin': 'نہیں',
          'nahi': 'نہیں',
          'jarvis': 'جاروس',
          'hukum': 'حکم',
          'farmaye': 'فرمائیے',
          'bhai': 'بھائی',
          'sab': 'سب',
          'theek-thaak': 'ٹھیک ٹھاک'
        };
        speechChunk = speechChunk.split(/\b/).map(word => {
          const l = word.toLowerCase();
          return romanMap[l] || word;
        }).join('');
        chosenLang = 'ur';
      } else {
        // Pure English commands -> Iconic British Jarvis accent
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
