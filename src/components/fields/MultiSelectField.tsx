import type { FieldDef } from '../../content/questions'
import type { MultiChoiceAnswer } from '../../types/form'
import { FieldShell, inputClass } from './FieldShell'

type MultiFieldDef = Extract<FieldDef, { type: 'multichoice' }>

interface MultiSelectFieldProps {
  field: MultiFieldDef
  value: MultiChoiceAnswer | undefined
  onChange: (value: MultiChoiceAnswer | undefined) => void
}

/** คืน undefined เมื่อไม่เหลือคำตอบใด ๆ เพื่อให้ข้อนี้นับเป็น "ยังไม่ระบุ" */
function normalize(next: MultiChoiceAnswer): MultiChoiceAnswer | undefined {
  if (next.values.length === 0 && !next.other) return undefined
  return next
}

export function MultiSelectField({
  field,
  value,
  onChange,
}: MultiSelectFieldProps) {
  const values = value?.values ?? []

  const toggle = (optionValue: string) => {
    const nextValues = values.includes(optionValue)
      ? values.filter((v) => v !== optionValue)
      : [...values, optionValue]
    onChange(normalize({ values: nextValues, other: value?.other }))
  }

  return (
    <FieldShell
      label={field.label}
      hint={field.hint}
      required={field.required}
      asFieldset
    >
      <div className="space-y-2">
        {field.options.map((option) => {
          const checked = values.includes(option.value)
          const optionId = `${field.id}-${option.value}`
          return (
            <label
              key={option.value}
              htmlFor={optionId}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
                checked
                  ? 'border-tea-600 bg-tea-100'
                  : 'border-tea-200 bg-card hover:bg-tea-100/50'
              }`}
            >
              <input
                id={optionId}
                type="checkbox"
                className="h-5 w-5 shrink-0 accent-tea-700"
                checked={checked}
                onChange={() => toggle(option.value)}
              />
              <span className="text-lg text-ink">{option.label}</span>
            </label>
          )
        })}
        {field.allowOther ? (
          <div className="pt-1">
            <label
              htmlFor={`${field.id}-other`}
              className="mb-1 block text-base text-ink-soft"
            >
              อื่น ๆ (เขียนเอง)
            </label>
            <input
              id={`${field.id}-other`}
              type="text"
              className={inputClass}
              value={value?.other ?? ''}
              placeholder={field.otherPlaceholder}
              onChange={(e) =>
                onChange(
                  normalize({ values, other: e.target.value || undefined }),
                )
              }
            />
          </div>
        ) : null}
      </div>
    </FieldShell>
  )
}
