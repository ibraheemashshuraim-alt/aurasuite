const fs = require('fs');
const path = require('path');

const originalPath = path.join(__dirname, 'frontend/app/page.js');
const source = fs.readFileSync(originalPath, 'utf8');

// Dashboard Generation
let dashboardSource = source;
// Replace standard set/check with redirect on failure
dashboardSource = dashboardSource.replace(
  `        } catch(e) {
          sessionStorage.removeItem('aura_session');
          localStorage.removeItem('aura_session');
          setIsCheckingSession(false);
        }
      } else {
        setIsCheckingSession(false);
      }`,
  `        } catch(e) {
          sessionStorage.removeItem('aura_session');
          localStorage.removeItem('aura_session');
          window.location.href = '/login';
        }
      } else {
        window.location.href = '/login';
      }`
);

// Worker admin isolation failure
dashboardSource = dashboardSource.replace(
  `              if (isWorker && loadedMode === 'admin') {
                localStorage.removeItem('aura_session');
                setIsCheckingSession(false);
                return;
              }`,
  `              if (isWorker && loadedMode === 'admin') {
                localStorage.removeItem('aura_session');
                window.location.href = '/login';
                return;
              }`
);

// Redirect to /login if !isLoggedIn inside render block
dashboardSource = dashboardSource.replace(
  `  // ── LOGIN SCREEN ──
  if (!isLoggedIn) {`,
  `  // ── LOGIN SCREEN ──
  if (!isLoggedIn) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return null;`
);

fs.writeFileSync(path.join(__dirname, 'frontend/app/dashboard/page.js'), dashboardSource);

// Login Generation
let loginSource = source;

// When session is found valid, redirect to dashboard
loginSource = loginSource.replace(
  `            if (savedUser.is_first_login) {
              setForcePasswordChange(savedUser.is_first_login);
              setIsLoggedIn(true);
            } else {
              setIsLoggedIn(true);
            }`,
  `            if (savedUser.is_first_login) {
              setForcePasswordChange(savedUser.is_first_login);
              window.location.href = '/dashboard';
            } else {
              window.location.href = '/dashboard';
            }`
);

// After manual login logic sets session, redirect to dashboard
loginSource = loginSource.replace(
  `      setTimeout(() => {
        setIsLoggedIn(true);
        setAuthLoading(false);
      }, 1000);`,
  `      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);`
);

// Render nothing if they are somehow logged in
loginSource = loginSource.replace(
  `  // ══════════════════ MAIN APP ══════════════════
  return (`,
  `  // ══════════════════ MAIN APP ══════════════════
  if (isLoggedIn) return null;
  
  return (`
);

fs.writeFileSync(path.join(__dirname, 'frontend/app/login/page.js'), loginSource);
console.log("Migration generated successfully!");
