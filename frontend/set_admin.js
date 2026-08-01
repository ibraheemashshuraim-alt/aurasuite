import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './frontend/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function setSuperAdmin() {
    const email = 'ibraheemashshuraim@gmail.com';
    
    console.log(`Setting ${email} to super_admin...`);
    
    // Check if user exists
    const { data: user, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();
        
    if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching user:', fetchError);
        return;
    }
    
    if (user) {
        // Update existing user
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ role: 'super_admin' })
            .eq('email', email);
            
        if (updateError) {
            console.error('Error updating user:', updateError);
        } else {
            console.log(`Successfully updated ${email} to super_admin.`);
        }
    } else {
        console.log(`User ${email} not found. Please log in first with this email so it gets created in the DB, or register it.`);
    }
}

setSuperAdmin();
