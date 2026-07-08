import type { FieldDef } from '../../content/questions'
import { FieldShell, inputClass } from './FieldShell'

type TextFieldDef = Extract<FieldDef, { type: 'text' }>

interface TextFieldProps {
  field: TextFieldDef
  value: string | undefined
  onChange: (value: string | undefined) => void
}

export function TextField({ field, value, onChange }: TextFieldProps) {
  return (
    <FieldShell
      label={field.label}
      hint={field.hint}
      required={field.required}
      htmlFor={field.id}
    >
      <input
        id={field.id}
        type="text"
        className={inputClass}
        value={value ?? ''}
        placeholder={field.placeholder}
        onChange={(e) => onChange(e.target.value || undefined)}
      />
    </FieldShell>
  )
}
