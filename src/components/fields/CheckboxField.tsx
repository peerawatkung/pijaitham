import type { FieldDef } from '../../content/questions'

type CheckboxFieldDef = Extract<FieldDef, { type: 'checkbox' }>

interface CheckboxFieldProps {
  field: CheckboxFieldDef
  value: boolean | undefined
  onChange: (value: boolean | undefined) => void
}

export function CheckboxField({ field, value, onChange }: CheckboxFieldProps) {
  const checked = value === true
  return (
    <div className="space-y-2">
      <label
        htmlFor={field.id}
        className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 transition-colors ${
          checked
            ? 'border-tea-600 bg-tea-100'
            : 'border-tea-200 bg-card hover:bg-tea-100/50'
        }`}
      >
        <input
          id={field.id}
          type="checkbox"
          className="mt-1 h-5 w-5 shrink-0 accent-tea-700"
          checked={checked}
          onChange={(e) => onChange(e.target.checked ? true : undefined)}
        />
        <span className="text-lg font-bold text-ink">{field.label}</span>
      </label>
      {field.hint ? (
        <p className="text-base text-ink-soft">{field.hint}</p>
      ) : null}
    </div>
  )
}
