import { useEffect } from 'react'
import { SECTIONS } from '../content/questions'
import { usePdfDownload } from '../hooks/usePdfDownload'
import { exportDraft } from '../lib/draft'
import { formatAnswer } from '../lib/formatAnswer'
import { useForm } from '../state/FormContext'

/** ข้อความในหน้าตรวจทานสำหรับข้อที่เว้นไว้ (ใน PDF จะเป็นเส้น/ช่องติ๊กว่าง) */
const SKIPPED_TEXT = 'เว้นว่างไว้ — มีช่องให้เขียนด้วยปากกาในเอกสาร'

export function Review() {
  const { answers, goToStep, goHome, goToDone } = useForm()
  // ดาวน์โหลดสำเร็จ → พาไปหน้า "ขั้นตอนถัดไป"
  const {
    generating,
    error: pdfError,
    download: handleDownloadPdf,
  } = usePdfDownload(answers, goToDone)

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [])

  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <header className="space-y-3">
        <button
          type="button"
          className="text-base text-ink-soft underline underline-offset-4 hover:text-ink"
          onClick={goHome}
        >
          กลับหน้าแรก
        </button>
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">
          ตรวจทานคำตอบของคุณ
        </h1>
        <p className="text-lg leading-relaxed text-ink-soft">
          อ่านทบทวนอีกครั้งก่อนสร้างเอกสาร — แก้ไขส่วนไหนได้ทุกเมื่อ
          ข้อที่เว้นไว้จะมีเส้นและช่องติ๊กว่างในเอกสาร ให้เขียนด้วยปากกาได้
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
                className="shrink-0 rounded-lg border border-tea-200 px-4 py-1.5 text-base text-ink transition-colors hover:bg-tea-100 focus:outline-none focus:ring-2 focus:ring-tea-600/30"
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

      <div className="mt-10 space-y-3">
        <button
          type="button"
          disabled={generating}
          className="w-full rounded-xl bg-tea-700 px-8 py-4 text-xl font-bold text-white shadow-sm transition-colors hover:bg-tea-600 focus:outline-none focus:ring-4 focus:ring-tea-600/40 disabled:cursor-wait disabled:opacity-60"
          onClick={() => void handleDownloadPdf()}
        >
          {generating ? 'กำลังสร้างเอกสาร...' : 'ดาวน์โหลด PDF'}
        </button>
        {pdfError ? (
          <p role="alert" className="text-center text-lg text-red-700">
            {pdfError}
          </p>
        ) : null}
        <button
          type="button"
          className="w-full rounded-xl border border-tea-200 px-8 py-4 text-xl text-ink transition-colors hover:bg-tea-100 focus:outline-none focus:ring-4 focus:ring-tea-600/30"
          onClick={() => exportDraft(answers)}
        >
          ดาวน์โหลดแบบร่าง (.json) ไว้ทำต่อภายหลัง
        </button>
      </div>
    </main>
  )
}
