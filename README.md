# พิใจธรรม (Pijaitham)

เว็บแอปช่วยเขียน **หนังสือแสดงเจตนาเกี่ยวกับการดูแลสุขภาพช่วงท้ายของชีวิต** (Advance Care Planning / Living Will) ตามแนวมาตรา 12 พ.ร.บ.สุขภาพแห่งชาติ พ.ศ. 2550 — ตอบคำถามทีละขั้น แล้วรับเป็นไฟล์ PDF ภาษาไทยพร้อมปริ้นไปลงนามกับพยาน

🌐 **Production:** https://pijaitham.com

## หลักการสูงสุด

**ข้อมูลไม่ออกจากเครื่องผู้ใช้เด็ดขาด** — ไม่มี backend, ไม่มี database, ไม่มี analytics ที่เก็บข้อมูลบุคคล ทุกอย่างประมวลผลในเบราว์เซอร์ 100% (ดูรายละเอียดใน `CLAUDE_2.md`)

## Tech Stack

- React 18 + Vite + TypeScript (strict)
- Tailwind CSS v4
- PDF: `pdf-lib` + `@pdf-lib/fontkit` ฝังฟอนต์ Sarabun (ตัดคำไทยด้วย `Intl.Segmenter`)
- ไม่มี router / state library — React Context เท่านั้น

## โครงสร้างสำคัญ

```
src/content/questions.ts   # คำถามทั้ง 7 ส่วน (single source of truth)
src/content/pdfText.ts     # ข้อความคงที่ใน PDF (หน้าลงนาม ภาคผนวก)
src/lib/pdf/generator.ts   # PDF layout engine
src/lib/draft.ts           # บันทึก/เปิดแบบร่าง .json + validation
public/fonts/              # Sarabun ttf (ฝังลง PDF)
```

## พัฒนา

```bash
npm install
npm run dev        # dev server
npm run build      # type-check + production build → dist/
```

## Deploy

Deploy ขึ้น Cloudflare Pages (project: `acp-booklet`) ด้วย:

```bash
npm run build
npx wrangler pages deploy dist --project-name=acp-booklet --commit-dirty=true
```

โดเมน: pijaitham.com (+ www) ชี้ CNAME → `acp-booklet.pages.dev`

## License

โอเพนซอร์สภายใต้ [MIT License](LICENSE) — นำไปใช้ ปรับแต่ง หรือต่อยอดได้อย่างอิสระ
เช่น โรงพยาบาล มูลนิธิ หรือหน่วยงานที่อยากนำไปให้บริการประชาชน
