/**
 * วาด QR code ลงหน้า PDF เป็นสี่เหลี่ยม vector — คมชัดทุกขนาดพิมพ์ ไม่ต้องฝังรูป
 * ใช้ชี้ไปหน้า "สำหรับแพทย์และบุคลากร" (pijaitham.com/doctors) บนเอกสารต่าง ๆ
 */
import qrcode from 'qrcode-generator'
import { rgb } from 'pdf-lib'
import type { Color, PDFPage } from 'pdf-lib'

interface QrOptions {
  /** มุมล่างซ้ายของ QR ในพิกัดหน้า PDF */
  x: number
  y: number
  /** ความกว้าง = ความสูง (pt) — ควรเผื่อพื้นที่ว่างสีขาวรอบ ๆ อย่างน้อย 2 ช่องโมดูล */
  size: number
  color?: Color
}

export function drawQrCode(page: PDFPage, text: string, opts: QrOptions): void {
  // error correction ระดับ M ทนรอยพับ/สึกจากการพกในกระเป๋าได้ดีกว่า L
  const qr = qrcode(0, 'M')
  qr.addData(text)
  qr.make()

  const count = qr.getModuleCount()
  const cell = opts.size / count
  const color = opts.color ?? rgb(0.13, 0.17, 0.15)
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (!qr.isDark(row, col)) continue
      page.drawRectangle({
        x: opts.x + col * cell,
        // แถวบนสุดของ QR อยู่บนสุดของพื้นที่ (แกน y ของ PDF ชี้ขึ้น)
        y: opts.y + (count - 1 - row) * cell,
        // เผื่อขอบเล็กน้อยกันเส้นขาวบาง ๆ ระหว่างช่องในบางโปรแกรมอ่าน PDF
        width: cell + 0.15,
        height: cell + 0.15,
        color,
      })
    }
  }
}
