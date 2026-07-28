const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();

    // Capture console messages
    page.on('console', msg => {
        console.log(`[BROWSER CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
    });

    page.on('pageerror', error => {
        console.log(`[PAGE ERROR] ${error.message}`);
    });

    console.log('Navigating to app...');
    await page.goto('http://localhost:5176');

    await page.waitForSelector('input[type="text"]');

    console.log('Typing credentials...');
    await page.type('input[type="text"]', 'amandajhonnes@yahoo.com.br');
    await page.type('input[type="password"]', 'Britney');

    console.log('Clicking login...');
    await page.click('button[type="submit"]');

    console.log('Waiting 5 seconds...');
    await new Promise(r => setTimeout(r, 5000));

    console.log('Done waiting.');
    await browser.close();
})();
