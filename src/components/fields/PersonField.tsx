import type { FieldDef } from '../../content/questions'
import type { PersonAnswer } from '../../types/form'
import { FieldShell, inputClass } from './FieldShell'

type PersonFieldDef = Extract<FieldDef, { type: 'person' }>

interface PersonFieldProps {
  field: PersonFieldDef
  value: PersonAnswer | undefined
  onChange: (value: PersonAnswer | undefined) => void
}

const EMPTY: PersonAnswer = {
  name: '',
  relation: '',
  phone: '',
  lineId: '',
  facebook: '',
  email: '',
  otherContact: '',
}

/** ช่องย่อยของข้อมูลบุคคล — เพิ่ม/แก้ช่องทางติดต่อได้ที่นี่ที่เดียว */
const SUB_FIELDS: Array<{
  key: keyof PersonAnswer
  label: string
  placeholder?: string
  type?: string
  fullWidth?: boolean
}> = [
  { key: 'name', label: 'ชื่อ-นามสกุล', fullWidth: true },
  {
    key: 'relation',
    label: 'ความสัมพันธ์',
    placeholder: 'เช่น ลูกสาว คู่สมรส เพื่อนสนิท',
  },
  { key: 'phone', label: 'เบอร์ติดต่อ', type: 'tel' },
  { key: 'lineId', label: 'LINE ID' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'email', label: 'อีเมล', type: 'email' },
  {
    key: 'otherContact',
    label: 'ช่องทางอื่น ๆ',
    placeholder: 'เช่น WhatsApp, ที่อยู่',
  },
]

/** คืน undefined เมื่อทุกช่องว่าง เพื่อให้ข้อนี้นับเป็นยังไม่ได้ตอบ */
function normalize(next: PersonAnswer): PersonAnswer | undefined {
  const hasValue = Object.values(next).some((v) => v !== '')
  return hasValue ? next : undefined
}

export function PersonField({ field, value, onChange }: PersonFieldProps) {
  const person = value ?? EMPTY

  const update = (patch: Partial<PersonAnswer>) => {
    onChange(normalize({ ...person, ...patch }))
  }

  return (
    <FieldShell
      label={field.label}
      hint={field.hint}
      required={field.required}
      asFieldset
    >
      <div className="grid gap-3 rounded-lg border border-tea-200 bg-card p-4 sm:grid-cols-2">
        {SUB_FIELDS.map((sub) => (
          <div key={sub.key} className={sub.fullWidth ? 'sm:col-span-2' : ''}>
            <label
              htmlFor={`${field.id}-${sub.key}`}
              className="mb-1 block text-base text-ink-soft"
            >
              {sub.label}
            </label>
            <input
              id={`${field.id}-${sub.key}`}
              type={sub.type ?? 'text'}
              className={inputClass}
              value={person[sub.key]}
              placeholder={sub.placeholder}
              onChange={(e) => update({ [sub.key]: e.target.value })}
            />
          </div>
        ))}
      </div>
    </FieldShell>
  )
}
