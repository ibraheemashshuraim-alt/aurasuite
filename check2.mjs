import fs from 'fs';

async function check() {
  const r = await fetch('https://aurasuite-kappa.vercel.app/dashboard');
  const t = await r.text();
  
  const regex = /src="(\/_next\/static\/chunks\/[^"]+\.js)"/g;
  let m;
  while ((m = regex.exec(t)) !== null) {
    const url = 'https://aurasuite-kappa.vercel.app' + m[1];
    const js = await fetch(url).then(res => res.text());
    if (js.includes('team-general')) {
      console.log('FOUND IN:', url);
      // find ALL animate-spin
      const parts = js.split('animate-spin');
      console.log(`Found ${parts.length - 1} occurrences of animate-spin`);
      let acc = 0;
      for (let i = 0; i < parts.length - 1; i++) {
        acc += parts[i].length;
        console.log(`-- Match ${i+1}:`);
        console.log(js.substring(acc - 50, acc + 50));
        acc += 'animate-spin'.length;
      }
    }
  }
}

check();
