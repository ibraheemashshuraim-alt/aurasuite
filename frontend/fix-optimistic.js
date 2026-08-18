const fs = require('fs');
let content = fs.readFileSync('frontend/app/dashboard/page.js', 'utf8');
content = content.replace(
  /if \(pError\) \{\s*console\.warn\('Session check error \(network\?\):', pError\);\s*setIsCheckingSession\(false\);\s*addNotification\('Network error checking session\. Please refresh to try again\.', 'warning'\);\s*return;\s*\}/g,
  `if (pError) {
              console.warn('Session check error (network?):', pError);
              const isWorker = ['worker', 'client'].includes(parsed.loginMode);
              if (isWorker && loadedMode === 'admin') {
                localStorage.removeItem('aura_session');
                setIsCheckingSession(false);
                return;
              }
              setCurrentUser({ id: userId, role: parsed.loginMode || 'worker', organization_id: parsed.orgId });
              setActiveOrg({ id: parsed.orgId, name: 'Offline Mode', type: 'software_house' });
              setIsLoggedIn(true);
              setIsCheckingSession(false);
              addNotification('Network error connecting to database. Using cached session.', 'warning');
              return;
            }`
);
fs.writeFileSync('frontend/app/dashboard/page.js', content);
