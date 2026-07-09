import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { ShareButton } from '../components/ShareButton'
import { APP_CONFIG } from '../config/app'
import { DraftError, readDraftFile } from '../lib/draft'
import { useForm } from '../state/FormContext'

const WHY_CARDS = [
  {
    title: 'บอกแทนคุณ ในวันที่คุณบอกเองไม่ได้',
    body: 'หากถึงวันที่คุณสื่อสารไม่ได้ เอกสารนี้จะพูดแทนใจคุณกับแพทย์และครอบครัว ว่าคุณต้องการหรือไม่ต้องการการรักษาแบบใดในวาระสุดท้าย',
  },
  {
    title: 'ปลดภาระให้คนที่คุณรัก',
    body: 'ครอบครัวไม่ต้องเดาใจ และไม่ต้องแบกการตัดสินใจที่ยากที่สุดไว้เพียงลำพัง เพราะคุณได้บอกความตั้งใจไว้ล่วงหน้าแล้ว',
  },
  {
    title: 'เป็นสิทธิตามกฎหมายไทย',
    body: 'หนังสือแสดงเจตนาเป็นสิทธิตามมาตรา 12 พ.ร.บ.สุขภาพแห่งชาติ พ.ศ. 2550 เมื่อลงนามพร้อมพยานครบถ้วน',
  },
] as const

// ขั้นที่ 3–4 ให้สอดคล้องกับ "ขั้นตอนหลังพิมพ์เอกสาร" ในหน้า Done (pdfText.appendix.afterPrintSteps)
const HOW_STEPS = [
  'ค่อย ๆ ตอบคำถาม 7 ส่วน ใช้เวลาราว 15–30 นาที ทุกข้อข้ามได้ ไม่ต้องรีบ',
  'ตรวจทานคำตอบ แล้วดาวน์โหลดเป็นไฟล์ PDF ภาษาไทยที่จัดหน้าพร้อมปริ้น',
  'ปริ้น แล้วลงนามพร้อมพยาน 2 คน และบอกครอบครัวว่าคุณทำเอกสารนี้ไว้',
  'มอบสำเนาให้ผู้ตัดสินใจแทนและโรงพยาบาลที่รักษาประจำ ส่วนต้นฉบับเก็บในที่ที่หาง่าย',
] as const

export function Home() {
  const {
    goToStep,
    goToFaq,
    goToSample,
    goToAbout,
    goToTalkGuide,
    loadAnswers,
  } = useForm()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [blankBusy, setBlankBusy] = useState(false)
  const [blankError, setBlankError] = useState<string | null>(null)

  const handleBlankForm = async () => {
    setBlankBusy(true)
    setBlankError(null)
    try {
      // โหลด PDF engine เฉพาะเมื่อกดปุ่ม — ไม่ถ่วง bundle หลัก
      const { downloadBlankPdf } = await import('../lib/pdf/generator')
      await downloadBlankPdf()
    } catch (err) {
      console.error(err)
      const { downloadErrorMessage } = await import('../lib/browser')
      setBlankError(downloadErrorMessage())
    } finally {
      setBlankBusy(false)
    }
  }

  const handleDraftFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // ให้เลือกไฟล์เดิมซ้ำได้หลังแก้ไข
    if (!file) return
    setImportError(null)
    try {
      const answers = await readDraftFile(file)
      loadAnswers(answers)
      goToStep(0)
    } catch (err) {
      setImportError(
        err instanceof DraftError
          ? err.message
          : 'เปิดไฟล์ไม่สำเร็จ กรุณาลองอีกครั้ง',
      )
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-5 pb-14">
      {/* ---- Hero ---- */}
      <section className="flex flex-col items-center pt-4 text-center sm:pt-6">
        <h1 className="sr-only">
          {APP_CONFIG.name} ({APP_CONFIG.englishName}) — {APP_CONFIG.tagline}
        </h1>
        {/* โลโก้พื้นโปร่งใส (ประมวลผลจาก Logo_Pijaitham.png ต้นฉบับ) — กลืนกับพื้นเว็บทุกสี */}
        <img
          src={`${import.meta.env.BASE_URL}logo.png`}
          alt=""
          aria-hidden="true"
          width={640}
          height={640}
          className="h-auto w-72 sm:w-80"
        />
        <p className="mt-2 max-w-xl text-2xl font-bold leading-snug text-tea-700 sm:text-3xl">
          บอกความตั้งใจไว้ล่วงหน้า ในวันที่ยังบอกได้
        </p>
        <p className="mt-4 max-w-lg text-lg leading-relaxed text-ink sm:text-xl">
          เพื่อให้คนที่คุณรักดูแลคุณได้ตรงใจ ไม่ต้องเดา
          และไม่ต้องแบกการตัดสินใจที่ยากที่สุดไว้เพียงลำพัง
        </p>
        <p className="mt-5 inline-flex items-center gap-2.5 rounded-full border border-tea-200 bg-tea-100 px-5 py-2.5 text-base font-bold text-tea-700">
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="4" y="11" width="16" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
          เว็บไซต์นี้ไม่มีการเก็บข้อมูลใด ๆ ของผู้ใช้ทั้งสิ้น
        </p>
      </section>

      {/* ---- พิใจธรรมคืออะไร ---- */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold text-ink">
          {APP_CONFIG.name}คืออะไร
        </h2>
        <p className="mt-3 text-lg leading-relaxed text-ink">
          {APP_CONFIG.name}คือเครื่องมือช่วยเขียน
          &ldquo;หนังสือแสดงเจตนา&rdquo; (Living Will) —
          เอกสารที่บอกไว้ล่วงหน้าว่า ในช่วงท้ายของชีวิต
          คุณอยากให้ดูแลรักษาอย่างไร
        </p>
        <p className="mt-4 text-lg leading-relaxed text-ink">
          ในเอกสาร คุณจะได้บอกสิ่งสำคัญ 3 เรื่อง:
        </p>
        <ul className="mt-2 list-disc space-y-1.5 pl-6 text-lg leading-relaxed text-ink">
          <li>การรักษาที่ต้องการ และไม่ต้องการ ในวาระสุดท้าย</li>
          <li>คนที่คุณไว้วางใจให้ตัดสินใจแทน เมื่อคุณสื่อสารเองไม่ได้</li>
          <li>ข้อความจากใจ ถึงคนที่คุณรัก</li>
        </ul>
        <p className="mt-4 text-lg leading-relaxed text-ink">
          เพียงตอบคำถามทีละขั้นด้วยคำถามที่อ่อนโยน
          แล้วเราจะเรียบเรียงทุกคำตอบเป็นเอกสารที่สวยงาม
          พร้อมปริ้นไปลงนามให้มีผลจริงตามกฎหมาย
        </p>
        <button
          type="button"
          className="mt-4 rounded-xl border border-tea-200 px-6 py-3 text-lg text-ink transition-colors hover:bg-tea-100 focus:outline-none focus:ring-4 focus:ring-tea-600/30"
          onClick={goToSample}
        >
          ดูตัวอย่างเอกสารที่เสร็จแล้ว
        </button>
      </section>

      {/* ---- ทำไมจึงสำคัญ ---- */}
      <section className="mt-10">
        <h2 className="text-2xl font-bold text-ink">ทำไมเอกสารนี้จึงมีความหมาย</h2>
        <div className="mt-4 space-y-4">
          {WHY_CARDS.map((card) => (
            <div
              key={card.title}
              className="rounded-xl border border-tea-200 bg-card p-5"
            >
              <h3 className="text-lg font-bold text-tea-700">{card.title}</h3>
              <p className="mt-1 text-base leading-relaxed text-ink">
                {card.body}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-base leading-relaxed text-ink-soft">
          พิใจธรรมเกิดจากเรื่องจริงของครอบครัวหนึ่ง —{' '}
          <button
            type="button"
            className="underline underline-offset-4 hover:text-ink"
            onClick={goToAbout}
          >
            อ่านเรื่องราวเบื้องหลัง
          </button>
        </p>
      </section>

      {/* ---- ใช้งานอย่างไร ---- */}
      <section className="mt-10">
        <h2 className="text-2xl font-bold text-ink">ใช้งานเป็น 4 ขั้นตอน</h2>
        <ol className="mt-4 space-y-3">
          {HOW_STEPS.map((step, i) => (
            <li key={step} className="flex items-start gap-4">
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tea-100 text-lg font-bold text-tea-700"
              >
                {i + 1}
              </span>
              <span className="text-lg leading-relaxed text-ink">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* ---- คำถามพบบ่อย ---- */}
      <section className="mt-10 flex flex-col items-start justify-between gap-3 rounded-xl border border-tea-200 bg-card p-5 sm:flex-row sm:items-center">
        <p className="text-base leading-relaxed text-ink">
          มีข้อสงสัย? เรารวมคำตอบเรื่องผลทางกฎหมาย การใช้งาน
          และความเป็นส่วนตัวไว้ให้แล้ว
        </p>
        <button
          type="button"
          className="shrink-0 rounded-xl border border-tea-200 px-6 py-3 text-lg text-ink transition-colors hover:bg-tea-100 focus:outline-none focus:ring-4 focus:ring-tea-600/30"
          onClick={goToFaq}
        >
          อ่านคำถามพบบ่อย
        </button>
      </section>

      {/* ---- คู่มือชวนครอบครัวคุย ---- */}
      <section className="mt-4 flex flex-col items-start justify-between gap-3 rounded-xl border border-tea-200 bg-card p-5 sm:flex-row sm:items-center">
        <p className="text-base leading-relaxed text-ink">
          ไม่รู้จะเริ่มคุยกับพ่อแม่หรือครอบครัวยังไง?
          เรามีคู่มือพร้อมประโยคเปิดบทสนทนาให้
        </p>
        <button
          type="button"
          className="shrink-0 rounded-xl border border-tea-200 px-6 py-3 text-lg text-ink transition-colors hover:bg-tea-100 focus:outline-none focus:ring-4 focus:ring-tea-600/30"
          onClick={goToTalkGuide}
        >
          อ่านคู่มือชวนคุย
        </button>
      </section>

      {/* ---- คำมั่นเรื่องความเป็นส่วนตัว ---- */}
      <section className="mt-10 rounded-xl border border-dawn-100 bg-dawn-100/40 p-5">
        <h2 className="text-lg font-bold text-ink">
          คำมั่นเรื่องความเป็นส่วนตัว
        </h2>
        <p className="mt-2 text-base font-bold leading-relaxed text-ink">
          {APP_CONFIG.name}ไม่มีการเก็บข้อมูลใด ๆ ของผู้ใช้ทั้งสิ้น —
          ทุกตัวอักษรที่คุณพิมพ์อยู่ในเครื่องของคุณเท่านั้น
          และไม่มีใครเห็นนอกจากคุณ
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-6 text-base leading-relaxed text-ink">
          <li>ทุกอย่างเกิดขึ้นในเครื่องของคุณ — ไม่มีข้อมูลใดถูกส่งออกไปที่ใด</li>
          <li>ไม่มีบัญชีผู้ใช้ ไม่มีการล็อกอิน ไม่มีการเก็บข้อมูลบนเซิร์ฟเวอร์</li>
          <li>ปิดหน้านี้เมื่อไร ข้อมูลก็หายไปทันที เว้นแต่คุณบันทึกไฟล์เก็บไว้เอง</li>
        </ul>
      </section>

      {/* ---- เริ่มใช้งาน: ปุ่มหลักเด่นตัวเดียว ---- */}
      <section className="mt-10">
        <button
          type="button"
          className="w-full rounded-xl bg-tea-700 px-8 py-5 text-2xl font-bold text-white shadow-sm transition-colors hover:bg-tea-600 focus:outline-none focus:ring-4 focus:ring-tea-600/40"
          onClick={() => goToStep(0)}
        >
          เริ่มเขียนเจตนาของฉัน
        </button>

        <div className="mt-6 rounded-xl border border-tea-200 bg-card p-5">
          <h3 className="text-lg font-bold text-ink">
            อยากเขียนด้วยปากกาแทน
          </h3>
          <p className="mt-1 text-base leading-relaxed text-ink">
            ดาวน์โหลดแบบฟอร์มเปล่าไปปริ้น แล้วเขียนเองได้ทั้งฉบับ
            — ไม่ต้องพิมพ์อะไรลงในเว็บเลย
          </p>
          <button
            type="button"
            disabled={blankBusy}
            className="mt-3 rounded-xl border border-tea-200 px-6 py-3 text-lg text-ink transition-colors hover:bg-tea-100 focus:outline-none focus:ring-4 focus:ring-tea-600/30 disabled:cursor-wait disabled:opacity-60"
            onClick={() => void handleBlankForm()}
          >
            {blankBusy ? 'กำลังสร้างเอกสาร...' : 'ดาวน์โหลดแบบฟอร์มเปล่า (PDF)'}
          </button>
          {blankError ? (
            <p role="alert" className="mt-2 text-lg text-red-700">
              {blankError}
            </p>
          ) : null}
        </div>

        {/* ---- ทำต่อจากครั้งก่อน (เดิมคือ "เปิดแบบร่างจากไฟล์") ---- */}
        <div className="mt-6 rounded-xl border border-tea-200 bg-card p-5">
          <h3 className="text-lg font-bold text-ink">
            เคยทำค้างไว้ กลับมาทำต่อได้
          </h3>
          <p className="mt-1 text-base leading-relaxed text-ink">
            ถ้าเคยกด &ldquo;บันทึกแบบร่างลงเครื่อง&rdquo; ไว้
            เพียงเลือกไฟล์นั้น — คำตอบเดิมจะกลับมาครบทุกข้อ
          </p>
          <button
            type="button"
            className="mt-3 rounded-xl border border-tea-200 px-6 py-3 text-lg text-ink transition-colors hover:bg-tea-100 focus:outline-none focus:ring-4 focus:ring-tea-600/30"
            onClick={() => fileInputRef.current?.click()}
          >
            เลือกไฟล์ที่บันทึกไว้ เพื่อทำต่อ
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            aria-label="เลือกไฟล์แบบร่างที่บันทึกไว้"
            onChange={(e) => void handleDraftFile(e)}
          />
          {importError ? (
            <p role="alert" className="mt-2 text-lg text-red-700">
              {importError}
            </p>
          ) : null}
        </div>
      </section>

      {/* ---- ชวนบอกต่อ ---- */}
      <section className="mt-10 text-center">
        <p className="text-lg leading-relaxed text-ink">
          รู้จักใครที่เรื่องนี้มีความหมายกับเขา
        </p>
        <div className="mt-3">
          <ShareButton />
        </div>
      </section>

      <footer className="mt-12 border-t border-tea-200 pt-6 text-center">
        <nav
          aria-label="ลิงก์เพิ่มเติม"
          className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-base text-ink"
        >
          <button
            type="button"
            className="underline decoration-tea-200 underline-offset-4 transition-colors hover:decoration-tea-600"
            onClick={goToAbout}
          >
            ทำไมต้องมีพิใจธรรม
          </button>
          <button
            type="button"
            className="underline decoration-tea-200 underline-offset-4 transition-colors hover:decoration-tea-600"
            onClick={goToFaq}
          >
            คำถามพบบ่อย
          </button>
          <button
            type="button"
            className="underline decoration-tea-200 underline-offset-4 transition-colors hover:decoration-tea-600"
            onClick={goToTalkGuide}
          >
            คู่มือชวนครอบครัวคุย
          </button>
          <a
            href="https://github.com/peerawatkung/pijaitham"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-tea-200 underline-offset-4 transition-colors hover:decoration-tea-600"
          >
            โค้ดเปิดเผยทั้งหมด (GitHub)
          </a>
        </nav>
        <p className="mt-6 text-sm leading-relaxed text-ink-soft">
          {APP_CONFIG.name} · {APP_CONFIG.englishName} — {APP_CONFIG.tagline}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-ink-soft">
          เครื่องมือนี้ช่วยเรียบเรียงเจตนาเท่านั้น
          ไม่ใช่คำแนะนำทางการแพทย์หรือกฎหมาย
        </p>
      </footer>
    </main>
  )
}
