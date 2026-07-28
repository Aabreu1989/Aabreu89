const puppeteer = require('puppeteer');
const path = require('path');

async function run() {
    console.log("📸 Iniciando captura de ecrã local com Puppeteer...");
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    try {
        console.log("🌐 Navegando para http://localhost:3333...");
        await page.goto('http://localhost:3333', { waitUntil: 'networkidle2', timeout: 30000 });
        
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Tentar saltar a intro
        console.log("🖱️ Tentando saltar intro...");
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const saltar = btns.find(b => b.innerText.includes('SALTAR'));
            if (saltar) saltar.click();
        });
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Tentar ir para Vagas
        console.log("💼 Tentando clicar em Vagas...");
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button, a, span'));
            const vagas = btns.find(b => b.innerText.toLowerCase().includes('vagas') || b.innerText.toLowerCase().includes('empregos'));
            if (vagas) vagas.click();
        });
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const screenshotPath = path.join(__dirname, 'localhost_vagas_verify.png');
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`✅ Captura das Vagas guardada em: ${screenshotPath}`);
        
    } catch (e) {
        console.error("❌ Erro na captura:", e.message);
    } finally {
        await browser.close();
    }
}

run();
