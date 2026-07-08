/** คำตอบแบบเลือกหนึ่งข้อ — value คือรหัสตัวเลือก, detail คือข้อความเพิ่มเติมของตัวเลือกนั้น (ถ้ามี) */
export interface ChoiceAnswer {
  value: string
  detail?: string
}

/** คำตอบแบบเลือกได้หลายข้อ — values คือรหัสตัวเลือก, other คือข้อความ "อื่น ๆ" ที่ผู้ใช้พิมพ์เอง */
export interface MultiChoiceAnswer {
  values: string[]
  other?: string
}

/** ข้อมูลบุคคล (ผู้ตัดสินใจแทน) */
export interface PersonAnswer {
  name: string
  relation: string
  phone: string
}

export type AnswerValue =
  | string
  | boolean
  | ChoiceAnswer
  | MultiChoiceAnswer
  | PersonAnswer

/** คำตอบทั้งหมด key ตาม field id ใน src/content/questions.ts — ทุกข้อข้ามได้ */
export type FormAnswers = Record<string, AnswerValue | undefined>

/** Schema ของไฟล์แบบร่าง .json (versioned เพื่อรองรับ migration ภายหลัง) */
export const DRAFT_VERSION = 1

export interface DraftFile {
  version: typeof DRAFT_VERSION
  savedAt: string
  data: FormAnswers
}
