import fs from 'fs';

async function check() {
  const r = await fetch('https://aurasuite-kappa.vercel.app/dashboard');
  const t = await r.text();
  
  // Use regex to find all script src that match _next/static/chunks
  const regex = /src="(\/_next\/static\/chunks\/[^"]+\.js)"/g;
  let m;
  let found = false;
  while ((m = regex.exec(t)) !== null) {
    const url = 'https://aurasuite-kappa.vercel.app' + m[1];
    const js = await fetch(url).then(res => res.text());
    if (js.includes('team-general')) {
      found = true;
      console.log('FOUND TEAM-GENERAL IN:', url);
      // See if it has Loader2 near the send button.
      // We look for 'animate-spin'
      if (js.includes('animate-spin')) {
        console.log('HAS ANIMATE-SPIN!');
        // Print 50 chars around it
        const idx = js.indexOf('animate-spin');
        console.log(js.substring(idx - 50, idx + 50));
      } else {
        console.log('NO ANIMATE-SPIN FOUND NEARBY');
      }
    }
  }
  if (!found) console.log("team-general not found in any chunk!");
}

check();
