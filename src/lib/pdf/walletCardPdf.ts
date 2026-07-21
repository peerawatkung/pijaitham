/**
 * การ์ดพกกระเป๋า (wallet card) — PDF หน้า A4 ที่มีการ์ดขนาดบัตรเครดิต 2 ใบ
 * ให้ตัดตามเส้นประ พับครึ่ง แล้วเก็บในกระเป๋าเงิน
 * บอกคนพบเห็นยามฉุกเฉินว่า เจ้าของมีหนังสือแสดงเจตนา เก็บไว้ที่ไหน และติดต่อใคร
 */
import fontkit from '@pdf-lib/fontkit'
import { PDFDocument } from 'pdf-lib'
import type { Color, PDFFont, PDFPage } from 'pdf-lib'
import { APP_CONFIG, DOCTORS_URL } from '../../config/app'
import { shareOrDownload, ymd } from '../download'
import { drawQrCode } from './qr'
import type { FormAnswers, PersonAnswer } from '../../types/form'
import {
  COLOR_ACCENT,
  COLOR_INK,
  COLOR_SOFT,
  loadFontBytes,
  wrapText,
} from './generator'
import type { FontBytes } from './generator'

// ---- ขนาด (หน่วย pt) ----
const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const MM = 2.83465
/** ขนาดบัตรเครดิตมาตรฐาน 85.6 × 54 มม. — หนึ่งใบพับครึ่งจากสองแผง */
const PANEL_W = 85.6 * MM
const PANEL_H = 54 * MM
const CARD_W = PANEL_W * 2
const CARD_X = (PAGE_WIDTH - CARD_W) / 2
const PAD = 12
const INNER_W = PANEL_W - PAD * 2

interface Fonts {
  regular: PDFFont
  bold: PDFFont
}

function getText(answers: FormAnswers, id: string): string | null {
  const value = answers[id]
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function getPerson(answers: FormAnswers, id: string): PersonAnswer | null {
  const value = answers[id]
  if (value && typeof value === 'object' && 'name' in value) {
    const person = value as PersonAnswer
    return person.name.trim() ? person : null
  }
  return null
}

/** จำกัดจำนวนบรรทัด — เกินให้ตัดแล้วปิดท้ายด้วย … (พื้นที่การ์ดมีจำกัด) */
function clampLines(lines: string[], max: number): string[] {
  if (lines.length <= max) return lines
  const kept = lines.slice(0, max)
  kept[max - 1] = `${kept[max - 1]}…`
  return kept
}

/** เส้นจุดให้เขียนด้วยปากกา ยาวพอดีความกว้างที่กำหนด */
function dotFill(font: PDFFont, size: number, width: number): string {
  const dotWidth = font.widthOfTextAtSize('.', size)
  return '.'.repeat(Math.max(4, Math.floor(width / dotWidth)))
}

interface TextOptions {
  size: number
  font: PDFFont
  color?: Color
}

/** วาดข้อความบรรทัดเดียว คืนความกว้างที่ใช้ไป */
function draw(
  page: PDFPage,
  text: string,
  x: number,
  baselineY: number,
  opts: TextOptions,
): number {
  page.drawText(text, {
    x,
    y: baselineY,
    size: opts.size,
    font: opts.font,
    color: opts.color ?? COLOR_INK,
  })
  return opts.font.widthOfTextAtSize(text, opts.size)
}

/**
 * วาดคู่ "ป้ายกำกับ: ค่า" — ป้ายตัวหนา ค่าตัวปกติ (ไม่มีค่า = เส้นจุดให้เขียนเอง)
 * ค่าที่ยาวจะถูกตัดขึ้นบรรทัดใหม่ชิดขอบซ้าย คืนตำแหน่ง y บนสุดของบรรทัดถัดไป
 */
function labelValue(
  page: PDFPage,
  fonts: Fonts,
  label: string,
  value: string | null,
  x: number,
  yTop: number,
  size: number,
  maxLines: number,
  width = INNER_W,
): number {
  const lineHeight = size * 1.55
  let y = yTop - size
  const labelWidth = draw(page, label, x, y, { size, font: fonts.bold })
  const valueX = x + labelWidth + 3
  const firstLineWidth = width - labelWidth - 3

  if (!value) {
    draw(page, dotFill(fonts.regular, size, firstLineWidth), valueX, y, {
      size,
      font: fonts.regular,
      color: COLOR_SOFT,
    })
    return yTop - lineHeight
  }

  // บรรทัดแรกอยู่ต่อจากป้าย บรรทัดถัดไปชิดขอบซ้ายเต็มความกว้าง
  const firstLines = wrapText(fonts.regular, value, size, firstLineWidth)
  draw(page, firstLines[0], valueX, y, { size, font: fonts.regular })
  const rest = firstLines.slice(1).join('')
  let used = 1
  if (rest && used < maxLines) {
    const restLines = clampLines(
      wrapText(fonts.regular, rest, size, width),
      maxLines - used,
    )
    for (const line of restLines) {
      y -= lineHeight
      draw(page, line, x, y, { size, font: fonts.regular })
      used++
    }
  }
  return yTop - lineHeight * used
}

/** แผงหน้า (ด้านซ้าย): ประกาศว่ามีหนังสือแสดงเจตนา + ชื่อ + ที่เก็บเอกสาร */
function drawFrontPanel(
  page: PDFPage,
  fonts: Fonts,
  answers: FormAnswers,
  topY: number,
): void {
  const x = CARD_X + PAD
  let y = topY - PAD

  y -= 10.5
  draw(page, 'ข้าพเจ้ามีหนังสือแสดงเจตนา', x, y, {
    size: 10.5,
    font: fonts.bold,
    color: COLOR_ACCENT,
  })
  y -= 11
  draw(page, 'เกี่ยวกับการดูแลสุขภาพช่วงท้ายของชีวิต (Living Will)', x, y, {
    size: 7,
    font: fonts.regular,
    color: COLOR_SOFT,
  })
  y -= 9.5
  draw(page, 'ตามมาตรา 12 พ.ร.บ.สุขภาพแห่งชาติ พ.ศ. 2550', x, y, {
    size: 7,
    font: fonts.regular,
    color: COLOR_SOFT,
  })
  y -= 7

  // ติ๊ก "เขียนข้อมูลส่วนตัวด้วยปากกา" = ไม่พิมพ์ชื่อที่เคยกรอกลงการ์ด
  const ownerName =
    answers['handwritePersonal'] === true ? null : getText(answers, 'fullName')
  y = labelValue(page, fonts, 'ชื่อ:', ownerName, x, y, 8.5, 2)
  y -= 3
  y = labelValue(
    page,
    fonts,
    'เอกสารเก็บไว้ที่:',
    getText(answers, 'documentsLocation'),
    x,
    y,
    8,
    3,
  )
  if (!getText(answers, 'documentsLocation')) {
    // เส้นจุดเพิ่มอีกบรรทัด เผื่อที่เก็บยาว
    y -= 8
    draw(page, dotFill(fonts.regular, 8, INNER_W), x, y, {
      size: 8,
      font: fonts.regular,
      color: COLOR_SOFT,
    })
  }

  draw(
    page,
    `${APP_CONFIG.name} · ${APP_CONFIG.domain}`,
    x,
    topY - PANEL_H + 8,
    { size: 6.5, font: fonts.regular, color: COLOR_SOFT },
  )
}

/** แผงหลัง (ด้านขวา): ผู้ตัดสินใจแทนพร้อมเบอร์ติดต่อ */
function drawBackPanel(
  page: PDFPage,
  fonts: Fonts,
  answers: FormAnswers,
  topY: number,
): void {
  const x = CARD_X + PANEL_W + PAD
  let y = topY - PAD

  y -= 9.5
  draw(page, 'ยามฉุกเฉิน โปรดติดต่อผู้ตัดสินใจแทน', x, y, {
    size: 9.5,
    font: fonts.bold,
    color: COLOR_ACCENT,
  })
  y -= 8

  for (const [i, id] of (['proxy1', 'proxy2'] as const).entries()) {
    const person = getPerson(answers, id)
    const nameText = person
      ? `${person.name}${person.relation.trim() ? ` (${person.relation.trim()})` : ''}`
      : null
    y = labelValue(page, fonts, `${i + 1}.`, nameText, x, y, 8.5, 1)
    const phones = person
      ? [person.phone.trim(), person.phone2.trim()].filter(Boolean).join(' / ')
      : null
    y = labelValue(page, fonts, 'โทร', phones, x + 12, y, 8.5, 1, INNER_W - 12)
    y -= 5
  }

  // QR มุมล่างขวา ชี้ไปหน้าคำอธิบายสำหรับแพทย์ — ผู้พบการ์ดเข้าใจเอกสารได้ทันที
  const qrSize = 34
  drawQrCode(page, DOCTORS_URL, {
    x: CARD_X + PANEL_W * 2 - PAD - qrSize,
    y: topY - PANEL_H + 10,
    size: qrSize,
  })
  draw(
    page,
    'รายละเอียดทั้งหมดอยู่ในหนังสือแสดงเจตนาฉบับเต็ม',
    x,
    topY - PANEL_H + 18,
    { size: 6.5, font: fonts.regular, color: COLOR_SOFT },
  )
  draw(page, 'แพทย์/ผู้พบเห็น: สแกนดูคำอธิบายเอกสาร', x, topY - PANEL_H + 8, {
    size: 6.5,
    font: fonts.regular,
    color: COLOR_SOFT,
  })
}

/** การ์ดหนึ่งใบ: กรอบเส้นประสำหรับตัด + เส้นพับกลาง + สองแผง */
function drawCard(
  page: PDFPage,
  fonts: Fonts,
  answers: FormAnswers,
  topY: number,
): void {
  page.drawRectangle({
    x: CARD_X,
    y: topY - PANEL_H,
    width: CARD_W,
    height: PANEL_H,
    borderColor: COLOR_SOFT,
    borderWidth: 0.8,
    borderDashArray: [4, 3],
  })
  page.drawLine({
    start: { x: CARD_X + PANEL_W, y: topY },
    end: { x: CARD_X + PANEL_W, y: topY - PANEL_H },
    thickness: 0.5,
    color: COLOR_SOFT,
    opacity: 0.55,
    dashArray: [2, 3],
  })
  drawFrontPanel(page, fonts, answers, topY)
  drawBackPanel(page, fonts, answers, topY)
}

/** วาดข้อความหลายบรรทัดจัดกลางหน้า คืนตำแหน่ง y บนสุดของบรรทัดถัดไป */
function centeredParagraph(
  page: PDFPage,
  text: string,
  yTop: number,
  opts: TextOptions,
): number {
  const lineHeight = opts.size * 1.65
  let y = yTop
  for (const line of wrapText(opts.font, text, opts.size, PAGE_WIDTH - 112)) {
    const w = opts.font.widthOfTextAtSize(line, opts.size)
    draw(page, line, (PAGE_WIDTH - w) / 2, y - opts.size, opts)
    y -= lineHeight
  }
  return y
}

/** สร้าง PDF การ์ดพกกระเป๋า — แยกจากส่วนดาวน์โหลดเพื่อให้ทดสอบได้โดยไม่ใช้ browser API */
export async function generateWalletCardBytes(
  answers: FormAnswers,
  fontBytes: FontBytes,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.registerFontkit(fontkit)
  const regular = await doc.embedFont(fontBytes.regular, { subset: true })
  const bold = await doc.embedFont(fontBytes.bold, { subset: true })
  doc.setTitle(`การ์ดพกกระเป๋า — ${APP_CONFIG.name}`)
  doc.setLanguage('th')

  const fonts: Fonts = { regular, bold }
  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])

  let y = PAGE_HEIGHT - 64
  y = centeredParagraph(page, 'การ์ดพกกระเป๋า', y, {
    size: 17,
    font: bold,
    color: COLOR_ACCENT,
  })
  y -= 4
  y = centeredParagraph(
    page,
    'การ์ดขนาดบัตร บอกคนพบเห็นยามฉุกเฉินว่าคุณมีหนังสือแสดงเจตนา เก็บไว้ที่ไหน และติดต่อใคร',
    y,
    { size: 10.5, font: regular, color: COLOR_SOFT },
  )
  y -= 10
  y = centeredParagraph(
    page,
    'วิธีใช้: 1) ปริ้นหน้านี้  2) ตัดตามกรอบเส้นประ  3) พับครึ่งตามเส้นกลาง ให้ตัวหนังสืออยู่ด้านนอก',
    y,
    { size: 10, font: regular, color: COLOR_INK },
  )
  y = centeredParagraph(
    page,
    '4) เก็บในช่องบัตรของกระเป๋าเงิน — มีให้ 2 ใบ อีกใบฝากคนใกล้ชิดไว้ได้',
    y,
    { size: 10, font: regular, color: COLOR_INK },
  )

  y -= 22
  drawCard(page, fonts, answers, y)
  y -= PANEL_H + 26
  drawCard(page, fonts, answers, y)
  y -= PANEL_H + 24

  centeredParagraph(
    page,
    `เมื่อข้อมูลเปลี่ยน สร้างการ์ดใหม่ได้ฟรีที่ ${APP_CONFIG.domain}`,
    y,
    { size: 9, font: regular, color: COLOR_SOFT },
  )

  return doc.save()
}

/** สร้างและดาวน์โหลดการ์ดพกกระเป๋าในเบราว์เซอร์ */
export async function downloadWalletCardPdf(
  answers: FormAnswers,
): Promise<void> {
  const fontBytes = await loadFontBytes()
  const bytes = await generateWalletCardBytes(answers, fontBytes)
  const blob = new Blob([bytes], { type: 'application/pdf' })
  await shareOrDownload(
    blob,
    `${APP_CONFIG.fileSlug}-การ์ดพกกระเป๋า-${ymd()}.pdf`,
  )
}
