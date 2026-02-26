const fs = require('fs');
require('dotenv').config({ path: '.env.local' });
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function checkFailures() {
    try {
        const { data, error } = await resend.emails.list();
        if (error) {
            console.error('Error fetching emails:', error);
            return;
        }

        fs.writeFileSync('resend_logs_clean.json', JSON.stringify(data.data, null, 2), 'utf-8');
        console.log('Saved 100 emails to resend_logs_clean.json');

    } catch (err) {
        console.error('Fatal API Error:', err);
    }
}

checkFailures();
