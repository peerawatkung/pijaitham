/**
 * สร้างคู่มือ "ชวนครอบครัวคุยอย่างไร" เป็น PDF — เนื้อหาชุดเดียวกับหน้าเว็บ
 * (จาก src/content/talkGuide.ts) สำหรับปริ้นหรือส่งต่อให้พี่น้องอ่านก่อนไปคุยพร้อมกัน
 */
import fontkit from '@pdf-lib/fontkit'
import { PDFDocument } from 'pdf-lib'
import { APP_CONFIG } from '../../config/app'
import { TALK_GUIDE } from '../../content/talkGuide'
import { shareOrDownload } from '../download'
import {
  COLOR_ACCENT,
  COLOR_SOFT,
  loadFontBytes,
  loadLogoBytes,
  MARGIN_X,
  PAGE_WIDTH,
  PdfWriter,
} from './generator'

export async function downloadTalkGuidePdf(): Promise<void> {
  const [fontBytes, logoPng] = await Promise.all([
    loadFontBytes(),
    loadLogoBytes(),
  ])

  const doc = await PDFDocument.create()
  doc.registerFontkit(fontkit)
  const regular = await doc.embedFont(fontBytes.regular, { subset: true })
  const bold = await doc.embedFont(fontBytes.bold, { subset: true })
  doc.setTitle(`${TALK_GUIDE.title} — ${APP_CONFIG.name}`)
  doc.setLanguage('th')

  const w = new PdfWriter(doc, regular, bold)

  // โลโก้เล็กบนหัวกระดาษ
  if (logoPng) {
    const logo = await doc.embedPng(logoPng)
    const size = 84
    w.page.drawImage(logo, {
      x: (PAGE_WIDTH - size) / 2,
      y: w.y - size,
      width: size,
      height: size,
    })
    w.moveDown(size + 8)
  }
  w.paragraph(TALK_GUIDE.title, {
    size: 19,
    bold: true,
    align: 'center',
    color: COLOR_ACCENT,
    spaceAfter: 8,
  })
  w.paragraph(TALK_GUIDE.lead, {
    size: 11,
    align: 'center',
    color: COLOR_SOFT,
    spaceAfter: 20,
  })

  for (const section of TALK_GUIDE.sections) {
    w.sectionHeading(section.title)
    if (section.intro) {
      w.paragraph(section.intro, { size: 11.5, spaceAfter: 8 })
    }
    for (const item of section.items ?? []) {
      w.paragraph(`• ${item}`, {
        x: MARGIN_X + 12,
        size: 11.5,
        spaceAfter: 5,
      })
    }
    for (const quote of section.quotes ?? []) {
      w.paragraph(`“${quote}”`, {
        x: MARGIN_X + 12,
        size: 11.5,
        bold: true,
        color: COLOR_ACCENT,
        spaceAfter: 8,
      })
    }
    w.moveDown(8)
  }

  w.moveDown(4)
  w.paragraph(TALK_GUIDE.closing, {
    size: 11.5,
    bold: true,
    color: COLOR_ACCENT,
    spaceAfter: 10,
  })
  w.paragraph(
    `เขียนหนังสือแสดงเจตนาของคุณได้ฟรีที่ https://${APP_CONFIG.domain}`,
    { size: 10, color: COLOR_SOFT },
  )

  // footer ทุกหน้า
  const pages = doc.getPages()
  pages.forEach((page, i) => {
    page.drawText(`${APP_CONFIG.name} · ${APP_CONFIG.domain}`, {
      x: MARGIN_X,
      y: 38,
      size: 9,
      font: regular,
      color: COLOR_SOFT,
    })
    const pageText = `หน้า ${i + 1} / ${pages.length}`
    page.drawText(pageText, {
      x: PAGE_WIDTH - MARGIN_X - regular.widthOfTextAtSize(pageText, 9),
      y: 38,
      size: 9,
      font: regular,
      color: COLOR_SOFT,
    })
  })

  const bytes = await doc.save()
  const blob = new Blob([bytes], { type: 'application/pdf' })
  await shareOrDownload(blob, `${APP_CONFIG.fileSlug}-คู่มือชวนครอบครัวคุย.pdf`)
}
