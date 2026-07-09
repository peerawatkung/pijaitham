import { useEffect, useState } from 'react'
import { SECTIONS } from '../content/questions'
import { SAMPLE_ANSWERS } from '../content/sampleAnswers'
import { formatAnswer } from '../lib/formatAnswer'
import { useForm } from '../state/FormContext'

/** ข้อความสำหรับข้อที่ตัวอย่างเว้นไว้ */
const SKIPPED_TEXT = 'เว้นว่างไว้ — ในเอกสารจะมีเส้นให้เขียนด้วยปากกา'

/**
 * หน้าตัวอย่างเอกสารแบบ HTML — อ่านสบายบนมือถือ (PDF ย่อทั้งหน้า A4 ตัวจะเล็ก)
 * มีปุ่มเปิดไฟล์ PDF จริงสำหรับคนอยากเห็นหน้าตาเอกสารพร้อมปริ้น
 */
export function Sample() {
  const { goHome, goToStep } = useForm()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [])

  const handleOpenPdf = async () => {
    setBusy(true)
    setError(null)
    try {
      const { openSamplePdf } = await import('../lib/pdf/generator')
      await openSamplePdf()
    } catch (err) {
      console.error(err)
      const { downloadErrorMessage } = await import('../lib/browser')
      setError(downloadErrorMessage())
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <button
        type="button"
        className="text-base text-ink-soft underline underline-offset-4 hover:text-ink"
        onClick={goHome}
      >
        กลับหน้าแรก
      </button>
      <h1 className="mt-4 text-2xl font-bold text-ink sm:text-3xl">
        ตัวอย่างเอกสารที่กรอกเสร็จแล้ว
      </h1>
      <p className="mt-2 text-lg leading-relaxed text-ink-soft">
        ตัวอย่างสมมติของ &ldquo;สมศรี ใจดี&rdquo; เพื่อให้เห็นภาพว่าเอกสารฉบับ
        สมบูรณ์บอกเล่าอะไรบ้าง — บุคคลและข้อมูลทั้งหมดไม่มีอยู่จริง
      </p>

      <button
        type="button"
        disabled={busy}
        className="mt-5 rounded-xl border border-tea-200 px-6 py-3 text-lg text-ink transition-colors hover:bg-tea-100 focus:outline-none focus:ring-4 focus:ring-tea-600/30 disabled:cursor-wait disabled:opacity-60"
        onClick={() => void handleOpenPdf()}
      >
        {busy ? 'กำลังสร้างเอกสาร...' : 'เปิดฉบับ PDF (หน้าตาจริงพร้อมปริ้น)'}
      </button>
      {error ? (
        <p role="alert" className="mt-2 text-lg text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mt-8 space-y-6">
        {SECTIONS.map((section) => (
          <section
            key={section.id}
            className="rounded-xl border border-tea-200 bg-card p-5"
          >
            <h2 className="text-xl font-bold text-ink">
              ส่วนที่ {section.number}: {section.title}
            </h2>
            <dl className="mt-4 space-y-4">
              {section.fields
                .filter((field) => !field.webOnly)
                .map((field) => {
                  const text = formatAnswer(field, SAMPLE_ANSWERS[field.id])
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

      <p className="mt-6 text-base leading-relaxed text-ink-soft">
        ในไฟล์ PDF จริงยังมีหน้าปก หน้าลงนามพร้อมพยาน 2 คน
        และภาคผนวกคำแนะนำหลังปริ้นให้ครบถ้วน
      </p>

      <button
        type="button"
        className="mt-6 w-full rounded-xl bg-tea-700 px-8 py-4 text-xl font-bold text-white shadow-sm transition-colors hover:bg-tea-600 focus:outline-none focus:ring-4 focus:ring-tea-600/40"
        onClick={() => goToStep(0)}
      >
        เริ่มเขียนเจตนาของฉันบ้าง
      </button>
    </main>
  )
}
