const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? 'PRESENT' : 'MISSING');

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFetch() {
    const { data, error } = await supabase.from('commissions').select('id').limit(1);
    if (error) {
        console.error('Fetch Error:', error);
    } else {
        console.log('Fetch Success:', data);
    }
}

testFetch();
