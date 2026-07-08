import type { FieldDef } from '../../content/questions'
import type { PersonAnswer } from '../../types/form'
import { FieldShell, inputClass } from './FieldShell'

type PersonFieldDef = Extract<FieldDef, { type: 'person' }>

interface PersonFieldProps {
  field: PersonFieldDef
  value: PersonAnswer | undefined
  onChange: (value: PersonAnswer | undefined) => void
}

const EMPTY: PersonAnswer = { name: '', relation: '', phone: '' }

/** คืน undefined เมื่อทุกช่องว่าง เพื่อให้ข้อนี้นับเป็น "ยังไม่ระบุ" */
function normalize(next: PersonAnswer): PersonAnswer | undefined {
  if (!next.name && !next.relation && !next.phone) return undefined
  return next
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
        <div className="sm:col-span-2">
          <label
            htmlFor={`${field.id}-name`}
            className="mb-1 block text-base text-ink-soft"
          >
            ชื่อ-นามสกุล
          </label>
          <input
            id={`${field.id}-name`}
            type="text"
            className={inputClass}
            value={person.name}
            onChange={(e) => update({ name: e.target.value })}
          />
        </div>
        <div>
          <label
            htmlFor={`${field.id}-relation`}
            className="mb-1 block text-base text-ink-soft"
          >
            ความสัมพันธ์
          </label>
          <input
            id={`${field.id}-relation`}
            type="text"
            className={inputClass}
            value={person.relation}
            placeholder="เช่น ลูกสาว คู่สมรส เพื่อนสนิท"
            onChange={(e) => update({ relation: e.target.value })}
          />
        </div>
        <div>
          <label
            htmlFor={`${field.id}-phone`}
            className="mb-1 block text-base text-ink-soft"
          >
            เบอร์ติดต่อ
          </label>
          <input
            id={`${field.id}-phone`}
            type="tel"
            className={inputClass}
            value={person.phone}
            onChange={(e) => update({ phone: e.target.value })}
          />
        </div>
      </div>
    </FieldShell>
  )
}
