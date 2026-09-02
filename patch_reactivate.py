import re

for file_path in ['frontend/app/dashboard/page.js', 'frontend/app/login/page.js']:
    with open(file_path, 'r', encoding='utf-8') as f:
        code = f.read()

    # 1. Remove disabled={isBanActive} from Reactivate buttons
    code = code.replace('disabled={isBanActive}', '')
    code = code.replace('disabled:bg-gray-900 disabled:border-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed', '')
    
    # 2. Update handleReactivateUser
    # We will replace the entire handleReactivateUser function body
    reactivate_pattern = r"const handleReactivateUser = async \(user\) => \{.*?const updatedUser = \{ \.\.\.user, role: nextRole, is_locked: false, force_unlocked: false \};.*?setProfiles\(prev => prev\.map\(p => p\.id === user\.id \? updatedUser : p\)\);.*?if \(kickoutChannelRef.*?\}\n.*?addNotification.*?\}\n    \}\);\n  \};"
    
    new_reactivate_func = """const handleReactivateUser = async (user) => {
    const userEmail = user.email?.toLowerCase();
    const banRecord = bannedEmails.find(b => b.email === userEmail || b.email === `${activeOrg?.id}:${userEmail}`);
    const isBanActive = banRecord && new Date(banRecord.banned_until) > new Date();

    let warningMsg = '';
    if (isBanActive) {
      warningMsg = `\\n\\nWARNING: This user is currently serving a 30-day ban until ${formatOrgDate(banRecord.banned_until)}. By proceeding, you are pardoning them early.`;
    }

    setConfirmModal({
      title: `Reactivate ${user.full_name}?`,
      message: `This will restore the user profile and reactivate their existing access card.${warningMsg}`,
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

    code = re.sub(reactivate_pattern, new_reactivate_func, code, flags=re.DOTALL)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(code)

print("Patch applied successfully.")
