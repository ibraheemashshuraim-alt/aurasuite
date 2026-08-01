const supabaseUrl = 'https://trrvcethuyqldnzrneiw.supabase.co';
const supabaseKey = 'sb_publishable_HKKUstgS3rzPEmDk53OrMg_9J7JqsSx';

async function wipeTable(table) {
    console.log(`Wiping ${table}...`);
    let pk = 'id';
    if (table === 'financials') pk = 'organization_id';
    if (table === 'meeting_states') pk = 'meeting_id';
    if (table === 'presence') pk = 'user_id';
    
    const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${pk}=not.is.null`, {
        method: 'DELETE',
        headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Prefer': 'return=minimal'
        }
    });
    if (!response.ok) {
        console.error(`Error wiping ${table}:`, await response.text());
    } else {
        console.log(`Successfully wiped ${table}.`);
    }
}

async function wipeDatabase() {
    console.log('Starting full database wipe...');
    const tables = [
        'digital_cards',
        'quiz_results',
        'tasks',
        'schedules',
        'group_messages',
        'dm_messages',
        'meeting_invites',
        'meeting_states',
        'meetings',
        'financials',
        'presence',
        'profiles',
        'organizations'
    ];
    
    for (const table of tables) {
        await wipeTable(table);
    }
    console.log('Database wipe complete. All accounts and data have been reset.');
}

wipeDatabase();
