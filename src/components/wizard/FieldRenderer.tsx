import type { FieldDef } from '../../content/questions'
import type {
  AnswerValue,
  ChoiceAnswer,
  MultiChoiceAnswer,
  PersonAnswer,
} from '../../types/form'
import { CheckboxField } from '../fields/CheckboxField'
import { ChoiceField } from '../fields/ChoiceField'
import { MultiSelectField } from '../fields/MultiSelectField'
import { PersonField } from '../fields/PersonField'
import { TextAreaField } from '../fields/TextAreaField'
import { TextField } from '../fields/TextField'

interface FieldRendererProps {
  field: FieldDef
  value: AnswerValue | undefined
  onChange: (value: AnswerValue | undefined) => void
}

/** เลือกคอมโพเนนต์ตามชนิดของคำถามใน questions.ts */
export function FieldRenderer({ field, value, onChange }: FieldRendererProps) {
  switch (field.type) {
    case 'text':
      return (
        <TextField
          field={field}
          value={value as string | undefined}
          onChange={onChange}
        />
      )
    case 'textarea':
      return (
        <TextAreaField
          field={field}
          value={value as string | undefined}
          onChange={onChange}
        />
      )
    case 'choice':
      return (
        <ChoiceField
          field={field}
          value={value as ChoiceAnswer | undefined}
          onChange={onChange}
        />
      )
    case 'multichoice':
      return (
        <MultiSelectField
          field={field}
          value={value as MultiChoiceAnswer | undefined}
          onChange={onChange}
        />
      )
    case 'person':
      return (
        <PersonField
          field={field}
          value={value as PersonAnswer | undefined}
          onChange={onChange}
        />
      )
    case 'checkbox':
      return (
        <CheckboxField
          field={field}
          value={value as boolean | undefined}
          onChange={onChange}
        />
      )
  }
}
