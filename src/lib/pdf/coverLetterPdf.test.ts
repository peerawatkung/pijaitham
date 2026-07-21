import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { PDFDocument } from 'pdf-lib'
import { describe, expect, it } from 'vitest'
import { SAMPLE_ANSWERS } from '../../content/sampleAnswers'
import type { FontBytes } from './generator'
import { generateCoverLetterBytes } from './coverLetterPdf'

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

describe('generateCoverLetterBytes (smoke test กับฟอนต์จริง)', () => {
  it('กรอกครบ (ข้อมูลตัวอย่าง) สร้างได้ และจดหมายจบใน 1 หน้า', async () => {
    const bytes = await generateCoverLetterBytes(SAMPLE_ANSWERS, fonts)
    expect(isPdf(bytes)).toBe(true)
    expect(bytes.length).toBeGreaterThan(10_000)
    const doc = await PDFDocument.load(bytes)
    expect(doc.getPageCount()).toBe(1)
  }, 30_000)

  it('ไม่กรอกอะไรเลย — ทุกช่องเป็นเส้นจุดให้เขียนเอง จบใน 1 หน้า', async () => {
    const bytes = await generateCoverLetterBytes({}, fonts)
    expect(isPdf(bytes)).toBe(true)
    const doc = await PDFDocument.load(bytes)
    expect(doc.getPageCount()).toBe(1)
  }, 30_000)

  it('ติ๊กปริ้นไปเขียนเอง: ไม่พิมพ์ข้อมูลส่วนตัวลงจดหมาย สร้างได้ไม่ error', async () => {
    const bytes = await generateCoverLetterBytes(
      { fullName: 'สมศรี ใจดี', phone: '0812345678', handwritePersonal: true },
      fonts,
    )
    expect(isPdf(bytes)).toBe(true)
  }, 30_000)
})
