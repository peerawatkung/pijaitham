import { useEffect } from 'react'
import { HELP_PARENTS } from '../content/helpParents'
import { useForm } from '../state/FormContext'

/** หน้า "ช่วยพ่อแม่เขียน" — แนะนำลูกที่อยากนั่งทำเอกสารด้วยกันกับพ่อแม่ */
export function HelpParents() {
  const { goHome, goToStep, goToTalkGuide } = useForm()

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
        {HELP_PARENTS.title}
      </h1>
      <p className="mt-3 text-lg leading-relaxed text-ink-soft">
        {HELP_PARENTS.lead}
      </p>

      <blockquote className="mt-6 border-l-4 border-tea-600 bg-tea-100/60 px-5 py-4 text-lg font-bold leading-relaxed text-ink">
        {HELP_PARENTS.principle}
      </blockquote>

      <div className="mt-8 space-y-8">
        {HELP_PARENTS.sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-xl font-bold text-ink">{section.title}</h2>
            {'steps' in section ? (
              <ol className="mt-3 space-y-3">
                {section.steps.map((step, i) => (
                  <li
                    key={step}
                    className="flex items-start gap-4 rounded-xl border border-tea-200 bg-card p-4"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tea-100 text-lg font-bold text-tea-700"
                    >
                      {i + 1}
                    </span>
                    <span className="text-lg leading-relaxed text-ink">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <ul className="mt-3 list-disc space-y-2 pl-6 text-lg leading-relaxed text-ink">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      <p className="mt-10 text-xl font-bold leading-relaxed text-tea-700">
        {HELP_PARENTS.closing}
      </p>

      <button
        type="button"
        className="mt-8 w-full rounded-xl bg-tea-700 px-8 py-4 text-xl font-bold text-white shadow-sm transition-colors hover:bg-tea-600 focus:outline-none focus:ring-4 focus:ring-tea-600/40"
        onClick={() => goToStep(0)}
      >
        เริ่มทำด้วยกันเลย
      </button>
      <p className="mt-4 text-center text-base leading-relaxed text-ink-soft">
        ยังไม่เคยคุยเรื่องนี้กันมาก่อน —{' '}
        <button
          type="button"
          className="underline underline-offset-4 hover:text-ink"
          onClick={goToTalkGuide}
        >
          เริ่มจากคู่มือชวนครอบครัวคุย
        </button>
      </p>
    </main>
  )
}
