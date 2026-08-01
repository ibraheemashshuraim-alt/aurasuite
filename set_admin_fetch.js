const supabaseUrl = 'https://trrvcethuyqldnzrneiw.supabase.co';
const supabaseKey = 'sb_publishable_HKKUstgS3rzPEmDk53OrMg_9J7JqsSx';

async function setSuperAdmin() {
    const email = 'ibraheemashshuraim@gmail.com';
    
    console.log(`Setting ${email} to super_admin...`);
    
    // Check if user exists
    const response = await fetch(`${supabaseUrl}/rest/v1/profiles?email=eq.${email}`, {
        method: 'GET',
        headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
        }
    });
    
    const users = await response.json();
    
    if (users && users.length > 0) {
        // Update existing user
        const updateResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?email=eq.${email}`, {
            method: 'PATCH',
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({ role: 'super_admin' })
        });
            
        if (!updateResponse.ok) {
            console.error('Error updating user:', await updateResponse.text());
        } else {
            console.log(`Successfully updated ${email} to super_admin.`);
        }
    } else {
        console.log(`User ${email} not found. Please log in first with this email so it gets created in the DB, or register it.`);
    }
}

setSuperAdmin();
