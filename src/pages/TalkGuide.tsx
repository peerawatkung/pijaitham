import { useEffect, useState } from 'react'
import { TALK_GUIDE } from '../content/talkGuide'
import { useForm } from '../state/FormContext'

/** คู่มือ "ชวนครอบครัวคุยอย่างไร" — พร้อมดาวน์โหลดเป็น PDF ส่งต่อได้ */
export function TalkGuide() {
  const { goHome, goToStep, goToHelpParents } = useForm()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [])

  const handleDownloadPdf = async () => {
    setBusy(true)
    setError(null)
    try {
      const { downloadTalkGuidePdf } = await import('../lib/pdf/talkGuidePdf')
      await downloadTalkGuidePdf()
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
        {TALK_GUIDE.title}
      </h1>
      <p className="mt-3 text-lg leading-relaxed text-ink-soft">
        {TALK_GUIDE.lead}
      </p>

      <button
        type="button"
        disabled={busy}
        className="mt-5 rounded-xl border border-tea-200 px-6 py-3 text-lg text-ink transition-colors hover:bg-tea-100 focus:outline-none focus:ring-4 focus:ring-tea-600/30 disabled:cursor-wait disabled:opacity-60"
        onClick={() => void handleDownloadPdf()}
      >
        {busy
          ? 'กำลังสร้างเอกสาร...'
          : 'ดาวน์โหลดคู่มือเป็น PDF (ส่งต่อให้พี่น้องได้)'}
      </button>
      {error ? (
        <p role="alert" className="mt-2 text-lg text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mt-8 space-y-8">
        {TALK_GUIDE.sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-xl font-bold text-ink">{section.title}</h2>
            {section.intro ? (
              <p className="mt-2 text-lg leading-relaxed text-ink-soft">
                {section.intro}
              </p>
            ) : null}
            {section.items ? (
              <ul className="mt-3 list-disc space-y-2 pl-6 text-lg leading-relaxed text-ink">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
            {section.quotes ? (
              <div className="mt-3 space-y-3">
                {section.quotes.map((quote) => (
                  <blockquote
                    key={quote}
                    className="rounded-xl border-l-4 border-tea-600 bg-tea-100/60 px-5 py-4 text-lg leading-relaxed text-ink"
                  >
                    &ldquo;{quote}&rdquo;
                  </blockquote>
                ))}
              </div>
            ) : null}
          </section>
        ))}
      </div>

      <p className="mt-10 text-xl font-bold leading-relaxed text-tea-700">
        {TALK_GUIDE.closing}
      </p>

      <button
        type="button"
        className="mt-8 w-full rounded-xl bg-tea-700 px-8 py-4 text-xl font-bold text-white shadow-sm transition-colors hover:bg-tea-600 focus:outline-none focus:ring-4 focus:ring-tea-600/40"
        onClick={() => goToStep(0)}
      >
        เริ่มเขียนเจตนาของฉัน
      </button>
      <p className="mt-4 text-center text-base leading-relaxed text-ink-soft">
        อยากนั่งทำด้วยกันกับพ่อแม่ —{' '}
        <button
          type="button"
          className="underline underline-offset-4 hover:text-ink"
          onClick={goToHelpParents}
        >
          ดูคำแนะนำช่วยพ่อแม่เขียน
        </button>
      </p>
    </main>
  )
}
