import { useEffect } from 'react'
import { BackLink } from '../components/BackLink'
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
      <BackLink onClick={goHome} />
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
            {/* คำตอบยาวแบ่งเป็นย่อหน้าจริงตาม \n — มีระยะห่างให้พักสายตา */}
            <div className="space-y-3 px-5 pb-5">
              {item.a
                .split('\n')
                .filter((para) => para.trim() !== '')
                .map((para, i) => (
                  // key ตาม index ปลอดภัย: เนื้อหา FAQ เป็น static ไม่ reorder
                  <p
                    key={i}
                    className="text-base leading-relaxed text-ink sm:text-lg"
                  >
                    {para}
                  </p>
                ))}
            </div>
          </details>
        ))}
      </div>

      <p className="mt-8 text-base leading-relaxed text-ink-soft">
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
