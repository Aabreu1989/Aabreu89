import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    root: path.resolve(__dirname),
    cacheDir: path.resolve(__dirname, 'node_modules/.vite'),
    server: {
      port: 3000,
      strictPort: true,
      host: true, 
      hmr: {
        overlay: false,
        timeout: 60000,
      },
      watch: {
        ignored: [
          '**/node_modules/**',
          '**/.vercel/**',
          '**/scratch_*.mjs',
          '**/scratch/**',
          '**/supabase/functions/**',
          '**/.git/**',
          '**/dist/**',
          '**/tmp/**',
          '**/scripts/**',
        ],
        usePolling: false,
      },
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:3001',
          changeOrigin: true,
        }
      },
    },

    define: {
      'process.env': {},
    },

    plugins: [react()],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },

    // 🛡️ Disable dev pre-bundling optimizer to prevent Node v24 esbuild output key mismatch crash
    optimizeDeps: {
      noDiscovery: true,
      include: [],
    },

    build: {
      sourcemap: false,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-supabase': ['@supabase/supabase-js'],
            'vendor-ui': ['lucide-react', 'recharts'],
          },
        },
        onwarn(warning, warn) {
          if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
          if (warning.code === 'CIRCULAR_DEPENDENCY') return;
          warn(warning);
        },
      },
    },
  };
});
