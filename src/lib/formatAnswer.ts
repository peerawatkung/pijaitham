import type { FieldDef } from '../content/questions'
import type {
  AnswerValue,
  ChoiceAnswer,
  MultiChoiceAnswer,
  PersonAnswer,
} from '../types/form'

/**
 * แปลงคำตอบเป็นข้อความอ่านได้ ใช้ร่วมกันทั้งหน้าตรวจทานและ PDF generator
 * คืน null เมื่อไม่มีคำตอบ — ใน PDF ข้อนั้นจะเว้นเป็นเส้นประ/ช่องติ๊กว่าง
 * ให้เขียนด้วยปากกาได้ (ตามการตัดสินใจ 2026-07-08 แทนการพิมพ์ "— ยังไม่ระบุ —")
 */
export function formatAnswer(
  field: FieldDef,
  value: AnswerValue | undefined,
): string | null {
  if (value === undefined) return null

  switch (field.type) {
    case 'text':
    case 'textarea': {
      const text = value as string
      return text.trim() ? text : null
    }

    case 'choice': {
      const answer = value as ChoiceAnswer
      const option = field.options.find((o) => o.value === answer.value)
      if (!option) return null
      if (answer.detail && option.detail) {
        return `${option.label} (${option.detail.label} ${answer.detail})`
      }
      return option.label
    }

    case 'multichoice': {
      const answer = value as MultiChoiceAnswer
      const labels = answer.values
        .map((v) => field.options.find((o) => o.value === v)?.label)
        .filter((label): label is string => Boolean(label))
      if (answer.other) labels.push(`อื่น ๆ: ${answer.other}`)
      if (labels.length === 0) return null
      // ข้อละบรรทัด อ่านง่ายทั้งบนจอมือถือและใน PDF
      return labels.map((label) => `• ${label}`).join('\n')
    }

    case 'person': {
      const person = value as PersonAnswer
      const who: string[] = []
      if (person.name) who.push(person.name)
      if (person.relation) who.push(`(${person.relation})`)
      const contacts: string[] = []
      if (person.phone) contacts.push(`โทร ${person.phone}`)
      if (person.phone2) contacts.push(`โทรสำรอง ${person.phone2}`)
      if (person.lineId) contacts.push(`LINE: ${person.lineId}`)
      if (person.facebook) contacts.push(`Facebook: ${person.facebook}`)
      if (person.email) contacts.push(`อีเมล: ${person.email}`)
      if (person.otherContact) contacts.push(`อื่น ๆ: ${person.otherContact}`)
      // ช่องทางติดต่อบรรทัดละช่องทาง อ่านง่ายกว่าต่อกันเป็นพืด
      const text = [who.join(' '), ...contacts].filter(Boolean).join('\n')
      return text || null
    }

    case 'checkbox':
      return value === true ? 'ยืนยันแล้ว' : null
  }
}
