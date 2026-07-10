import { useEffect } from 'react'
import {
  RESOURCE_GROUPS,
  RESOURCES_LEAD,
  RESOURCES_NOTE,
  RESOURCES_TITLE,
} from '../content/resources'
import { useForm } from '../state/FormContext'

/** หน้า "แหล่งข้อมูลเพิ่มเติม" — ลิงก์ไปหน่วยงานและองค์กรจริงที่ทำงานด้านนี้ */
export function Resources() {
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
        {RESOURCES_TITLE}
      </h1>
      <p className="mt-3 text-lg leading-relaxed text-ink-soft">
        {RESOURCES_LEAD}
      </p>

      {RESOURCE_GROUPS.map((group) => (
        <section key={group.title} className="mt-8">
          <h2 className="text-xl font-bold text-ink">{group.title}</h2>
          <ul className="mt-3 space-y-3">
            {group.links.map((link) => (
              <li
                key={link.url}
                className="rounded-xl border border-tea-200 bg-card p-5"
              >
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg font-bold text-tea-700 underline decoration-tea-200 underline-offset-4 transition-colors hover:decoration-tea-600"
                >
                  {link.name}
                </a>
                <span className="ml-2 text-sm text-ink-soft">
                  {link.domain}
                </span>
                <p className="mt-2 text-base leading-relaxed text-ink">
                  {link.description}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p className="mt-8 text-sm leading-relaxed text-ink-soft">
        {RESOURCES_NOTE}
      </p>

      <button
        type="button"
        className="mt-10 w-full rounded-xl bg-tea-700 px-8 py-4 text-xl font-bold text-white shadow-sm transition-colors hover:bg-tea-600 focus:outline-none focus:ring-4 focus:ring-tea-600/40"
        onClick={() => goToStep(0)}
      >
        เริ่มเขียนเจตนาของฉัน
      </button>
    </main>
  )
}
