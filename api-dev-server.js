import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─── ENV WARNINGS ────────────────────────────────────────────────────────────
// ─── ENV AUDIT: SOBERANIA V2026 ──────────────────────────────────────────
if (!process.env.RESEND_API_KEY) {
    console.log('\x1b[31m%s\x1b[0m', '🚨 ERROR: RESEND_API_KEY IS MISSING! Email delivery will fail.');
} else {
    const maskedKey = process.env.RESEND_API_KEY.substring(0, 7) + '...';
    console.log('\x1b[32m%s\x1b[0m', `✅ RESEND KEY: DEPLOYED (${maskedKey})`);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('\x1b[33m%s\x1b[0m', '⚠️  WARNING: SUPABASE_SERVICE_ROLE_KEY is missing. Profile actions limited.');
} else {
    console.log('\x1b[32m%s\x1b[0m', '✅ SUPABASE ROLE: ACTIVE');
}

const app = express();

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// Request timeout middleware (prevents hanging requests from blocking the server)
app.use((req, res, next) => {
    req.setTimeout(30000, () => {
        if (!res.headersSent) res.status(408).json({ error: 'Request timeout' });
    });
    next();
});

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'Sovereign', uptime: process.uptime() }));

// ─── NESTED ROUTING HANDLER FOR EXPORT IMPACT ─────────────────────────────────
app.all('/api/admin/export-impact', async (req, res) => {
    try {
        const funcPath = join(__dirname, 'api', 'admin-export-impact.js');
        const stat = fs.statSync(funcPath);
        const mod = await import(`./api/admin-export-impact.js?t=${stat.mtimeMs}`);
        console.log(`📡 [MIRA API] Executing /api/admin/export-impact...`);
        await mod.default(req, res);
    } catch (err) {
        console.error(`❌ Erro em /api/admin/export-impact:`, err.message);
        if (!res.headersSent) {
            res.status(500).json({ error: err.message });
        }
    }
});

// ─── NESTED ROUTING HANDLER FOR METRICS PANEL (AUDIT COMPLIANCE) ───────────────
app.all('/api/admin/metrics-panel', async (req, res) => {
    try {
        const funcPath = join(__dirname, 'api', 'admin-metrics-panel.js');
        const stat = fs.statSync(funcPath);
        const mod = await import(`./api/admin-metrics-panel.js?t=${stat.mtimeMs}`);
        console.log(`📡 [MIRA API] Executing /api/admin/metrics-panel...`);
        await mod.default(req, res);
    } catch (err) {
        console.error(`❌ Erro em /api/admin/metrics-panel:`, err.message);
        if (!res.headersSent) {
            res.status(500).json({ error: err.message });
        }
    }
});

// ─── DYNAMIC API ROUTER (PRE-DEFINED CHAT HANDLED HERE) ───────────────────────
// Uses a module cache to avoid memory leaks from repeated dynamic imports
const moduleCache = new Map();

app.all('/api/:function', async (req, res) => {
    const funcName = req.params.function;
    const funcPath = join(__dirname, 'api', `${funcName}.js`);

    if (!fs.existsSync(funcPath)) {
        console.warn(`⚠️  API: /api/${funcName} não encontrada. Procurando em: ${funcPath}`);
        return res.status(404).json({ 
            error: `Função /api/${funcName} não encontrada.`,
            debug_path: funcPath,
            exists: fs.existsSync(funcPath)
        });
    }

    try {
        // Cache modules — only re-import if file was modified
        const stat = fs.statSync(funcPath);
        const cacheKey = `${funcPath}:${stat.mtimeMs}`;

        if (!moduleCache.has(cacheKey)) {
            // Bust old cache entries for this func (new version of file)
            for (const key of moduleCache.keys()) {
                if (key.startsWith(funcPath)) moduleCache.delete(key);
            }
            const mod = await import(`./api/${funcName}.js?t=${stat.mtimeMs}`);
            moduleCache.set(cacheKey, mod);
        }

        const module = moduleCache.get(cacheKey);
        console.log(`📡 [MIRA API] Executing /api/${funcName}...`);
        await module.default(req, res);
    } catch (err) {
        console.error(`❌ Erro em /api/${funcName}:`, err.message);
        if (!res.headersSent) {
            res.status(500).json({ error: err.message });
        }
    }
});

// ─── ERROR HANDLER ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error(`❌ [MIRA API ERROR] Path: ${req.path} | Error: ${err.message}`);
    if (!res.headersSent) {
        res.status(500).json({ 
            error: 'API_STRICT_FAILURE', 
            details: err.message,
            source: 'Sovereign API Shield'
        });
    }
});

// ─── SERVER STARTUP WITH PORT-CONFLICT RECOVERY ───────────────────────────────
const PORT = parseInt(process.env.API_PORT || '3001', 10);
const HOST = '127.0.0.1';

function startServer(port) {
    const server = app.listen(port, HOST, () => {
        console.log('\n' + '👑 '.repeat(15));
        console.log(`🚀 MIRA API SOVEREIGN: http://${HOST}:${port}`);
        console.log(`⏱️  Uptime tracking: ACTIVE`);
        console.log(`🛡️  Modo: Desenvolvimento V2026.STABLE`);
        console.log('👑 '.repeat(15) + '\n');
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.warn(`⚠️  Porto ${port} ocupado. Tentando ${port + 1}...`);
            setTimeout(() => startServer(port + 1), 1000);
        } else {
            console.error('❌ [MIRA API] Erro fatal no servidor:', err.message);
            process.exit(1);
        }
    });

    // ─── GRACEFUL SHUTDOWN ─────────────────────────────────────────────────
    const shutdown = (signal) => {
        console.log(`\n🛑 [MIRA API] Recebido ${signal}. Encerrando graciosamente...`);
        server.close(() => {
            console.log('✅ [MIRA API] Servidor encerrado. Pode reiniciar com segurança.');
            process.exit(0);
        });
        // Force shutdown after 5s if graceful shutdown hangs
        setTimeout(() => process.exit(1), 5000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    return server;
}

// ─── UNCAUGHT EXCEPTION GUARD ──────────────────────────────────────────────────
// This is what prevents the server from dying on unexpected errors
process.on('uncaughtException', (err) => {
    console.error('🚨 [MIRA API] Uncaught Exception — SERVIDOR PROTEGIDO:', err.message);
    // Don't exit — log and continue
});

process.on('unhandledRejection', (reason) => {
    console.error('🚨 [MIRA API] Unhandled Promise Rejection — SERVIDOR PROTEGIDO:', reason);
    // Don't exit — log and continue
});

startServer(PORT);
