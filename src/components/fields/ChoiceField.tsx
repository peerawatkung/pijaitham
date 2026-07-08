import type { FieldDef } from '../../content/questions'
import type { ChoiceAnswer } from '../../types/form'
import { FieldShell, inputClass } from './FieldShell'

type ChoiceFieldDef = Extract<FieldDef, { type: 'choice' }>

interface ChoiceFieldProps {
  field: ChoiceFieldDef
  value: ChoiceAnswer | undefined
  onChange: (value: ChoiceAnswer | undefined) => void
}

export function ChoiceField({ field, value, onChange }: ChoiceFieldProps) {
  return (
    <FieldShell
      label={field.label}
      hint={field.hint}
      required={field.required}
      asFieldset
    >
      <div className="space-y-2">
        {field.options.map((option) => {
          const selected = value?.value === option.value
          const optionId = `${field.id}-${option.value}`
          return (
            <div key={option.value}>
              <label
                htmlFor={optionId}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
                  selected
                    ? 'border-tea-600 bg-tea-100'
                    : 'border-tea-200 bg-card hover:bg-tea-100/50'
                }`}
              >
                <input
                  id={optionId}
                  type="radio"
                  name={field.id}
                  className="h-5 w-5 shrink-0 accent-tea-700"
                  checked={selected}
                  onChange={() => onChange({ value: option.value })}
                />
                <span className="text-lg text-ink">{option.label}</span>
              </label>
              {selected && option.detail ? (
                <div className="mt-2 ml-9">
                  <label
                    htmlFor={`${optionId}-detail`}
                    className="mb-1 block text-base text-ink-soft"
                  >
                    {option.detail.label}
                  </label>
                  <input
                    id={`${optionId}-detail`}
                    type="text"
                    className={inputClass}
                    value={value?.detail ?? ''}
                    placeholder={option.detail.placeholder}
                    onChange={(e) =>
                      onChange({
                        value: option.value,
                        detail: e.target.value || undefined,
                      })
                    }
                  />
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
      {value ? (
        <button
          type="button"
          className="text-base text-ink-soft underline underline-offset-4 hover:text-ink"
          onClick={() => onChange(undefined)}
        >
          ขอคิดดูก่อน (ล้างคำตอบข้อนี้)
        </button>
      ) : null}
    </FieldShell>
  )
}
