# พิใจธรรม (Pijaitham)

เว็บแอปช่วยเขียน **หนังสือแสดงเจตนาเกี่ยวกับการดูแลสุขภาพช่วงท้ายของชีวิต** (Advance Care Planning / Living Will) ตามแนวมาตรา 12 พ.ร.บ.สุขภาพแห่งชาติ พ.ศ. 2550 — ตอบคำถามทีละขั้น แล้วเลือกเก็บเอกสารได้ 2 แบบ:

1. **แบบกระดาษ** — ดาวน์โหลด PDF ภาษาไทยลงเครื่อง พิมพ์ไปลงนามกับพยาน
2. **แบบอิเล็กทรอนิกส์** — เก็บบนเซิร์ฟเวอร์แบบเข้ารหัส end-to-end เปิดจากเครื่องไหนก็ได้ด้วย "อีเมล + รหัสผ่าน"

🌐 **Production:** https://pijaitham.com

## หลักการสูงสุด

**ไม่มีใครอ่านเนื้อหาของผู้ใช้ได้นอกจากผู้ใช้เอง** — ค่าเริ่มต้นทุกอย่างประมวลผลในเบราว์เซอร์ 100% ไม่ส่งข้อมูลออกไปที่ใด ส่วนโหมดเก็บออนไลน์ (opt-in เท่านั้น) เอกสารถูกเข้ารหัส AES-256-GCM ในเครื่องผู้ใช้ก่อนส่งขึ้นเซิร์ฟเวอร์ — เซิร์ฟเวอร์เก็บเฉพาะ ciphertext ไม่รู้รหัสผ่านและถอดรหัสไม่ได้ (ดูรายละเอียดใน `CLAUDE_2.md`)

## Tech Stack

- React 18 + Vite + TypeScript (strict)
- Tailwind CSS v4
- PDF: `pdf-lib` + `@pdf-lib/fontkit` ฝังฟอนต์ Sarabun (ตัดคำไทยด้วย `Intl.Segmenter`)
- ไม่มี router / state library — React Context เท่านั้น

## โครงสร้างสำคัญ

```
src/content/questions.ts   # คำถามทั้ง 8 ส่วน รวมชื่อพยาน (single source of truth)
src/content/pdfText.ts     # ข้อความคงที่ใน PDF (หน้าลงนาม ภาคผนวก)
src/lib/pdf/generator.ts   # PDF layout engine
src/lib/draft.ts           # schema + validation ของแบบร่าง (ใช้โดย autosave และโหมดออนไลน์)
src/lib/e2ee.ts            # เข้ารหัส E2E ฝั่ง client (PBKDF2 + AES-256-GCM)
src/lib/cloudDoc.ts        # client โหมดเก็บออนไลน์ (บันทึก/เปิด/เขียนทับ/ลบ)
functions/api/             # Cloudflare Pages Functions — เก็บ ciphertext ลง KV
public/fonts/              # Sarabun ttf (ฝังลง PDF)
```

## พัฒนา

```bash
npm install
npm run dev        # dev server
npm run build      # type-check + production build → dist/
```

## Deploy

Deploy ขึ้น Cloudflare Pages (project: `acp-booklet`, ตั้งค่าใน `wrangler.toml`) ด้วย:

```bash
npm run build
npx wrangler pages deploy --project-name=acp-booklet --commit-dirty=true
```

โดเมน: pijaitham.com (+ www) ชี้ CNAME → `acp-booklet.pages.dev`

### เปิดใช้โหมด "เก็บออนไลน์" (ครั้งแรกครั้งเดียว)

โหมดเก็บออนไลน์ใช้ Cloudflare KV เก็บ ciphertext — ต้องสร้าง namespace แล้วผูกกับโปรเจกต์ก่อน:

```bash
npx wrangler kv namespace create DOCS
```

นำค่า `id` ที่ได้ไปใส่แทน `REPLACE_WITH_KV_NAMESPACE_ID` ใน `wrangler.toml` แล้ว deploy ตามปกติ
ถ้ายังไม่ผูก KV เว็บส่วนอื่นทำงานปกติ — เฉพาะปุ่มเก็บออนไลน์จะแจ้งว่ายังไม่เปิดใช้งาน

ทดสอบโหมดออนไลน์ในเครื่อง (KV จำลอง ไม่แตะของจริง):

```bash
npm run build
npx wrangler pages dev dist
```

## License

โอเพนซอร์สภายใต้ [MIT License](LICENSE) — นำไปใช้ ปรับแต่ง หรือต่อยอดได้อย่างอิสระ
เช่น โรงพยาบาล มูลนิธิ หรือหน่วยงานที่อยากนำไปให้บริการประชาชน
