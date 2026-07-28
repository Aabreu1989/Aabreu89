import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testResendFallback() {
    const resendKey = process.env.RESEND_API_KEY;
    console.log('Testing Resend Fallback (onboarding@resend.dev)...');

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendKey}`
        },
        body: JSON.stringify({
            from: 'MIRA Test <onboarding@resend.dev>',
            to: ['amanda.abreu@aln.iseg.ulisboa.pt'],
            subject: 'MIRA: Teste de Fallback',
            html: '<p>Se recebeu isto, o problema é a verificação do domínio miraimigrante.pt no Resend.</p>'
        })
    });

    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
}

testResendFallback();
