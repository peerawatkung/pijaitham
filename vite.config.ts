import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // PWA: ติดตั้งบนมือถือ + ใช้งานออฟไลน์ได้ทั้งแอปรวมถึงสร้าง PDF
    // (ตอกย้ำหลัก privacy — ค่าเริ่มต้นปิดเน็ตแล้วยังใช้ได้ = ไม่ส่งข้อมูลไปไหน
    //  ส่วนโหมดเก็บออนไลน์เป็น opt-in ผ่าน /api ซึ่ง SW ไม่แตะ)
    VitePWA({
      registerType: 'autoUpdate',
      // ฝังโค้ด register SW (134B) ลง HTML แทน request แยกที่ block parser
      injectRegister: 'inline',
      // ไม่ต้องมี includeAssets — globPatterns ด้านล่างครอบคลุม svg/png/ttf ครบแล้ว
      // (og-image.jpg ตั้งใจไม่ precache — ใช้เฉพาะ social crawler ซึ่งไม่ผ่าน SW)
      manifest: {
        name: 'พิใจธรรม — สมุดวางแผนการดูแลชีวิตระยะท้าย',
        short_name: 'พิใจธรรม',
        description:
          'เครื่องมือช่วยเขียนหนังสือแสดงเจตนา (Living Will) ตามมาตรา 12 — ข้อมูลเป็นความลับ ไม่มีใครอ่านได้นอกจากคุณ',
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
        // (ไม่รวม jpg: ไฟล์ jpg เดียวคือ og-image ซึ่งแอปไม่ได้ใช้)
        globPatterns: ['**/*.{js,css,html,svg,png,ttf,webmanifest}'],
        // หน้าบทความเป็น HTML static ที่สร้างหลัง SW ถูก generate (scripts/build-articles.mjs)
        // ถ้าไม่กันไว้ SW จะเสิร์ฟ index.html ของแอปทับ ทำให้เปิดบทความไม่ได้
        // /api คือ Pages Functions (โหมดเก็บออนไลน์) — ห้าม SW แตะเช่นกัน
        navigateFallbackDenylist: [/^\/articles/, /^\/api/],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        // แยก React เป็น chunk ของตัวเอง — hash ไม่เปลี่ยนตอน deploy เนื้อหา
        // ผู้ใช้เดิมจึงไม่ต้องโหลด React ใหม่ทุกครั้งที่แก้ถ้อยคำ
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
        },
      },
    },
  },
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
    // โหมดเก็บออนไลน์ตอน dev: รัน `npx wrangler pages dev dist --port 8788`
    // คู่กันไว้ แล้ว /api จะถูกส่งต่อไปที่ Pages Functions จำลองในเครื่อง
    proxy: {
      '/api': 'http://127.0.0.1:8788',
    },
  },
  preview: {
    port: process.env.PORT ? Number(process.env.PORT) : 4173,
  },
})
