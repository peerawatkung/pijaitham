/**
 * สร้างไฟล์ปฏิทิน .ics เตือนทบทวนเอกสารรายปี — ทำงานในเครื่องทั้งหมด
 * ไม่มีการส่งข้อมูลหรือเชื่อมบัญชีปฏิทินใด ๆ ผู้ใช้เปิดไฟล์เพิ่มลงปฏิทินเอง
 */
import { APP_CONFIG } from '../config/app'
import { shareOrDownload } from './download'

/** escape ข้อความตามสเปก iCalendar (RFC 5545) */
function icsEscape(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

/** พับบรรทัดยาวตามสเปก (ไม่เกิน ~70 octets ต่อบรรทัด — ไทย 1 ตัว = 3 bytes) */
function foldLine(line: string): string {
  const CHUNK = 20 // ~60 octets สำหรับข้อความไทยล้วน ปลอดภัยต่อทุก parser
  if (line.length <= CHUNK * 3) return line
  const parts: string[] = []
  for (let i = 0; i < line.length; i += CHUNK) {
    parts.push((i === 0 ? '' : ' ') + line.slice(i, i + CHUNK))
  }
  return parts.join('\r\n')
}

function fmtDate(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('')
}

/** ดาวน์โหลดไฟล์เตือน "ทบทวนหนังสือแสดงเจตนา" ปีละครั้ง เริ่มปีหน้า */
export async function downloadReviewReminder(): Promise<void> {
  const now = new Date()
  const start = new Date(now)
  start.setFullYear(now.getFullYear() + 1)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)

  const summary = icsEscape(`ทบทวนหนังสือแสดงเจตนา (${APP_CONFIG.name})`)
  const description = icsEscape(
    `ครบ 1 ปีแล้ว — ชวนหยิบหนังสือแสดงเจตนาขึ้นมาอ่านอีกครั้ง\n` +
      `ถ้าความต้องการยังเหมือนเดิม ให้บันทึกวันที่ทบทวนในภาคผนวกของเอกสาร\n` +
      `ถ้าอยากแก้ไข ทำฉบับใหม่ได้ที่ https://${APP_CONFIG.domain} (ฉบับล่าสุดมีผลเหนือฉบับเก่า)`,
  )

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//${APP_CONFIG.englishName}//Review Reminder//TH`,
    'BEGIN:VEVENT',
    `UID:${crypto.randomUUID()}@${APP_CONFIG.domain}`,
    `DTSTAMP:${fmtDate(now)}T000000Z`,
    `DTSTART;VALUE=DATE:${fmtDate(start)}`,
    `DTEND;VALUE=DATE:${fmtDate(end)}`,
    'RRULE:FREQ=YEARLY',
    foldLine(`SUMMARY:${summary}`),
    foldLine(`DESCRIPTION:${description}`),
    `URL:https://${APP_CONFIG.domain}/`,
    'TRANSP:TRANSPARENT',
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  const blob = new Blob([lines.join('\r\n')], {
    type: 'text/calendar;charset=utf-8',
  })
  await shareOrDownload(blob, `${APP_CONFIG.fileSlug}-เตือนทบทวนรายปี.ics`)
}
