/**
 * ใบปะหน้าฝากเวชระเบียน — จดหมายนำส่ง 1 หน้า ยื่นพร้อมสำเนาหนังสือแสดงเจตนา
 * ที่โรงพยาบาล ช่องวันที่/โรงพยาบาล/HN เว้นเป็นเส้นจุดให้เขียนหน้างานเสมอ
 */
import fontkit from '@pdf-lib/fontkit'
import { PDFDocument } from 'pdf-lib'
import { APP_CONFIG, DOCTORS_URL } from '../../config/app'
import { COVER_LETTER } from '../../content/coverLetter'
import { shareOrDownload, ymd } from '../download'
import type { FormAnswers, PersonAnswer } from '../../types/form'
import {
  COLOR_ACCENT,
  COLOR_SOFT,
  loadFontBytes,
  MARGIN_X,
  PAGE_WIDTH,
  PdfWriter,
} from './generator'
import type { FontBytes } from './generator'
import { drawQrCode } from './qr'

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

/** สร้าง PDF ใบปะหน้า — แยกจากส่วนดาวน์โหลดเพื่อให้ทดสอบได้โดยไม่ใช้ browser API */
export async function generateCoverLetterBytes(
  answers: FormAnswers,
  fontBytes: FontBytes,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.registerFontkit(fontkit)
  const regular = await doc.embedFont(fontBytes.regular, { subset: true })
  const bold = await doc.embedFont(fontBytes.bold, { subset: true })
  doc.setTitle(`${COVER_LETTER.title} — ${APP_CONFIG.name}`)
  doc.setLanguage('th')

  const w = new PdfWriter(doc, regular, bold)

  // ติ๊ก "เขียนข้อมูลส่วนตัวด้วยปากกา" = เว้นข้อมูลส่วนตัวเป็นเส้นจุดทั้งฉบับ
  const handwrite = answers['handwritePersonal'] === true
  const personal = (id: string) => (handwrite ? null : getText(answers, id))

  w.paragraph(COVER_LETTER.title, {
    size: 16,
    bold: true,
    align: 'center',
    color: COLOR_ACCENT,
    spaceAfter: 4,
  })
  w.paragraph(COVER_LETTER.subtitle, {
    size: 11,
    align: 'center',
    color: COLOR_SOFT,
    spaceAfter: 16,
  })

  // วันที่เว้นให้เขียนวันยื่นจริง ชิดขวาแบบจดหมายทั่วไป
  const dateWidth = 170
  w.paragraph(w.dotted(COVER_LETTER.dateLabel, '', dateWidth), {
    x: PAGE_WIDTH - MARGIN_X - dateWidth,
    spaceAfter: 8,
  })
  w.paragraph(COVER_LETTER.to, { spaceAfter: 2 })
  w.paragraph(w.dotted(COVER_LETTER.hospitalLabel, '', 320), { spaceAfter: 12 })

  const field = (label: string, value: string | null) =>
    w.paragraph(value ? `${label}  ${value}` : w.dotted(`${label}  `, '', 330), {
      spaceAfter: 3,
    })
  field(COVER_LETTER.fields.name, personal('fullName'))
  field(COVER_LETTER.fields.birthDate, personal('birthDate'))
  field(COVER_LETTER.fields.hn, null) // เว็บไม่ถาม HN — ให้เขียนที่โรงพยาบาลเสมอ
  field(COVER_LETTER.fields.phone, personal('phone'))
  w.moveDown(9)

  w.paragraph(COVER_LETTER.body, { spaceAfter: 4 })
  COVER_LETTER.requests.forEach((item, i) => {
    w.paragraph(`${i + 1}. ${item}`, { x: MARGIN_X + 14, spaceAfter: 3 })
  })
  w.moveDown(9)

  w.paragraph(COVER_LETTER.proxyHeading, { bold: true, spaceAfter: 3 })
  for (const [i, id] of (['proxy1', 'proxy2'] as const).entries()) {
    const person = getPerson(answers, id)
    const phones = person
      ? [person.phone.trim(), person.phone2.trim()].filter(Boolean).join(' / ')
      : ''
    const text = person
      ? `${i + 1}. ${person.name}${
          person.relation.trim() ? ` (${person.relation.trim()})` : ''
        }${phones ? ` — ${COVER_LETTER.proxyPhoneLabel} ${phones}` : ''}`
      : w.dotted(`${i + 1}. `, '', 330)
    w.paragraph(text, { x: MARGIN_X + 14, spaceAfter: 3 })
  }
  w.moveDown(9)

  w.paragraph(COVER_LETTER.closing, { spaceAfter: 14 })

  // บล็อกลงชื่อชิดขวา เว้นช่องว่างเหนือเส้นให้เซ็นจริงด้วยปากกา
  const signWidth = 260
  const signX = PAGE_WIDTH - MARGIN_X - signWidth
  w.moveDown(14)
  w.paragraph(w.dotted(COVER_LETTER.signLabel, '', signWidth), {
    x: signX,
    spaceAfter: 3,
  })
  const printedName = personal('fullName')
  w.paragraph(
    printedName ? `( ${printedName} )` : w.dotted('( ', ' )', signWidth - 60),
    { x: signX, maxWidth: signWidth, align: 'center', spaceAfter: 2 },
  )
  w.paragraph(COVER_LETTER.signRole, {
    x: signX,
    maxWidth: signWidth,
    align: 'center',
    spaceAfter: 10,
  })

  w.calloutBox(COVER_LETTER.staffNoteTitle, COVER_LETTER.staffNote)

  // QR ไปหน้าสำหรับแพทย์ มุมล่างขวา + ที่มาของเอกสารมุมล่างซ้าย
  const qrSize = 38
  drawQrCode(w.page, DOCTORS_URL, {
    x: PAGE_WIDTH - MARGIN_X - qrSize,
    y: 40,
    size: qrSize,
  })
  w.page.drawText(`${APP_CONFIG.name} · ${APP_CONFIG.domain}`, {
    x: MARGIN_X,
    y: 44,
    size: 9,
    font: regular,
    color: COLOR_SOFT,
  })

  return doc.save()
}

/** สร้างและดาวน์โหลดใบปะหน้าในเบราว์เซอร์ */
export async function downloadCoverLetterPdf(
  answers: FormAnswers,
): Promise<void> {
  const fontBytes = await loadFontBytes()
  const bytes = await generateCoverLetterBytes(answers, fontBytes)
  const blob = new Blob([bytes], { type: 'application/pdf' })
  await shareOrDownload(
    blob,
    `${APP_CONFIG.fileSlug}-ใบปะหน้าเวชระเบียน-${ymd()}.pdf`,
  )
}
