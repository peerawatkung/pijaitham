import { useEffect, useRef } from 'react'
import { FieldRenderer } from '../components/wizard/FieldRenderer'
import { ProgressBar } from '../components/wizard/ProgressBar'
import { SECTIONS, TOTAL_STEPS } from '../content/questions'
import { exportDraft } from '../lib/draft'
import { useForm } from '../state/FormContext'

interface WizardProps {
  step: number
}

export function Wizard({ step }: WizardProps) {
  const { answers, setAnswer, goHome, goToStep, goToReview } = useForm()
  const section = SECTIONS[step]
  const headingRef = useRef<HTMLHeadingElement>(null)

  // เปลี่ยน step แล้วเลื่อนขึ้นบนสุด + ย้าย focus ไปหัวข้อ เพื่อ screen reader รับรู้
  useEffect(() => {
    window.scrollTo({ top: 0 })
    headingRef.current?.focus()
  }, [step])

  const isFirst = step === 0
  const isLast = step === TOTAL_STEPS - 1

  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <header className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            className="text-base text-ink-soft underline underline-offset-4 hover:text-ink"
            onClick={goHome}
          >
            กลับหน้าแรก
          </button>
          <button
            type="button"
            className="text-base text-ink-soft underline underline-offset-4 hover:text-ink"
            onClick={() => exportDraft(answers)}
          >
            บันทึกแบบร่างลงเครื่อง
          </button>
        </div>
        <ProgressBar current={step} />
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-2xl font-bold text-ink focus:outline-none sm:text-3xl"
        >
          ส่วนที่ {section.number}: {section.title}
        </h1>
        <p className="text-lg leading-relaxed text-ink-soft">{section.intro}</p>
        {section.preamble ? (
          <div className="rounded-xl border-2 border-tea-600 bg-tea-100 p-5">
            <p className="text-lg font-bold leading-relaxed text-ink">
              {section.preamble}
            </p>
          </div>
        ) : null}
      </header>

      <div className="mt-8 space-y-8">
        {section.fields
          // ซ่อน field ที่ผู้ใช้เลือก "ปริ้นไปเขียนเอง" — ในเอกสารจะเว้นเส้นให้เขียนด้วยมือ
          .filter(
            (field) =>
              !(
                field.hiddenWhenChecked &&
                answers[field.hiddenWhenChecked] === true
              ),
          )
          .map((field) => (
            <FieldRenderer
              key={field.id}
              field={field}
              value={answers[field.id]}
              onChange={(value) => setAnswer(field.id, value)}
            />
          ))}
      </div>

      {section.footnote ? (
        <div className="mt-8 rounded-xl border border-dawn-100 bg-dawn-100/40 p-5">
          <p className="text-base leading-relaxed text-ink">
            {section.footnote}
          </p>
        </div>
      ) : null}

      <nav className="mt-10 flex items-center justify-between gap-4">
        <button
          type="button"
          className="rounded-xl border border-tea-200 px-6 py-3 text-lg text-ink transition-colors hover:bg-tea-100 focus:outline-none focus:ring-4 focus:ring-tea-600/30"
          onClick={() => (isFirst ? goHome() : goToStep(step - 1))}
        >
          ย้อนกลับ
        </button>
        <button
          type="button"
          className="rounded-xl bg-tea-700 px-8 py-3 text-lg font-bold text-white shadow-sm transition-colors hover:bg-tea-600 focus:outline-none focus:ring-4 focus:ring-tea-600/40"
          onClick={() => (isLast ? goToReview() : goToStep(step + 1))}
        >
          {isLast ? 'ไปหน้าตรวจทาน' : 'ถัดไป'}
        </button>
      </nav>

      <p className="mt-6 text-center text-base text-ink-soft">
        ข้อไหนยังไม่พร้อมตอบ เว้นไว้ก่อนได้เสมอ —
        ข้อที่เว้นไว้จะมีเส้นว่างในเอกสาร ให้เขียนด้วยปากกาภายหลังได้
      </p>
    </main>
  )
}
