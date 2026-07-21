import { useEffect } from 'react'
import {
  FOR_DOCTORS_LEAD,
  FOR_DOCTORS_NOTE,
  FOR_DOCTORS_REFERENCES,
  FOR_DOCTORS_SECTIONS,
  FOR_DOCTORS_TITLE,
} from '../content/forDoctors'
import { useForm } from '../state/FormContext'

/**
 * หน้า "สำหรับแพทย์และบุคลากรสาธารณสุข" — ปลายทางของ QR บนการ์ดพกกระเป๋า
 * หน้าปก PDF และใบปะหน้าเวชระเบียน อธิบายเอกสารให้ผู้รับเข้าใจใน 1 หน้า
 */
export function ForDoctors() {
  const { goHome } = useForm()

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
        {FOR_DOCTORS_TITLE}
      </h1>
      <p className="mt-3 text-lg leading-relaxed text-ink-soft">
        {FOR_DOCTORS_LEAD}
      </p>

      {FOR_DOCTORS_SECTIONS.map((section) => (
        <section key={section.title} className="mt-8">
          <h2 className="text-xl font-bold text-ink">{section.title}</h2>
          {section.paragraphs?.map((text) => (
            <p key={text} className="mt-3 text-lg leading-relaxed text-ink">
              {text}
            </p>
          ))}
          {section.items ? (
            <ul className="mt-3 space-y-2">
              {section.items.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-lg leading-relaxed text-ink"
                >
                  <span aria-hidden="true" className="mt-0.5 text-tea-700">
                    •
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {section.highlight ? (
            <blockquote className="mt-4 border-l-4 border-tea-600 bg-tea-100/60 px-5 py-4 text-lg font-bold leading-relaxed text-ink">
              {section.highlight}
            </blockquote>
          ) : null}
        </section>
      ))}

      <section className="mt-8">
        <h2 className="text-xl font-bold text-ink">แหล่งอ้างอิงทางการ</h2>
        <ul className="mt-3 space-y-3">
          {FOR_DOCTORS_REFERENCES.map((link) => (
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
              <span className="ml-2 text-sm text-ink-soft">{link.domain}</span>
              <p className="mt-2 text-base leading-relaxed text-ink">
                {link.description}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-8 text-sm leading-relaxed text-ink-soft">
        {FOR_DOCTORS_NOTE}
      </p>
    </main>
  )
}
