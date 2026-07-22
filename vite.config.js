import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';
export default defineConfig({
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
            },
            manifest: {
                name: 'EBD Petrolina - Controle de Estoque',
                short_name: 'EBD Estoque',
                description: 'Sistema de controle de estoque da EBD Petrolina',
                theme_color: '#b91c1c',
                background_color: '#7f1d1d',
                display: 'standalone',
                icons: [],
            },
        }),
    ],
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'react-vendor': ['react', 'react-dom', 'react-router-dom'],
                    'supabase-vendor': ['@supabase/supabase-js'],
                    'ui-vendor': ['recharts', 'lucide-react', 'sonner'],
                },
            },
        },
    },
});
