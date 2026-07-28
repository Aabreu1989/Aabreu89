const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testChat() {
    console.log("🚀 Testing MIRA Proxy API...");
    try {
        const response = await fetch('http://127.0.0.1:3001/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: "Ola, teste de tradução",
                action: "translate",
                language: "EN"
            })
        });

        const status = response.status;
        const body = await response.text();
        console.log(`Status: ${status}`);
        console.log(`Body: ${body}`);
    } catch (err) {
        console.error("❌ Test Failed:", err.message);
    }
}

testChat();
