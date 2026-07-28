import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testResend() {
    const resendKey = process.env.RESEND_API_KEY;
    console.log('Testing Resend with key:', resendKey?.substring(0, 10) + '...');

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendKey}`
        },
        body: JSON.stringify({
            from: 'MIRA Imigrante <no-reply@miraimigrante.pt>',
            to: ['amanda.abreu@aln.iseg.ulisboa.pt'],
            subject: 'Teste de Entrega MIRA',
            html: '<p>Este é um teste de entrega soberano.</p>'
        })
    });

    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
}

testResend();
