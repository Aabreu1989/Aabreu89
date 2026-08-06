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
      port: 3333,
      host: true,
      strictPort: false, 
      hmr: {
        overlay: true,           // Show errors as overlay instead of crashing
        timeout: 60000,          // 60s timeout before giving up on HMR connection
      },
      watch: {
        // Ignore node_modules and supabase functions to prevent excessive file watchers
        ignored: [
          '**/node_modules/**',
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
            'massive-data': ['./src/utils/massiveJobsDatabase', './src/utils/iefpCoursesDatabase', './src/utils/dgesCoursesDatabase', './src/utils/massiveServicesDatabase'],
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
