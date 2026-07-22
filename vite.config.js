import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            manifest: {
                name: 'EBD Petrolina - Controle de Estoque',
                short_name: 'EBD Estoque',
                description: 'Sistema de controle de estoque EBD Petrolina',
                theme_color: '#C00000',
                background_color: '#0a0a0a',
                display: 'standalone',
                icons: [
                    { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
                    { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
                    { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
                ],
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
            },
        }),
    ],
    build: {
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                manualChunks: {
                    'react-vendor': ['react', 'react-dom', 'react-router-dom'],
                    'supabase-vendor': ['@supabase/supabase-js'],
                    'ui-vendor': ['lucide-react', 'recharts', 'sonner', '@tanstack/react-query'],
                },
            },
        },
    },
});
