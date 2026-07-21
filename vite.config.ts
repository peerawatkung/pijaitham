import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // PWA: ติดตั้งบนมือถือ + ใช้งานออฟไลน์ได้ทั้งแอปรวมถึงสร้าง PDF
    // (ตอกย้ำหลัก privacy — ปิดเน็ตแล้วยังใช้ได้ = พิสูจน์ว่าไม่ส่งข้อมูลไปไหน)
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'logo.png',
        'fonts/*.ttf',
        'icons/*.png',
        'og-image.jpg',
      ],
      manifest: {
        name: 'พิใจธรรม — สมุดวางแผนการดูแลชีวิตระยะท้าย',
        short_name: 'พิใจธรรม',
        description:
          'เครื่องมือช่วยเขียนหนังสือแสดงเจตนา (Living Will) ตามมาตรา 12 — ข้อมูลอยู่ในเครื่องของคุณเท่านั้น',
        lang: 'th',
        display: 'standalone',
        start_url: '/',
        background_color: '#faf8f1',
        theme_color: '#faf8f1',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // precache ทุกอย่างรวมฟอนต์และ PDF engine — เปิดครั้งเดียว ใช้ออฟไลน์ได้ครบ
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,ttf,webmanifest}'],
        // หน้าบทความเป็น HTML static ที่สร้างหลัง SW ถูก generate (scripts/build-articles.mjs)
        // ถ้าไม่กันไว้ SW จะเสิร์ฟ index.html ของแอปทับ ทำให้เปิดบทความไม่ได้
        navigateFallbackDenylist: [/^\/articles/],
      },
    }),
  ],
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
  },
  preview: {
    port: process.env.PORT ? Number(process.env.PORT) : 4173,
  },
})
