import type { FieldDef } from '../../content/questions'
import { FieldShell, inputClass } from './FieldShell'

type TextAreaFieldDef = Extract<FieldDef, { type: 'textarea' }>

interface TextAreaFieldProps {
  field: TextAreaFieldDef
  value: string | undefined
  onChange: (value: string | undefined) => void
}

export function TextAreaField({ field, value, onChange }: TextAreaFieldProps) {
  return (
    <FieldShell
      label={field.label}
      hint={field.hint}
      required={field.required}
      htmlFor={field.id}
    >
      <textarea
        id={field.id}
        className={inputClass}
        rows={field.rows ?? 4}
        value={value ?? ''}
        placeholder={field.placeholder}
        onChange={(e) => onChange(e.target.value || undefined)}
      />
    </FieldShell>
  )
}
