import { useEffect } from 'react'
import { FAQ_DISCLAIMER, FAQ_ITEMS } from '../content/faq'
import { useForm } from '../state/FormContext'

/** หน้าคำถามพบบ่อย — accordion ด้วย <details> native (รองรับ keyboard/screen reader ในตัว) */
export function Faq() {
  const { goHome, goToStep } = useForm()

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [])

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
        คำถามพบบ่อย
      </h1>
      <p className="mt-2 text-lg leading-relaxed text-ink-soft">
        รวมคำตอบเรื่องผลทางกฎหมาย การใช้งาน และความเป็นส่วนตัว
      </p>

      <div className="mt-6 space-y-3">
        {FAQ_ITEMS.map((item) => (
          <details
            key={item.q}
            className="group rounded-xl border border-tea-200 bg-card"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-lg font-bold text-ink [&::-webkit-details-marker]:hidden">
              {item.q}
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 shrink-0 text-tea-700 transition-transform group-open:rotate-180"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m6 9 6 6 6-9" transform="translate(0 1) scale(1 0.85)" />
              </svg>
            </summary>
            <p className="whitespace-pre-line px-5 pb-5 text-base leading-relaxed text-ink sm:text-lg">
              {item.a}
            </p>
          </details>
        ))}
      </div>

      <p className="mt-8 text-sm leading-relaxed text-ink-soft">
        {FAQ_DISCLAIMER}
      </p>

      <button
        type="button"
        className="mt-8 w-full rounded-xl bg-tea-700 px-8 py-4 text-xl font-bold text-white shadow-sm transition-colors hover:bg-tea-600 focus:outline-none focus:ring-4 focus:ring-tea-600/40"
        onClick={() => goToStep(0)}
      >
        เริ่มเขียนเจตนาของฉัน
      </button>
    </main>
  )
}
