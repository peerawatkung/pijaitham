import { useEffect } from 'react'
import { ShareButton } from '../components/ShareButton'
import { APP_CONFIG } from '../config/app'
import { ABOUT_BLOCKS, ABOUT_TITLE } from '../content/about'
import type { AboutBlock } from '../content/about'
import { useForm } from '../state/FormContext'

/** เลือกวิธีแสดงผลตามชนิดของบล็อกเนื้อหา */
function Block({ block }: { block: AboutBlock }) {
  switch (block.type) {
    case 'p':
      return (
        <p className="whitespace-pre-line text-lg leading-relaxed text-ink">
          {block.text}
        </p>
      )
    case 'em':
      return (
        <p className="whitespace-pre-line text-xl font-bold leading-relaxed text-tea-700">
          {block.text}
        </p>
      )
    case 'h2':
      return (
        <h2 className="pt-4 text-2xl font-bold text-ink">{block.text}</h2>
      )
    case 'quote':
      return (
        <blockquote className="whitespace-pre-line border-l-4 border-tea-600 bg-tea-100/60 px-6 py-5 text-xl font-bold leading-relaxed text-ink">
          &ldquo;{block.text}&rdquo;
        </blockquote>
      )
    case 'callout':
      return (
        <div className="rounded-xl border border-dawn-100 bg-dawn-100/40 p-5">
          <p className="whitespace-pre-line text-lg leading-relaxed text-ink">
            {block.text}
          </p>
        </div>
      )
  }
}

/** หน้า "ทำไมต้องมีพิใจธรรม" — เรื่องราวเบื้องหลังและจุดประสงค์ */
export function About() {
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
        {ABOUT_TITLE}
      </h1>

      <article className="mt-8 space-y-6">
        {ABOUT_BLOCKS.map((block, i) => (
          <Block key={i} block={block} />
        ))}
      </article>

      <button
        type="button"
        className="mt-10 w-full rounded-xl bg-tea-700 px-8 py-4 text-xl font-bold text-white shadow-sm transition-colors hover:bg-tea-600 focus:outline-none focus:ring-4 focus:ring-tea-600/40"
        onClick={() => goToStep(0)}
      >
        เริ่มเขียนเจตนาของฉัน
      </button>

      <div className="mt-8 text-center">
        <p className="text-base leading-relaxed text-ink-soft">
          หรือส่งเรื่องราวนี้ให้คนที่คุณอยากชวนคุย
        </p>
        <div className="mt-3">
          <ShareButton />
        </div>
      </div>

      <div className="mt-10 rounded-xl border border-tea-200 bg-card p-5 text-center">
        <p className="text-base leading-relaxed text-ink">
          มีคำถาม ข้อเสนอแนะ หรือพบข้อผิดพลาด — ยินดีรับฟังเสมอ
        </p>
        <a
          href={`mailto:${APP_CONFIG.contactEmail}`}
          className="mt-1 inline-block text-lg font-bold text-tea-700 underline decoration-tea-200 underline-offset-4 transition-colors hover:decoration-tea-600"
        >
          {APP_CONFIG.contactEmail}
        </a>
      </div>
    </main>
  )
}
