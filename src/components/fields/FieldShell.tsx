import type { ReactNode } from 'react'

interface FieldShellProps {
  label: string
  hint?: string
  required?: boolean
  /** id ของ input หลัก สำหรับ htmlFor (เว้นได้ถ้าเป็น fieldset) */
  htmlFor?: string
  /** ใช้ fieldset/legend แทน label (สำหรับกลุ่ม radio/checkbox) */
  asFieldset?: boolean
  children: ReactNode
}

/** กรอบมาตรฐานของทุกคำถาม: label + hint + เนื้อหา field */
export function FieldShell({
  label,
  hint,
  required,
  htmlFor,
  asFieldset,
  children,
}: FieldShellProps) {
  const heading = (
    <>
      <span className="text-lg font-bold text-ink">{label}</span>
      {required ? (
        <span className="ml-2 text-sm font-normal text-tea-700">(จำเป็น)</span>
      ) : null}
    </>
  )

  if (asFieldset) {
    return (
      <fieldset className="space-y-2">
        <legend className="leading-relaxed">{heading}</legend>
        {hint ? <p className="text-base text-ink-soft">{hint}</p> : null}
        {children}
      </fieldset>
    )
  }

  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="block leading-relaxed">
        {heading}
      </label>
      {hint ? <p className="text-base text-ink-soft">{hint}</p> : null}
      {children}
    </div>
  )
}

/** สไตล์ร่วมของ input/textarea */
export const inputClass =
  'w-full rounded-lg border border-tea-200 bg-card px-4 py-3 text-lg text-ink placeholder:text-ink-soft/50 focus:border-tea-600 focus:outline-none focus:ring-2 focus:ring-tea-600/30'
