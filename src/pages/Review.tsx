import { useEffect } from 'react'
import { BackLink } from '../components/BackLink'
import { SECTIONS } from '../content/questions'
import { formatAnswer } from '../lib/formatAnswer'
import { useForm } from '../state/FormContext'

/** ข้อความในหน้าตรวจทานสำหรับข้อที่เว้นไว้ (ใน PDF จะเป็นเส้น/ช่องติ๊กว่าง) */
const SKIPPED_TEXT = 'เว้นว่างไว้ — ในเอกสารจะเว้นที่ให้เขียนด้วยปากกาภายหลัง'

export function Review() {
  const { answers, goToStep, goHome, goToStoreChoice } = useForm()

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [])

  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <header className="space-y-3">
        <BackLink onClick={goHome} />
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">
          ตรวจทานคำตอบของคุณ
        </h1>
        <p className="text-lg leading-relaxed text-ink-soft">
          อ่านทบทวนอีกครั้งก่อนสร้างเอกสาร — แก้ไขส่วนไหนได้ทุกเมื่อ
        </p>
        <p className="text-lg leading-relaxed text-ink-soft">
          ข้อที่เว้นไว้จะมีเส้นและช่องติ๊กว่างในเอกสาร
          ให้เขียนด้วยปากกาภายหลังได้
        </p>
      </header>

      <div className="mt-8 space-y-6">
        {SECTIONS.map((section, index) => (
          <section
            key={section.id}
            className="rounded-xl border border-tea-200 bg-card p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-xl font-bold text-ink">
                ส่วนที่ {section.number}: {section.title}
              </h2>
              <button
                type="button"
                className="inline-flex min-h-[44px] shrink-0 items-center whitespace-nowrap rounded-lg border border-tea-200 px-4 py-1.5 text-base text-ink transition-colors hover:bg-tea-100 focus:outline-none focus:ring-2 focus:ring-tea-600/30"
                onClick={() => goToStep(index)}
              >
                แก้ไข
              </button>
            </div>
            <dl className="mt-4 space-y-4">
              {section.fields
                .filter(
                  (field) =>
                    !(
                      field.hiddenWhenChecked &&
                      answers[field.hiddenWhenChecked] === true
                    ),
                )
                .map((field) => {
                  const text = formatAnswer(field, answers[field.id])
                  return (
                    <div key={field.id}>
                      <dt className="text-base font-bold text-ink-soft">
                        {field.label}
                      </dt>
                      <dd
                        className={`mt-0.5 whitespace-pre-wrap text-lg leading-relaxed ${
                          text ? 'text-ink' : 'text-ink-soft'
                        }`}
                      >
                        {text ?? SKIPPED_TEXT}
                      </dd>
                    </div>
                  )
                })}
            </dl>
          </section>
        ))}
      </div>

      {/* ---- เสร็จแล้ว → ไปเลือกวิธีเก็บ (ออนไลน์ / กระดาษ) เป็นขั้นถัดไป ---- */}
      <div className="mt-10">
        <button
          type="button"
          className="w-full rounded-xl bg-tea-700 px-8 py-4 text-xl font-bold text-white shadow-sm transition-colors hover:bg-tea-600 focus:outline-none focus:ring-4 focus:ring-tea-600/40"
          onClick={goToStoreChoice}
        >
          ถัดไป: เลือกวิธีเก็บเอกสาร
        </button>
      </div>
    </main>
  )
}
