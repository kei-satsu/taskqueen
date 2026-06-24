import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
export default defineConfig({
 plugins: [
 react(),
 VitePWA({
 registerType: 'autoUpdate',
 includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-able-icon.png'],
 manifest: {
 name: 'TaskQueen - Smart Manager',
 short_name: 'TaskQueen',
 description: 'Micro-Task & Budget Manager for Everyday Queens',
 theme_color: '#6d28d9',
 background_color: '#fdfbfa',
 display: 'standalone',
 orientation: 'portrait',
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
 }
 ]
 }
 })
 ],
})
