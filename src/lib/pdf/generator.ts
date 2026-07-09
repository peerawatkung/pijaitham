import fontkit from '@pdf-lib/fontkit'
import { PDFDocument, rgb } from 'pdf-lib'
import type { Color, PDFFont, PDFPage } from 'pdf-lib'
import { APP_CONFIG } from '../../config/app'
import { SECTIONS } from '../../content/questions'
import { PDF_TEXT } from '../../content/pdfText'
import { safeFileSlug, shareOrDownload, ymd } from '../download'
import { formatAnswer } from '../formatAnswer'
import type { FormAnswers, PersonAnswer } from '../../types/form'

// ---- ขนาดหน้าและระยะขอบ (หน่วย pt) — A4 พร้อมปริ้น ----
export const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
export const MARGIN_X = 56
const MARGIN_TOP = 60
const MARGIN_BOTTOM = 72
export const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2

// อักษรไทยมีสระบน-ล่างและวรรณยุกต์ซ้อน ต้องเผื่อระยะบรรทัดมากกว่าละติน
const LINE_SPACING = 1.65

export const COLOR_INK = rgb(0.13, 0.17, 0.15)
export const COLOR_SOFT = rgb(0.38, 0.43, 0.4)
export const COLOR_ACCENT = rgb(0.24, 0.36, 0.27)
const COLOR_LINE = rgb(0.68, 0.74, 0.69)
const COLOR_BOX_FILL = rgb(0.93, 0.95, 0.91)

/** สระ/วรรณยุกต์ไทยที่เกาะตัวหน้า — ห้ามขึ้นบรรทัดใหม่ด้วยอักขระเหล่านี้ */
const THAI_COMBINING = /[ัิ-ฺ็-๎]/

/** ตัดคำไทยด้วย Intl.Segmenter (ไทยไม่มีช่องว่างระหว่างคำ) */
const segmenter =
  typeof Intl !== 'undefined' && 'Segmenter' in Intl
    ? new Intl.Segmenter('th', { granularity: 'word' })
    : null

function segmentWords(text: string): string[] {
  if (segmenter) {
    return Array.from(segmenter.segment(text), (s) => s.segment)
  }
  return text.split(/(\s+)/).filter((s) => s !== '')
}

export interface FontBytes {
  regular: ArrayBuffer
  bold: ArrayBuffer
}

interface ParagraphOptions {
  size?: number
  bold?: boolean
  color?: Color
  /** ตำแหน่ง x เริ่มต้น (default = ขอบซ้าย) */
  x?: number
  maxWidth?: number
  spaceAfter?: number
  align?: 'left' | 'center'
}

/** layout engine ง่าย ๆ: เดิน cursor จากบนลงล่าง ขึ้นหน้าใหม่อัตโนมัติ */
export class PdfWriter {
  readonly doc: PDFDocument
  private readonly regular: PDFFont
  private readonly bold: PDFFont
  page!: PDFPage
  /** ตำแหน่งขอบบนของบรรทัดถัดไป (นับจากล่างของหน้า ตามระบบพิกัด PDF) */
  y = 0

  constructor(doc: PDFDocument, regular: PDFFont, bold: PDFFont) {
    this.doc = doc
    this.regular = regular
    this.bold = bold
    this.newPage()
  }

  newPage(): void {
    this.page = this.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    this.y = PAGE_HEIGHT - MARGIN_TOP
  }

  /** ถ้าพื้นที่เหลือไม่พอ ให้ขึ้นหน้าใหม่ */
  ensure(height: number): void {
    if (this.y - height < MARGIN_BOTTOM) this.newPage()
  }

  font(bold: boolean): PDFFont {
    return bold ? this.bold : this.regular
  }

  moveDown(pts: number): void {
    this.y -= pts
  }

  /** ตัดข้อความหนึ่งย่อหน้าเป็นบรรทัดตามความกว้าง (ตัดตามขอบเขตคำไทย) */
  wrap(text: string, size: number, bold: boolean, maxWidth: number): string[] {
    const font = this.font(bold)
    const width = (s: string) => font.widthOfTextAtSize(s, size)
    const lines: string[] = []
    let current = ''

    const pushCurrent = () => {
      if (current.trimEnd()) lines.push(current.trimEnd())
      current = ''
    }

    for (const seg of segmentWords(text)) {
      if (width(current + seg) <= maxWidth) {
        current += seg
        continue
      }
      pushCurrent()
      if (/^\s+$/.test(seg)) continue // ไม่ขึ้นบรรทัดใหม่ด้วยช่องว่าง
      if (width(seg) <= maxWidth) {
        current = seg
        continue
      }
      // คำเดียวยาวเกินบรรทัด (เช่น ข้อความไม่มีช่องว่างเลย) — ตัดทีละอักขระ
      // โดยไม่แยกสระ/วรรณยุกต์ออกจากตัวที่มันเกาะ
      for (const ch of Array.from(seg)) {
        if (
          width(current + ch) > maxWidth &&
          current &&
          !THAI_COMBINING.test(ch)
        ) {
          lines.push(current)
          current = ''
        }
        current += ch
      }
    }
    pushCurrent()
    return lines.length > 0 ? lines : ['']
  }

  paragraph(text: string, opts: ParagraphOptions = {}): void {
    const {
      size = 11.5,
      bold = false,
      color = COLOR_INK,
      x = MARGIN_X,
      maxWidth = PAGE_WIDTH - MARGIN_X - x,
      spaceAfter = 6,
      align = 'left',
    } = opts
    const font = this.font(bold)
    const lineHeight = size * LINE_SPACING

    for (const para of text.split('\n')) {
      const lines = this.wrap(para, size, bold, maxWidth)
      for (const line of lines) {
        this.ensure(lineHeight)
        if (line) {
          const lineX =
            align === 'center'
              ? x + (maxWidth - font.widthOfTextAtSize(line, size)) / 2
              : x
          this.page.drawText(line, {
            x: lineX,
            y: this.y - size,
            size,
            font,
            color,
          })
        }
        this.y -= lineHeight
      }
    }
    this.y -= spaceAfter
  }

  /** หัวข้อส่วน พร้อมเส้นคั่นใต้หัวข้อ */
  sectionHeading(text: string): void {
    // เผื่อพื้นที่หัวข้อ + อย่างน้อยหนึ่งคำถาม ไม่ให้หัวข้อค้างท้ายหน้า
    this.ensure(110)
    this.paragraph(text, {
      size: 15,
      bold: true,
      color: COLOR_ACCENT,
      spaceAfter: 3,
    })
    this.page.drawLine({
      start: { x: MARGIN_X, y: this.y },
      end: { x: PAGE_WIDTH - MARGIN_X, y: this.y },
      thickness: 1,
      color: COLOR_LINE,
    })
    this.y -= 16
  }

  subheading(text: string): void {
    this.ensure(60)
    this.paragraph(text, { size: 12.5, bold: true, spaceAfter: 4 })
  }

  /** คำถาม (ตัวหนา) */
  fieldLabel(label: string): void {
    this.ensure(44)
    this.paragraph(label, { size: 11, bold: true, spaceAfter: 2 })
  }

  /** คำตอบที่พิมพ์จากเว็บ */
  answerText(text: string): void {
    this.paragraph(text, { size: 11.5, x: MARGIN_X + 14, spaceAfter: 12 })
  }

  /** เส้นประเว้นว่างให้เขียนด้วยปากกา (ใส่ label นำหน้าได้ เช่น "ชื่อ-นามสกุล") */
  writeLine(prefix = ''): void {
    // เว้นช่องว่างเหนือเส้นให้พอเขียนตัวหนังสือด้วยมือ (~1 ซม.)
    this.moveDown(12)
    const text = this.dotted(prefix ? `${prefix} ` : '', '', CONTENT_WIDTH - 14)
    this.paragraph(text, { x: MARGIN_X + 14, spaceAfter: 4 })
  }

  /** แถวช่องติ๊กสำหรับกาด้วยปากกา (หรือพิมพ์เครื่องหมายถูกเมื่อตอบจากเว็บ) */
  checkboxRow(
    label: string,
    opts: {
      checked?: boolean
      /** ต่อท้ายด้วยเส้นประให้เขียน เช่น "ลงทะเบียนไว้กับ" (ค่าว่าง = เส้นประอย่างเดียว) */
      detailLabel?: string
      x?: number
      bold?: boolean
    } = {},
  ): void {
    const size = 11.5
    const x = opts.x ?? MARGIN_X + 14
    this.ensure(size * LINE_SPACING + 4)
    const box = 10
    const baseline = this.y - size
    this.page.drawRectangle({
      x,
      y: baseline - 1,
      width: box,
      height: box,
      borderColor: COLOR_INK,
      borderWidth: 0.9,
    })
    if (opts.checked) {
      this.page.drawLine({
        start: { x: x + 2, y: baseline + 3.5 },
        end: { x: x + 4, y: baseline + 1 },
        thickness: 1.2,
        color: COLOR_INK,
      })
      this.page.drawLine({
        start: { x: x + 4, y: baseline + 1 },
        end: { x: x + 8, y: baseline + 7.5 },
        thickness: 1.2,
        color: COLOR_INK,
      })
    }
    const textX = x + box + 7
    let text = label
    if (opts.detailLabel !== undefined) {
      const prefix = opts.detailLabel
        ? `${label}  ${opts.detailLabel} `
        : `${label} `
      text = this.dotted(prefix, '', PAGE_WIDTH - MARGIN_X - textX, size)
    }
    this.paragraph(text, { x: textX, size, bold: opts.bold, spaceAfter: 4 })
  }

  /** กล่องเน้นข้อความสำคัญ (เงื่อนไขนำส่วนที่ 3) — วาดทั้งกล่องในหน้าเดียว */
  calloutBox(title: string, body: string): void {
    const size = 11.5
    const pad = 14
    const innerX = MARGIN_X + pad
    const innerWidth = CONTENT_WIDTH - pad * 2
    const lineHeight = size * LINE_SPACING
    const titleLines = this.wrap(title, size, true, innerWidth)
    const bodyLines = this.wrap(body, size, true, innerWidth)
    const height =
      pad * 2 + (titleLines.length + bodyLines.length) * lineHeight + 4
    this.ensure(height + 8)

    const top = this.y
    this.page.drawRectangle({
      x: MARGIN_X,
      y: top - height,
      width: CONTENT_WIDTH,
      height,
      color: COLOR_BOX_FILL,
      borderColor: COLOR_ACCENT,
      borderWidth: 1.2,
    })
    let textY = top - pad
    const drawBoxLine = (line: string, color: Color) => {
      if (line) {
        this.page.drawText(line, {
          x: innerX,
          y: textY - size,
          size,
          font: this.bold,
          color,
        })
      }
      textY -= lineHeight
    }
    for (const line of titleLines) drawBoxLine(line, COLOR_ACCENT)
    textY -= 4
    for (const line of bodyLines) drawBoxLine(line, COLOR_INK)
    this.y = top - height - 14
  }

  /** สร้างบรรทัดจุดไข่ปลาให้พอดีความกว้างที่กำหนด */
  dotted(prefix: string, suffix: string, totalWidth: number, size = 11.5): string {
    const width = (s: string) => this.regular.widthOfTextAtSize(s, size)
    const dotW = width('.')
    const remaining = totalWidth - width(prefix + suffix)
    const count = Math.max(10, Math.floor(remaining / dotW))
    return `${prefix}${'.'.repeat(count)}${suffix}`
  }

  /** บล็อกลงนาม: เส้นเซ็น + ชื่อตัวบรรจง + วันที่ (+ ความสัมพันธ์สำหรับพยาน) */
  signatureBlock(
    role: string,
    opts: { printedName?: string; withRelation?: boolean } = {},
  ): void {
    const size = 11.5
    const x = MARGIN_X + 16
    const lineHeight = size * LINE_SPACING
    // เว้นช่องเหนือเส้นให้เขียนด้วยมือได้ แต่กระชับพอให้ส่วนลงนามจบหน้าเดียว
    const GAP = 7
    const rows = opts.withRelation ? 4 : 3
    const blockHeight = 6 + (lineHeight + GAP) * rows + lineHeight + 10
    this.ensure(blockHeight)

    // ช่องว่างเหนือเส้นเซ็น ให้ลายเซ็นไม่ชนข้อความก่อนหน้า
    this.moveDown(6)
    this.paragraph(this.dotted('ลงชื่อ ', ` ${role}`, CONTENT_WIDTH - 32, size), {
      x,
      spaceAfter: GAP,
    })
    const nameText = opts.printedName
      ? `( ${opts.printedName} )`
      : `( ${'.'.repeat(52)} )`
    this.paragraph(`${nameText}  ${PDF_TEXT.signing.printedNameHint}`, {
      x: x + 28,
      size: opts.printedName ? size : 10.5,
      color: COLOR_SOFT,
      spaceAfter: GAP,
    })
    if (opts.withRelation) {
      this.paragraph(
        this.dotted(`${PDF_TEXT.signing.relationLabel} `, '', 300, size),
        { x: x + 28, spaceAfter: GAP },
      )
    }
    this.paragraph(
      'วันที่ ................ เดือน ............................ พ.ศ. ................',
      { x: x + 28, spaceAfter: 10 },
    )
  }
}

/** วันที่แบบไทย พ.ศ. เช่น "8 กรกฎาคม 2569" */
function thaiDate(date: Date): string {
  try {
    return new Intl.DateTimeFormat('th-TH-u-ca-buddhist', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date)
  } catch {
    return date.toLocaleDateString('th-TH')
  }
}

function getOwnerName(answers: FormAnswers): string | null {
  const name = answers['fullName']
  return typeof name === 'string' && name.trim() ? name.trim() : null
}

function getPerson(answers: FormAnswers, id: string): PersonAnswer | null {
  const value = answers[id]
  if (value && typeof value === 'object' && 'name' in value) {
    return value as PersonAnswer
  }
  return null
}

/** Footer ทุกหน้า: ชื่อเจ้าของเอกสาร (ซ้าย) + เลขหน้า X/Y (ขวา) — กันหน้ากระดาษปะปน */
function drawFooters(
  doc: PDFDocument,
  font: PDFFont,
  ownerName: string | null,
): void {
  const pages = doc.getPages()
  const size = 9
  const label = ownerName
    ? `เอกสารแสดงเจตนาของ ${ownerName}`
    : APP_CONFIG.documentTitle
  pages.forEach((page, i) => {
    page.drawText(label, { x: MARGIN_X, y: 38, size, font, color: COLOR_SOFT })
    const pageText = `หน้า ${i + 1} / ${pages.length}`
    page.drawText(pageText, {
      x: PAGE_WIDTH - MARGIN_X - font.widthOfTextAtSize(pageText, size),
      y: 38,
      size,
      font,
      color: COLOR_SOFT,
    })
  })
}

export interface GeneratePdfOptions {
  createdAt?: Date
  /** แบบฟอร์มเปล่าสำหรับเขียนด้วยมือทั้งฉบับ — วันที่จัดทำเว้นเป็นเส้นให้เขียนด้วย */
  blankForm?: boolean
  /** โลโก้ (PNG พื้นโปร่งใส) แสดงบนหน้าปก — เว้นได้ เอกสารยังสมบูรณ์ */
  logoPng?: ArrayBuffer
}

/**
 * สร้าง PDF จากคำตอบ — pure function ไม่แตะ DOM (ทดสอบได้ทุก environment)
 * ผู้เรียกส่งไฟล์ฟอนต์เข้ามาเอง
 * ข้อที่ไม่ได้ตอบจะเว้นเป็นเส้นประ/ช่องติ๊กว่าง ให้เขียนต่อด้วยปากกาได้
 */
export async function generatePdfBytes(
  answers: FormAnswers,
  fontBytes: FontBytes,
  opts: GeneratePdfOptions = {},
): Promise<Uint8Array> {
  const createdAt = opts.createdAt ?? new Date()
  const doc = await PDFDocument.create()
  doc.registerFontkit(fontkit)
  const regular = await doc.embedFont(fontBytes.regular, { subset: true })
  const bold = await doc.embedFont(fontBytes.bold, { subset: true })

  // ติ๊ก "ปริ้นไปเขียนเอง" = ไม่พิมพ์ข้อมูลส่วนตัวลงเอกสาร แม้เคยพิมพ์ค่าไว้ก็ตาม
  const handwritePersonal = answers['handwritePersonal'] === true
  const ownerName = handwritePersonal ? null : getOwnerName(answers)
  doc.setTitle(APP_CONFIG.documentTitle)
  if (ownerName) doc.setAuthor(ownerName)
  doc.setLanguage('th')

  const w = new PdfWriter(doc, regular, bold)

  // ---- หน้าปก ----
  if (opts.logoPng) {
    const logoImage = await doc.embedPng(opts.logoPng)
    const logoSize = 175
    w.page.drawImage(logoImage, {
      x: (PAGE_WIDTH - logoSize) / 2,
      y: PAGE_HEIGHT - 85 - logoSize,
      width: logoSize,
      height: logoSize,
    })
  }
  w.y = PAGE_HEIGHT - 300
  w.paragraph(PDF_TEXT.cover.titleLines, {
    size: 21,
    bold: true,
    align: 'center',
    color: COLOR_ACCENT,
    spaceAfter: 10,
  })
  w.paragraph(PDF_TEXT.cover.subtitle, {
    size: 12,
    align: 'center',
    color: COLOR_SOFT,
    spaceAfter: 28,
  })
  // เส้นประดับสั้นกลางหน้า คั่นชื่อเอกสารกับส่วนเจ้าของ
  w.page.drawLine({
    start: { x: (PAGE_WIDTH - 70) / 2, y: w.y },
    end: { x: (PAGE_WIDTH + 70) / 2, y: w.y },
    thickness: 1,
    color: COLOR_LINE,
  })
  w.moveDown(42)
  w.paragraph(PDF_TEXT.cover.ofOwner, {
    size: 13,
    align: 'center',
    color: COLOR_SOFT,
    spaceAfter: ownerName ? 8 : 24, // เว้นที่เหนือเส้นให้พอเขียนชื่อด้วยมือ
  })
  if (ownerName) {
    w.paragraph(ownerName, {
      size: 18,
      bold: true,
      align: 'center',
      spaceAfter: 40,
    })
  } else {
    // เส้นว่างให้เขียนชื่อด้วยปากกา
    w.paragraph(w.dotted('', '', 280, 14), {
      size: 14,
      align: 'center',
      spaceAfter: 40,
    })
  }
  if (opts.blankForm) {
    w.paragraph(w.dotted(`${PDF_TEXT.cover.createdOn}วันที่ `, '', 250, 12), {
      size: 12,
      align: 'center',
      color: COLOR_SOFT,
    })
  } else {
    w.paragraph(`${PDF_TEXT.cover.createdOn} ${thaiDate(createdAt)}`, {
      size: 12,
      align: 'center',
      color: COLOR_SOFT,
    })
  }
  // หมายเหตุท้ายหน้าปก — เส้นสั้นคั่นด้านบนให้ดูเรียบร้อย
  w.y = 132
  w.page.drawLine({
    start: { x: (PAGE_WIDTH - 40) / 2, y: w.y },
    end: { x: (PAGE_WIDTH + 40) / 2, y: w.y },
    thickness: 0.8,
    color: COLOR_LINE,
  })
  w.moveDown(16)
  w.paragraph(PDF_TEXT.cover.note, {
    size: 9,
    align: 'center',
    color: COLOR_SOFT,
  })

  // ---- เนื้อหา 7 ส่วน — แต่ละส่วนขึ้นหน้าใหม่เสมอ ----
  for (const section of SECTIONS) {
    w.newPage()
    w.sectionHeading(`ส่วนที่ ${section.number}: ${section.title}`)
    if (section.preamble) {
      w.calloutBox(PDF_TEXT.section3.preambleTitle, section.preamble)
    }
    for (const field of section.fields) {
      if (field.webOnly) continue
      const forcedBlank =
        field.hiddenWhenChecked !== undefined &&
        answers[field.hiddenWhenChecked] === true
      const text = forcedBlank
        ? null
        : formatAnswer(field, answers[field.id])

      // checkbox แสดงเป็นช่องติ๊ก: ตอบจากเว็บ = กาให้, ไม่ตอบ = ช่องว่างให้กาด้วยปากกา
      if (field.type === 'checkbox') {
        w.ensure(30)
        w.checkboxRow(field.label, {
          checked: text !== null,
          bold: true,
          x: MARGIN_X,
        })
        w.moveDown(10)
        continue
      }

      if (text !== null) {
        w.fieldLabel(field.label)
        w.answerText(text)
        continue
      }
      // ไม่ได้ตอบ — เว้นว่างให้เขียนด้วยปากกา
      // แบบฟอร์มเปล่าพิมพ์ hint ตัวเล็กใต้คำถาม ช่วยคนกรอกด้วยมือ
      const showHint = opts.blankForm === true && Boolean(field.hint)
      // จองพื้นที่ทั้งบล็อกก่อนวาด กันคำถามกับช่องติ๊ก/เส้นเขียนถูกตัดข้ามหน้า
      const LABEL_H = 22
      const ROW_H = 23 // checkboxRow หนึ่งแถว
      const LINE_H = 35 // writeLine หนึ่งเส้น (รวมช่องว่างเหนือเส้น)
      let blockHeight = LABEL_H + (showHint ? 32 : 0)
      switch (field.type) {
        case 'text':
          blockHeight += LINE_H
          break
        case 'textarea':
          blockHeight += Math.min(Math.max(field.rows ?? 3, 2), 6) * LINE_H
          break
        case 'choice':
        case 'multichoice':
          blockHeight +=
            (field.options.length +
              (field.type === 'multichoice' && field.allowOther ? 1 : 0)) *
            ROW_H
          break
        case 'person':
          blockHeight += 7 * LINE_H
          break
      }
      // กันกรณีบล็อกสูงเกินหน้ากระดาษ (ไม่มีเคสจริงในปัจจุบัน)
      w.ensure(Math.min(blockHeight, 600))

      w.fieldLabel(field.label)
      if (showHint && field.hint) {
        w.paragraph(field.hint, {
          size: 8.5,
          color: COLOR_SOFT,
          x: MARGIN_X + 14,
          spaceAfter: 3,
        })
      }
      switch (field.type) {
        case 'text':
          w.writeLine()
          w.moveDown(5)
          break
        case 'textarea': {
          const lines = Math.min(Math.max(field.rows ?? 3, 2), 6)
          for (let i = 0; i < lines; i++) w.writeLine()
          w.moveDown(5)
          break
        }
        case 'choice':
        case 'multichoice':
          for (const option of field.options) {
            w.checkboxRow(option.label, {
              detailLabel: option.detail?.label,
            })
          }
          if (field.type === 'multichoice' && field.allowOther) {
            w.checkboxRow('อื่น ๆ', { detailLabel: '' })
          }
          w.moveDown(10)
          break
        case 'person':
          w.writeLine('ชื่อ-นามสกุล')
          w.writeLine('ความสัมพันธ์')
          w.writeLine('เบอร์ติดต่อ')
          w.writeLine('เบอร์ติดต่อสำรอง')
          w.writeLine('LINE ID')
          w.writeLine('Facebook / อีเมล')
          w.writeLine('ช่องทางอื่น ๆ')
          w.moveDown(5)
          break
      }
    }
    if (section.footnote) {
      w.paragraph(`${PDF_TEXT.section3.footnotePrefix}${section.footnote}`, {
        size: 10.5,
        color: COLOR_SOFT,
        spaceAfter: 10,
      })
    }
    w.moveDown(8)
  }

  // ---- ส่วนที่ 8: การลงนาม (ขึ้นหน้าใหม่เสมอ) ----
  w.newPage()
  w.sectionHeading(PDF_TEXT.signing.title)
  w.paragraph(PDF_TEXT.signing.intro, {
    size: 10.5,
    color: COLOR_SOFT,
    spaceAfter: 6,
  })
  w.paragraph(PDF_TEXT.signing.declaration, { size: 11.5, spaceAfter: 14 })
  w.signatureBlock(PDF_TEXT.signing.ownerRole, {
    printedName: ownerName ?? undefined,
  })

  // หัวข้อ + หมายเหตุ + บล็อกลงนามแรก ต้องอยู่หน้าเดียวกัน ไม่ให้หัวข้อค้างท้ายหน้า
  w.moveDown(6)
  w.ensure(220)
  w.subheading(PDF_TEXT.signing.witnessHeading)
  w.paragraph(PDF_TEXT.signing.witnessNote, {
    size: 9.5,
    color: COLOR_SOFT,
    spaceAfter: 10,
  })
  w.signatureBlock(PDF_TEXT.signing.witness1Role, { withRelation: true })
  w.signatureBlock(PDF_TEXT.signing.witness2Role, { withRelation: true })

  const proxy1 = getPerson(answers, 'proxy1')
  const proxy2 = getPerson(answers, 'proxy2')
  const proxyBlockCount = proxy2?.name ? 2 : 1
  w.moveDown(6)
  // จองพื้นที่ทั้งส่วนตามจำนวนบล็อกจริง — ไม่ให้บล็อกใดหลุดไปหน้าถัดไปตามลำพัง
  w.ensure(60 + 115 * proxyBlockCount)
  w.subheading(PDF_TEXT.signing.proxyHeading)
  w.paragraph(PDF_TEXT.signing.proxyNote, {
    size: 9.5,
    color: COLOR_SOFT,
    spaceAfter: 10,
  })
  w.signatureBlock(PDF_TEXT.signing.proxyRole, {
    printedName: proxy1?.name || undefined,
  })
  if (proxy2?.name) {
    w.signatureBlock(PDF_TEXT.signing.proxyRole, { printedName: proxy2.name })
  }

  // ---- ภาคผนวก ----
  w.newPage()
  w.sectionHeading(PDF_TEXT.appendix.title)

  w.subheading(PDF_TEXT.appendix.afterPrintTitle)
  PDF_TEXT.appendix.afterPrintSteps.forEach((step, i) => {
    w.paragraph(`${i + 1}. ${step}`, { x: MARGIN_X + 10, spaceAfter: 4 })
  })
  w.moveDown(10)

  w.subheading(PDF_TEXT.appendix.lawTitle)
  w.paragraph(PDF_TEXT.appendix.lawText, { size: 11 })
  w.paragraph(PDF_TEXT.appendix.amendText, { size: 11, spaceAfter: 14 })

  w.subheading(PDF_TEXT.appendix.reviewTitle)
  w.paragraph(PDF_TEXT.appendix.reviewHint, {
    size: 10.5,
    color: COLOR_SOFT,
    spaceAfter: 10,
  })
  for (let i = 0; i < 3; i++) {
    w.paragraph(
      `ทบทวนล่าสุดเมื่อวันที่ ${'.'.repeat(40)} ลายมือชื่อ ${'.'.repeat(40)}`,
      { x: MARGIN_X + 10, spaceAfter: 8 },
    )
  }
  w.moveDown(10)

  w.subheading(PDF_TEXT.appendix.disclaimerTitle)
  w.paragraph(PDF_TEXT.appendix.disclaimerText, {
    size: 10,
    color: COLOR_SOFT,
  })

  drawFooters(doc, regular, ownerName)
  return doc.save()
}

// ---- ส่วนที่ใช้ browser API (แยกจาก generatePdfBytes เพื่อให้ทดสอบง่าย) ----

let cachedFontBytes: FontBytes | null = null
let cachedLogoBytes: ArrayBuffer | null = null

/** โหลดโลโก้สำหรับหน้าปก — โหลดไม่ได้ก็สร้างเอกสารต่อ (โลโก้เป็นส่วนตกแต่ง) */
export async function loadLogoBytes(): Promise<ArrayBuffer | undefined> {
  if (cachedLogoBytes) return cachedLogoBytes
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}logo.png`)
    if (!res.ok) return undefined
    cachedLogoBytes = await res.arrayBuffer()
    return cachedLogoBytes
  } catch {
    return undefined
  }
}

/** โหลดฟอนต์จาก /public/fonts ที่ bundle มากับแอป — ไม่มีการเรียก CDN */
export async function loadFontBytes(): Promise<FontBytes> {
  if (cachedFontBytes) return cachedFontBytes
  const load = async (file: string): Promise<ArrayBuffer> => {
    const res = await fetch(`${import.meta.env.BASE_URL}fonts/${file}`)
    if (!res.ok) throw new Error(`โหลดฟอนต์ ${file} ไม่สำเร็จ (${res.status})`)
    return res.arrayBuffer()
  }
  const [regularBytes, boldBytes] = await Promise.all([
    load('Sarabun-Regular.ttf'),
    load('Sarabun-Bold.ttf'),
  ])
  cachedFontBytes = { regular: regularBytes, bold: boldBytes }
  return cachedFontBytes
}

export function buildFileName(
  answers: FormAnswers,
  now: Date = new Date(),
): string {
  // ติ๊ก "ปริ้นไปเขียนเอง" = ไม่เอาชื่อที่เคยพิมพ์ไว้ไปอยู่ในชื่อไฟล์ด้วย
  const ownerName =
    answers['handwritePersonal'] === true ? null : getOwnerName(answers)
  const safe = safeFileSlug(ownerName ?? '')
  return `${APP_CONFIG.fileSlug}-${safe || 'เอกสาร'}-${ymd(now)}.pdf`
}

/** สร้างและดาวน์โหลด PDF ในเบราว์เซอร์ */
export async function downloadPdf(answers: FormAnswers): Promise<void> {
  const [fontBytes, logoPng] = await Promise.all([
    loadFontBytes(),
    loadLogoBytes(),
  ])
  const bytes = await generatePdfBytes(answers, fontBytes, { logoPng })
  const blob = new Blob([bytes], { type: 'application/pdf' })
  await shareOrDownload(blob, buildFileName(answers))
}

/**
 * เปิดตัวอย่างเอกสารที่กรอกเสร็จแล้ว (ข้อมูลสมมติ) ในแท็บใหม่
 * ถ้าเบราว์เซอร์บล็อกการเปิดแท็บ ให้ส่งไฟล์ผ่านดาวน์โหลด/แชร์แทน
 */
export async function openSamplePdf(): Promise<void> {
  const [fontBytes, logoPng] = await Promise.all([
    loadFontBytes(),
    loadLogoBytes(),
  ])
  const { SAMPLE_ANSWERS } = await import('../../content/sampleAnswers')
  const bytes = await generatePdfBytes(SAMPLE_ANSWERS, fontBytes, { logoPng })
  const blob = new Blob([bytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank')
  if (!win) {
    await shareOrDownload(blob, `${APP_CONFIG.fileSlug}-ตัวอย่าง-${ymd()}.pdf`)
  }
  // แท็บใหม่ยังใช้ URL อยู่ — รอสักพักก่อนคืนหน่วยความจำ
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

/**
 * ดาวน์โหลดแบบฟอร์มเปล่า — ไม่มีข้อมูลใด ๆ ทุกช่องเว้นให้เขียนด้วยปากกาทั้งฉบับ
 * สำหรับผู้ที่ไม่สะดวกกรอกข้อมูลลงในเว็บ
 */
export async function downloadBlankPdf(): Promise<void> {
  const [fontBytes, logoPng] = await Promise.all([
    loadFontBytes(),
    loadLogoBytes(),
  ])
  const bytes = await generatePdfBytes({}, fontBytes, {
    blankForm: true,
    logoPng,
  })
  const blob = new Blob([bytes], { type: 'application/pdf' })
  await shareOrDownload(blob, `${APP_CONFIG.fileSlug}-แบบฟอร์มเปล่า-${ymd()}.pdf`)
}
