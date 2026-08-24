import sys
with open('frontend/app/login/page.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Modify the first useEffect where setIsCheckingSession(false) is called for URL params
old_check = '''      // If an invite token is present, let the URL params effect handle the login flow.
      // Do not auto-login from localStorage, otherwise it overrides the token!
      if (hasInviteToken || hasOldInvite || hasCard) {
        setIsCheckingSession(false);
        return;
      }'''

new_check = '''      // If an invite token is present, let the URL params effect handle the login flow.
      // Do not auto-login from localStorage, otherwise it overrides the token!
      if (hasInviteToken || hasOldInvite || hasCard) {
        // DO NOT set isCheckingSession(false) here. The second useEffect will handle it after checking revokes.
        return;
      }'''

content = content.replace(old_check, new_check)

# 2. Modify the second useEffect
old_second = '''      if (cardParam && userParam) {
        setAuthCardNumber(cardParam);
        setAuthUsername(userParam);
        setLoginMode('worker');
        supabase.from('digital_cards').select('is_revoked').eq('card_number', cardParam).eq('username', userParam).maybeSingle().then(({data}) => { if (data?.is_revoked) setKickoutModal(true); });
      }

      // Process the invite token
      if (loginTokenParam) {'''

new_second = '''      if (cardParam && userParam) {
        setAuthCardNumber(cardParam);
        setAuthUsername(userParam);
        setLoginMode('worker');
        supabase.from('digital_cards').select('is_revoked').eq('card_number', cardParam).eq('username', userParam).maybeSingle().then(({data}) => { 
          if (data?.is_revoked) setKickoutModal(true); 
          setIsCheckingSession(false);
        }).catch(() => setIsCheckingSession(false));
      } else {
        setIsCheckingSession(false);
      }

      // Process the invite token
      if (loginTokenParam) {'''

content = content.replace(old_second, new_second)

with open('frontend/app/login/page.js', 'w', encoding='utf-8') as f:
    f.write(content)
