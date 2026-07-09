/**
 * บันทึก/เปิดแบบร่างเป็นไฟล์ .json ฝั่ง client ล้วน
 * - schema versioned: { version, savedAt, data } (นิยามใน types/form.ts)
 * - validation เข้มงวด: รับเฉพาะ field id ที่รู้จัก และค่าที่ตรงชนิดคำถามเท่านั้น
 *   (กันไฟล์เสียหรือถูกแก้ ทำให้แอป crash หรือ state เพี้ยน)
 */
import { APP_CONFIG } from '../config/app'
import { SECTIONS } from '../content/questions'
import type { FieldDef } from '../content/questions'
import { DRAFT_VERSION } from '../types/form'
import type {
  AnswerValue,
  DraftFile,
  FormAnswers,
  PersonAnswer,
} from '../types/form'
import { safeFileSlug, shareOrDownload, ymd } from './download'

/** ข้อผิดพลาดที่แสดงต่อผู้ใช้ได้โดยตรง (ข้อความภาษาไทย) */
export class DraftError extends Error {}

const fieldById: ReadonlyMap<string, FieldDef> = new Map(
  SECTIONS.flatMap((section) => section.fields.map((f) => [f.id, f] as const)),
)

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** ตรวจค่าหนึ่งคำตอบตามชนิดคำถาม — คืน undefined ถ้าไม่ผ่าน (ข้อนั้นถูกทิ้ง ไม่ throw) */
function validateValue(field: FieldDef, raw: unknown): AnswerValue | undefined {
  switch (field.type) {
    case 'text':
    case 'textarea':
      return typeof raw === 'string' && raw ? raw : undefined

    case 'checkbox':
      return raw === true ? true : undefined

    case 'choice': {
      if (!isRecord(raw) || typeof raw['value'] !== 'string') return undefined
      const value = raw['value']
      if (!field.options.some((o) => o.value === value)) return undefined
      const detail =
        typeof raw['detail'] === 'string' && raw['detail']
          ? raw['detail']
          : undefined
      return detail ? { value, detail } : { value }
    }

    case 'multichoice': {
      if (!isRecord(raw) || !Array.isArray(raw['values'])) return undefined
      const values = raw['values'].filter(
        (v): v is string =>
          typeof v === 'string' && field.options.some((o) => o.value === v),
      )
      const other =
        typeof raw['other'] === 'string' && raw['other']
          ? raw['other']
          : undefined
      if (values.length === 0 && !other) return undefined
      return other ? { values, other } : { values }
    }

    case 'person': {
      if (!isRecord(raw)) return undefined
      const str = (key: string): string =>
        typeof raw[key] === 'string' ? (raw[key] as string) : ''
      const person: PersonAnswer = {
        name: str('name'),
        relation: str('relation'),
        phone: str('phone'),
        // ช่องทางติดต่อเพิ่มเมื่อ 2026-07-08 — draft เก่าไม่มี field เหล่านี้ ถือเป็นค่าว่าง
        phone2: str('phone2'),
        lineId: str('lineId'),
        facebook: str('facebook'),
        email: str('email'),
        otherContact: str('otherContact'),
      }
      const hasValue = Object.values(person).some((v) => v !== '')
      return hasValue ? person : undefined
    }
  }
}

/**
 * migration ระหว่างเวอร์ชัน schema — ปัจจุบันมีแค่ v1
 * เมื่อเพิ่ม DRAFT_VERSION ในอนาคต ให้เพิ่มขั้น migrate ต่อท้ายที่นี่
 */
function migrate(version: number, data: Record<string, unknown>) {
  // v1 → ปัจจุบัน: ไม่ต้องแปลง
  void version
  return data
}

/** แปลงเนื้อไฟล์แบบร่างเป็นคำตอบที่ผ่านการตรวจแล้ว */
export function parseDraft(text: string): FormAnswers {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new DraftError('ไฟล์นี้ไม่ใช่ไฟล์แบบร่างที่ถูกต้อง')
  }
  if (
    !isRecord(raw) ||
    typeof raw['version'] !== 'number' ||
    !isRecord(raw['data'])
  ) {
    throw new DraftError('ไฟล์นี้ไม่ใช่ไฟล์แบบร่างของแอปนี้')
  }
  if (raw['version'] > DRAFT_VERSION) {
    throw new DraftError(
      'ไฟล์แบบร่างนี้สร้างจากแอปเวอร์ชันใหม่กว่า กรุณาเปิดด้วยแอปเวอร์ชันล่าสุด',
    )
  }

  const data = migrate(raw['version'], raw['data'])
  const answers: FormAnswers = {}
  for (const [id, value] of Object.entries(data)) {
    const field = fieldById.get(id)
    if (!field) continue // field ที่ไม่รู้จัก (เช่นจากเวอร์ชันเก่า) — ข้าม
    const valid = validateValue(field, value)
    if (valid !== undefined) answers[id] = valid
  }
  return answers
}

/** อ่านไฟล์แบบร่างที่ผู้ใช้เลือก */
export async function readDraftFile(file: File): Promise<FormAnswers> {
  const text = await file.text()
  return parseDraft(text)
}

export function buildDraftFile(answers: FormAnswers): DraftFile {
  return {
    version: DRAFT_VERSION,
    savedAt: new Date().toISOString(),
    data: answers,
  }
}

/** บันทึกแบบร่างเป็นไฟล์ .json ลงเครื่องผู้ใช้ */
export function exportDraft(answers: FormAnswers): void {
  const draft = buildDraftFile(answers)
  const blob = new Blob([JSON.stringify(draft, null, 2)], {
    type: 'application/json',
  })
  const name = typeof answers['fullName'] === 'string' ? answers['fullName'] : ''
  const fileName = `${APP_CONFIG.fileSlug}-แบบร่าง-${safeFileSlug(name.trim()) || 'เอกสาร'}-${ymd()}.json`
  void shareOrDownload(blob, fileName)
}
