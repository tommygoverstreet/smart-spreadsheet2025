import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import legacy from '@vitejs/plugin-legacy';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  root: '.',
  base: './',

  // Server configuration
  server: {
    port: 3000,
    host: true,
    open: true
  },

  // Preview configuration
  preview: {
    port: 3000,
    host: true
  },

  // Build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    minify: 'terser',
    target: 'es2020',

    // Optimize chunks
    rollupOptions: {
      input: {
        main: './index.html'
      },
      output: {
        manualChunks: {
          // Vendor chunks
          'vendor-charts': ['chart.js'],
          'vendor-csv': ['papaparse'],
          'vendor-pdf': ['jspdf'],

          // Feature chunks
          'performance': ['./src/modules/PerformanceMonitor.js', './src/modules/PerformanceDashboard.js'],
          'data-processing': ['./src/modules/DataProcessor.js', './src/modules/CacheManager.js'],
          'ui-components': ['./src/modules/UIRenderer.js', './src/modules/ProgressiveEnhancement.js']
        },
        // Optimize asset naming
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/css/i.test(ext)) {
            return `assets/css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        }
      }
    },

    // Terser options for better minification
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
        passes: 2
      },
      mangle: {
        safari10: true
      },
      format: {
        comments: false
      }
    },

    // Assets optimization
    assetsInlineLimit: 4096, // 4kb
    cssCodeSplit: true,

    // Chunk size warnings
    chunkSizeWarningLimit: 1000 // 1MB
  },

  // Plugins
  plugins: [
    // Legacy browser support
    legacy({
      targets: ['defaults', 'not IE 11'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
      modernPolyfills: true
    }),

    // PWA plugin
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],

      // Manifest
      manifest: {
        name: 'Smart Spreadsheet Dashboard',
        short_name: 'Smart Dashboard',
        description: 'AI-Powered Data Analysis Dashboard',
        theme_color: '#0c8ce9',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',

        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },

      // Workbox configuration
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          // Cache Google Fonts
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheKeyWillBeUsed: async ({ request }) => {
                return `${request.url}?version=1`;
              }
            }
          },

          // Cache CDN assets
          {
            urlPattern: /^https:\/\/cdn\.(jsdelivr\.net|tailwindcss\.com|cdnjs\.cloudflare\.com)\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'cdn-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },

          // Cache API responses
          {
            urlPattern: /^https:\/\/api\..*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              networkTimeoutSeconds: 3
            }
          }
        ],

        // Skip waiting and claim clients
        skipWaiting: true,
        clientsClaim: true,

        // Clean up old caches
        cleanupOutdatedCaches: true
      }
    }),

    // Bundle analyzer
    visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true
    })
  ],

  // Dependencies optimization
  optimizeDeps: {
    include: [
      'chart.js/auto',
      'papaparse',
      'jspdf'
    ],
    exclude: [
      'some-problematic-dep'
    ]
  },

  // CSS configuration
  css: {
    devSourcemap: true,
    postcss: {
      plugins: [
        require('tailwindcss'),
        require('autoprefixer'),
      ]
    }
  },

  // Define global constants
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development')
  },

  // Environment variables
  envPrefix: 'VITE_',

  // Worker configuration
  worker: {
    format: 'es'
  }
});