/**
 * บันทึกแบบร่างอัตโนมัติใน localStorage — อยู่ในเครื่องของผู้ใช้เท่านั้น
 * ไม่มีอะไรถูกส่งออกไปไหน (สอดคล้องคำมั่น privacy ของเว็บ)
 * ใช้ schema และ validation ชุดเดียวกับไฟล์ .json (lib/draft.ts)
 */
import { buildDraftFile, parseDraft } from './draft'
import type { FormAnswers } from '../types/form'

const STORAGE_KEY = 'pijaitham-draft'

export interface StoredDraft {
  answers: FormAnswers
  /** เวลาที่บันทึกล่าสุด (ISO) — ไม่มีในร่างรุ่นเก่า/เสียหายบางส่วน = null */
  savedAt: string | null
}

/** localStorage อาจไม่มี (รันใน node) หรือถูกปิด (บางเบราว์เซอร์โหมดส่วนตัว) */
function getStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

/** บันทึกร่างลงเครื่อง — คืน false เมื่อเก็บไม่ได้ (โหมดส่วนตัว/พื้นที่เต็ม) */
export function saveStoredDraft(answers: FormAnswers): boolean {
  const storage = getStorage()
  if (!storage) return false
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(buildDraftFile(answers)))
    return true
  } catch {
    return false
  }
}

/** อ่านร่างที่เก็บไว้ ผ่าน validation เข้มเหมือนไฟล์ .json — ว่าง/เสียหาย = null */
export function loadStoredDraft(): StoredDraft | null {
  const storage = getStorage()
  if (!storage) return null
  const text = storage.getItem(STORAGE_KEY)
  if (!text) return null
  try {
    const answers = parseDraft(text)
    if (Object.keys(answers).length === 0) return null
    const raw = JSON.parse(text) as { savedAt?: unknown }
    return {
      answers,
      savedAt: typeof raw.savedAt === 'string' ? raw.savedAt : null,
    }
  } catch {
    clearStoredDraft() // ร่างเสียหาย — ลบทิ้ง กันเจอ error ซ้ำทุกครั้งที่เปิด
    return null
  }
}

/** ลบร่างออกจากเครื่อง (ปุ่ม "ลบร่าง" และกรณีร่างเสียหาย) */
export function clearStoredDraft(): void {
  try {
    getStorage()?.removeItem(STORAGE_KEY)
  } catch {
    // ลบไม่ได้ = ไม่มีอะไรให้ทำต่อ
  }
}
