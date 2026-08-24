const fs = require('fs');

let c = fs.readFileSync('frontend/app/login/page.js', 'utf8');

c = c.replace(/if \(decoded\.orgName\) setAuthOrgName\(decoded\.orgName\);\r?\n\s*\}\r?\n\s*\} catch\(e\) \{ \/\* ignore invalid token \*\/ \}\r?\n\s*\}/, 
`if (decoded.orgName) setAuthOrgName(decoded.orgName);
              
              // NEW FIX: Immediately check if revoked and block the screen!
              supabase.from('digital_cards').select('is_revoked').eq('card_number', decoded.card).eq('username', decoded.username).maybeSingle().then(({data}) => { 
                if (data?.is_revoked) setKickoutModal(true); 
              });
            }
          } catch(e) { /* ignore invalid token */ }
        }`);

fs.writeFileSync('frontend/app/login/page.js', c);
console.log('Fixed popup in login');
