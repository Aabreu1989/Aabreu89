import fetch from 'node-fetch';

async function run() {
    const url = "https://www.glassdoor.pt/Job/portugal-jobs-SRCH_IL.0,8_IN195_RSS.xml";
    console.log(`📡 Tentando buscar RSS do Glassdoor: ${url}`);
    
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            }
        });
        
        console.log(`📊 Status: ${res.status}`);
        const text = await res.text();
        console.log("📝 Resposta (primeiros 1000 caracteres):");
        console.log(text.substring(0, 1000));
        
    } catch (e) {
        console.error("❌ Erro:", e.message);
    }
}

run();
