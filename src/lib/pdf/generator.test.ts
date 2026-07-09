import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { SAMPLE_ANSWERS } from '../../content/sampleAnswers'
import { buildFileName, generatePdfBytes } from './generator'
import type { FontBytes } from './generator'

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

describe('generatePdfBytes (smoke test กับฟอนต์จริง)', () => {
  it('ข้ามทุกข้อ (แบบฟอร์มเปล่า) สร้างได้ไม่ error', async () => {
    const bytes = await generatePdfBytes({}, fonts, { blankForm: true })
    expect(isPdf(bytes)).toBe(true)
    expect(bytes.length).toBeGreaterThan(20_000)
  }, 30_000)

  it('เอกสารตัวอย่าง (กรอกครบ) สร้างได้ไม่ error', async () => {
    const bytes = await generatePdfBytes(SAMPLE_ANSWERS, fonts)
    expect(isPdf(bytes)).toBe(true)
    expect(bytes.length).toBeGreaterThan(20_000)
  }, 30_000)

  it('ข้อความยาวมาก (3,000+ ตัวอักษรไทยไม่เว้นวรรค) ตัดหน้าได้ไม่ error', async () => {
    const longText = 'น้ำใจที่สุดของปู่ย่าตายายคือความทรงจำล้ำค่า'.repeat(80)
    const bytes = await generatePdfBytes({ messageToLoved: longText }, fonts)
    expect(isPdf(bytes)).toBe(true)
  }, 30_000)
})

describe('buildFileName', () => {
  const date = new Date(2026, 6, 9)

  it('มีชื่อ: พิใจธรรม-ชื่อ-วันที่.pdf', () => {
    expect(buildFileName({ fullName: 'สมศรี ใจดี' }, date)).toBe(
      'พิใจธรรม-สมศรี-ใจดี-20260709.pdf',
    )
  })

  it('ไม่มีชื่อ: ใช้คำว่า เอกสาร', () => {
    expect(buildFileName({}, date)).toBe('พิใจธรรม-เอกสาร-20260709.pdf')
  })

  it('ติ๊กปริ้นไปเขียนเอง: ไม่ใช้ชื่อที่พิมพ์ไว้ในชื่อไฟล์', () => {
    expect(
      buildFileName({ fullName: 'สมศรี', handwritePersonal: true }, date),
    ).toBe('พิใจธรรม-เอกสาร-20260709.pdf')
  })
})
