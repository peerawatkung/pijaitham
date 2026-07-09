import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { SAMPLE_ANSWERS } from '../../content/sampleAnswers'
import type { FontBytes } from './generator'
import { generateWalletCardBytes } from './walletCardPdf'

/** โหลดฟอนต์จริงจาก public/fonts — ทดสอบ pipeline เดียวกับ production */
function loadFont(name: string): ArrayBuffer {
  const buf = readFileSync(
    fileURLToPath(new URL(`../../../public/fonts/${name}`, import.meta.url)),
  )
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
}

const fonts: FontBytes = {
  regular: loadFont('Sarabun-Regular.ttf'),
  bold: loadFont('Sarabun-Bold.ttf'),
}

function isPdf(bytes: Uint8Array): boolean {
  return String.fromCharCode(...bytes.slice(0, 5)) === '%PDF-'
}

describe('generateWalletCardBytes (smoke test กับฟอนต์จริง)', () => {
  it('กรอกครบ (ข้อมูลตัวอย่าง) สร้างได้ไม่ error', async () => {
    const bytes = await generateWalletCardBytes(SAMPLE_ANSWERS, fonts)
    expect(isPdf(bytes)).toBe(true)
    expect(bytes.length).toBeGreaterThan(10_000)
  }, 30_000)

  it('ไม่กรอกอะไรเลย — ทุกช่องเป็นเส้นจุดให้เขียนเอง สร้างได้ไม่ error', async () => {
    const bytes = await generateWalletCardBytes({}, fonts)
    expect(isPdf(bytes)).toBe(true)
  }, 30_000)

  it('ติ๊กปริ้นไปเขียนเอง: ไม่พิมพ์ชื่อลงการ์ด สร้างได้ไม่ error', async () => {
    const bytes = await generateWalletCardBytes(
      { fullName: 'สมศรี ใจดี', handwritePersonal: true },
      fonts,
    )
    expect(isPdf(bytes)).toBe(true)
  }, 30_000)

  it('ที่เก็บเอกสารยาวมาก — ถูกตัดให้พอดีการ์ด ไม่ error', async () => {
    const bytes = await generateWalletCardBytes(
      {
        documentsLocation:
          'พินัยกรรมและกรมธรรม์ประกันชีวิตทุกฉบับเก็บไว้ในลิ้นชักโต๊ะทำงานชั้นล่างสุดของห้องหนังสือ'.repeat(
            5,
          ),
      },
      fonts,
    )
    expect(isPdf(bytes)).toBe(true)
  }, 30_000)
})
