/**
 * 🛡️ MIRA SOVEREIGN DEV LAUNCHER V2026
 * ─────────────────────────────────────
 * Inicia o ambiente de desenvolvimento de forma estável:
 * - Liberta portas ocupadas antes de arrancar
 * - Reinicia automaticamente o API server se ele cair
 * - Mostra logs colorizados e separados de cada processo
 * 
 * Uso: node scripts/dev-launcher.mjs
 */

import { spawn, execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORTS_TO_FREE = [3333, 3000, 3001];
const COLORS = {
    reset: '\x1b[0m',
    vite: '\x1b[36m',    // Cyan
    api: '\x1b[33m',     // Yellow
    sys: '\x1b[32m',     // Green
    err: '\x1b[31m',     // Red
};

function log(prefix, color, msg) {
    const ts = new Date().toLocaleTimeString('pt-PT');
    console.log(`${color}[${ts}] ${prefix}${COLORS.reset} ${msg}`);
}

// ─── LIBERTA PORTAS OCUPADAS ─────────────────────────────────────────────────
function freePort(port) {
    try {
        // Windows: find and kill process on port
        const result = execSync(
            `for /f "tokens=5" %a in ('netstat -aon ^| findstr :${port}') do taskkill /F /PID %a`,
            { shell: 'cmd.exe', stdio: 'pipe', timeout: 3000 }
        );
        log('SYS', COLORS.sys, `✅ Porto ${port} libertado.`);
    } catch (err) {
        // Port was already free or taskkill failed silently — that's fine
        log('SYS', COLORS.sys, `ℹ️  Porto ${port} verificado / libertado.`);
    }
}

log('SYS', COLORS.sys, '🚀 MIRA SOVEREIGN DEV LAUNCHER - Iniciando...');
log('SYS', COLORS.sys, '🧹 Libertando portas...');
PORTS_TO_FREE.forEach(freePort);

// ─── SPAWN VITE ──────────────────────────────────────────────────────────────
function startVite() {
    log('SYS', COLORS.sys, '⚡ Iniciando Vite (Frontend)...');
    const vite = spawn('node', ['./node_modules/vite/bin/vite.js'], {
        shell: true,
        cwd: path.resolve(__dirname, '..'),
        env: { ...process.env },
    });

    vite.stdout.on('data', (d) => {
        d.toString().split('\n').filter(Boolean).forEach(line => 
            log('VITE', COLORS.vite, line.trim())
        );
    });
    vite.stderr.on('data', (d) => {
        const msg = d.toString().trim();
        if (msg) log('VITE', COLORS.err, msg);
    });
    vite.on('close', (code) => {
        log('VITE', COLORS.err, `❌ Vite encerrou (código: ${code}). Reiniciando em 3s...`);
        setTimeout(startVite, 3000);
    });

    return vite;
}

// ─── SPAWN API SERVER ─────────────────────────────────────────────────────────
let apiRestartCount = 0;
let isApiReady = false;

async function checkApiHealth(port) {
    try {
        const response = await fetch(`http://127.0.0.1:${port}/api/health`);
        return response.ok;
    } catch {
        return false;
    }
}

function startApi() {
    log('SYS', COLORS.sys, '🛰️  Iniciando API Server...');
    const api = spawn('node', ['api-dev-server.js'], {
        shell: true,
        cwd: path.resolve(__dirname, '..'),
        env: { ...process.env },
    });

    api.stdout.on('data', (d) => {
        const line = d.toString().trim();
        if (line.includes('MIRA API SOVEREIGN')) {
            isApiReady = true;
            log('SYS', COLORS.sys, '✅ API Reconhecida como Ativa.');
        }
        log('API', COLORS.api, line);
    });

    api.on('close', (code) => {
        isApiReady = false;
        apiRestartCount++;
        const delay = Math.min(1000 * apiRestartCount, 10000);
        log('API', COLORS.err, `❌ API Server caiu (código: ${code}). Reinício #${apiRestartCount} em ${delay/1000}s...`);
        setTimeout(startApi, delay);
    });

    return api;
}

// ─── ARRANQUE ────────────────────────────────────────────────────────────────
log('SYS', COLORS.sys, '💎 MIRA SOVEREIGN ENVIRONMENT BOOTING...');

setTimeout(async () => {
    startApi();
    
    // Aguardar até a API estar pronta antes de lançar o Vite
    log('SYS', COLORS.sys, '⏳ Aguardando sincronização da API...');
    let checks = 0;
    while (!isApiReady && checks < 10) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        checks++;
    }

    startVite();
    log('SYS', COLORS.sys, '🔮 ENVIRONMENT FULLY ACTIVE. Localhost session is persistent.');
    
    // ─── AUTO-SYNC VAGAS (Daily Check) ───────────────────────────────────────
    log('SYS', COLORS.sys, '🔄 Verificando sincronização de vagas...');
    const syncJobs = spawn('node', ['scripts/sync-jobs.cjs'], {
        shell: true,
        stdio: 'ignore', // Silent in background
        detached: true
    });
    syncJobs.unref(); 

    // 🛡️ LIFE SENTINEL: Keeps the node process alive even if spawns are idle or failing
    // Run sync every 24 hours if launcher stays alive
    setInterval(() => {
        log('SYS', COLORS.sys, '🔄 Iniciando sincronização diária de vagas...');
        const periodicSync = spawn('node', ['scripts/sync-jobs.cjs'], {
            shell: true,
            stdio: 'ignore', // Silent in background
            detached: true
        });
        periodicSync.unref();
    }, 24 * 60 * 60 * 1000);
}, 500);
