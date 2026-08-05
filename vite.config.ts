import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    root: path.resolve(__dirname),
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

    // 🛡️ Optimize dependency pre-bundling to prevent crashes on cold start
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        '@supabase/supabase-js',
        'lucide-react',
        'recharts',
      ],
      exclude: ['puppeteer'],    // Puppeteer must never run in the browser
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
