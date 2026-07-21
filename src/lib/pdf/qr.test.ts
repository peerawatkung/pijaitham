import jsQR from 'jsqr'
import { describe, expect, it } from 'vitest'
import type { PDFPage } from 'pdf-lib'
import { DOCTORS_URL } from '../../config/app'
import { drawQrCode } from './qr'

interface Rect {
  x: number
  y: number
  width: number
  height: number
}

/**
 * จับสี่เหลี่ยมที่ drawQrCode วาดจริง แล้ว rasterize เป็นบิตแมปให้ jsQR ถอดรหัส
 * — พิสูจน์ว่า QR ที่ลงบนกระดาษสแกนได้และชี้ URL ถูกต้อง (จับบั๊กกลับแกน/กลับด้าน)
 */
function decodeDrawnQr(text: string): string | null {
  const rects: Rect[] = []
  const fakePage = {
    drawRectangle: (opts: Rect) => rects.push(opts),
  } as unknown as PDFPage
  const size = 200
  drawQrCode(fakePage, text, { x: 0, y: 0, size })

  // แปลงพิกัด PDF (y ชี้ขึ้น) เป็นพิกัดภาพ (y ชี้ลง) พร้อม quiet zone ขาวรอบ ๆ
  const margin = 20
  const dim = size + margin * 2
  const data = new Uint8ClampedArray(dim * dim * 4).fill(255)
  for (const r of rects) {
    const x0 = Math.round(margin + r.x)
    const y0 = Math.round(margin + size - r.y - r.height)
    for (let py = y0; py < y0 + Math.round(r.height); py++) {
      for (let px = x0; px < x0 + Math.round(r.width); px++) {
        if (px < 0 || py < 0 || px >= dim || py >= dim) continue
        const i = (py * dim + px) * 4
        data[i] = data[i + 1] = data[i + 2] = 0
      }
    }
  }
  return jsQR(data, dim, dim)?.data ?? null
}

describe('drawQrCode', () => {
  it('QR ที่วาดถอดรหัสกลับได้เป็น URL หน้าสำหรับแพทย์', () => {
    expect(decodeDrawnQr(DOCTORS_URL)).toBe(DOCTORS_URL)
  })
})
