import re

for file_path in ['frontend/app/dashboard/page.js', 'frontend/app/login/page.js']:
    with open(file_path, 'r', encoding='utf-8') as f:
        code = f.read()

    # 1. Put back disabled={isBanActive} on the Reactivate buttons
    # Button 1: Organization reactivation (not changed, but let's check)
    # Button 2: User reactivation
    # I replaced `disabled={isBanActive}` with empty string earlier.
    # The original was: <button onClick={() => handleReactivateUser(user)} disabled={isBanActive} title={isBanActive ? `Eligible on ${formatOrgDate(expiryDate)}` : 'Reactivate'}
    
    code = re.sub(
        r'<button onClick=\{\(\) => handleReactivateUser\(user\)\}  title=\{isBanActive \? `Eligible on \$\{formatOrgDate\(expiryDate\)\}` : \'Reactivate\'\}',
        r'<button onClick={() => handleReactivateUser(user)} disabled={isBanActive} title={isBanActive ? `Eligible on ${formatOrgDate(expiryDate)}` : \'Reactivate\'}',
        code
    )
    
    # Put back the disabled classes
    code = re.sub(
        r'className="px-3 py-1\.5 bg-green-950/50 hover:bg-green-600/80 text-green-200 hover:text-white text-\[10px\] font-bold rounded-lg border border-green-500/30 transition-all flex items-center gap-1 "',
        r'className="px-3 py-1.5 bg-green-950/50 hover:bg-green-600/80 text-green-200 hover:text-white text-[10px] font-bold rounded-lg border border-green-500/30 transition-all flex items-center gap-1 disabled:bg-gray-900 disabled:border-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"',
        code
    )

    # 2. Revert handleReactivateUser to block if isBanActive is true, but keep the originalRole logic
    
    new_reactivate_func = """const handleReactivateUser = async (user) => {
    const userEmail = user.email?.toLowerCase();
    const banRecord = bannedEmails.find(b => b.email === userEmail || b.email === `${activeOrg?.id}:${userEmail}`);
    const isBanActive = banRecord && new Date(banRecord.banned_until) > new Date();

    if (isBanActive) {
      setCustomAlert(`This email can be reactivated on ${formatOrgDate(banRecord.banned_until)}.`);
      return;
    }

    setConfirmModal({
      title: `Reactivate ${user.full_name}?`,
      message: 'This will restore the user profile and reactivate their existing access card.',
      onConfirm: async () => {
        // Fetch original role from digital_cards
        const { data: cards } = await supabase.from('digital_cards').select('role').eq('profile_id', user.id).limit(1);
        let originalRole = cards && cards.length > 0 && cards[0].role ? cards[0].role : null;
        if (!originalRole) {
            originalRole = user.category === 'A' && user.domain === 'Admin' ? 'admin' : 'worker';
        }
        
        const nextRole = originalRole;
        const { error } = await supabase
          .from('profiles')
          .update({ role: nextRole, is_locked: false, force_unlocked: false })
          .eq('id', user.id);
        if (error) throw error;

        await supabase.from('digital_cards').update({ is_revoked: false }).eq('profile_id', user.id);
        if (banRecord) {
          await supabase.from('banned_emails').delete().in('email', [userEmail, `${activeOrg?.id}:${userEmail}`]);
          setBannedEmails(prev => prev.filter(b => b.email !== userEmail && b.email !== `${activeOrg?.id}:${userEmail}`));
        }

        const updatedUser = { ...user, role: nextRole, is_locked: false, force_unlocked: false };
        setProfiles(prev => prev.map(p => p.id === user.id ? updatedUser : p));
        if (kickoutChannelRef.current) {
          await kickoutChannelRef.current.send({
            type: 'broadcast',
            event: 'user-reactivated',
            payload: { userId: user.id, role: nextRole }
          });
        }
        addNotification(`User ${user.full_name} reactivated successfully.`, 'success');
      }
    });
  };"""

    code = re.sub(r'const handleReactivateUser = async \(user\) => \{.*?addNotification\(`User \$\{user\.full_name\} reactivated successfully\.`, \'success\'\);\n      \}\n    \}\);\n  \};', new_reactivate_func, code, flags=re.DOTALL)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(code)

print("Patch reverted successfully.")
